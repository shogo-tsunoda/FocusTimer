# アイコン・アセット管理ガイド

## 概要

| 用途 | 生成ファイル | 参照先 |
|------|-------------|--------|
| Windows .exe アイコン | `src-tauri/icons/icon.ico` | Tauri ビルド自動参照 |
| macOS アプリアイコン | `src-tauri/icons/icon.icns` | Tauri ビルド自動参照 |
| Vector 公開用 | `assets/vector/icon-*.png` | 手動で使用 |
| Microsoft Store 提出 | `assets/microsoft-store/store-*.png` | 手動でアップロード |

---

## 元画像

```
icon.png  (プロジェクトルート)
```

- **推奨サイズ**: 1024×1024 以上の正方形 PNG
- 正方形でない場合（例: バナー画像）は生成スクリプトが自動で中央クロップする
- 透過背景（RGBA）推奨

---

## アイコン再生成コマンド

```bash
npm run generate:icons
```

このコマンド1つで以下がすべて再生成される:
- `src-tauri/icons/` — Tauri 公式アイコン一式（`.ico` / `.icns` / PNG 各サイズ / iOS / Android / APPX）
- `assets/vector/` — Vector 公開用 PNG
- `assets/microsoft-store/` — Microsoft Store 提出用 PNG

---

## ディレクトリ構成

```
icon.png                        ← 元画像（ここを差し替える）
scripts/
  generate-icons.mjs            ← アイコン生成スクリプト
src-tauri/
  icons/
    icon.ico                    ← Windows .exe アイコン（多サイズ埋め込み）
    icon.icns                   ← macOS アプリアイコン
    icon.png                    ← 512x512（Tauri 内部参照用）
    32x32.png
    64x64.png
    128x128.png
    128x128@2x.png              ← 256x256
    StoreLogo.png               ← 50x50（APPX/MSIX ストアロゴ）
    Square30x30Logo.png
    Square44x44Logo.png
    Square71x71Logo.png
    Square89x89Logo.png
    Square107x107Logo.png
    Square142x142Logo.png
    Square150x150Logo.png
    Square284x284Logo.png
    Square310x310Logo.png
    ios/                        ← iOS アイコン各サイズ
    android/                    ← Android アイコン各サイズ
assets/
  vector/
    icon-512.png                ← Vector 公開・配布用（最高品質）
    icon-256.png
    icon-128.png
    icon-64.png
  microsoft-store/
    store-square-32x32.png
    store-square-44x44.png      ← アプリリストアイコン（必須）
    store-logo-50x50.png        ← ストアロゴ（必須）
    store-square-71x71.png
    store-square-150x150.png    ← 小タイル（必須）
    store-square-256x256.png
    store-square-310x310.png    ← 大タイル（必須）
    store-wide-310x150.png      ← ワイドタイル（推奨）
```

---

## 各用途の詳細

### Windows .exe アイコン

`src-tauri/icons/icon.ico` が `.exe` ファイルに埋め込まれる。
サイズ 16 / 24 / 32 / 48 / 64 / 128 / 256 px のすべてが1ファイルに格納されている。

Tauri が `src-tauri/tauri.conf.json` の `bundle.icon` リストを参照してビルド時に自動適用する:

```json
"bundle": {
  "icon": [
    "icons/32x32.png",
    "icons/64x64.png",
    "icons/128x128.png",
    "icons/128x128@2x.png",
    "icons/icon.icns",
    "icons/icon.ico"
  ]
}
```

### Vector 公開（Vector サイト等）

`assets/vector/icon-256.png` または `assets/vector/icon-512.png` を使用する。
透過背景 PNG のためどの背景色にも対応できる。

### Microsoft Store 提出

Store 提出時は `assets/microsoft-store/` 以下のファイルを使用する。
Store 提出ポータル（Partner Center）では以下が必須:

| ファイル | サイズ | Store での用途 |
|---------|-------|--------------|
| `store-logo-50x50.png` | 50×50 | ストアロゴ |
| `store-square-44x44.png` | 44×44 | アプリリスト |
| `store-square-150x150.png` | 150×150 | 小タイル |
| `store-square-310x310.png` | 310×310 | 大タイル |
| `store-wide-310x150.png` | 310×150 | ワイドタイル |

> **注意**: Store 提出にはアイコン以外に**スクリーンショット**（最低1枚、1366×768 以上推奨）も必要。
> スクリーンショットはアイコン生成スクリプトの対象外のため、別途用意すること。

---

## icon.png を差し替えたときの更新手順

1. プロジェクトルートの `icon.png` を新しい画像で上書きする
   （1024×1024 以上の正方形 PNG 推奨）
2. 以下を実行する:
   ```bash
   npm run generate:icons
   ```
3. 生成結果を確認する:
   - `src-tauri/icons/icon.png` が新しいアイコンになっているか
   - `assets/vector/icon-256.png` が正しく表示されるか
4. 変更をコミットする:
   ```bash
   git add icon.png src-tauri/icons/ assets/
   git commit -m "chore: update app icons"
   ```

---

## 生成スクリプトの仕組み

`scripts/generate-icons.mjs` は以下の順で処理する:

1. `icon.png` を読み込み、正方形でない場合は中央クロップ
2. `npx tauri icon <square>` を実行 → `src-tauri/icons/` に公式アイコン一式を生成
3. `sharp` を使って `assets/vector/` に Vector 用 PNG を生成
4. `sharp` を使って `assets/microsoft-store/` に Store 用 PNG を生成

依存パッケージ: `sharp` (devDependency), `@tauri-apps/cli` (devDependency)
