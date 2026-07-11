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
    Building,
    Copy,
    Trash2,
    HelpCircle,
    Thermometer,
    Lightbulb
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/index";

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
            <section className="space-y-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-4 pb-4 border-b border-slate-100/80">
                        <div className="w-10 h-10 bg-teal-50 text-teal-700 rounded-lg flex items-center justify-center font-black text-lg">1</div>
                        <h2 id="initial-registration" className="text-[22px] md:text-[26px] font-black text-[#1e293b] tracking-tight">
                            アカウントの新規作成（初回登録）
                        </h2>
                    </div>
                    <div className="text-[15px] text-slate-600 font-medium leading-loose pt-2">
                        初めてSigns AIを利用する管理者向けのセットアップ手順です。メールアドレスまたは<br className="hidden md:block"/>
                        Googleアカウントでログイン後、組織の基本情報を登録する「オンボーディング画面」が表示されます。
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-[2rem] p-8 lg:p-10 shadow-sm relative overflow-hidden">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <div className="flex gap-5 items-start">
                                <div className="w-8 h-8 rounded-full bg-teal-100/80 text-teal-800 flex items-center justify-center font-black text-sm shrink-0">A</div>
                                <div>
                                    <span className="font-bold text-slate-800 text-[17px] tracking-tight block mb-2">企業情報の入力</span>
                                    <span className="text-[14.5px] text-slate-600 leading-relaxed font-medium">画面の案内に従い、「新規作成」を選択して会社名とWebサイトURLを入力します。</span>
                                </div>
                            </div>
                            <div className="flex gap-5 items-start">
                                <div className="w-8 h-8 rounded-full bg-teal-100/80 text-teal-800 flex items-center justify-center font-black text-sm shrink-0">B</div>
                                <div>
                                    <span className="font-bold text-slate-800 text-[17px] tracking-tight block mb-2">部署とKPIの定義</span>
                                    <span className="text-[14.5px] text-slate-600 leading-relaxed font-medium">マトリックスで比較したい主要な部署と、目標となる数値を順に登録していきます。</span>
                                </div>
                            </div>
                            <div className="flex gap-5 items-start">
                                <div className="w-8 h-8 rounded-full bg-teal-100/80 text-teal-800 flex items-center justify-center font-black text-sm shrink-0">C</div>
                                <div>
                                    <span className="font-bold text-slate-800 text-[17px] tracking-tight block mb-2">組織方針（セマンティックレイヤー）の入力</span>
                                    <span className="text-[14.5px] text-slate-600 leading-relaxed font-medium">AIに会社の方向性を学習させるためのウィザードに回答します（後からダッシュボードでも変更可能）。</span>
                                </div>
                            </div>
                        </div>

                        {/* UI Mockup for Onboarding Step 1 */}
                        <div className="bg-white rounded-3xl border border-slate-50 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] overflow-hidden hidden md:block select-none pointer-events-none relative z-10 w-full max-w-[400px] justify-self-end">
                            <div className="bg-white px-6 py-5 text-center">
                                <div className="inline-flex items-center gap-2">
                                    <Thermometer className="w-4 h-4 text-slate-500" aria-hidden />
                                    <span className="text-[13px] font-black text-slate-800 tracking-tight">初期設定</span>
                                </div>
                            </div>
                            <div className="p-8 pt-2 space-y-6">
                                <div className="flex gap-3 mb-6 justify-center">
                                    <div className="w-6 h-6 rounded-full bg-teal-500 text-white text-[11px] font-bold flex items-center justify-center">1</div>
                                    <div className="w-8 h-px bg-teal-200 my-auto" />
                                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 text-[11px] font-bold flex items-center justify-center">2</div>
                                    <div className="w-8 h-px bg-slate-100 my-auto" />
                                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 text-[11px] font-bold flex items-center justify-center">3</div>
                                    <div className="w-8 h-px bg-slate-100 my-auto" />
                                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 text-[11px] font-bold flex items-center justify-center">4</div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 rounded-xl border-2 border-teal-500 bg-white">
                                        <div className="text-sm font-black text-slate-800">新規作成</div>
                                        <div className="text-[10px] text-slate-400 mt-1 font-bold">新しい組織を作成</div>
                                    </div>
                                    <div className="p-4 rounded-xl border-2 border-slate-50 bg-white opacity-40">
                                        <div className="text-sm font-black text-slate-800">参加</div>
                                        <div className="text-[10px] text-slate-400 mt-1 font-bold">招待を受けて参加</div>
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">企業名</div>
                                    <div className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 2: Member Invitation */}
            <section className="space-y-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-4 pb-4 border-b border-slate-100/80">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-lg flex items-center justify-center font-black text-lg">2</div>
                        <h2 id="member-invitation" className="text-[22px] md:text-[26px] font-black text-[#1e293b] tracking-tight">
                            メンバーの招待・追加
                        </h2>
                    </div>
                    <div className="text-[15px] text-slate-600 font-medium leading-loose pt-2">
                        初回セットアップ完了後、サイドバー（またはヘッダー）の右上メニューから<strong>「設定（Settings）」</strong>を開き、<br className="hidden lg:block"/>
                        <strong>「メンバー」</strong>タブからチームメンバーを招待します。
                    </div>
                </div>

                {/* UI Mockup for Invitation Form */}
                <div className="relative max-w-4xl mx-auto">
                    <div className="bg-white border border-slate-200 rounded-[2rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] p-6 md:p-8 lg:p-10">
                        <h2 className="text-[17px] font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-teal-500" /> メンバーを招待
                        </h2>
                        <div className="bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-100 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Email */}
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase tracking-widest">
                                        メールアドレス <span className="text-rose-400">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <div className="w-full bg-white border border-slate-200 rounded-2xl px-11 py-4 text-sm font-bold text-slate-400">
                                                example@company.com
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Department */}
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase tracking-widest">所属部署 (任意)</label>
                                    <div className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 flex justify-between items-center">
                                        <span>未設定</span>
                                    </div>
                                </div>

                                {/* Axis/Area */}
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase tracking-widest">担当領域 (任意)</label>
                                    <div className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 flex justify-between items-center">
                                        <span>未設定</span>
                                    </div>
                                </div>

                                {/* Slack User ID */}
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-400 mb-2 ml-1 uppercase tracking-widest flex items-center gap-1">
                                        Slack User ID (任意)
                                        <div className="w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center text-[8px] text-slate-400">?</div>
                                    </label>
                                    <div className="flex gap-2 max-w-sm">
                                        <div className="flex-1 bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-400">
                                            例: U12345678
                                        </div>
                                        <div className="bg-slate-100 text-slate-600 px-4 rounded-2xl flex items-center gap-1.5 text-[10px] font-black uppercase">
                                            テスト送信
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <div className="bg-teal-300 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-teal-500/20 flex items-center gap-2 opacity-80 cursor-default">
                                    招待メールを送信 <ArrowRight className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 招待管理の新機能 */}
                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 space-y-6">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-indigo-500" />
                        <h3 className="text-lg font-black text-slate-800 tracking-tight">送信済み招待の管理</h3>
                    </div>
                    <p className="text-[14.5px] text-slate-600 leading-relaxed font-medium">
                        招待を送信すると、下部の「招待中のメンバー」リストに表示されます。各メンバーのカードをホバーする（マウスを乗せる）と、以下の管理アクションが利用可能です。
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs mb-2 uppercase tracking-widest">
                                <Copy className="w-3.5 h-3.5" /> リンクをコピー
                            </div>
                            <p className="text-[13px] text-slate-500 font-medium leading-relaxed">招待URLを直接コピーしてSlackやチャット等で共有できます。</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                            <div className="flex items-center gap-2 text-teal-600 font-bold text-xs mb-2 uppercase tracking-widest">
                                <Mail className="w-3.5 h-3.5" /> 再送
                            </div>
                            <p className="text-[13px] text-slate-500 font-medium leading-relaxed">招待を再送信し、メンバーに通知を促します。</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                            <div className="flex items-center gap-2 text-rose-500 font-bold text-xs mb-2 uppercase tracking-widest">
                                <Trash2 className="w-3.5 h-3.5" /> 削除
                            </div>
                            <p className="text-[13px] text-slate-500 font-medium leading-relaxed">誤って送信した招待や期限切れの招待を個別に取り消します。</p>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex gap-4 mt-4">
                        <div className="p-2 bg-amber-100 rounded-lg h-fit text-amber-700">
                            <HelpCircle className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-[13px] font-black text-amber-900 leading-none">メールが届かない場合</h4>
                            <p className="text-[12px] text-amber-800 leading-relaxed font-bold">
                                相手先のセキュリティ設定等により招待メールが届かない場合は、<strong>[リンクをコピー]</strong> ボタンから発行されるURLを、対象者に直接Slackやメッセージ等で送付してください。
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 3: Join Mode Onboarding */}
            <section className="space-y-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-4 pb-4 border-b border-slate-100/80">
                        <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center font-black text-lg">3</div>
                        <h2 id="onboarding" className="text-[22px] md:text-[26px] font-black text-[#1e293b] tracking-tight">
                            招待されたメンバーの「オンボーディング」
                        </h2>
                    </div>
                    <div className="text-[15px] text-slate-600 font-medium leading-loose pt-2">
                        管理者が招待メールを送信すると、対象のメンバーにリンクが記載されたメールが届きます。<br className="hidden lg:block"/>
                        メンバーがそのリンク（またはコピーされたURL）からログインを完了すると、<strong>参加モード</strong>のオンボーディング画面が表示されます。
                    </div>
                    <div className="bg-blue-50/50 border border-blue-100/50 rounded-2xl p-4 mt-2 flex gap-2">
                        <Lightbulb className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" aria-hidden />
                        <p className="text-[11px] text-blue-700 font-bold leading-relaxed">
                            招待リンク（招待コードを含むURL）経由でアクセスした場合、ログイン・新規登録画面で招待コードが自動的に引き継がれるため、メンバーは迷わずに正しい組織へ参加できます。
                        </p>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-[2rem] p-8 lg:p-10 shadow-sm relative overflow-hidden">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <div className="flex gap-5 items-start">
                                <div className="w-8 h-8 rounded-full bg-amber-100/80 text-amber-800 flex items-center justify-center font-black text-sm shrink-0">A</div>
                                <div>
                                    <span className="font-bold text-slate-800 text-[17px] tracking-tight block mb-2">「参加」モードの選択</span>
                                    <span className="text-[14.5px] text-slate-600 leading-relaxed font-medium">招待を受けたユーザーは自動的に「参加」が選択された状態になり、企業の新規作成はスキップされます。</span>
                                </div>
                            </div>
                            <div className="flex gap-5 items-start">
                                <div className="w-8 h-8 rounded-full bg-amber-100/80 text-amber-800 flex items-center justify-center font-black text-sm shrink-0">B</div>
                                <div>
                                    <span className="font-bold text-slate-800 text-[17px] tracking-tight block mb-2">所属と担当領域の登録</span>
                                    <span className="text-[14.5px] text-slate-600 leading-relaxed font-medium">管理者が事前に指定した自分の所属部署・担当領域を確認（未設定の場合は自ら選択）します。内容が正しければ完了してダッシュボードへ遷移します。</span>
                                </div>
                            </div>
                        </div>

                        {/* UI Mockup for Onboarding Step 1 (Join mode) */}
                        <div className="bg-white rounded-3xl border border-slate-50 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] overflow-hidden hidden md:block select-none pointer-events-none relative z-10 w-full max-w-[400px] justify-self-end">
                            <div className="bg-white px-6 py-5 text-center">
                                <div className="inline-flex items-center gap-2">
                                    <Thermometer className="w-4 h-4 text-slate-500" aria-hidden />
                                    <span className="text-[13px] font-black text-slate-800 tracking-tight">初期設定</span>
                                </div>
                            </div>
                            <div className="p-8 pt-2 space-y-6">
                                <div className="flex gap-3 mb-6 justify-center">
                                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center">1</div>
                                    <div className="w-8 h-px bg-slate-100 my-auto" />
                                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 text-[11px] font-bold flex items-center justify-center">2</div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 rounded-xl border-2 border-slate-50 bg-white opacity-40">
                                        <div className="text-sm font-black text-slate-800">新規作成</div>
                                        <div className="text-[10px] text-slate-400 mt-1 font-bold">新しい組織を作成</div>
                                    </div>
                                    <div className="p-4 rounded-xl border-2 border-amber-500 bg-amber-50/50">
                                        <div className="text-sm font-black text-amber-900">参加</div>
                                        <div className="text-[10px] text-amber-700/70 mt-1 font-bold">招待を受けて参加</div>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mt-4 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-xs">A</div>
                                    <div>
                                        <div className="text-[10px] text-slate-500 font-bold mb-0.5">招待元ワークスペース</div>
                                        <div className="text-[13px] font-black text-slate-800">Acme Corporation</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 4: Slack Integration */}
            <section className="space-y-8">
                <div className="space-y-4">
                    <div className="flex items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100/80 flex-col md:flex-row">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#4A154B] text-white rounded-lg flex items-center justify-center font-black text-lg">4</div>
                            <h2 id="slack-mentions" className="text-[22px] md:text-[26px] font-black text-[#1e293b] tracking-tight">
                                Slack連携とメンション通知
                            </h2>
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black tracking-widest uppercase shrink-0">
                            <ShieldCheck className="w-3.5 h-3.5" /> Standardプラン以上
                        </div>
                    </div>
                    <div className="text-[15px] text-slate-600 font-medium leading-loose pt-2 max-w-3xl">
                        担当者へ確実にメンション（@）を飛ばすため、各メンバーの Slack User ID を登録します。<br className="hidden md:block"/>
                        通知先チャンネル（Webhook）の設定など、Slack連携の全体像とセットアップ手順は<Link href="/docs/slack-integration" className="text-indigo-600 font-bold hover:underline">「Slackアプリを準備する」</Link>をご覧ください。
                    </div>
                </div>

                <div className="bg-white border border-slate-200 p-8 lg:p-12 rounded-[2.5rem] shadow-[0_15px_50px_-12px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700">
                        <Slack className="w-48 h-48" />
                    </div>

                    <div className="space-y-8 relative z-10 max-w-2xl">
                        <div>
                            <h3 id="slack-userid" className="text-2xl font-black text-slate-800 mb-4 tracking-tight">各メンバーの User ID 登録</h3>
                            <p className="text-[15px] text-slate-600 font-medium leading-relaxed">
                                特定の担当者へ確実にメンション（@通知）を飛ばすための設定です。各メンバーのプロフィールから取得できる「メンバーID」をSigns AIに登録します。
                            </p>
                        </div>

                        <div className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] space-y-4">
                            <div className="flex items-center gap-3">
                                <Search className="w-5 h-5 text-indigo-500" />
                                <span className="text-sm font-black text-slate-800">ユーザーIDの見つけ方</span>
                            </div>
                            <ol className="text-[13px] text-slate-600 space-y-2 font-bold ml-1">
                                <li>1. 該当メンバーのプロフィールを表示</li>
                                <li>2. 「その他 ⋯ 」＞「メンバーIDをコピー」</li>
                                <li>3. Signs AIの「設定」→「メンバー」タブで対象メンバーを編集し、Slack User ID欄に貼り付け</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}