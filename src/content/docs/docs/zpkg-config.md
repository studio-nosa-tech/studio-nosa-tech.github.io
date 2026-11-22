---
title: zpkg 設定
description: ZIGNOS のパッケージマネージャ zpkg の設定ファイル(USE、make.conf、binpkg リポジトリ、レシピ同期、署名、ビルドキャッシュ)と環境変数の一覧。
---

`zpkg` の設定は、**ターゲットルート**の `/etc/zpkg/` に置きます。
`ZPKG_ROOT=/mnt/zignos` で作業している場合は `/mnt/zignos/etc/zpkg/` です。
どのファイルも任意で、無い場合は既定値が使われます。

```text
/etc/zpkg/
├── use.conf       # グローバル USE フラグ
├── package.use    # パッケージ単位の USE フラグ
├── make.conf      # CHANNEL / CFLAGS / MAKEOPTS
├── binrepo.conf   # binpkg リポジトリ
├── sync.conf      # zpkg sync の既定ソース
├── security.conf  # 署名検証ポリシー
├── sandbox.conf   # ビルドサンドボックス
├── build.conf     # 再現性 / ログ / SBOM / キャッシュ保持
└── trusted.d/     # 信頼する公開鍵(*.pub)
```

## 設定ファイル一覧

| ファイル | 用途 | 形式 |
|---|---|---|
| `use.conf` | 全パッケージの USE フラグ | 空白区切りのフラグ。`#` から行末までコメント |
| `package.use` | パッケージ単位の USE 上書き | 1 行 `<package> flag -flag ...` |
| `make.conf` | チャンネルとビルドフラグ | `CHANNEL=stable|testing|unstable` / `CFLAGS=...` / `MAKEOPTS=...` |
| `binrepo.conf` | binpkg リポジトリ | `BINREPO=<URL またはパス>` |
| `sync.conf` | レシピ同期の既定ソース | `RECIPEURL=` / `RECIPEGIT=` / `RECIPEBRANCH=` / `RECIPEALLOWUNSIGNED=` |
| `security.conf` | 署名検証ポリシー | `TRUSTED_KEYS=...` / `ALLOW_UNSIGNED=0|1` / `ALLOW_EXPIRED=0|1` |
| `sandbox.conf` | ビルドサンドボックス | `SANDBOX=auto|require|off` / `BUILD_NET=0|1` / `BWRAP=...` |
| `build.conf` | 再現性・記録・ビルドキャッシュ | `SOURCE_DATE_EPOCH=<unix>` / `BUILD_LOG=0|1` / `SBOM=0|1` / `KEEP_WORKDIR=0|1` / `BUILD_BINPKG=0|1` / `KEEP_SOURCES=0|1` |
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
CHANNEL=stable
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

## リリースチャンネル(`make.conf`)

```sh
# /etc/zpkg/make.conf
CHANNEL=stable     # stable(既定)/ testing / unstable
```

- `ZPKG_CHANNEL` 環境変数は1回の実行だけ上書きします
- `zpkg upgrade --channel <ch>` も1回だけ上書きします
- 永続的に切り替えるには `zpkg channel <ch>` を使います(他の行は保持)
- 切り替え後は `zpkg upgrade -p` で差分を確認してから `zpkg upgrade` を
  実行してください。upgrade は変更一覧・依存差分・警告を表示し、全ビルド
  成功後にインストール、完了後に整合性チェックを行います
- `--prune` は不要になった依存を削除、`--allow-downgrade` はダウングレードを
  許可、`--verify` は全ファイルの sha256 を照合します

レシピツリーは `$ZPKG_ROOT/usr/share/zignos/recipes/<channel>/` にあります。
stage3 は stable のみ同梱するため、testing / unstable は `zpkg sync` で
全チャンネル入りのレシピ tarball を取り込んでから切り替えます。詳細は
[リリースチャンネル](/docs/channels/) を参照してください。

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
ハッシュ・チャンネル・レシピ digest** です。`ZPKG_BINREPO` 環境変数はこの
ファイルより優先されます。
署名・期限・generation・sha256 の検証に失敗した場合はエラーになり、
ソースビルドへはフォールバックしません。

