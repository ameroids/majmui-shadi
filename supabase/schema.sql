-- Majmui Shaadi — Supabase schema
-- Run this in the Supabase SQL editor of a new project, then set
-- VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in your .env file.
-- The app runs fully on demo data until those variables are present.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- users: bride, groom, admin and tnc accounts.
-- In production, swap this for Supabase Auth and keep this table for
-- role + display metadata, referencing auth.users(id).
-- ---------------------------------------------------------------------------
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  role text not null check (role in ('bride', 'groom', 'admin', 'tnc')),
  display_name text not null,
  can_add_invitees boolean not null default true,
  can_send_invitations boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- families / family_members: read-mostly master (Jamaat) data.
-- Never mutated when a bride/groom selects invitees.
-- ---------------------------------------------------------------------------
create table if not exists families (
  id uuid primary key default gen_random_uuid(),
  hof_its text unique not null,
  surname text not null,
  is_manual boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  member_its text not null,
  full_name text not null,
  mobile text,
  relationship text,
  gender text,
  created_at timestamptz not null default now()
);

create index if not exists idx_family_members_family_id on family_members(family_id);
create index if not exists idx_families_hof_its on families(hof_its);

-- ---------------------------------------------------------------------------
-- events: wedding function list, editable by admin/TNC.
-- ---------------------------------------------------------------------------
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  event_description text,
  event_date date,
  event_time text,
  venue text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- invitees: each bride/groom's own selection of members to invite.
-- Kept separate from family_members so selection never touches master data.
-- ---------------------------------------------------------------------------
create table if not exists invitees (
  id uuid primary key default gen_random_uuid(),
  bride_groom_user_id uuid not null references users(id) on delete cascade,
  family_id uuid not null references families(id) on delete cascade,
  member_id uuid not null references family_members(id) on delete cascade,
  hof_its text not null,
  member_its text not null,
  full_name text not null,
  surname text not null,
  mobile text,
  relationship text,
  gender text,
  selected boolean not null default true,
  invitation_status text not null default 'Not Invited',
  created_at timestamptz not null default now(),
  unique (bride_groom_user_id, member_id)
);

create index if not exists idx_invitees_user on invitees(bride_groom_user_id);
create index if not exists idx_invitees_family on invitees(family_id);

-- ---------------------------------------------------------------------------
-- invitations: one row per family per WhatsApp message (one representative).
-- ---------------------------------------------------------------------------
create table if not exists invitations (
  id uuid primary key default gen_random_uuid(),
  bride_groom_user_id uuid not null references users(id) on delete cascade,
  family_id uuid not null references families(id) on delete cascade,
  whatsapp_recipient_member_id uuid not null references family_members(id),
  status text not null default 'Draft' check (status in ('Draft', 'Ready', 'WhatsApp Opened', 'Sent', 'RSVP Sent', 'RSVPed')),
  generated_message text not null,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table if not exists invitation_member_events (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references invitations(id) on delete cascade,
  invitee_id uuid not null references invitees(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  rsvp_status text not null default 'Pending' check (rsvp_status in ('Pending', 'Attending', 'Not Attending')),
  unique(invitation_id, invitee_id, event_id)
);

create index if not exists idx_invitation_member_events_invitation on invitation_member_events(invitation_id);
create index if not exists idx_invitation_member_events_invitee on invitation_member_events(invitee_id);

-- ---------------------------------------------------------------------------
-- Row Level Security — bride/groom accounts only see their own invitee and
-- invitation rows; admin and TNC roles get broader read access.
-- Adjust the auth.uid() mapping once Supabase Auth is wired in.
-- ---------------------------------------------------------------------------
alter table invitees enable row level security;
alter table invitations enable row level security;
alter table invitation_member_events enable row level security;

create policy "Bride/groom manage their own invitees"
  on invitees for all
  using (bride_groom_user_id = auth.uid())
  with check (bride_groom_user_id = auth.uid());

create policy "Bride/groom manage their own invitations"
  on invitations for all
  using (bride_groom_user_id = auth.uid())
  with check (bride_groom_user_id = auth.uid());

-- Families, family_members and events are shared read data.
alter table families enable row level security;
alter table family_members enable row level security;
alter table events enable row level security;

create policy "Everyone can read families" on families for select using (true);
create policy "Everyone can read family members" on family_members for select using (true);
create policy "Everyone can read events" on events for select using (true);
