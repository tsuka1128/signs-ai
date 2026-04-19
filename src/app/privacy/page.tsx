import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-teal-100 selection:text-teal-900">
      <nav className="fixed top-0 left-0 w-full z-50 px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/marketing" className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-bold">戻る</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm italic">S</span>
            </div>
            <span className="text-lg font-black tracking-tighter text-slate-900">Signs AI</span>
          </div>
          <div className="w-10"></div> {/* Spacer */}
        </div>
      </nav>

      <main className="pt-32 pb-24 px-6 max-w-3xl mx-auto">
        <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-xl shadow-slate-200/60 border border-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">プライバシーポリシー</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Privacy Policy</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none prose-h2:text-xl prose-h2:font-black prose-h2:mt-10 prose-p:text-slate-600 prose-p:font-medium prose-p:leading-relaxed">
            <p className="text-sm text-slate-400 mb-10 font-bold italic">最終更新日: 2026年4月19日</p>
            
            <p>
              Signs AI（以下，「当サービス」といいます。）は，本ウェブサイト上で提供するサービス（以下，「本サービス」といいます。）における，ユーザーの個人情報の取扱いについて，以下のとおりプライバシーポリシー（以下，「本ポリシー」といいます。）を定めます。
            </p>

            <h2>第1条（個人情報の定義）</h2>
            <p>
              「個人情報」とは，個人情報保護法にいう「個人情報」を指すものとし，生存する個人に関する情報であって，当該情報に含まれる氏名，生年月日，住所，電話番号，連絡先その他の記述等により特定の個人を識別できる情報（個人識別情報）を指します。
            </p>

            <h2>第2条（個人情報の収集方法）</h2>
            <p>
              当サービスは，ユーザーが利用登録をする際に氏名，メールアドレスなどの個人情報をお尋ねすることがあります。また、サービス利用過程で組織内の匿名アンケート結果を収集しますが、これらは個人を特定しない形式で集計・分析されます。
            </p>

            <h2>第3条（個人情報を収集・利用する目的）</h2>
            <p>当サービスが個人情報を収集・利用する目的は，以下のとおりです。</p>
            <ul>
              <li>本サービスの提供・運営のため</li>
              <li>ユーザーからのお問い合わせに回答するため</li>
              <li>ユーザーが利用中のサービスの新機能，更新情報，キャンペーン等及び当サービスが提供する他のサービスの案内のメールを送付するため</li>
              <li>メンテナンス，重要なお知らせなど必要に応じたご連絡のため</li>
              <li>利用規約に違反したユーザーや，不正・不当な目的でサービスを利用しようとするユーザーの特定をし，ご利用をお断りするため</li>
            </ul>

            <h2>第4条（利用目的の変更）</h2>
            <p>
              当サービスは，利用目的が変更前と関連性を有すると合理的に認められる場合に限り，個人情報の利用目的を変更するものとします。
            </p>

            <h2>第5条（個人情報の第三者提供）</h2>
            <p>
              当サービスは，次に掲げる場合を除いて，あらかじめユーザーの同意を得ることなく，第三者に個人情報を提供することはありません。ただし，個人情報保護法その他の法令で認められる場合を除きます。
            </p>

            <h2>第6条（セキュリティ対策）</h2>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex gap-4 items-start">
              <Lock className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
              <p className="text-sm text-slate-500 m-0">
                当サービスは、保存されるすべてのデータを暗号化し、SSL接続を用いた安全な通信を行っています。また、認証基盤として信頼性の高い外部サービスを利用し、不正アクセス防止に努めています。
              </p>
            </div>

            <div className="mt-16 pt-8 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-400 font-bold mb-6">Signs AI は、皆さまの大切なデータを守り、活用します。</p>
              <Link href="/marketing" className="inline-flex items-center gap-2 text-teal-600 font-black hover:underline underline-offset-4">
                トップページへ戻る
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-12 px-6 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        &copy; 2026 Signs AI. All rights reserved.
      </footer>
    </div>
  );
}