一時的に binpkg を使わない場合:

```sh
ZPKG_NO_BINPKG=1 zpkg install <pkg>
```

## レシピ同期(`sync.conf`)

```sh
# /etc/zpkg/sync.conf
RECIPEURL=https://github.com/studio-nosa-tech/zignos-recipes
RECIPEGIT=1
RECIPEBRANCH=main
RECIPEALLOWUNSIGNED=1
```

`zpkg sync` の既定ソースです。`--from` を指定した場合はそちらが優先されます。
git モードでは置換先の `.zpkg-git` に commit を記録し、`git ls-remote` の
リモート HEAD と比較します。同じなら取得せず、変更時だけ shallow clone して
検証後に置き換えます。

```sh
zpkg sync                    # sync.conf / ZPKG_RECIPE_URL を使う
zpkg sync --git --from https://github.com/studio-nosa-tech/zignos-recipes
zpkg sync --from ./zignos-recipes          # tar.xz / ディレクトリも可
zpkg sync --from zignos-stage3.tar.xz
zpkg sync --from ./zignos-recipes -n       # 検証だけ
```

`ZPKG_RECIPE_URL` / `ZPKG_RECIPE_GIT` / `ZPKG_RECIPE_BRANCH` 環境変数は
`sync.conf` より優先されます。既定のリポジトリは public のため
未認証で取得できます。private リポジトリは git の credential helper か
SSH 鍵が必要です。`sync` はレシピツリーを置き換えるだけで、インストール済み
パッケージは更新しません。必要なら続けて `zpkg upgrade` を実行します。

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

## ビルドサンドボックス(`sandbox.conf`)

```sh
# /etc/zpkg/sandbox.conf
SANDBOX=auto
BUILD_NET=1
#BWRAP=/usr/bin/bwrap
```

- `SANDBOX=auto`(既定)は bubblewrap があればビルドを隔離し、無い/使えない場合は
  警告して直接ビルドします。`require` は失敗、`off` は無効です
- `BUILD_NET=1` はビルド時のネットワークを許可します。`0` にすると
  network namespace で分離します
- レシピの `build_network`(`1` / `0`)がグローバル設定を上書きします
- 環境変数 `ZPKG_SANDBOX` / `ZPKG_BUILD_NET` / `ZPKG_BWRAP` が優先されます
- `zpkg build --no-sandbox` / `zpkg install --no-sandbox` で一時的に無効化できます

サンドボックスの内容と chroot の注意は
[ビルド環境の隔離](/docs/build-sandbox/) を参照してください。

## 再現性(`build.conf`)

```sh
# /etc/zpkg/build.conf
SOURCE_DATE_EPOCH=946684800
BUILD_LOG=1
SBOM=1
```

- `SOURCE_DATE_EPOCH` はビルドの固定時刻です。既定は `946684800`
  (2000-01-01T00:00:00Z)。`ZPKG_SOURCE_DATE_EPOCH` → `SOURCE_DATE_EPOCH`
  環境変数 → このファイルの順で優先されます
- `BUILD_LOG=1`(既定)は `$ZPKG_CACHE/logs/` にビルドログを保存します
- `SBOM=1`(既定)は SPDX 2.3 SBOM を生成します
- 環境変数 `ZPKG_BUILD_LOG` / `ZPKG_SBOM` がこのファイルより優先されます

値を変えると binpkg の tar/gzip の mtime が変わり、artifact の SHA-256 も
変わります。詳細は [再現可能なビルド](/docs/reproducibility/) を参照してください。

## ビルドキャッシュ(`build.conf`)

既定ではディスク消費を抑えるため、成功したビルドの作業データを残しません。

