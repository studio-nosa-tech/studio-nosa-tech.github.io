---
title: ダウンロード
description: ZIGNOS の stage3 tarball、レシピツリー、zpkg バイナリと、現在の公開状況。
---

## 現在の状況

ZIGNOS の stage3 は現在**一般配布を準備中**です。公開時は
[ダウンロード](/download/) と [ニュース](/news/) で案内します。

公開マニフェストには、次のファイル名・サイズ・SHA-256 が記録されています。

| 配布物 | 内容 |
|---|---|
| stage3 | `{{stage3.filename}}` |
| レシピツリー | `{{recipes.filename}}` |
| zpkg | マニフェストの `artifacts` を参照 |

stage3 の SHA-256: `{{stage3.sha256}}`

## 開発者が自分で生成する場合

`zignos-build/make-stage3.sh` で stage3 を生成できます。

```sh
sudo OUT=/var/tmp/zignos-stage3.tar.xz ./make-stage3.sh
sha256sum --check /var/tmp/zignos-stage3.tar.xz.sha256
```

## 関連リンク

- [現在のリリース](/releases/current/) — パッケージ一覧と配布物
- [`/releases.json`](/releases.json) — 機械可読なマニフェスト
- [リリースマニフェストの仕様](/docs/release-manifest/)
- [インストール環境の準備](/docs/getting-started/media/)
