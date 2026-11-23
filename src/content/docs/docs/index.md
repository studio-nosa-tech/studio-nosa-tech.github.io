---
title: ZIGNOS ドキュメント
description: ZIGNOS の概要、導入、システム管理、リファレンス、FAQ への入口。
---

ZIGNOS は、ゼロから組み立てるソースベースの Linux ディストリビューションです。
[Studio NØSa.](https://studio-nosa.live/) が開発しています。

> stage3 は [ダウンロード](/download/)(GitHub Releases)から取得できます。

## はじめての方

- [ZIGNOS 概要](/docs/overview/) — 現在のリリース、チャンネル、デスクトップ、リポジトリ
- [哲学](/docs/philosophy/) — なぜゼロから作るのか
- [インストール](/docs/install/) — 要件確認からデスクトップ追加まで 1 ページ
- [FAQ](/docs/faq/) — よくある質問

## 使う

### インストール

- [インストール](/docs/install/) — 要件、SystemRescue、stage3、chroot、カーネル、GRUB、VIDEO_CARDS、デスクトップ

### システム管理

- [システム管理](/docs/system/) — 設定・サービス・パッケージの入口
- [設定ファイルの場所](/docs/system/config/)
- [パッケージの管理](/docs/system/packages/)
- [チャンネルとアップグレード](/docs/system/channels/)
- [サービス (OpenRC)](/docs/system/services/)

### デスクトップ

- [デスクトップ概要](/docs/desktops/)
- [KDE Plasma 6](/docs/system/desktop/)
- [Wayland と Xwayland](/docs/desktops/wayland/)
- [デスクトップ環境(詳細)](/docs/desktop/)

## パッケージング

- [パッケージング概要](/docs/packaging/) — zignos-recipes の構成
- [ワークフロー](/docs/packaging/workflow/) — 追加・更新・ビルド・PR
- [レシピ](/docs/packaging/recipes/) — ファイル構成とビルド契約
- [ビルドパターン](/docs/packaging/patterns/) — autotools / CMake / Meson / Cargo / Go など
- [システムアカウント](/docs/packaging/accounts/) — グループとサービスユーザー

## 開発

- [開発者向け概要](/docs/developers/) — 層、リポジトリ、リリースの流れ
- [zpkg 設計](/docs/design-pkg/) — レシピ、DB、依存解決、USE、トランザクション
- [zpkg 設定](/docs/zpkg-config/) — make.conf、USE、binpkg、レシピ同期
- [署名と検証](/docs/signing/) — Ed25519、信頼済み鍵
- [ビルド隔離](/docs/build-sandbox/) — bubblewrap
- [再現可能ビルド](/docs/reproducibility/) — provenance、SPDX SBOM
- [リリースマニフェスト](/docs/release-manifest/)
- [ロードマップ](/docs/roadmap/) — M0–M51 の記録

## リファレンス

- [stage3 リファレンス](/docs/stage3/) — 中身・ビルド・配布
- [リリースチャンネル](/docs/channels/) — チャンネル運用と upgrade の詳細
- [システム設計](/docs/design-system/) — init、サービス、カーネル方針

## プロジェクト

- [現在のリリース](/releases/current/) — {{release}} の配布物とパッケージ一覧
- [コントリビュート](/docs/contributing/)
- [プロジェクト概要](/about/)
- [公式サイト](/) / [ニュース](/news/)
