---
title: レシピ
description: zpkg レシピのファイル構成、メタデータ、依存、ビルド契約、フック、パッチの現行仕様。
---

レシピは `zignos-recipes/<channel>/{core,main,desktop}/<package>/` の
ディレクトリです。パッケージ名はディレクトリ名、チャンネルとカテゴリはパスから
決まります。

## ファイル一覧

| ファイル | 必須 | 内容 |
|---|---|---|
| `version` | 必須 | 上流のバージョン |
| `sources` | 必須 | ソース URL(1行1 URL) |
| `checksums` | 必須 | `sources` と同じ順の SHA-256 |
| `build` | 必須 | ビルドと destroot への install を行うシェルスクリプト |
| `revision` | 任意 | 同一バージョン内の改訂番号(既定 0) |
| `slot` | 任意 | スロット(既定 0) |
| `depends` | 任意 | 実行時依存 |
| `makedepends` | 任意 | ビルド時依存 |
| `iuse` | 任意 | パッケージが認識する USE フラグ |
| `provides` | 任意 | 仮想パッケージ |
| `conflicts` | 任意 | 競合 |
| `build_network` | 任意 | ビルド中のネットワーク許可(既定は sandbox 設定) |
| `upgrade_warning` | 任意 | `zpkg upgrade` 時に表示する注意 |
| `post_install` | 任意 | インストール後のフック |
| `post_remove` | 任意 | 削除後のフック |
| `*.patch` | 任意 | ビルドスクリプトから適用するパッチ |

`license` / `maintainer` / `homepage` / `test` / `patches/` + `series` は
まだ標準化されていません。今後のレシピ仕様拡張の候補です。

## ソースとチェックサム

```sh
# sources
https://example.invalid/foo-1.2.3.tar.xz

# checksums
<64桁のSHA-256>
```

複数ソースがある場合は、`sources` と `checksums` の行を同じ順に並べます。
`zpkg` は取得したファイルを `checksums` と照合してからビルドします。

## ビルド契約

`build` は zpkg が **bash** で実行します。スクリプトの shebang は慣例で
`#!/bin/sh` ですが、bash 固有機能に依存しない POSIX の範囲で書くのが安全です。
次の環境変数が使えます。

| 変数 | 内容 |
|---|---|
| `ZPKG_SRC` | 展開済みソースの親ディレクトリ |
| `ZPKG_VERSION` | `version` の値 |
| `ZPKG_RECIPE_DIR` | レシピディレクトリ |
| `ZPKG_DESTROOT` | install 先の一時 root |
| `ZPKG_ROOT` | 実際のインストール先 root |
| `ZPKG_USE` | 実効 USE フラグ |

典型例:

```sh
#!/bin/sh
set -e
cd "$ZPKG_SRC/foo-$ZPKG_VERSION"
./configure --prefix=/usr
make -j"$(nproc)"
make DESTDIR="$ZPKG_DESTROOT" install
```

`build` の中で `make check` / `ctest` / `meson test` などを実行すると、
ビルド時にテストできます。

## 依存

`depends` は実行時に必要なパッケージ、`makedepends` はビルド時だけ必要な
パッケージです。バージョン制約や `provides` を含むアトムが使えます。
依存解決の詳細は [zpkg 設計](/docs/design-pkg/) を参照してください。

## USE フラグ

`iuse` にパッケージが理解するフラグを列挙します。実際の値は
`/etc/zpkg/use.conf` と `package.use` で決まり、`ZPKG_USE` として build に
渡されます。

## フック

`post_install` / `post_remove` は、パッケージのインストール後・削除後に
実行されます。サービスユーザーの作成、ディレクトリの所有権、キャッシュの
更新などに使います。

```sh
#!/bin/sh
install -d -m755 -o foo -g foo "$ZPKG_ROOT/var/lib/foo"
```

`/etc/passwd` / `/etc/group` をパッケージで丸ごと置き換えないでください。
ベースアカウントは initscripts が所有し、`/usr/share/zignos/base-accounts/`
から不足分だけマージします。詳しくは
[システムアカウント](/docs/packaging/accounts/) を参照してください。

## パッチ

現行のレシピは、パッチファイルをレシピディレクトリに置き、`build` の中で
明示的に適用します。

```sh
patch -p1 -d "$ZPKG_SRC/foo-$ZPKG_VERSION" \
  < "$ZPKG_RECIPE_DIR/fix-build.patch"
```

`patches/` ディレクトリと `series` による自動適用はまだありません。パッチの
管理方法は、レシピ仕様の標準化とあわせて検討中です。
