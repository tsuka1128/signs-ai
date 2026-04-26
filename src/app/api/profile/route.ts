import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

// PATCH /api/profile → 自分のプロフィールを更新（role変更は不可）
export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { display_name, department_id, axis_id, slack_user_id } = await request.json();

  const { error } = await supabase
    .from("users")
    .update({
      display_name: display_name ?? null,
      department_id: department_id || null,
      axis_id: axis_id || null,
      slack_user_id: slack_user_id || null,
    })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
