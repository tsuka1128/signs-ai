import { 
    Users, 
    ArrowRight, 
    UserPlus, 
    Slack, 
    ShieldCheck, 
    Search,
    Building2,
    Mail,
    ChevronDown,
    Building
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function MemberManagementPage() {
    return (
        <div className="space-y-12 pb-24 animate-in fade-in duration-500">
            {/* Header */}
            <section className="space-y-4">
                <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                    <Link href="/docs" className="hover:text-teal transition-colors">Documentation</Link>
                    <ArrowRight className="w-3 h-3" />
                    <span className="text-slate-900">Member Management</span>
                </nav>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-xs font-bold tracking-tight mb-2">
                    <Users className="w-3.5 h-3.5" />
                    Setup & Settings
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight">
                    新規登録とメンバー管理
                </h1>
                <p className="text-base text-slate-600 font-medium leading-relaxed max-w-2xl mt-4">
                    Signs AIの利用を開始するための初回セットアップ（オンボーディング）手順と、チームメンバーを招待して適切に権限を管理する方法をステップ・バイ・ステップで解説します。
                </p>
            </section>

            {/* Section 1: Initial Registration & Onboarding */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                    <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center font-black">1</div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                        アカウントの新規作成（初回登録）
                    </h2>
                </div>

                <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-loose mb-6">
                    <p>
                        初めてSigns AIを利用する管理者向けのセットアップ手順です。メールアドレスまたはGoogleアカウントでログイン後、組織の基本情報を登録する「オンボーディング画面」が表示されます。
                    </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-8">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        <div className="space-y-5">
                            <div className="flex gap-4 items-start">
                                <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">A</div>
                                <div>
                                    <span className="font-bold text-slate-800 block mb-1">企業情報の入力</span>
                                    <span className="text-sm text-slate-600">画面の案内に従い、「新規作成」を選択して会社名とWebサイトURLを入力します。</span>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">B</div>
                                <div>
                                    <span className="font-bold text-slate-800 block mb-1">部署とKPIの定義</span>
                                    <span className="text-sm text-slate-600">マトリックスで比較したい主要な部署と、目標となる数値を順に登録していきます。</span>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">C</div>
                                <div>
                                    <span className="font-bold text-slate-800 block mb-1">組織方針（セマンティックレイヤー）の入力</span>
                                    <span className="text-sm text-slate-600">AIに会社の方向性を学習させるためのウィザードに回答します（後からダッシュボードでも変更可能）。</span>
                                </div>
                            </div>
                        </div>

                        {/* UI Mockup for Onboarding */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden hidden md:block select-none pointer-events-none">
                            <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 text-center">
                                <div className="inline-flex items-center gap-2">
                                    <span className="text-sm">🌡️</span>
                                    <span className="text-xs font-black text-slate-800">初期設定</span>
                                </div>
                            </div>
                            <div className="p-5 space-y-4">
                                <div className="flex gap-2 mb-4 justify-center">
                                    <div className="w-5 h-5 rounded-full bg-teal-500 text-white text-[9px] font-bold flex items-center justify-center">1</div>
                                    <div className="w-5 h-px bg-teal-200 my-auto" />
                                    <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 text-[9px] font-bold flex items-center justify-center">2</div>
                                    <div className="w-5 h-px bg-slate-100 my-auto" />
                                    <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 text-[9px] font-bold flex items-center justify-center">3</div>
                                    <div className="w-5 h-px bg-slate-100 my-auto" />
                                    <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 text-[9px] font-bold flex items-center justify-center">4</div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-3 rounded-xl border-2 border-teal-500 bg-teal-50/50">
                                        <div className="text-xs font-bold text-slate-700">新規作成</div>
                                        <div className="text-[9px] text-slate-400 mt-0.5">新しい組織を作成</div>
                                    </div>
                                    <div className="p-3 rounded-xl border-2 border-slate-100 bg-white opacity-50">
                                        <div className="text-xs font-bold text-slate-700">参加</div>
                                        <div className="text-[9px] text-slate-400 mt-0.5">招待を受けて参加</div>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">企業名</div>
                                    <div className="w-full h-8 bg-slate-50 border border-slate-200 rounded-lg" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 2: Member Invitation */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4 mt-12">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black">2</div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                        メンバーの招待・追加
                    </h2>
                </div>

                <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-loose">
                    <p>
                        初回セットアップ完了後、サイドバー（またはヘッダー）の右上メニューから<strong>「設定（Settings）」</strong>を開き、<strong>「メンバー」</strong>タブからチームメンバーを招待します。
                    </p>
                </div>

                {/* UI Mockup for Invitation Form */}
                <div className="mt-8 relative max-w-3xl mx-auto">
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
                        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-2">
                            <UserPlus className="w-4 h-4 text-indigo-500" />
                            <span className="text-sm font-black text-slate-800">メンバー招待フォーム</span>
                        </div>
                        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            
                            {/* Email */}
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-tighter">メールアドレス</label>
                                <div className="relative">
                                    <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                    <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-3 text-sm text-slate-400 font-medium">
                                        member@example.com
                                    </div>
                                </div>
                            </div>

                            {/* Department */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-tighter">所属部署</label>
                                <div className="relative">
                                    <Building2 className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                    <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-3 text-sm text-slate-700 font-bold flex justify-between items-center">
                                        <span>営業部</span>
                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Axis/Area */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-tighter">担当領域</label>
                                <div className="relative">
                                    <Building className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                    <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-3 text-sm text-slate-700 font-bold flex justify-between items-center">
                                        <span>東京本店</span>
                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Role */}
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-tighter">権限（Role）</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 opacity-60">
                                        <div className="flex gap-2 items-center mb-1 text-slate-800"><ShieldCheck className="w-4 h-4"/> 管理者</div>
                                        <div className="text-[10px] font-medium text-slate-400 font-normal">設定や方針の変更が可能</div>
                                    </div>
                                    <div className="px-4 py-3 rounded-xl border-2 border-indigo-500 bg-indigo-50/50 text-sm font-bold text-indigo-900">
                                        <div className="flex gap-2 items-center mb-1"><Users className="w-4 h-4 text-indigo-500"/> メンバー</div>
                                        <div className="text-[10px] font-medium text-indigo-600/70 font-normal">閲覧とアクション管理のみ</div>
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2 pt-2">
                                <div className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold text-sm text-center shadow-lg pointer-events-none">
                                    招待メールを送信する
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 space-y-4 text-sm text-slate-600 font-medium">
                    <p>
                        招待を受ける側のメンバーは、メールに記載された招待リンクをクリックすると「オンボーディング画面（参加モード）」に案内されます。<br/>
                        そこで自分の部署・担当領域を確認し、ログインを完了させます。
                    </p>
                </div>
            </section>


            {/* Section 3: Slack ID */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4 mt-12">
                    <div className="w-10 h-10 bg-[#4A154B] text-white rounded-xl flex items-center justify-center font-black">3</div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                        Slack User IDの紐付け（重要）
                    </h2>
                </div>

                <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-loose mb-6">
                    <p>
                        Signs AIがSlackへアクション提案を通知する際、担当者に直接メンション（@）を飛ばすためには、各メンバーのプロフィールに<strong>Slack User ID</strong>を登録する必要があります。
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 border-2 border-slate-100 p-6 rounded-3xl">
                        <h4 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
                            <Search className="w-4 h-4 text-slate-400" />
                            IDの調べ方
                        </h4>
                        <ol className="space-y-4 list-decimal pl-5 text-sm text-slate-600 font-medium">
                            <li>Slackアプリで、対象メンバーのプロフィール画面を開く。</li>
                            <li>「その他」のアイコン <span className="inline-block px-1 border border-slate-300 rounded mx-1 pb-0.5">⋯</span> （縦に点の並んだアイコン）をクリック。</li>
                            <li><strong>「メンバーIDをコピー」</strong> を選択。<br/><span className="text-[10px] text-slate-400 mt-1 block">（例: U0123ABCD）</span></li>
                        </ol>
                    </div>

                    <div className="bg-white border-2 border-slate-100 p-6 rounded-3xl flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mr-4 -mt-4 text-[#4A154B] opacity-5">
                            <Slack className="w-32 h-32" />
                        </div>
                        <h4 className="text-sm font-black text-slate-900 mb-3 relative z-10">
                            設定画面での登録
                        </h4>
                        <p className="text-xs text-slate-500 mb-4 font-medium leading-relaxed relative z-10">
                            「設定」＞「メンバー」タブを開き、各メンバーの「編集」ボタンからコピーしたIDを貼り付けて保存します。<br/>その後<strong>「🔍Slack通信テスト」</strong>ボタンを押して、該当メンバーにメンション付きの通知が届くか確認してください。
                        </p>
                    </div>
                </div>

                {/* Hint section */}
                <div className="p-6 bg-slate-900 text-white rounded-3xl flex gap-4 mt-8 shadow-xl">
                    <div className="p-2 bg-white/10 rounded-xl h-fit">
                        <Slack className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black mb-1 text-white">なぜメンションIDが必要か？</h3>
                        <p className="text-sm text-slate-300 leading-relaxed font-medium">
                            AIがアクションを提案しても、ただチャンネルに投稿されるだけでは誰も対応せずに終わってしまいます。対象部署の担当者に確実にメンションを飛ばすことで、「自分ごと」としてアクションの実行漏れを防ぐ効果があります。
                        </p>
                    </div>
                </div>
            </section>

        </div>
    );
}
