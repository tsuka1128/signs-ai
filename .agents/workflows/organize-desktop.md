---
description: デスクトップのファイルを本日の日付フォルダに整理する
---

デスクトップ上（`/Users/tsukagoshiyuta/Desktop`）にある `desktop` フォルダ以外のすべてのファイルを、本日の日付（YYYYMMDD形式）を名前にもつ新しいフォルダ（例: `desktop20260222`）に移動させ、さらにそのフォルダを `desktop` フォルダの中に格納するワークフローです。

// turbo
1. 以下のシェルスクリプトを実行し、デスクトップを整理します。

```bash
cd /Users/tsukagoshiyuta/Desktop
TODAY=$(date "+%Y%m%d")
mkdir -p "desktop/desktop${TODAY}"

for item in *; do
  if [ "$item" != "desktop" ] && [ "$item" != "*" ]; then
    mv "$item" "desktop/desktop${TODAY}/"
  fi
done

echo "デスクトップの整理が完了しました。移動先: /Users/tsukagoshiyuta/Desktop/desktop/desktop${TODAY}"
```

2. 整理が完了した旨をユーザーに報告します。
