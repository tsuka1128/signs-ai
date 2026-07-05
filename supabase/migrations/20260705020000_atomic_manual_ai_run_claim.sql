-- T-API-4: 手動AI分析のレート制限が TOCTOU（read → Claude呼び出し → 最後に+1）で、
-- 並列連打すると全リクエストが used=0 を読んで全通過し、Claude課金が青天井になる問題を修正する。
--
-- 呼び出し前にアトミックに1回分を「予約」する SECURITY DEFINER 関数を用意する。
-- 重要: 会社ID・対象月・上限回数を引数で受け取ると、認証ユーザーが RPC を直接叩いて
-- 巨大な上限や他社IDを渡すことで回避できてしまう。そのため全てを関数内部で
-- get_my_company_id() と now() から導出し、クライアントからは一切の値を受け取らない。

-- 1回分をアトミックに予約する。成功時 {claimed:true, used, max}、上限到達時 {claimed:false, used, max}。
CREATE OR REPLACE FUNCTION public.claim_manual_ai_run()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_company uuid := get_my_company_id();
    v_month   text := to_char((now() AT TIME ZONE 'UTC'), 'YYYY-MM');
    v_used    int;
    v_active  text;
    v_max     int;
BEGIN
    IF v_company IS NULL THEN
        RETURN jsonb_build_object('claimed', false, 'used', 0, 'max', 0);
    END IF;

    -- 対象行をロックして読む（同時実行を直列化）
    SELECT c.manual_ai_runs_used_this_month,
           c.manual_ai_runs_active_month,
           COALESCE(
               (c.plan_overrides->>'manual_ai_runs_per_month')::int,
               p.manual_ai_runs_per_month,
               1
           )
      INTO v_used, v_active, v_max
      FROM public.companies c
      LEFT JOIN public.plans p ON p.id = c.plan_id
     WHERE c.id = v_company
     FOR UPDATE OF c;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('claimed', false, 'used', 0, 'max', 0);
    END IF;

    -- 月が変わっていたらリセット扱い
    IF v_active IS DISTINCT FROM v_month THEN
        v_used := 0;
    END IF;

    IF v_used >= v_max THEN
        RETURN jsonb_build_object('claimed', false, 'used', v_used, 'max', v_max);
    END IF;

    UPDATE public.companies
       SET manual_ai_runs_used_this_month = v_used + 1,
           manual_ai_runs_active_month = v_month
     WHERE id = v_company;

    RETURN jsonb_build_object('claimed', true, 'used', v_used + 1, 'max', v_max);
END;
$$;

-- Claude呼び出しが失敗したとき、予約した1回分を返金する（当月分のみ・0未満にはしない）。
CREATE OR REPLACE FUNCTION public.refund_manual_ai_run()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_company uuid := get_my_company_id();
    v_month   text := to_char((now() AT TIME ZONE 'UTC'), 'YYYY-MM');
BEGIN
    IF v_company IS NULL THEN
        RETURN;
    END IF;
    UPDATE public.companies
       SET manual_ai_runs_used_this_month = GREATEST(manual_ai_runs_used_this_month - 1, 0)
     WHERE id = v_company
       AND manual_ai_runs_active_month = v_month;
END;
$$;

-- 匿名からは実行させない。認証ユーザーのみ（会社・月・上限は関数内部で導出するため安全）。
REVOKE ALL ON FUNCTION public.claim_manual_ai_run() FROM public, anon;
REVOKE ALL ON FUNCTION public.refund_manual_ai_run() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_manual_ai_run() TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_manual_ai_run() TO authenticated;
