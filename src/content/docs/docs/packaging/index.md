---
title: パッケージング
description: zignos-recipes の構成、チャンネル、レシピを追加・更新するための入口。
---

ZIGNOS のパッケージは、[zignos-recipes](https://github.com/studio-nosa-tech/zignos-recipes)
のレシピからビルドします。レシピはパッケージごとのディレクトリで、シェル
スクリプトとメタデータファイルで構成されます。

## ツリーの構成

```
zignos-recipes/
├── stable/{core,main,desktop}/
├── testing/{core,main,desktop}/
└── unstable/{core,main,desktop}/
```

| カテゴリ | 内容 |
|---|---|
| `core` | ベースシステム、ツールチェーン、zpkg |
| `main` | CLI ツール、ネットワーク、ライブラリ、ビルドツール |
| `desktop` | KDE Plasma 6 と KDE アプリ |

3チャンネルは同じ構造を持ち、変更は **unstable → testing → stable** の順に
昇格させます。バージョンと構成は [リリースチャンネル](/docs/channels/) を
参照してください。

## ページ

- [ワークフロー](/docs/packaging/workflow/) — 前提、レシピ作成、更新、ビルド、PR
- [レシピ](/docs/packaging/recipes/) — ファイル構成、メタデータ、依存、フック
- [ビルドパターン](/docs/packaging/patterns/) — autotools / CMake / Meson / Cargo / Go / Python / Perl / Qt
- [システムアカウント](/docs/packaging/accounts/) — グループとサービスユーザー

## 基本コマンド

```sh
zpkg build <pkg>          # destroot までビルド
zpkg install -p <pkg>     # 何が入るか確認
zpkg install <pkg>        # ビルドしてインストール
zpkg sync                 # レシピツリーを更新
```

レシピの内部仕様は [zpkg 設計](/docs/design-pkg/) を参照してください。
