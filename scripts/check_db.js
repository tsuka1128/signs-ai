const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// .env.local を手動で読み込む
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Environment variables not found in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- Database Audit for 株式会社SignsAi ---');
    const { data: companies, error: cErr } = await supabase
        .from('companies')
        .select('*')
        .ilike('name', '%株式会社SignsAi%');

    if (cErr) {
        console.error('Error fetching companies:', cErr);
        return;
    }

    console.log(`Found ${companies.length} companies with that name.`);

    for (const company of companies) {
        console.log(`\n[Company ID: ${company.id}]`);
        console.log(`Name: ${company.name}`);
        console.log(`Status: ${company.status}`);
        console.log(`Created At: ${company.created_at}`);

        const { data: depts } = await supabase.from('departments').select('*').eq('company_id', company.id);
        console.log(`Departments (${depts?.length || 0}):`, depts?.map(d => d.name));

        const { data: kpis } = await supabase.from('kpi_definitions').select('*').eq('company_id', company.id);
        console.log(`KPIs (${kpis?.length || 0}):`, kpis?.map(k => k.name));
    }
}

check();
