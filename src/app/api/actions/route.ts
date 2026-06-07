import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";

export async function POST(req: Request) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from("users")
            .select("company_id, role")
            .eq("id", user.id)
            .single();

        const body = await req.json();
        const { title, description, priority, department_id, owner, is_ai_generated, status, targetCompanyId } = body;

        let companyId = profile?.company_id;
        const isSuperAdmin = profile?.role === 'super_admin';

        if (isSuperAdmin && targetCompanyId) {
            companyId = targetCompanyId;
        }

        if (!companyId) {
            return NextResponse.json({ error: "No company associated" }, { status: 400 });
        }

        if (!title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        if (!profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        const { data, error } = await supabase
            .from("action_items")
            .insert({
                company_id: companyId,
                department_id: department_id || null,
                title,
                description: description || "",
                priority: priority || "normal",
                status: status || "pending",
                owner: owner || "",
                is_ai_generated: is_ai_generated || false,
                is_archived: false
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error("Action Create Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { id, updates } = body;

        if (!id || !updates) {
            return NextResponse.json({ error: "id and updates are required" }, { status: 400 });
        }

        // 更新者のロールを取得（部署マネージャーの判断時に経営層へ通知するため）
        const { data: actorProfile } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();

        // 削除ではなくアーカイブする場合もあるためupdatesには is_archived 等が含まれる
        const { data, error } = await supabase
            .from("action_items")
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        // 部署マネージャーがステータスを変更したら、経営層（admin/executive）に通知
        if (
            actorProfile?.role === 'manager' &&
            typeof updates.status === 'string' &&
            data?.department_id
        ) {
            const statusLabel: Record<string, string> = {
                completed: '完了', rejected: '不採用', kept: 'キープ', accepted: '実行中',
            };
            const label = statusLabel[updates.status] || updates.status;
            // 部署名を取得（通知文面用）
            const { data: dept } = await supabase
                .from("departments")
                .select("name")
                .eq("id", data.department_id)
                .single();
            const deptName = dept?.name || '担当部署';
            void createNotification({
                companyId: data.company_id,
                type: 'action_decided',
                title: `${deptName}がアクションを「${label}」に更新`,
                body: `「${data.title}」が ${deptName} で${label}と判断されました。`,
                link: '/?sec=action',
                targetRole: 'admin',
            });
            void createNotification({
                companyId: data.company_id,
                type: 'action_decided',
                title: `${deptName}がアクションを「${label}」に更新`,
                body: `「${data.title}」が ${deptName} で${label}と判断されました。`,
                link: '/?sec=action',
                targetRole: 'executive',
            });
        }

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error("Action Update Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
