import { createClient } from '@supabase/supabase-js';
import * as xlsx from 'xlsx';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function main() {
    const { data: users, error } = await supabase.from('users').select('*');
    if (error) {
        console.error("Error fetching users:", error);
        return;
    }

    const bridesGrooms = users.filter(u => u.role === 'bride' || u.role === 'groom').map(u => ({
        Role: u.role === 'bride' ? 'Bride' : 'Groom',
        Name: u.display_name,
        Username: u.username,
        Password: u.password_hash
    }));

    const admins = users.filter(u => u.role === 'admin').map(u => ({
        Role: 'Admin',
        Name: u.display_name,
        Username: u.username,
        Password: u.password_hash
    }));

    const tnc = users.filter(u => u.role === 'tnc').map(u => ({
        Role: 'TNC',
        Name: u.display_name,
        Username: u.username,
        Password: u.password_hash
    }));

    const accounts = users.filter(u => u.role === 'accounts').map(u => ({
        Role: 'Accounts',
        Name: u.display_name,
        Username: u.username,
        Password: u.password_hash
    }));

    const wb = xlsx.utils.book_new();
    
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(bridesGrooms), 'Bride & Groom Panel');
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(admins), 'Admin Panel');
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(tnc), 'TNC Panel');
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(accounts), 'Accounts Panel');

    xlsx.writeFile(wb, 'credentials.xlsx');
    console.log('Successfully generated credentials.xlsx in the root directory.');
}

main();
