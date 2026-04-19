import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, FileText } from "lucide-react";

export default function TermsPage() {
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
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">利用規約</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Terms of Service</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none prose-h2:text-xl prose-h2:font-black prose-h2:mt-10 prose-p:text-slate-600 prose-p:font-medium prose-p:leading-relaxed">
            <p className="text-sm text-slate-400 mb-10 font-bold italic">最終更新日: 2026年4月19日</p>
            
            <p>
              この利用規約（以下，「本規約」といいます。）は，Signs AI（以下，「当サービス」といいます。）が提供するサービス（以下，「本サービス」といいます。）の利用条件を定めるものです。登録ユーザーの皆さま（以下，「ユーザー」といいます。）には，本規約に従って，本サービスをご利用いただきます。
            </p>

            <h2>第1条（適用）</h2>
            <p>
              本規約は，ユーザーと当サービスとの間の本サービスの利用に関わる一切の関係に適用されるものとします。
            </p>

            <h2>第2条（利用登録）</h2>
            <p>
              本サービスにおいては，登録希望者が本規約に同意の上，当サービスの定める方法によって利用登録を申請し，当サービスがこれを承認することによって，利用登録が完了するものとします。
            </p>

            <h2>第3条（禁止事項）</h2>
            <p>ユーザーは，本サービスの利用にあたり，以下の行為をしてはなりません。</p>
            <ul>
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>本サービスの内容等，本サービスに含まれる著作権，商標権ほか知的財産権を侵害する行為</li>
              <li>当サービス，ほかのユーザー，またはその他第三者のサーバーまたはネットワークの機能を破壊したり，妨害したりする行為</li>
              <li>本サービスによって得られた情報を商業的に利用する行為</li>
              <li>不当な目的を持って本サービスを利用する行為</li>
            </ul>

            <h2>第4条（本サービスの提供の停止等）</h2>
            <p>
              当サービスは，以下のいずれかの事由があると判断した場合，ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
            </p>
            <ul>
              <li>本サービスに係るコンピュータシステムの保守点検または更新を行う場合</li>
              <li>地震，落雷，火災，停電または天災などの不可抗力により，本サービスの提供が困難となった場合</li>
              <li>コンピュータまたは通信回線等が事故により停止した場合</li>
              <li>その他，当サービスが本サービスの提供が困難と判断した場合</li>
            </ul>

            <h2>第5条（利用制限および登録抹消）</h2>
            <p>
              当サービスは，ユーザーが規約に違反した場合や、不正な利用があったと判断した場合には事前の通知なく利用を制限できるものとします。
            </p>

            <div className="mt-16 pt-8 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-400 font-bold mb-6">Signs AI は、健全な組織構築をサポートします。</p>
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
