---
title: システム管理
description: ZIGNOS の設定ファイル、パッケージ管理、リリースチャンネル、OpenRC サービス、デスクトップの管理。
---

ZIGNOS のシステム管理は、**設定ファイルを直接編集し、OpenRC と zpkg で状態を
管理する**ことが基本です。管理画面や自動設定ツールはありません。

## 基本の場所

| 対象 | 場所 |
|---|---|
| zpkg の設定 | `/etc/zpkg/` |
| システム設定 | `/etc/` |
| サービス | `/etc/init.d/`, `/etc/conf.d/`, `/etc/rc.conf` |
| パッケージ DB | `/var/lib/zpkg/` |
| ビルドキャッシュ | `/var/cache/zpkg/` |

## よく使う操作

```sh
rc-status                     # サービスの状態
rc-service <name> start       # 起動
rc-update add <name> default  # 自動起動
zpkg install <pkg>            # パッケージ導入
zpkg upgrade -p               # 更新内容の確認
zpkg upgrade                  # 更新
```

## ページ

- [設定ファイルの場所](/docs/system/config/)
- [パッケージの管理](/docs/system/packages/)
- [チャンネルとアップグレード](/docs/system/channels/)
- [サービス (OpenRC)](/docs/system/services/)
- [デスクトップ (KDE)](/docs/system/desktop/)

設計の背景は [システム設計](/docs/design-system/)、zpkg の内部は
[zpkg 設計](/docs/design-pkg/) を参照してください。
