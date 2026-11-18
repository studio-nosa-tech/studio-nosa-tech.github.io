---
title: zpkg 設定
description: ZIGNOS のパッケージマネージャ zpkg の設定ファイル(USE、make.conf、binpkg リポジトリ、レシピ同期、署名)と環境変数の一覧。
---

`zpkg` の設定は、**ターゲットルート**の `/etc/zpkg/` に置きます。
`ZPKG_ROOT=/mnt/zignos` で作業している場合は `/mnt/zignos/etc/zpkg/` です。
どのファイルも任意で、無い場合は既定値が使われます。

```text
/etc/zpkg/
├── use.conf       # グローバル USE フラグ
├── package.use    # パッケージ単位の USE フラグ
├── make.conf      # CFLAGS / MAKEOPTS
├── binrepo.conf   # binpkg リポジトリ
├── sync.conf      # zpkg sync の既定ソース
├── security.conf  # 署名検証ポリシー
└── trusted.d/     # 信頼する公開鍵(*.pub)
```

## 設定ファイル一覧

| ファイル | 用途 | 形式 |
|---|---|---|
| `use.conf` | 全パッケージの USE フラグ | 空白区切りのフラグ。`#` から行末までコメント |
| `package.use` | パッケージ単位の USE 上書き | 1 行 `<package> flag -flag ...` |
| `make.conf` | ビルドフラグ | `CFLAGS=...` / `MAKEOPTS=...` |
| `binrepo.conf` | binpkg リポジトリ | `BINREPO=<URL またはパス>` |
| `sync.conf` | レシピ同期の既定ソース | `RECIPEURL=<URL またはパス>` |
| `security.conf` | 署名検証ポリシー | `TRUSTED_KEYS=...` / `ALLOW_UNSIGNED=0|1` / `ALLOW_EXPIRED=0|1` |
| `trusted.d/` | 信頼する公開鍵 | `<keyid>.pub`(PKIX PEM) |

## USE フラグ

### グローバル(`use.conf`)

```sh
# /etc/zpkg/use.conf
ssl
zlib
```

`zpkg use` でも編集できます。

```sh
zpkg use                 # 現在のグローバル USE を表示
zpkg use ssl zlib        # 有効化
zpkg use -ssl            # 無効化
```

### パッケージ単位(`package.use`)

```sh
# /etc/zpkg/package.use
grub uefi -bios
```

`grub` の `uefi` を有効にし、`bios` を無効にします。CLI から編集する場合:

```sh
zpkg use --package grub uefi
zpkg use --package grub -bios
zpkg use --package grub          # 実効値と tokens を表示
```

USE フラグは依存関係の条件指定(`flag?package`)にも使われます。レシピの
`iuse` にないフラグを条件依存で使うと、`zpkg` がエラーにします。

### 優先順位

1. `use.conf` のグローバルフラグ
2. `package.use` のパッケージ固有トークン(後に書いたものが優先)
3. `ZPKG_USE` 環境変数 — **グローバル設定を丸ごと置き換える**(追加ではない)

`package.use` は `ZPKG_USE` の影響を受けず、常にグローバル値の上に適用されます。

USE を変えても、インストール済みパッケージは自動では再ビルドされません。

```sh
zpkg install -f <pkg>       # そのパッケージを強制再ビルド
zpkg upgrade --newuse       # 実効 USE が変わったパッケージを再ビルド
```

## ビルドフラグ(`make.conf`)

```sh
# /etc/zpkg/make.conf
CFLAGS="-O2 -pipe"
MAKEOPTS="-j8"
```

- `KEY=value` 形式。値の前後のクォートは外されます。
- シェルのコマンド置換は行われません。`MAKEOPTS="-j$(nproc)"` ではなく、
  実際の数値(`-j8` など)を書いてください。
- `ZPKG_CFLAGS` / `ZPKG_MAKEOPTS` 環境変数がファイルより優先されます。
  空文字を明示すると、その設定を空にできます。

値はビルドスクリプトへ `ZPKG_CFLAGS` / `ZPKG_MAKEOPTS` として渡されます。
実際にコンパイラへ渡すかは各レシピの `build` 次第です。

## binpkg リポジトリ(`binrepo.conf`)

```sh
# /etc/zpkg/binrepo.conf
BINREPO=https://example.com/zignos/binpkgs
```

`zpkg install` は、ローカルの binpkg キャッシュに無い場合にこのリポジトリを
探します。リポジトリには署名付きの `index.json` が必要です。

```sh
zpkg mkindex --key ~/zignos-signing.key /path/to/binpkgs
```

`--key` を付けると `index.json.sig` と `keys/<keyid>.pub` も生成されます。
クライアント側では公開鍵を信頼します。

```sh
zpkg key import /path/to/binrepo/keys/<keyid>.pub
```

一致条件は **名前・アーキテクチャ・version+revision・実効 USE/ビルドフラグの
ハッシュ**です。`ZPKG_BINREPO` 環境変数はこのファイルより優先されます。
署名・期限・generation・sha256 の検証に失敗した場合はエラーになり、
ソースビルドへはフォールバックしません。

一時的に binpkg を使わない場合:

