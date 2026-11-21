---
title: 開発者向け概要
description: ZIGNOS のアーキテクチャ、リポジトリ、ビルドチェーン、開発用ドキュメントの入口。
---

ZIGNOS は、bootstrap で作った土台の上に、zpkg とレシピで最終システムを
組み立てます。開発時は「どの層を変更しているか」を意識すると追いやすくなります。

## 層

```
stage0/1  cross toolchain        zignos-build
stage2    bootstrap core         zignos-build
base      base.list closure      zignos-recipes
desktop   plasma-meta / apps     zignos-recipes
release   stage3 / manifest      zignos-build
```

- **bootstrap** — 一時システムと cross toolchain
- **base** — glibc / gcc / binutils / OpenRC / zpkg / git など
- **desktop** — KDE Plasma 6 と KDE アプリ
- **release** — stage3、`release.json`、サイト

## リポジトリ

| リポジトリ | 内容 |
|---|---|
| `zignos` | 設計文書、ロードマップ |
| `zpkg` | パッケージマネージャ本体 |
| `zignos-build` | bootstrap、stage3 / イメージ、QEMU テスト |
| `zignos-recipes` | レシピツリー(公開) |
| `studio-nosa-tech.github.io` | 公式サイト(公開) |

## 読む順序

1. [zpkg 設計](/docs/design-pkg/) — レシピ、DB schema、依存解決、USE、トランザクション
2. [レシピ](/docs/packaging/recipes/) — レシピのファイル構成と契約
3. [パッケージングワークフロー](/docs/packaging/workflow/) — 追加・更新・PR
4. [システム設計](/docs/design-system/) — init、サービス、特権昇格、カーネル
5. [署名と検証](/docs/signing/) — Ed25519 と信頼チェーン
6. [ビルド隔離](/docs/build-sandbox/) — bubblewrap
7. [再現可能ビルド](/docs/reproducibility/) — provenance / SBOM
8. [リリースマニフェスト](/docs/release-manifest/) — release.json

## リリースの流れ

1. recipes の unstable でビルド・検証
2. testing へ昇格して QEMU / 実機で確認
3. stable へ昇格
4. `make-stage3.sh` で stage3 と `release.json` を生成
5. `publish-release.sh` でマニフェストを公開
6. サイトの `src/data/release.json` を更新してデプロイ

## 開発時の注意

- 変更はチャンネル順(unstable → testing → stable)を守る
- 同じ version+revision のまま内容を変えない
- 依存はレシピに明示する(暗黙のビルド環境依存を残さない)
- ビルドログと QEMU / 実機の確認結果を残す
- `/etc/passwd` など管理者所有ファイルをパッケージで置き換えない

不明点は [コントリビュート](/docs/contributing/) と
[コミュニティ](/docs/faq/community/) を参照してください。
