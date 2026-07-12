"use client";

import { useEffect } from "react";

/**
 * ページ固有のタブタイトルを設定する。
 *
 * アプリの大半のページは "use client" のため Next.js の metadata export が使えず、
 * 53ページ中ほぼ全てが同一のタブタイトル「Signs AI | 組織に体温を」になっていた
 * （複数タブを開いて作業するBtoBユーザーがタブを区別できない）。
 * title.template はサーバーの metadata にしか効かずクライアントの document.title 直接代入
 * には関与しないため、ここでは自前で " | Signs AI" サフィックスを付与する（二重化しない）。
 */
export function useDocumentTitle(title: string) {
    useEffect(() => {
        const prev = document.title;
        document.title = `${title} | Signs AI`;
        return () => {
            document.title = prev;
        };
    }, [title]);
}
