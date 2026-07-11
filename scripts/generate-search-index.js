const fs = require('fs');
const path = require('path');

/**
 * Signs AI ドキュメント検索インデックス生成スクリプト
 * 
 * src/app/docs 配下の各ページを解析し、セクション（h2, h3）単位で
 * 全文検索用の JSON インデックスを作成します。
 */

/**
 * ドキュメントのページ一覧は src/lib/docs-menu.ts を単一ソースとして参照する。
 * （以前はこのスクリプトに別の配列をハードコードしており、docs-menu.ts に追加した
 *  ページ（flow / hr-strategy-guide / labor-cost-guide 等）が検索対象から漏れていた。）
 * docs-menu.ts は lucide アイコンを import する TS/TSX のため require できないので、
 * テキストをパースして {category, items:[{title, href, icon}]} を復元する。
 */
function loadDocsMenu() {
    const menuPath = path.join(process.cwd(), 'src/lib/docs-menu.ts');
    const src = fs.readFileSync(menuPath, 'utf8');

    // グループ見出し（title: "..." の直後に items: [ が続くもの）
    const groupRe = /title:\s*"([^"]+)"\s*,\s*items\s*:\s*\[/g;
    // 各アイテム（title / href / icon を持つ）
    const itemRe = /title:\s*"([^"]+)"\s*,\s*href:\s*"([^"]+)"\s*,\s*icon:\s*([A-Za-z0-9_]+)/g;

    const groupMarks = [];
    let g;
    while ((g = groupRe.exec(src)) !== null) {
        groupMarks.push({ category: g[1], index: g.index });
    }

    const byCategory = new Map();
    let it;
    while ((it = itemRe.exec(src)) !== null) {
        const itemIndex = it.index;
        let category = "その他";
        for (const gm of groupMarks) {
            if (gm.index < itemIndex) category = gm.category; else break;
        }
        if (!byCategory.has(category)) byCategory.set(category, []);
        byCategory.get(category).push({ title: it[1], href: it[2], icon: it[3] });
    }

    return [...byCategory.entries()].map(([category, items]) => ({ category, items }));
}

const DOCS_MENU = loadDocsMenu();

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
