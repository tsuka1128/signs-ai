import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// RLSポリシーで 'plan_price_%' のキーに対するSELECTがpublicに許可されているため、
// ANON_KEYでも読み取り可能です。
export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            console.error("Missing Supabase credentials.");
            return NextResponse.json({ team: 30000, standard: 50000, pro: 150000 }); // デフォルトフォールバック
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        
        const { data, error } = await supabase
            .from("system_settings")
            .select("key, value")
            .in("key", ["plan_price_team", "plan_price_standard", "plan_price_pro"]);

        if (error) {
            console.error("Error fetching pricing settings:", error);
            // エラーの場合もフォールバックを返す
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
