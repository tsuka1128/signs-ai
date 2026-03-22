import { 
    Users, 
    ArrowRight, 
    UserPlus, 
    Slack, 
    ShieldCheck, 
    AlertCircle,
    Copy,
    Search
} from "lucide-react";
import Link from "next/link";

export default function MemberManagementPage() {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Link href="/docs" className="hover:text-teal transition-colors">Documentation</Link>
                <ArrowRight className="w-3 h-3" />
                <span className="text-slate-900">Member Management</span>
            </nav>

            <div className="space-y-4">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">メンバーの招待と管理</h1>
                <p className="text-lg text-slate-500 font-medium leading-relaxed">
                    チームメンバーをSigns AIへ招待し、適切な権限を設定する方法を解説します。
                </p>
            </div>

            {/* Section 1: Invitation */}
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm">1</div>
                    <h2 className="text-2xl font-black text-slate-900">メンバーを招待する</h2>
                </div>
                <div className="pl-11 space-y-4">
                    <p className="text-slate-600 font-medium leading-relaxed">
                        メールアドレスを指定して、新しいメンバーを組織に追加します。
                    </p>
                    <div className="bg-slate-50 p-6 rounded-[28px] border border-slate-100">
                        <ul className="space-y-3 list-none pl-0 text-sm text-slate-600 font-medium">
                            <li className="flex items-center gap-2">
                                <UserPlus className="w-4 h-4 text-slate-400" />
                                <span>「設定」→「メンバー管理」タブを開きます。</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <PlusIcon className="w-4 h-4 text-slate-400" />
                                <span>「メンバーを招待」ボタンを押し、氏名とメールアドレス、所属部署を選択します。</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-teal" />
                                <span>権限（管理者 / メンバー）を選択し、招待メールを送信します。</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Section 2: Slack User ID */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 text-teal">
                    <div className="w-8 h-8 rounded-full bg-teal text-white flex items-center justify-center font-black text-sm text-white">2</div>
                    <h2 className="text-2xl font-black text-slate-900">Slack User IDを紐付ける</h2>
                </div>
                <div className="pl-11 space-y-4">
                    <p className="text-slate-600 font-medium leading-relaxed">
                        AIがSlackで個人にメンションを送るために、各メンバーの「Slack User ID」の登録が必要です。
                    </p>
                    <div className="bg-white border-2 border-slate-100 p-6 rounded-[32px] shadow-sm">
                        <h4 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
                            <Search className="w-4 h-4 text-slate-400" />
                            IDの調べ方（Slackデスクトップ版の場合）
                        </h4>
                        <ol className="space-y-3 list-decimal pl-5 text-sm text-slate-600 font-medium">
                            <li>Slackで対象メンバーのプロフィール画像をクリック。</li>
                            <li>「プロフィール」を表示。</li>
                            <li>「その他」のアイコン（縦に並んだ3つの点）をクリック。</li>
                            <li><strong>「メンバーIDをコピー」</strong>を選択。</li>
                        </ol>
                    </div>
                </div>
            </section>

            {/* Hint section */}
            <div className="p-6 bg-slate-900 text-white rounded-3xl flex gap-4 shadow-xl">
                <div className="p-2 bg-white/10 rounded-xl h-fit">
                    <Slack className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="text-sm font-black mb-1 text-white">なぜメンションIDが必要か？</h3>
                    <p className="text-sm text-slate-300 leading-relaxed font-medium">
                        Slack User IDを登録することで、AIがアクションを提案する際に「@山田太郎さん」のように直接メンションを飛ばすことが可能になり、実行漏れを防ぐことができます。
                    </p>
                </div>
            </div>

            {/* Next buttons */}
            <div className="pt-10 border-t border-slate-100 flex items-center justify-between">
                <Link href="/docs/kpi-setup" className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-all font-bold group">
                    <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    KPIの設定と入力
                </Link>
                <Link href="/docs" className="flex items-center gap-2 text-teal hover:text-teal-600 transition-all font-bold group">
                    ドキュメントトップへ
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    );
}

function PlusIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )
}
