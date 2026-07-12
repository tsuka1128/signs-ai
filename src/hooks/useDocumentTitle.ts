"use client";

import { useEffect } from "react";

/**
 * ページ固有のタブタイトルを設定する。
 *
 * アプリの大半のページは "use client" のため Next.js の metadata export が使えず、
 * 53ページ中ほぼ全てが同一のタブタイトル「Signs AI | 組織に体温を」になっていた
 * （複数タブを開いて作業するBtoBユーザーがタブを区別できない）。
 * root layout の title.template("%s | Signs AI") と組み合わせて使う。
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
