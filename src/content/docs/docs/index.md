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

- [zpkg 設計](/docs/design-pkg/) — レシピ、DB schema 2、USE、トランザクション
- [zpkg 設定](/docs/zpkg-config/) — USE、make.conf、binpkg、レシピ同期、環境変数
- [システム設計](/docs/design-system/) — init、サービス、特権昇格、カーネル方針

## プロジェクト

- [ロードマップ](/docs/roadmap/) — M0–M35 の記録と現在の状況
- [プロジェクト概要](/about/)
