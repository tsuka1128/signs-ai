import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// SUPABASE_SERVICE_ROLE_KEY を用いてRLSをバイパスし、
// system_settings の限定的な情報を非ログインユーザーに提供するAPI
export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error("Missing Supabase credentials for Service Role.");
            return NextResponse.json({ team: 30000, standard: 50000, pro: 150000 }); // デフォルトフォールバック
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        
        const { data, error } = await supabaseAdmin
            .from("system_settings")
            .select("key, value")
            .in("key", ["plan_price_team", "plan_price_standard", "plan_price_pro"]);

        if (error) {
            console.error("Error fetching pricing settings:", error);
            return NextResponse.json({ team: 30000, standard: 50000, pro: 150000 });
        }

        const prices = {
            team: 30000,
            standard: 50000,
            pro: 150000
        };

        if (data) {
            data.forEach((setting) => {
                if (setting.key === "plan_price_team") prices.team = typeof setting.value === 'number' ? setting.value : parseInt(setting.value as string) || 30000;
                if (setting.key === "plan_price_standard") prices.standard = typeof setting.value === 'number' ? setting.value : parseInt(setting.value as string) || 50000;
                if (setting.key === "plan_price_pro") prices.pro = typeof setting.value === 'number' ? setting.value : parseInt(setting.value as string) || 150000;
            });
        }

        // Cache control for performance (60s)
        return NextResponse.json(prices, {
            headers: {
                "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
            },
        });

    } catch (error) {
        console.error("Unexpected error in pricing API:", error);
        return NextResponse.json({ team: 30000, standard: 50000, pro: 150000 });
    }
}
