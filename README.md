# Majmui Shaadi

A wedding invitation manager for the bride and groom's families to build
invitee lists by ITS number and send personalised WhatsApp invitations —
one message per family, addressed to one representative, naming every
invited member and every selected event.

Pure React front end, built for **Supabase + Vercel**: there is no custom
server. Data access lives in `src/lib/db.js`.

## Running locally

```bash
npm install
npm run dev
```

Open the printed local URL. The app works immediately with **no setup** —
it seeds realistic demo data (families, events, users) into the browser's
local storage on first load.

## Demo credentials

| Panel | Username | Password |
|---|---|---|
| Bride | `bride01` … `bride10` | `Bride@12301` … `Bride@12310` |
| Groom | `groom01` … `groom10` | `Groom@12301` … `Groom@12310` |
| Admin | `admin` | `Admin@12345` |
| TNC | `tnc01` | `TNC@12345` |

The login screen has a tappable "demo credentials" hint on each panel that
fills the form for you.

## Try the full flow

1. Log in as `bride01` / `Bride@12301`.
2. **Add Invitee** → search HOF ITS `30123456` (Rampurawala family) → select
   a few members → **Save Selected Invitees**.
3. Try an ITS number that doesn't exist (e.g. `99999999`) to see
   **Create Invitee Manually**.
4. **Send Invitation** → **+ New Invitation** → pick the family → choose one
   member as the WhatsApp representative → pick events → **Generate
   Invitation** → review/edit the message → **Send on WhatsApp** (opens
   `wa.me` with the number and message pre-filled; you still press WhatsApp's
   own Send button).
5. Log in as `admin` / `Admin@12345` to see every family, invitee and
   invitation across all bride/groom accounts, and to edit the message
   template.
6. Log in as `tnc01` / `TNC@12345` for read-only reports and search by ITS,
   surname or mobile number.

## Connecting a real Supabase project

The app is structured so this is a drop-in change, not a rewrite:

1. Create a Supabase project and run `supabase/schema.sql` in the SQL editor.
2. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY`.
3. Import your real Jamaat family directory into `families` /
   `family_members`.
4. `src/lib/db.js` already reads from Supabase for `searchFamilyByHofIts`
   when the env vars are present (falling back to demo data otherwise) —
   extend the remaining functions the same way as you migrate each screen
   from demo mode to live data.
5. Replace the demo `authenticate()` call with Supabase Auth, keeping the
   `users` table for role + display name.

## Deploying to Vercel

```bash
npm run build
```

Push the repository to GitHub and import it in Vercel (framework preset:
Vite), or run `vercel` from this folder. Add the two `VITE_SUPABASE_*`
environment variables in the Vercel project settings once you've connected
a real Supabase project.

## WhatsApp sending

Sending is always **user-initiated**: the app builds a `wa.me` deep link
with the recipient's number and the generated message pre-filled, opens it
in a new tab, and the person reviews and presses WhatsApp's own Send
button. No message is ever sent silently. For fully automated sending at
scale, integrate the WhatsApp Business Platform / Cloud API server-side —
that is intentionally out of scope for this front-end-only prototype.

## Project structure

```
src/
  components/       shared UI (layout, buttons, cards, modal, form fields)
  context/          auth + toast providers
  lib/
    db.js           data-access layer (Supabase-shaped, demo-backed)
    seedData.js      demo users / families / events
    messageTemplate.js  WhatsApp message generation + wa.me links
    supabaseClient.js   Supabase client bootstrap (optional)
  pages/            one file per screen/role
supabase/
  schema.sql        full Postgres schema + RLS policies
```
