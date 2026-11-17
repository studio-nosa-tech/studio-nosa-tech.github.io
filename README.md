# ZIGNOS Official Site

ZIGNOS Project の公式サイト。Astro + Starlight の静的サイトで、GitHub Pages
(org ルート)に配信する。開発・運営は [Studio NØSa.](https://studio-nosa.live/)。

- 公開 URL(予定): <https://studio-nosa-tech.github.io/>
- リポジトリ名: `studio-nosa-tech/studio-nosa-tech.github.io`(**Public**)
- ドキュメント: `/docs/`(このリポジトリの `src/content/docs` が**正**)

## 開発

必要: Node.js 22.23 以上(npm 同梱)。

```bash
npm install
npm run dev       # http://localhost:4321/
npm run build     # dist/ に静的ファイルを生成
npm run preview   # ビルド結果をローカルで確認
```

画像(favicon / OGP)を作り直す場合:

```bash
node scripts/make-assets.mjs   # public/favicon.png, public/og.png
```

## 構成

```
astro.config.mjs          site / Starlight(sidebar, logo, locale)
src/
  assets/logo.png         ヘッダー・ヒーロー用ロゴ(透過)
  assets/wallpaper.webp   キービジュアル / OGP の元画像
  content/docs/docs/      公開ドキュメント(Starlight)
  content/i18n/ja.json    Starlight UI の日本語上書き
  layouts/PageLayout.astro  ランディング等の共通レイアウト
  pages/                  /, /download/, /about/, /news/, 404
  styles/site.css         ランディング系のデザイン
  styles/starlight.css    ドキュメントのブランド配色
public/                   favicon.png, og.png, wallpaper.png(壁紙配布用)
scripts/make-assets.mjs   favicon / OGP の生成
.github/workflows/deploy.yml  GitHub Pages へのビルド/デプロイ
```

## デプロイ(GitHub Pages)

1. `studio-nosa-tech` に **Public** リポジトリ
   `studio-nosa-tech.github.io` を作成する(org ルート Pages になる)
2. `main` を push する
3. リポジトリの **Settings → Pages → Build and deployment → Source** を
   **GitHub Actions** にする
4. Actions の `Deploy to GitHub Pages` が走り、
   `https://studio-nosa-tech.github.io/` で公開される

独自ドメインを使う場合は Pages の Custom domain に設定し、Astro の
`site`(astro.config.mjs)もそのドメインへ変更する。

## ドキュメントの方針

- 公開ドキュメントの**正はこのリポジトリ**。`src/content/docs/docs/` を編集する
- 初回は `zignos` リポジトリの `docs/` から次の 5 本を移行した:
  install / stage3 / design-pkg / design-system / roadmap
- 移行時に内部情報を除去している:
  - ビルド VM のホスト名・ユーザー名・初期パスワード
  - 非公開リポジトリ / 非公開 Release へのリンク
  - 公開していない `env.md`(開発環境・VM 運用)と `design-bootstrap.md` への参照
- `zignos` 側の `docs/` は今後、公開ドキュメントへのポインタに整理する

## ダウンロード(Coming soon)

stage3 の配布はまだ準備中。`src/pages/download.astro` は「準備中」表示にしてある。
公開時は次を行う:

1. このリポジトリの Releases に stage3(必要なら分割)と sha256 を添付
2. `download.astro` にダウンロードリンクとチェックサムを追加
3. `news/` にリリース告知を追加

## 注意

- このリポジトリは Public になる。秘密情報・内部ホスト名・認証情報を置かない
- 依存はビルド時のみ(`node_modules` はコミットしない)
