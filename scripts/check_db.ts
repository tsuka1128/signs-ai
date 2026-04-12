const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Environment variables not found.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- Checking Companies ---');
    const { data: companies, error: cErr } = await supabase
        .from('companies')
        .select('*')
        .ilike('name', '%株式会社SignsAi%');

    if (cErr) {
        console.error('Error fetching companies:', cErr);
        return;
    }

    console.log(`Found ${companies.length} matches.`);

    for (const company of companies) {
        console.log(`\nCompany: ${company.name} (ID: ${company.id})`);
        
        const { data: depts, error: dErr } = await supabase
            .from('departments')
            .select('*')
            .eq('company_id', company.id);

        if (dErr) {
            console.error('Error fetching departments:', dErr);
        } else {
            console.log(`Departments (${depts.length}):`, depts.map(d => d.name));
        }

        const { data: kpis, error: kErr } = await supabase
            .from('kpi_definitions')
            .select('*')
            .eq('company_id', company.id);

        if (kErr) {
            console.error('Error fetching KPIs:', kErr);
        } else {
            console.log(`KPIs (${kpis.length}):`, kpis.map(k => k.name));
        }
    }
}

check();
