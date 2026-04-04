import { createServerSupabaseClient } from "./supabase-server";

/**
 * サーバーサイド用：システム全体の設定を取得するユーティリティ
 */
export async function getSystemSettings(): Promise<Record<string, any>> {
    try {
        const supabase = await createServerSupabaseClient();
        const { data, error } = await supabase
            .from("system_settings")
            .select("key, value");

        if (error) throw error;

        const settings: Record<string, any> = {};
        data?.forEach(s => {
            settings[s.key] = s.value;
        });

        return settings;
    } catch (err) {
        console.error("[getSystemSettings Error]:", err);
        return {};
    }
}
