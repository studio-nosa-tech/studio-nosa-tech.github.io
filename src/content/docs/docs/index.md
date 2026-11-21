---
title: ZIGNOS ドキュメント
description: ZIGNOS の概要、導入、システム管理、リファレンス、FAQ への入口。
---

ZIGNOS は、ゼロから組み立てるソースベースの Linux ディストリビューションです。
[Studio NØSa.](https://studio-nosa.live/) が開発しています。

> stage3 の一般配布は現在**準備中**です。公開は [ニュース](/news/) で案内します。

## はじめての方

- [ZIGNOS 概要](/docs/overview/) — 現在のリリース、チャンネル、デスクトップ、リポジトリ
- [哲学](/docs/philosophy/) — なぜゼロから作るのか
- [はじめに](/docs/getting-started/) — 要件確認から初回起動までの流れ
- [FAQ](/docs/faq/) — よくある質問

## 使う

### インストール

- [要件](/docs/getting-started/requirements/)
- [ダウンロード](/docs/getting-started/download/)
- [インストール環境の準備](/docs/getting-started/media/)
- [SystemRescue の起動](/docs/getting-started/boot/)
- [ZIGNOS のインストール](/docs/getting-started/install/)
- [初回起動と設定](/docs/getting-started/first-boot/)

### システム管理

- [システム管理](/docs/system/) — 設定・サービス・パッケージの入口
- [設定ファイルの場所](/docs/system/config/)
- [パッケージの管理](/docs/system/packages/)
- [チャンネルとアップグレード](/docs/system/channels/)
- [サービス (OpenRC)](/docs/system/services/)
- [デスクトップ (KDE)](/docs/system/desktop/)

## リファレンス

- [インストールガイド(詳細)](/docs/install/) — コマンド完全版
- [stage3 リファレンス](/docs/stage3/) — 中身・ビルド・配布
- [zpkg 設計](/docs/design-pkg/) — レシピ、DB、依存解決、USE、トランザクション
- [zpkg 設定](/docs/zpkg-config/) — make.conf、USE、binpkg、レシピ同期
- [リリースチャンネル](/docs/channels/) — チャンネル運用と upgrade の詳細
- [署名と検証](/docs/signing/) — Ed25519、信頼済み鍵
- [ビルド隔離](/docs/build-sandbox/) — bubblewrap
- [再現可能ビルド](/docs/reproducibility/) — provenance、SPDX SBOM
- [システム設計](/docs/design-system/) — init、サービス、カーネル方針
- [リリースマニフェスト](/docs/release-manifest/)
- [ロードマップ](/docs/roadmap/) — M0–M51 の記録

## プロジェクト

- [現在のリリース](/releases/current/) — {{release}} の配布物とパッケージ一覧
- [コントリビュート](/docs/contributing/)
- [プロジェクト概要](/about/)
- [公式サイト](/) / [ニュース](/news/)
