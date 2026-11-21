---
title: チャンネルとアップグレード
description: stable / testing / unstable の選択、差分確認、zpkg upgrade の安全な実行。
---

## チャンネル

| チャンネル | 用途 | 主な構成 |
|---|---|---|
| `stable` | 安定版。既定 | Linux 6.18.64 LTS / Qt 6.8.5 LTS / Plasma 6.4.5 |
| `testing` | 次期 stable の検証 | Linux 7.3.5 / Qt 6.11.3 / Plasma 6.8.3 |
| `unstable` | 開発中の最新版 | Linux 7.4-rc3 / Gear 26.11.80 beta |

変更は **Unstable → Testing → Stable** の順に検証され、逆流しません。
`stable ↔ unstable` の切り替えは大規模な更新になります。

## 現在のチャンネル

```sh
zpkg channel
```

`/etc/zpkg/make.conf` の `CHANNEL=` が実効値です。一時的な上書きは
`ZPKG_CHANNEL` 環境変数または `zpkg upgrade --channel <ch>` を使います。

## 切り替え

```sh
zpkg channel testing
zpkg upgrade -p           # 差分を確認
zpkg upgrade              # 実行
```

ダウングレードを含む場合は `--allow-downgrade` が必要です。確認プロンプトを
省略する `--yes` は、非対話実行以外では使わないでください。

## アップグレードの安全性

`zpkg upgrade` は次の順で動きます。

1. 新しく必要になった依存を先に導入
2. アップグレード対象をすべてビルド
3. ビルドが全部成功してからインストール
4. インストール後に依存と manifest を検証

ビルドに失敗した場合、既存パッケージは置き換えません。新規依存だけは残る
ことがあります。インストール失敗はパッケージ単位でロールバックされ、
再実行で続きから再開できます。

> `zpkg 0.3.1` 以前から移行する場合、新規依存の先行導入がありません。
> ビルドに必要なパッケージが不足する場合は、先に `zpkg install` してください。

## 詳しい仕様

- [リリースチャンネル(詳細)](/docs/channels/)
- [zpkg 設計の upgrade 節](/docs/design-pkg/)
- [リリースマニフェスト](/docs/release-manifest/)
