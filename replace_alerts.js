const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

const files = getAllFiles('src');

const errorKeywords = ['失敗', 'エラー', 'できません', '入力してください', '選択してください', 'err', 'error', 'Error'];

function isError(msg) {
    return errorKeywords.some(kw => msg.includes(kw));
}

let changedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    const alertGeneralRegex = /alert\((.*?)\);?/g;

    let hasChanges = false;
    let newContent = content.replace(alertGeneralRegex, (match, inner) => {
        let isErr = isError(inner);
        
        // login/page.tsx specific rule: user said "ログインエラーは toast.error() で全て統一"
        // In login/page.tsx, if it's "確認メールを再送しました。", it's success. 
        if (file.includes('login/page.tsx') && inner.includes('確認メールを再送しました')) {
            isErr = false;
        } else if (file.includes('login/page.tsx')) {
            isErr = true;
        }

        hasChanges = true;
        if (isErr) {
            return `toast.error(${inner});`;
        } else {
            return `toast.success(${inner});`;
        }
    });

    if (hasChanges) {
        if (!newContent.includes('import { toast } from "sonner"')) {
            const lastImportIndex = newContent.lastIndexOf('import ');
            if (lastImportIndex !== -1) {
                const endOfLine = newContent.indexOf('\n', lastImportIndex);
                newContent = newContent.slice(0, endOfLine + 1) + 'import { toast } from "sonner";\n' + newContent.slice(endOfLine + 1);
            } else {
                newContent = 'import { toast } from "sonner";\n' + newContent;
            }
        }
        
        fs.writeFileSync(file, newContent, 'utf8');
        changedFiles++;
    }
});

console.log(`Changed ${changedFiles} files.`);
