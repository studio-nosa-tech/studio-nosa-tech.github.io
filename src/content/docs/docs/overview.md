---
title: ZIGNOS 概要
description: ZIGNOS の位置づけ、現在のリリース、3つのチャンネル、デスクトップ、リポジトリ構成をまとめます。
---

ZIGNOS は、ゼロから組み立てる **ソースベースの Linux ディストリビューション**です。
完成品をそのまま配るのではなく、ツールチェーンからベースシステム、デスクトップまでを
レシピとパッケージマネージャ **zpkg** で再現できる状態に保ちます。

**ZIGNOS は Gentoo ベースではありません。** Portage や ebuild は使わず、
ツールチェーンから最小ベースまでを独自のブートストラップ手順で構築しています。
パッケージ管理は zpkg と独自のレシピツリーで行います。

> 本文では「ZIGNOS」と略します。OS 全体の名称は **ZIGNOS GNU/Linux** です。

- init は **OpenRC**。systemd は使いません
- パッケージ管理は独自の **zpkg**。USE フラグ、スロット、binpkg、署名、ロールバックを持ちます
- ベースは **CLI の最小構成**。デスクトップは `desktop/` から任意で追加します
- BIOS / UEFI の両方で起動できます
- 開発元は [Studio NØSa.](https://studio-nosa.live/)

## 現在のリリース

公開マニフェストの値です。stage3 の一般配布は現在**準備中**で、公開は
[ニュース](/news/) で案内します。

| 項目 | 内容 |
|---|---|
| リリース | **{{release}}** |
| stage3 | **{{stage3.revision}}** / {{stage3.package_count}} パッケージ / 約 {{stage3.size_mib}} MiB |
| zpkg | {{zpkg.version}}（開発ツリーは 0.3.3） |
| Linux kernel | {{kernel.full}} |
| base.list | トップレベル {{base.top_level}} / 依存込み {{base.closure}} |
| レシピ | {{recipes.total}}（stable / testing / unstable の合計） |

stage3 はカーネルと GRUB を含まない chroot 可能な最小ベースです。展開後に
`zpkg install linux grub` でカーネルとブートローダーを導入します。

## 3つのチャンネル

ZIGNOS はローリングリリースです。用途に応じて3つのチャンネルを選べます。

| チャンネル | 用途 | 主な構成 |
|---|---|---|
| `stable` | 安定版。既定 | Linux 6.18.64 LTS / Qt 6.8.5 LTS / KF6 6.18 / Plasma 6.4.5 |
| `testing` | 次期 stable の検証 | Linux 7.3.5 / Qt 6.11.3 / KF6 6.32 / Plasma 6.8.3 |
| `unstable` | 開発中の最新版 | Linux 7.4-rc3 / Gear 26.11.80 beta |

変更は **Unstable → Testing → Stable** の順に検証し、逆流させません。
切り替え時は `zpkg upgrade -p` で差分を確認してください。

## デスクトップ

最初のデスクトップ環境として **KDE Plasma 6 (Wayland)** を用意しています。
`plasma-meta` と `kde-applications` は分離され、必要なものだけを追加できます。
SDDM は全チャンネル、Plasma Login Manager は Testing / Unstable で利用できます。

stage3 と既定のイメージは CLI の最小ベースのままです。デスクトップは
[デスクトップ環境](/docs/desktop/) の手順で追加します。

## リポジトリ

| リポジトリ | 役割 | 公開 |
|---|---|---|
| `zignos` | プロジェクト文書とロードマップ | 非公開 |
| `zpkg` | パッケージマネージャ本体 | 非公開 |
| `zignos-build` | bootstrap・stage3 / イメージ作成 | 非公開 |
| `zignos-recipes` | stable / testing / unstable のレシピツリー | 公開 |
| `studio-nosa-tech.github.io` | この公式サイト | 公開 |

## 次に読む

- 初めて使う: [インストール](/docs/install/)
- 設計を知る: [哲学](/docs/philosophy/) / [システム設計](/docs/design-system/)
- パッケージ管理: [zpkg 設計](/docs/design-pkg/) / [zpkg 設定](/docs/zpkg-config/)
- よくある質問: [FAQ](/docs/faq/)
