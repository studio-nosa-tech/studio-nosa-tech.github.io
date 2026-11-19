---
title: ZIGNOS ドキュメント
description: ZIGNOS のインストール、stage3、zpkg、システム設計、ロードマップ。
---

ZIGNOS は、ゼロからビルドするソースベースの Linux ディストリビューションです。
[Studio NØSa.](https://studio-nosa.live/) が開発しています。
このサイトのドキュメントが最新の公開版です。

## はじめに

- [実機インストール](/docs/install/) — stage3 tarball を既定にした BIOS / UEFI への導入(UEFI GRUB + efibootmgr)
- [stage3 tarball](/docs/stage3/) — tarball の中身・ビルド・配布のリファレンス

> stage3 のダウンロードは現在**準備中**です。公開は [ニュース](/news/) で案内します。

## 設計

- [zpkg 設計](/docs/design-pkg/) — レシピ、DB schema 2、依存解決、USE、トランザクション
- [zpkg 設定](/docs/zpkg-config/) — USE、make.conf、binpkg、レシピ同期、環境変数
- [リリースチャンネル](/docs/channels/) — stable / testing / unstable、upgrade の差分表示と整合性チェック
- [署名と検証](/docs/signing/) — Ed25519、信頼済み鍵、ロールバック・期限対策
- [ビルド環境の隔離](/docs/build-sandbox/) — bubblewrap、読み取り専用 root、ネットワーク分離
- [再現可能なビルド](/docs/reproducibility/) — SOURCE_DATE_EPOCH、ビルドログ、provenance、SPDX SBOM
- [システム設計](/docs/design-system/) — init、サービス、特権昇格、カーネル方針
- [デスクトップ環境](/docs/desktop/) — KDE Plasma 6 (Wayland) の設計方針とフェーズ(設計中)

## プロジェクト

- [現在のリリース](/releases/current/) — {{release}} の stage3・バージョン・チェックサム・パッケージ一覧
- [リリースマニフェスト](/docs/release-manifest/) — release.json のスキーマと生成・参照方法
- [ロードマップ](/docs/roadmap/) — M0–M42 の記録と現在の状況
- [プロジェクト概要](/about/)
