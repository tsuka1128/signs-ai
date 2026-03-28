const fs = require('fs');
const path = require('path');

/**
 * Signs AI ドキュメント検索インデックス生成スクリプト
 * 
 * src/app/docs 配下の各ページを解析し、全文検索用の JSON インデックスを作成します。
 */

const DOCS_MENU = [
    {
        category: "はじめに",
        items: [
            { title: "Signs AIとは？", href: "/docs/introduction", icon: "BookOpen" },
        ]
    },
    {
        category: "設定と連携",
        items: [
            { title: "KPIの設定と入力", href: "/docs/kpi-setup", icon: "BarChart3" },
            { title: "組織方針の登録", href: "/docs/policy-guide", icon: "Target" },
            { title: "Slackアプリを準備する", href: "/docs/slack-integration", icon: "MessageSquare" },
            { title: "メンバーの招待・管理", href: "/docs/member-management", icon: "Users" },
        ]
    },
    {
        category: "機能の使い方",
        items: [
            { title: "組織改善のPDCAサイクル", href: "/docs/pdca-guide", icon: "Target" },
            { title: "アクション管理の使い方", href: "/docs/action-guide", icon: "CheckSquare" },
            { title: "マトリックスの見方", href: "/docs/bubble-chart-guide", icon: "BarChart3" },
            { title: "マトリックスが示す成長の軌跡", href: "/docs/growth-steps", icon: "BookOpen" },
        ]
    }
];

function extractText(filePath) {
    if (!fs.existsSync(filePath)) return "";
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 不要な部分の削除（import, export, Hooks等）
    let text = content
        .replace(/import\s+.*?from\s+['"].*?['"];?/gs, '')
        .replace(/export\s+default\s+function\s+.*?\s*\{/gs, '')
        .replace(/const\s+.*?\s*=\s*.*?;/gs, '') // 定数定義
        .replace(/return\s*\(/gs, '')
        .replace(/["']use\s+client["'];?/g, '')
        .replace(/useState\(.*?\);?/g, '')
        .replace(/\(.*?\) => \{/gs, '') // アロー関数
        .replace(/\.map\(\(.*?\) => \{/gs, '') // map内
        .replace(/<[^>]+>/gs, ' ') // タグ内を削除
        .replace(/\{[^}]+\}/gs, ' ') // JSX波括弧内を削除
        .replace(/\);/gs, ' ') // 終端記号
        .replace(/\}/gs, ' ') // 終端記号
        .replace(/\s+/g, ' ') // 空白の整理
        .trim();
        
    return text;
}

const indexData = [];

DOCS_MENU.forEach(group => {
    group.items.forEach(item => {
        // href からファイルパスを特定 (/docs/foo -> src/app/docs/foo/page.tsx)
        const filePath = path.join(process.cwd(), 'src/app', item.href, 'page.tsx');
        const content = extractText(filePath);
        
        indexData.push({
            title: item.title,
            href: item.href,
            icon: item.icon,
            category: group.category,
            content: content
        });
    });
});

const outputDir = path.join(process.cwd(), 'src/lib');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(
    path.join(outputDir, 'docs-search-index.json'),
    JSON.stringify(indexData, null, 2),
    'utf8'
);

console.log(`✅ Search index generated for ${indexData.length} pages.`);
