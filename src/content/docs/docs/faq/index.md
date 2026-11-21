---
title: FAQ
description: ZIGNOS のよくある質問。インストール、ファイルシステム、機能、コミュニティ、制限をまとめます。
---

ZIGNOS についてよくある質問をまとめます。目的別の入口は次のとおりです。

| 知りたいこと | ページ |
|---|---|
| インストール時のトラブル | [インストール FAQ](/docs/faq/install/) |
| ディスク・ファイルシステム | [ファイルシステム](/docs/faq/filesystems/) |
| 何ができるか | [ZIGNOS の機能](/docs/faq/features/) |
| 一般的な質問 | [一般 FAQ](/docs/faq/general/) |
| 公開窓口・参加方法 | [コミュニティ](/docs/faq/community/) |
| 現時点の制限 | [制限・未実装](/docs/faq/limitations/) |

## まず知っておきたいこと

### ZIGNOS は何ですか?

ゼロから組み立てるソースベースの Linux ディストリビューションです。独自の
パッケージマネージャ **zpkg** と OpenRC を使い、stage3 から自分でシステムを
完成させます。

### GUI は使えますか?

stage3 は CLI のみです。ただし全チャンネルに KDE Plasma 6 (Wayland) の
レシピがあり、`zpkg install plasma-meta kde-applications` で追加できます。

### アップデートはどうしますか?

`zpkg sync` でレシピを更新し、`zpkg upgrade -p` で差分を確認してから
`zpkg upgrade` を実行します。詳細は [チャンネルとアップグレード](/docs/system/channels/)
を参照してください。

### Secure Boot には対応していますか?

未対応です。GRUB とカーネルは署名されていないため、Secure Boot を無効にして
使用してください。

### 対応アーキテクチャは?

x86_64 のみです。BIOS / UEFI の両方で起動できます。
