---
title: 設定ファイルの場所
description: ZIGNOS のシステム設定と zpkg の設定ファイル一覧。
---

## zpkg の設定

すべて `/etc/zpkg/` にあります。

| ファイル | 用途 |
|---|---|
| `make.conf` | `CHANNEL`、`CFLAGS`、`MAKEOPTS` などビルド既定値 |
| `use.conf` | 全体の USE フラグ |
| `package.use` | パッケージ単位の USE フラグ |
| `binrepo.conf` | binpkg リポジトリ |
| `sync.conf` | レシピツリーの同期元(git / tarball / URL) |
| `overlays.d/<name>.conf` | 追加レシピリポジトリ(オーバーレイ)の設定 |
| `security.conf` | 信頼済み鍵と署名の設定 |
| `sandbox.conf` | bubblewrap ビルド隔離のモード |
| `build.conf` | 再現可能ビルド・ログ・キャッシュ保持の設定 |

信頼済み公開鍵は `/etc/zpkg/trusted.d/` に置きます。

## システム設定

| ファイル | 用途 |
|---|---|
| `/etc/fstab` | マウント設定。UUID を使う |
| `/etc/rc.conf` | OpenRC の全体設定 |
| `/etc/conf.d/<service>` | サービスごとの設定 |
| `/etc/os-release` | ディストリビューション情報 |
| `/etc/passwd`, `/etc/shadow`, `/etc/group` | アカウント |
| `/etc/pam.d/` | PAM 設定 |
| `/etc/NetworkManager/` | NetworkManager の設定 |

## データとキャッシュ

| 場所 | 内容 |
|---|---|
| `/var/lib/zpkg/` | インストール済み DB、world、manifest、provenance、SBOM |
| `/var/lib/zpkg/overlays/<name>/` | 同期済みのオーバーレイツリー |
| `/var/cache/zpkg/` | ソース、binpkg、ビルドログ |
| `/usr/share/zignos/recipes/` | 同梱レシピツリー |

## 編集の基本

- 設定を変える前にバックアップを取る
- サービス設定は `/etc/conf.d/`、起動設定は `rc-update`
- `make.conf` の `CHANNEL` は `zpkg channel` でも変更できる
- ビルドフラグを変えたら `zpkg upgrade --newuse` で再ビルドする

各設定の詳しい意味は [zpkg 設定](/docs/zpkg-config/) を参照してください。
