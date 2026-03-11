import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuthFlow() {
    console.log("--- Testing Auth Flow ---");

    // 1. Sign up test (using a random email)
    const testEmail = `test_${Math.random().toString(36).substring(7)}@example.com`;
    const testPassword = "password123";

    console.log(`Trying to sign up: ${testEmail}`);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
    });

    if (signUpError) {
        console.error("Signup failed:", signUpError.message);
    } else {
        console.log("Signup successful!");
        console.log("User ID:", signUpData.user?.id);
        console.log("Identities:", signUpData.user?.identities);

        if (signUpData.user?.identities?.length === 0) {
            console.log("NOTE: Identity length is 0, user might already exist or needs confirmation.");
        }
    }

    // 2. Sign in test (should fail if email not confirmed)
    console.log("\nTrying to sign in without confirmation...");
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
    });

    if (signInError) {
        console.log("Signin failed (Expected if confirmation is required):", signInError.message);
    } else {
        console.log("Signin successful! (Email confirmation might not be required in this environment)");
    }
}

async function checkRLS() {
    console.log("\n--- Checking RLS (Anonymous Access) ---");

    // 1. Companies (Should be allowed for ID lookup, but potentially restricted for listing)
    const { data: companies, error: compError } = await supabase.from('companies').select('*').limit(5);
    console.log("Companies Access:", compError ? `FAILED: ${compError.message}` : `SUCCESS (Found ${companies?.length} rows)`);

    // 2. Departments
    const { data: depts, error: deptError } = await supabase.from('departments').select('*').limit(5);
    console.log("Departments Access:", deptError ? `FAILED: ${deptError.message}` : `SUCCESS (Found ${depts?.length} rows)`);

    // 3. KPI Definitions (Should be restricted)
    const { data: kpis, error: kpiError } = await supabase.from('kpi_definitions').select('*').limit(5);
    console.log("KPI Definitions Access:", kpiError ? `FAILED: ${kpiError.message}` : `SUCCESS (Found ${kpis?.length} rows)`);

    // 4. Survey Responses (Should be restricted)
    const { data: responses, error: respError } = await supabase.from('survey_responses').select('*').limit(5);
    console.log("Survey Responses Access:", respError ? `FAILED: ${respError.message}` : `SUCCESS (Found ${responses?.length} rows)`);
}

async function runAll() {
    await testAuthFlow();
    await checkRLS();
}

runAll().catch(console.error);