```sh
ZPKG_NO_BINPKG=1 zpkg install <pkg>
```

## レシピ同期(`sync.conf`)

```sh
# /etc/zpkg/sync.conf
RECIPEURL=https://example.com/zignos-recipes.tar.xz
```

`zpkg sync` の既定ソースです。`--from` を指定した場合はそちらが優先されます。

```sh
zpkg sync                    # sync.conf / ZPKG_RECIPE_URL を使う
zpkg sync --from ./zignos-recipes
zpkg sync --from zignos-stage3.tar.xz
zpkg sync --from ./zignos-recipes -n   # 検証だけ
```

`ZPKG_RECIPE_URL` 環境変数は `sync.conf` より優先されます。`sync` は
レシピツリーを置き換えるだけで、インストール済みパッケージは更新しません。
必要なら続けて `zpkg upgrade` を実行します。

`sync` はツリーの `recipes.manifest` を trusted key で検証します。署名が
ないツリーは既定で拒否されます。開発用の未署名ツリーだけ `--allow-unsigned`
(または `ZPKG_ALLOW_UNSIGNED=1`)を使えます。署名が存在して壊れている場合は
`--allow-unsigned` でも拒否されます。

## 署名と信頼済み鍵(`security.conf`)

```sh
# /etc/zpkg/security.conf
TRUSTED_KEYS=/etc/zpkg/trusted.d
ALLOW_UNSIGNED=0
ALLOW_EXPIRED=0
```

- `TRUSTED_KEYS` は `*.pub` を置くディレクトリです。`zpkg key import <pubkey>`
  で追加し、`zpkg key list` で確認できます
- `ALLOW_UNSIGNED=1` は**署名が存在しない**リポジトリ/レシピツリーだけを許可します。
  壊れた署名を受け入れる抜け道ではありません
- `ALLOW_EXPIRED=1` は期限切れだけを許可します。署名とロールバック検証は残ります
- 最後に受理した generation と SHA-256 は
  `$ZPKG_DB/.security.json` に保存され、古い署名済み index / manifest への
  差し替えを拒否します
- 環境変数 `ZPKG_TRUSTED_KEYS` / `ZPKG_ALLOW_UNSIGNED` /
  `ZPKG_ALLOW_EXPIRED` がこのファイルより優先されます

鍵の生成・リポジトリの署名・レシピツリーの署名の詳細は
[パッケージ署名と検証](/docs/signing/) を参照してください。

## パスと環境変数

| 変数 | 既定 | 内容 |
|---|---|---|
| `ZPKG_ROOT` | `/` | ターゲットルート。`/etc/zpkg/` もこの配下 |
| `ZPKG_REPOS` | 同梱ツリー | レシピリポジトリ。パス区切りで複数指定(Unix `:` / Windows `;`)。先頭優先 |
| `ZPKG_CACHE` | `$ZPKG_ROOT/var/cache/zpkg` | ソースキャッシュ・ビルド作業領域・binpkg |
| `ZPKG_DB` | `$ZPKG_ROOT/var/lib/zpkg` | インストール済み DB |
| `ZPKG_FORCE` | なし | `1` で改変済みパッケージの削除を許可 |
| `ZPKG_NO_BINPKG` | なし | `1` でローカル/リポジトリの binpkg を無視 |
| `ZPKG_BINREPO` | なし | binpkg リポジトリ(`binrepo.conf` より優先) |
| `ZPKG_RECIPE_URL` | なし | `zpkg sync` の既定ソース(`sync.conf` より優先) |
| `ZPKG_TRUSTED_KEYS` | `$ZPKG_ROOT/etc/zpkg/trusted.d` | 信頼する `*.pub` のディレクトリ |
| `ZPKG_ALLOW_UNSIGNED` | なし | `1` で署名のない index/レシピツリーを許可(開発用) |
| `ZPKG_ALLOW_EXPIRED` | なし | `1` で署名の期限切れだけ許可(復旧用) |
| `ZPKG_USE` | なし | グローバル USE を丸ごと上書き |
| `ZPKG_CFLAGS` | なし | `CFLAGS` を上書き(空文字も有効) |
| `ZPKG_MAKEOPTS` | なし | `MAKEOPTS` を上書き(空文字も有効) |

`ZPKG_REPOS` を省略した場合は、`$ZPKG_ROOT/usr/share/zignos/recipes` の
`core` / `main` / `desktop` が使われます。同じパッケージが複数のリポジトリに
ある場合は、先に指定したリポジトリが優先されます。

## 設定例

最小ベースで UEFI 用の GRUB とビルドフラグを設定する例:

```sh
# /etc/zpkg/package.use
grub uefi -bios
```

```sh
# /etc/zpkg/make.conf
CFLAGS="-O2 -pipe"
MAKEOPTS="-j8"
```

```sh
# /etc/zpkg/binrepo.conf
BINREPO=https://example.com/zignos/binpkgs
```

```sh
# /etc/zpkg/sync.conf
RECIPEURL=https://example.com/zignos-recipes.tar.xz
```

設定を変えたら、必要に応じて再ビルドします。

```sh
zpkg use --package grub uefi
zpkg install -f grub
```
