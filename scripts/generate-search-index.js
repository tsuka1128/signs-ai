const fs = require('fs');
const path = require('path');

/**
 * Signs AI ドキュメント検索インデックス生成スクリプト
 * 
 * src/app/docs 配下の各ページを解析し、セクション（h2, h3）単位で
 * 全文検索用の JSON インデックスを作成します。
 */

const DOCS_MENU = [
    {
        category: "はじめに",
        items: [
            { title: "Signs AIとは？", href: "/docs/introduction", icon: "BookOpen" },
            { title: "初回セットアップガイド", href: "/docs/getting-started", icon: "Rocket" },
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
        category: "日常の運用",
        items: [
            { title: "ボイスチェック回答ガイド", href: "/docs/voice-check", icon: "MessageSquareHeart" },
            { title: "KPI実績の入力方法", href: "/docs/kpi-input", icon: "Table2" },
            { title: "ダッシュボードの見方", href: "/docs/dashboard-guide", icon: "LayoutDashboard" },
        ]
    },
    {
        category: "分析と改善",
        items: [
            { title: "組織改善のPDCAサイクル", href: "/docs/pdca-guide", icon: "Target" },
            { title: "アクション管理の使い方", href: "/docs/action-guide", icon: "CheckSquare" },
            { title: "マトリックスの見方", href: "/docs/bubble-chart-guide", icon: "BarChart3" },
            { title: "マトリックスが示す成長の軌跡", href: "/docs/growth-steps", icon: "TrendingUp" },
        ]
    },
    {
        category: "サポート",
        items: [
            { title: "FAQ / トラブルシューティング", href: "/docs/faq", icon: "HelpCircle" },
        ]
    }
];

/**
 * テキストからタグやJSXの波括弧等を除去してクリーンアップする
 */
function cleanText(text) {
    if (!text) return "";
    return text
        .replace(/<[^>]+>/gs, ' ')
        .replace(/\{[^}]+\}/gs, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * ファイルからセクション（h2, h3）ごとに情報を抽出する
 */
function extractSections(filePath, item, category) {
    if (!fs.existsSync(filePath)) return [];
    
    let fullContent = fs.readFileSync(filePath, 'utf8');
    
    // 粗いクリーンアップ（不要なコードブロックを削除）
    let cleanContent = fullContent
        .replace(/import\s+.*?from\s+['"].*?['"];?/gs, '')
        .replace(/export\s+default\s+function\s+.*?\s*\{/gs, '')
        .replace(/const\s+.*?\s*=\s*.*?;/gs, '')
        .replace(/return\s*\(/gs, '')
        .replace(/["']use\s+client["'];?/g, '')
        .replace(/useState\(.*?\);?/g, '');

    // 見出し（h2, h3）を検索
    const headingRegex = /<(h[23])(?:\s+[^>]*?id=["']([^"']+)["'])?[^>]*?>(.*?)<\/\1>/gis;
    
    const headings = [...cleanContent.matchAll(headingRegex)];
    const sections = [];

    // 1. 冒頭セクション（最初の見出しまで）
    const firstMatch = headings[0];
    if (firstMatch) {
        const introText = cleanContent.substring(0, firstMatch.index);
        const cleanedIntro = cleanText(introText);
        if (cleanedIntro.length > 5) {
            sections.push({
                title: item.title,
                href: item.href,
                icon: item.icon,
                category: category,
                content: cleanedIntro
            });
        }
    } else {
        // 見出しが一つもない場合
        sections.push({
            title: item.title,
            href: item.href,
            icon: item.icon,
            category: category,
            content: cleanText(cleanContent)
        });
        return sections;
    }

    // 2. 見出しごとのセクション
    for (let i = 0; i < headings.length; i++) {
        const match = headings[i];
        const nextMatch = headings[i + 1];
        const end = nextMatch ? nextMatch.index : cleanContent.length;
        
        const id = match[2];
        const headingTitle = cleanText(match[3]);
        const sectionContent = cleanContent.substring(match.index + match[0].length, end);
        const cleanedContent = cleanText(sectionContent);

        sections.push({
            title: `${item.title} > ${headingTitle}`,
            href: id ? `${item.href}#${id}` : item.href,
            icon: item.icon,
            category: category,
            content: cleanedContent
        });
    }

    return sections;
}

const indexData = [];

DOCS_MENU.forEach(group => {
    group.items.forEach(item => {
        const filePath = path.join(process.cwd(), 'src/app', item.href, 'page.tsx');
        const sections = extractSections(filePath, item, group.category);
        indexData.push(...sections);
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

console.log(`✅ Search index generated for ${indexData.length} sections across ${DOCS_MENU.reduce((acc, g) => acc + g.items.length, 0)} pages.`);