```sh
# /etc/zpkg/build.conf
KEEP_WORKDIR=0   # インストール成功後に作業ディレクトリを削除
BUILD_BINPKG=0   # ローカル binpkg を作らない
KEEP_SOURCES=0   # ビルドに使ったソースアーカイブを削除
```

| キー | 既定 | `1` のとき |
|---|---|---|
| `KEEP_WORKDIR` | `0` | `$ZPKG_CACHE/build/<base>/` を残す |
| `BUILD_BINPKG` | `0` | 成功時に `$ZPKG_CACHE/binpkgs/` へ binpkg を作る |
| `KEEP_SOURCES` | `0` | ダウンロードしたソースアーカイブを残す |

- 新しいビルドが成功すると、同じパッケージの古い作業ディレクトリと古い
  binpkg は削除されます。バージョンを上げても古いデータが溜まりません
- 作成した binpkg は、レシピ digest とチャンネルが一致するときに次の
  `zpkg install` で再利用されます
- ソースアーカイブは、そのビルドで使ったアーカイブだけを削除します。
  パッチなどの同梱ファイルは残ります
- `zpkg build` は destroot を成果物として返すため、実行中は作業ディレクトリを
  残します。削除されるのは `zpkg install` の成功後です
- `--repro-check` は比較のため binpkg を作ります。`BUILD_BINPKG=0` の場合は
  比較後に削除されます
- 環境変数 `ZPKG_KEEP_WORKDIR` / `ZPKG_BUILD_BINPKG` / `ZPKG_KEEP_SOURCES`
  が `build.conf` より優先されます
- 0.3.2 以前が作った作業ディレクトリはパッケージ名を記録していないため、
  自動削除の対象外です。`/var/cache/zpkg/build` を手動で削除してください

キャッシュの場所と中身は次のとおりです。

```text
/var/cache/zpkg/
├── build/      # 作業ディレクトリ(既定では成功後に削除)
├── binpkgs/    # ローカル binpkg と sidecar(既定では作らない)
├── logs/       # ビルドログ
└── *.tar.*     # ソースアーカイブ(既定では成功後に削除)
```

キャッシュを丸ごと捨ててよい場合は、`/var/cache/zpkg` を削除しても
インストール済みパッケージには影響しません。次回のビルドで再取得・再生成
されます。

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
| `ZPKG_RECIPE_GIT` | `0` | `1` で git リポジトリとして取得 |
| `ZPKG_RECIPE_BRANCH` | `main` | git のブランチ |
| `ZPKG_TRUSTED_KEYS` | `$ZPKG_ROOT/etc/zpkg/trusted.d` | 信頼する `*.pub` のディレクトリ |
| `ZPKG_ALLOW_UNSIGNED` | なし | `1` で署名のない index/レシピツリーを許可(開発用) |
| `ZPKG_ALLOW_EXPIRED` | なし | `1` で署名の期限切れだけ許可(復旧用) |
| `ZPKG_CHANNEL` | `stable` | `stable` / `testing` / `unstable`(`make.conf` より優先) |
| `ZPKG_SANDBOX` | `auto` | `auto` / `require` / `off` |
| `ZPKG_BUILD_NET` | `1` | `0` でビルドをネットワーク分離 |
| `ZPKG_BWRAP` | `bwrap` | bubblewrap の実行ファイル |
| `ZPKG_SOURCE_DATE_EPOCH` | `946684800` | 固定ビルド時刻(標準の `SOURCE_DATE_EPOCH` も可) |
| `ZPKG_BUILD_LOG` | `1` | `0` でビルドログを保存しない |
| `ZPKG_SBOM` | `1` | `0` で SPDX SBOM を生成しない |
| `ZPKG_KEEP_WORKDIR` | `0` | `1` でインストール成功後も作業ディレクトリを残す |
| `ZPKG_BUILD_BINPKG` | `0` | `1` でソースビルド後にローカル binpkg を作る |
| `ZPKG_KEEP_SOURCES` | `0` | `1` でダウンロードしたソースアーカイブを残す |
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
CHANNEL=stable
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
