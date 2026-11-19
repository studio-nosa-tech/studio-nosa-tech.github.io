---
title: zpkg 設計
description: zpkg の設計。レシピ形式、DB schema 2、USE フラグ、トランザクション、binpkg。
---

ステータス: v0.9 設計(実装と合わせて更新する。DB schema 2・world/upgrade・USE
フラグ・フック・トランザクション・依存アトム解決は実装済み — 後述の各節参照)

> 実際の設定ファイル(`use.conf` / `package.use` / `make.conf` / `binrepo.conf` /
> `sync.conf`)と環境変数は [zpkg 設定](/docs/zpkg-config/) にまとめています。

## 目標

- ソースベースのパッケージマネージャ。KISS Linux の `kiss` を最小構成の参考にする
- 最初は数百行〜1500 行程度のシンプルな実装。長期的に Gentoo Portage / Exherbo Paludis 相当へ進化させる
- **Go で書く**: 単一静的バイナリとして chroot 内でも動かせる。将来の USE フラグ・ソルバー拡張も同じコードベースで行う

## まだ無いもの(v0.9 時点)

- 公開バイナリリポジトリの配布・運用(署名の仕組みと `keys/` 出力は実装済み)

- 本格的な SAT ソルバー。現在は決定的なバックトラック解決(下記「依存解決」)で、
  複数バージョン・スロットを同時に考慮する完全解は未実装

## 全体像

```
レシピリポジトリ(ZPKG_REPOS, 先頭一致で検索)
   ↓ recipe.Load
依存解決(internal/depspec + internal/resolve, バックトラック + トポロジカルソート)
   ↓
fetch → checksum 検証 → extract(internal/source)
   ↓
build スクリプト実行 → destroot(internal/build)
   ↓
マニフェスト作成(internal/manifest)
   ↓
install(競合検出 + DB 記録) / remove(internal/install, internal/pkgdb)
```

パッケージ DB: `$ZPKG_DB`(既定 `$ZPKG_ROOT/var/lib/zpkg`)
キャッシュ: `$ZPKG_CACHE`(既定 `$ZPKG_ROOT/var/cache/zpkg`)

## レシピ形式(ディレクトリ型・KISS 式)

```
recipes/<channel>/core/<pkg>/
├── version       # 1 行。必須
├── sources       # 1 行 1 URL。省略可(ソースなしパッケージ)
├── checksums     # 1 行 1 個の sha256。sources と同じ順・同数
├── depends       # 実行時依存(1 行 1 アトム)。省略可
├── makedepends   # ビルド時のみの依存(1 行 1 アトム)。省略可
├── revision      # -rN。内容を変えたら必ず上げる
├── slot          # 共存スロット(既定 0)
├── iuse          # このレシピが理解する USE フラグ
├── provides      # virtual 名(解決に使用。virtual/foo[-ver])
├── conflicts     # 同時インストール禁止(解決に使用)
├── build_network # 1/0 でビルド時ネットワークを上書き(省略時はグローバル)
├── build         # shell スクリプト。必須(恒久的に shell)
├── post_install  # 任意のフック(bash)
└── post_remove   # 任意のフック(bash)
```

パースルール: 空行と `#` 始まりの行は無視。`sources` と `checksums` は**行の順序で対応**する。`.patch` / `.diff` の sources は展開されず `$ZPKG_SRC` に配置される(build スクリプトで `patch -Np1 -i` に使う)。tarball 以外の展開は行われない。URL に `#ファイル名` の fragment を付けるとキャッシュファイル名を指定できる(GitHub のタグ tarball のような basename が貧弱な URL 向け。fragment はサーバには送信されない)。

## build スクリプト契約

`build` は**恒久的に shell**(Portage の ebuild、Arch の PKGBUILD と同じ発想)。書き換え対象は zpkg コアのみで、レシピの build スクリプト契約は温存する。

実行環境:

| 変数 | 内容 |
|---|---|
| `ZPKG_NAME` | パッケージ名 |
| `ZPKG_VERSION` | バージョン |
| `ZPKG_ROOT` | ターゲットルート |
| `ZPKG_CACHE` | ソースキャッシュディレクトリ(追加ソースの参照に使える) |
| `ZPKG_DESTROOT` | ビルド成果物のインストール先(staging root) |
| `ZPKG_SRC` | 展開済みソースディレクトリ(カレントディレクトリでもある) |
| `ZPKG_WORKDIR` | パッケージの作業ディレクトリ |

規約:

- ビルドスクリプトは `make DESTDIR="$ZPKG_DESTROOT" install` のように **destroot に成果物を置く**こと。zpkg は destroot をマニフェスト化してからインストールする
- 直接 `$ZPKG_ROOT` に書くのは禁止(マニフェストが取れないため)
- 実行は `bash <recipe>/build`、カレントディレクトリ = ソース展開先

## パッケージ DB 形式(schema 2)

```
$ZPKG_DB/<name>/
├── version     # インストール済みバージョン(pkgver[-rN]。v1 互換)
├── meta.json   # schema 2 のメタデータ
└── manifest    # ファイル一覧
```

`meta.json`:

```json
{
  "schema": 2,
  "name": "doas",
  "version": "6.8.2",
  "revision": 0,
  "slot": "0",
  "repo": "/sources/zignos-recipes/stable/core",
  "channel": "stable",
  "arch": "amd64",
  "installed": "2026-11-16T03:45:23Z",
  "useflags": [],
  "depends": [],
  "builddepends": []
}
```

- **v1 互換**: `meta.json` が無いレコードは v1 として読み、version ファイルから `-rN` を分離する。次の install で meta が書かれる(一括マイグレーション不要)
- 書き込みは `tmp` + `rename` で原子的に行う
- `world` ファイル(明示インストール集合)は `$ZPKG_DB/world` に置く(1行1パッケージ、ソート済み)

manifest の 1 行形式(空白区切り):

```
file <sha256> <path>
dir  <path>
link <target> <path>
```

`<path>` はルート(`$ZPKG_ROOT`)からの相対パス。**空白・タブ・引用符・
バックスラッシュを含むパスは Go の文字列リテラルとしてクォートする**
(例: `file <sha> "usr/lib/firmware/...Intel Corp.-VALLEYVIEW C0 PLATFORM.txt"`)。
linux-firmware に実在する空白入りファイル名がきっかけ(M22)。クォートの無い
旧形式の行はそのまま(パスの空白も含めて)読めるため、既存 DB の互換性は保たれる。

## レシピの任意メタデータ(schema 2)

| ファイル | 意味 | 既定 |
|---|---|---|
| `revision` | レシピ改訂番号(`-rN`) | 0 |
| `slot` | 共存スロット(将来の複数バージョン用) | `0` |
| `provides` | 提供する virtual 名(1行1個、`virtual/foo[-ver]`) | なし |
| `conflicts` | 同時に入れてはいけないパッケージ(アトム可) | なし |
| `makedepends` | ビルド時のみ必要な依存(1行1個、アトム可) | なし |
| `build_network` | ビルド時ネットワークの許可/拒否(`1` / `0`) | グローバル設定 |
| `iuse` | レシピが理解する USE フラグ(1行1個) | なし |
| `post_install` / `post_remove` | インストール/削除直後のフック(bash) | なし |

`depends` は実行時依存。ビルド順序には `depends` + `makedepends` の両方を使う。

## 依存解決(v0.9+ バックトラック)

`depends` / `makedepends` / `provides` / `conflicts` にはパッケージアトムを書ける。

| 例 | 意味 |
|---|---|
| `foo` | 任意バージョンの `foo` |
| `>=foo-1.2` / `<foo-2.0` / `=foo-1.2-r3` | バージョン制約(`>`, `<=`, `!=` も可) |
| `ssl?openssl` | `ssl` が有効なときだけ `openssl` |
| `!ssl?gnutls` | `ssl` が無効なときだけ `gnutls` |
| `foo[ssl]` / `foo[-ssl]` | 依存先の `ssl` が有効 / 無効であること |
| `foo[ssl?]` | 依存先が `ssl` を知っている場合だけ有効であること |
| `ssl?foo[ssl,-zlib]` | 条件と USE 制約の組み合わせ |

- バージョン制約は演算子付きで書く。`foo-1.2` はパッケージ名として扱う(名前に
  `-` と数字を含むパッケージがあるため)
- `provides` は `virtual/mailer` または `virtual/mailer-1.2`。バージョン省略時は
  提供側パッケージのバージョンを使う
- 解決は `internal/depspec`(アトムのパース)と `internal/resolve`(決定的バックトラック):
  - 直接レシピと `provides` の候補を「インストール済み → 直接名 → 名前順」で試す
  - バージョン / USE 制約を満たさない候補と、conflict する候補を除外する
  - 行き詰まったら別の provider / 候補へ戻る。選択結果は依存が先のトポロジカル順
  - `virtual/foo` を install すると provider を選び、world には provider を記録する
- `conflicts` は選択済みパッケージとインストール済みパッケージの両方に対して検査する
- 逆依存: `zpkg depends -r <pkg>` がインストール済み DB の `depends` / `builddepends` を
  provides も含めて照合する。`zpkg remove` は逆依存があると停止し、`-f` で強制できる
- 制限: レシピは名前ごとに 1 バージョン(複数バージョン/スロットは解決対象外)。
  **SAT solver は未実装**で、候補選択は将来差し替えられるよう `internal/resolve` に分離している
- 既にインストール済みのパッケージは build/install の対象からスキップ(`-f` で強制)
- **`-f` は binpkg キャッシュを無視しない**: 同一 version+revision+実効 USE の
  binpkg があればそれを使う。レシピの内容を変えたときは revision を上げること
  (binpkg キーが変わり、ソースから再ビルドされる)

## ビルド環境の隔離(M38)

`build` スクリプトは `bash` で直接実行せず、**bubblewrap** のサンドボックス内で
実行する(`internal/sandbox`)。

- root 全体を `--ro-bind / /` で読み取り専用にし、書き込み可能なのは
  `$ZPKG_CACHE/build/<name>-<version>[-rN][-opts]` だけ
- `/tmp` / `/run` / `/var/tmp` / `/var/lib` / `/var/log` / `/var/spool` /
  `/root` / `/home` / `/mnt` / `/media` / `/srv` は空の tmpfs
- `/etc/ssh` / `/etc/ssl/private` / `/etc/zpkg` / NetworkManager の接続設定 /
  wpa_supplicant は tmpfs でマスク。`/etc/shadow` / `/etc/gshadow` /
  `/etc/sudoers` / `/etc/doas.conf` / `/etc/machine-id` は `/dev/null`
- `--unshare-pid` / `--unshare-ipc` / `--unshare-uts`、hostname は `zignos-build`
- capability は `CAP_CHOWN` / `CAP_FOWNER` / `CAP_DAC_OVERRIDE` / `CAP_FSETID` /
  `CAP_SYS_CHROOT` のみ。`CAP_SYS_ADMIN` を付けないので ro root は remount できない
- 環境変数は allowlist(`PATH` / `HOME` / `TMPDIR` / `LANG` / `LC_ALL` /
  `GOCACHE` / `GOPATH` / `ZPKG_*` など)。proxy 系だけ引き継ぐ
- `ZPKG_ROOT=/` かつ Linux のときだけ適用。`SANDBOX=auto`(既定)は bwrap が
  無い/使えない場合に警告して直接ビルド、`require` は失敗、`off` は無効
- `--no-sandbox` は一時的な escape hatch
- ネットワークは既定で許可(`BUILD_NET=1`)。`ZPKG_BUILD_NET=0` で
  `--unshare-net` を付け、レシピの `build_network` がグローバルを上書きする
- ビルド環境の fingerprint(インストール済み `name@slot-version` の sha256 と件数)を
  `meta.json` / binpkg sidecar に記録し、`zpkg info` で表示する
- `post_install` / `post_remove`、ソース展開、resource limit は対象外。
  サンドボックス内に見えるのはインストール済みシステム全体で、最小依存ルートは
  次段階

bubblewrap の `pivot_root` は chroot 先が mount point であることを要求する。
`zignos-enter.sh` は private mount namespace 内で root を bind mount してから
chroot するため、stage3 のディレクトリ chroot でもサンドボックスが動く。
素の `chroot` では `auto` が警告して直接ビルドへフォールバックする。

## 再現可能なビルド(M39)

同じレシピ・ソース・ビルド環境から同じ成果物を目指すため、入力を固定し、
出力を記録する(`internal/provenance` / `internal/spdx`)。

- **SOURCE_DATE_EPOCH** — 既定 `946684800`(2000-01-01T00:00:00Z)。
  `ZPKG_SOURCE_DATE_EPOCH` → `SOURCE_DATE_EPOCH` → `/etc/zpkg/build.conf` の順。
  build 環境に `KBUILD_BUILD_TIMESTAMP` / `KBUILD_BUILD_USER=zignos` /
  `KBUILD_BUILD_HOST=zignos-build` / `PYTHONHASHSEED=0` も渡す
- **umask** — レシピは `umask 022; exec "$0" "$@"` の wrapper 経由で実行
- **binpkg の正規化** — gzip header と tar 全エントリの `ModTime` を
  SOURCE_DATE_EPOCH にし、AccessTime/ChangeTime をゼロにする。所有者・モード・
  内容・順序はビルドのまま
- **work dir** — `build/<name>-<version>[-rN][-opts]`。`--clean` は work 全体を
  削除し、`--repro-check` は 2 回目の前に自動 clean
- **ビルドログ** — `$ZPKG_CACHE/logs/<base>.log` に既定で保存。ヘッダに
  package / recipe / recipe digest / epoch / sandbox / network / started /
  build script を書き、stdout/stderr を tee する。`BUILD_LOG=0` で無効
- **provenance.json** — package / recipe(digest・署名 key/generation)/
  sources / build / toolchain / dependencies / build_dependencies /
  environment(全インストール済みパッケージと hash)/ artifact(sha256・size・
  manifest_sha256)/ log(sha256)。DB と binpkg sidecar に保存
- **SPDX 2.3 SBOM** — per-package と system。artifact の SHA-256、purl、
  `DEPENDS_ON` / `BUILD_DEPENDENCY_OF` / `BUILD_TOOL_OF`、system は
  `SPDXRef-System-zignos` への `CONTAINS`
- **再現性検証** — `zpkg build --repro-check` が 2 回ビルドして destroot の
  manifest(Kind / Path / Hash / Link)を比較する
- **制限** — manifest 比較であり、tar のバイト一致・所有者・mtime は保証しない。
  固定ビルドルートは未実装。SBOM のライセンスは `NOASSERTION`

詳細は [再現可能なビルド](/docs/reproducibility/) を参照。

## USE フラグ(v0.9)

- 設定はターゲットルート配下:
  - `$ZPKG_ROOT/etc/zpkg/use.conf` — グローバル USE フラグ(空白/改行区切り、`#` コメント可)
  - `$ZPKG_ROOT/etc/zpkg/package.use` — パッケージ単位の上書き(`<pkg> flag -flag ...`)
  - `$ZPKG_ROOT/etc/zpkg/make.conf` — `CFLAGS=...` / `MAKEOPTS=...`
- 実効フラグ = グローバル + そのパッケージの `package.use` トークン(`-flag` で無効化)。ハッシュと binpkg 名も**パッケージごとの実効値**から計算する
- レシピの `iuse` ファイルに「このレシピが理解するフラグ」を列挙する。`iuse` があるレシピで `flag?pkg` の flag が iuse に無ければ**エラー**(タイポ検出)
- 環境変数 `ZPKG_USE` / `ZPKG_CFLAGS` / `ZPKG_MAKEOPTS` がファイルより優先。**空文字でも「明示的に空」として上書き**する(`ZPKG_USE= zpkg build ...` でフラグ無効化)
- **条件付き依存**: `depends` / `makedepends` に `flag?pkg` と書くと、フラグ有効時だけ pkg が依存に加わる
- build スクリプトへ `ZPKG_USE`(空白区切り)・`ZPKG_CFLAGS`・`ZPKG_MAKEOPTS` を渡す。レシピ側はシェルで自由に分岐できる
- binpkg キャッシュ名: オプションが1つでも設定されていれば `<name>-<version>[-rN]-<8hex>`。ハッシュは `USE` + `CFLAGS` + `MAKEOPTS` の sha256 先頭8桁。空なら従来名
- インストール時、有効フラグを `meta.json` の `useflags` に記録し、`zpkg info` で表示
- まだ無いもの: `IUSE` の既定値(`+flag` 記法)、無効フラグの黙殺ではなく警告化
  (`upgrade --newuse` による USE 変更時の自動再ビルドは実装済み)

## slots(M20 で対応)

- DB レコードは `<name>@<slot>` をキーにする。**slot "0"(既定)は従来どおり素の
  `<name>` ディレクトリ**なので、slots 以前のレコードは移行不要
- 同一 name+slot のインストールは upgrade(置換)。**別スロットとのファイル重複は
  競合エラー**(誤って他スロットのファイルを壊さない)。スロット間でパスが
  重複しない設計のパッケージ(v1/v2 の soname 分離など)のみ共存できる
- `remove` はその名前の**全スロット**を削除。`upgrade` はレシピのスロットだけを
  更新し、他スロットは温存される
- `zpkg list` / `info` / `world` は非 0 スロットを `name@slot` で表示(slot 0 は
  従来どおり素の名前)
- ユースケース: 同一ライブラリの soname 違いの共存、ツールチェーンの旧版保持など

## upgrade 時の不要ファイル削除(M22 で追加)

- 同一 name+slot の upgrade で、**旧マニフェストにあり新マニフェストに無いファイル**は
  インストール完了時に削除する(例: レシピから runlevel リンクを外した場合)
- 削除は保守的: 旧マニフェストと**内容が一致するものだけ**(ファイルは sha256、
  シンボリックリンクはリンク先)。管理者が編集した設定ファイルは残す
- 削除したパスはトランザクションの backup に移すため、Apply 失敗時のロールバックで
  元に戻る。ディレクトリは削除しない(他パッケージと共有し得るため)
- 実装: `internal/install.pruneObsolete`。既存の Replaced リストを再利用している

## binpkg リポジトリ(署名対応)

リポジトリは「`index.json` + その署名 + binpkg 一式」を置いたディレクトリ(URL または
ローカルパス)。ホスティングは範囲外で、静的ファイルサーバがあればよい。

```
binrepo/
├── index.json                                  # zpkg mkindex が生成(schema 2)
├── index.json.sig                              # index.json への Ed25519 署名
├── keys/<keyid>.pub                            # リポジトリ公開鍵
└── packages/
    ├── doas-6.8.2.pkg.tar.gz                   # binpkg 本体
    ├── doas-6.8.2.manifest                     # ファイル一覧サイドカー
    └── doas-6.8.2.meta.json                    # name/version/revision/usehash/arch/deps
```

パッケージは従来どおりリポジトリ直下にも置ける(`packages/` は任意)。

- **生成**: `zpkg mkindex [--key <private>] [--generation N] [--expires ...] [dir]`
  (既定はローカルの binpkg キャッシュ)。PackBinpkg が `.meta.json` サイドカーも
  書くので、レシピツリーなしで索引を作れる。`--key` を付けると `index.json.sig` と
  `keys/<keyid>.pub` も書く
- **消費**: `ZPKG_BINREPO`(env)または `/etc/zpkg/binrepo.conf` の `BINREPO=` を設定すると、
  install はローカル binpkg キャッシュがミスした後にリポジトリを試す
- **一致条件**: name・arch・version+revision・**実効 USE フラグのハッシュ**が全部一致。
  一致するパッケージがない場合だけソースビルドへフォールバックする
- **検証**: index の署名、期限、generation、各エントリの `sha256` と
  `manifest_sha256` を検証する。改ざん・期限切れ・ロールバック・sha256 不一致は
  **ハードエラー**で、ソースビルドへ黙って逃げない
- **取得**: index / signature は毎回取り直す(キャッシュされた古い index を使わない)。
  package / manifest はキャッシュの sha256 が一致すれば再利用し、不一致なら再取得して
  再検証する
- `ZPKG_NO_BINPKG=1` はローカル binpkg とリポジトリの両方を無効化する

## 署名と信頼チェーン(M37)

### 鍵と署名

- 署名は **Ed25519**(Go 標準ライブラリ)。秘密鍵は PKCS#8 PEM、公開鍵は PKIX PEM
- key ID = 公開鍵 32 バイトの SHA-256(64 hex)
- 信頼する鍵は `$ZPKG_ROOT/etc/zpkg/trusted.d/*.pub`。`zpkg key import` で明示的に
  追加し、TOFU はしない。`security.conf` の `TRUSTED_KEYS=` / `ZPKG_TRUSTED_KEYS` で
  ディレクトリを変更できる
- 秘密鍵は 0600 を要求(Unix)。`mkindex` / `sign-recipes` は秘密鍵がリポジトリや
  レシピツリーの中にある場合を拒否する(stage3 への混入防止)
- detached signature は `<file>.sig`:

```json
{
  "schema": 1,
  "algorithm": "ed25519",
  "keyid": "<64hex>",
  "signature": "<base64 64 bytes>"
}
```

### 何に署名するか

- **binrepo**: `index.json` の実バイト列。index(schema 2)が `generation` /
  `expires` / `keyid` を持ち、各 package の `sha256` と `manifest_sha256` を拘束する。
  binpkg 本体と manifest は index 経由で間接的に署名される
- **レシピツリー**: `recipes.manifest`。`.git` と署名自身を除く全 regular file の
  path / sha256 / size / mode を列挙し、その manifest の実バイト列に署名する。
  ディレクトリ / レシピ tarball / stage3 同梱ツリーのどれでも同じ検証ができる
- **レシピのソース tarball**: 各レシピの `checksums`(sha256)が manifest に
  含まれるため、レシピツリーの署名がソース取得まで連鎖する
- **インストール済みパッケージ**: `meta.json` の `origin` / `origin_repo` /
  `origin_keyid` / `origin_generation` / `origin_index_sha256` /
  `origin_pkg_sha256` に記録し、`zpkg info` で表示する

### ロールバックと期限

- `generation` は単調増加。`mkindex` / `sign-recipes` は省略時に既存ファイルの +1 を
  使う。`--generation N` で明示できる
- `expires` は RFC3339 または `90d` / `720h`。既定 +90 日
- クライアントは最後に受理した generation / SHA-256 / keyid を
  `$ZPKG_DB/.security.json` に保存する
  - 新しい generation が保存値より小さい → ロールバックとして拒否
  - 同じ generation で SHA-256 が違う → 同一世代のすり替えとして拒否
  - 期限切れ → 拒否
- `--allow-unsigned` / `ZPKG_ALLOW_UNSIGNED=1` は署名が**存在しない**場合だけ許可する。
  署名が存在して検証に失敗する場合は常に拒否
- `ZPKG_ALLOW_EXPIRED=1` は期限だけ解除する。署名とロールバック検証は残る

### 限界

- 秘密鍵の漏洩、root 権限の奪取、Secure Boot(GRUB/kernel の署名)は別問題
- 鍵失効リスト(CRL)は未対応。`zpkg key remove` と新しい鍵へのローテーションで運用する
- 初回の信頼は公開鍵 fingerprint の out-of-band 確認に依存する
- GPG/OpenPGP は未対応。署名 envelope の `algorithm` を拡張して将来追加する

## リリースチャンネルと upgrade(M40)

zpkg 0.2.0 から、レシピツリーは `stable` / `testing` / `unstable` の3チャンネルを
持つ。選択は `/etc/zpkg/make.conf` の `CHANNEL=`(既定 stable)、
`ZPKG_CHANNEL` 環境変数、`--channel` の順で上書きできる。

- 既定 repo は `$ZPKG_ROOT/usr/share/zignos/recipes/<channel>/{core,main,desktop}`。
  フラットツリーは stable として受理する(r11 以前との互換)
- `zpkg channel` が実効値・取得元・利用可能チャンネルを表示し、
  `zpkg channel <ch>` が `make.conf` を原子的に更新する
- `zpkg upgrade` は `internal/upgrade` で版比較(upgrade / downgrade / rebuild /
  new dependency)、依存と makedepends の差分、警告(`upgrade_warning`、主要
  パッケージのメジャー版本変更、新 conflict、slot 変更、チャンネル変更)、
  孤立パッケージを計画する
- 実行は **全パッケージのビルド → インストール**。ビルド失敗時はシステムを
  変更しない。インストール失敗はパッケージ単位でロールバックし、再実行で
  再開、クラッシュは `zpkg recover`
- 完了後に world / ターゲットを再解決し、closure の manifest を検証する。
  `--verify` は全ファイルの sha256 も照合する
- 制限: セット全体の自動ロールバックはしない。同じ version+revision のまま
  内容を変えると binpkg が衝突するため、変更時は revision を上げる

詳細は [リリースチャンネル](/docs/channels/) を参照。

## コマンド(v0.9)

| コマンド | 内容 |
|---|---|
| `build [-f] [--no-sandbox] [--clean] [--repro-check] <pkg>...` | fetch → 検証 → destroot まで(インストールしない)。`--clean` は work を削除、`--repro-check` は 2 回ビルドして manifest 比較 |
| `install [-f] [-p] [--asdeps] [--no-sandbox] [--clean] [--repro-check] <pkg>...` | build/install。`-p` は pretend、`--asdeps` は world に追加しない。`--clean` / `--repro-check` はキャッシュを使わずソースビルド |
| `upgrade [-p] [-y] [--newuse] [--prune] [--allow-downgrade] [--channel <ch>] [--verify] [pkg...]` | world(または指定 pkg)を選択チャンネルの版へ。変更一覧・依存差分・警告を表示し、全ビルド成功後にインストール。`--newuse` は USE 変更時の再ビルド、`--prune` は孤立依存の削除、`--allow-downgrade` はダウングレード許可、`--verify` は全ファイルの sha256 検証 |
| `remove [-f] <pkg>...` | 削除 + world から除去。逆依存があると停止(`-f` で強制) |
| `info <pkg>...` | インストール済みメタデータと利用可能レシピ |
| `owner <path>...` | パスの所有パッケージ |
| `world` | 明示インストール一覧 |
| `use [flag|-flag]...` | グローバル USE の表示・編集(`-flag` で無効化) |
| `use --package <pkg> [flag|-flag]...` | パッケージ単位 USE の表示・編集(`package.use`) |
| `channel [stable\|testing\|unstable]` | 実効チャンネルと利用可能ツリーの表示、`make.conf` の `CHANNEL=` 更新 |
| `recover` | 中断されたトランザクションの修復(install はロールバック、remove は完了) |
| `mkindex [--key <private>] [--generation N] [--expires ...] [dir]` | binpkg リポジトリ用の `index.json` を生成。`--key` で署名し `keys/<keyid>.pub` も出力 |
| `sync [--from <src>] [--dest <dir>] [-n] [--allow-unsigned]` | レシピツリーを stage3/レシピ tarball・ディレクトリ・URL から原子的に置換。`recipes.manifest` を検証 |
| `key generate --private <path> [--public <path>]` | Ed25519 鍵ペアを生成(秘密鍵 0600) |
| `key import <pubkey>...` / `key list` / `key remove <keyid>` | trusted.d の鍵管理 |
| `sign --key <private> <file>...` / `verify <file>...` | detached 署名の生成・検証 |
| `sign-recipes --key <private> [--generation N] [--expires ...] [dir]` | レシピツリーの manifest と署名を生成 |
| `depends [-r] <pkg>...` | 依存順の表示。`-r` はインストール済みの逆依存を表示 |
| `provenance <pkg>...` | 記録済みのビルド来歴(JSON)を表示 |
| `sbom <pkg>...` / `sbom --system [-o <file>]` | SPDX 2.3 SBOM の表示・出力 |
| `log [-p] <pkg>...` | ビルドログの表示(`-p` はパスだけ) |
| `list` / `search <term>` | 導入済み一覧 / レシピ検索(provides も検索対象) |

binpkg のキャッシュ名は `<name>-<version>[-rN][-<opts8>].pkg.tar.gz`。revision や実効オプションが変わると別ファイルになる。

### 出力(emerge 風のフェーズ表示)

ビルドの前に、これから処理するパッケージと実効 USE フラグの一覧を出す
(Portage の "These are the packages that would be merged" 相当)。その下に件数が入る:

```
These are the packages that will be installed, in order:
  [1] fastfetch-2.71.0-r2     USE=""
  [2] cmake-4.5.0 (dependency)  USE=""

Total: 2 packages (1 target, 1 dependency)
```

ビルドとインストールは `>>>` 付きのフェーズ行で区切る(Portage 風)。ビルドスクリプトの
出力はそのまま流れるので、どこからどこまでが 1 パッケージなのかが分かる:

```
>>> Building fastfetch-2.71.0-r2
...コンパイラ出力...
>>> Built fastfetch-2.71.0-r2 (66 files) in 1m2s
>>> Packed binpkg /var/cache/zpkg/binpkgs/fastfetch-2.71.0-r2.pkg.tar.gz
>>> Installing (1 of 1) fastfetch-2.71.0-r2
>>> Installed fastfetch-2.71.0-r2
```

- 一覧の USE はレシピの `iuse` を基準にし、有効を `flag`、無効を `-flag` で示す
  (iuse に無いが有効なフラグも末尾に表示)。並びはアルファベット順
- `(dependency)` は依存として自動で入るパッケージ。コマンドラインで指定したものが
  target として数えられる
- `(i of n)` はその実行で実際に処理するパッケージ数(インストール済みでスキップする
  ものは数えない)。依存は自動で先に処理される
- binpkg キャッシュ/リポジトリから入れるときは `>>> Installing (1 of 1) foo-1.0 (binpkg)`
  となり、Building は出ない
- スキップは `>>> Skipping foo-1.0 (already installed)`。pretend(`-p`)は一覧と Total だけを
  出して終了する
- `remove` も `>>> Removing (1 of 2) foo` / `>>> Removed foo`
- 色は stdout が端末のときだけ緑(`NO_COLOR` または `TERM=dumb` で無効)。ログやパイプ
  では ANSI を出さない

## トランザクション(Step 5)

install / remove は**ジャーナル付きトランザクション**として動く:

- 作業中の状態は `$ZPKG_DB/.txn/` に置く:
  - `journal.json` — 種別(install/remove)・フェーズ・削除予定パス(remove)。install はヘッダのみ
  - `journal.log` — install の新規作成/置き換えパスを 1 行 1 イベントで**追記**(fsync 付き)
  - `backup/` — 置き換え対象ファイルの移動先
- **Apply の流れ**: 追記ログにイベントを書く(`replaced` は backup へ移す**前**、`created` は
  配置**前**)→ 置き換え対象を backup へ移動 → 新ファイルを tmp+rename で配置 →
  phase=installed → `db.Save`(fsync 付き)→ `.txn` を削除(コミット)
  - 追記ログにした理由: パス一覧を毎回 `journal.json` へ書き直す方式は O(ファイル数²) で、
    cmake(4381 ファイル)のインストールに 13 分かかった。追記化後は **49 秒**(2026-11-18 実測)。
    旧形式(配列を journal.json に持つ)のジャーナルも読める
- **Apply が失敗したらその場でロールバック**(backup から復元、作成ファイル削除)。
  アップグレード失敗時は**旧レコードを保持**する(`hadrecord` フラグ。復元された旧ファイルと
  マニフェストが一致するため)
- **プロセスが死んだ場合**(kill・電源断)は `.txn` が残る。次の zpkg 操作の冒頭、または
  `zpkg recover` が修復する:
  - 中断された install → **ロールバック**(元に戻す)
  - 中断された remove → **完了**(削除の続きを実施。remove は可逆でないため)
- ジャーナルが読めない(破損)場合は `.txn.corrupt` に退避して続行
- `db.Save` は version/meta.json/manifest すべて tmp+rename + fsync(ファイルとディレクトリ両方)

## フック(hooks)

レシピディレクトリに `post_install` / `post_remove`(任意、bash)を置くと、
インストール直後 / 削除直後に実行される。渡される環境:

```
ZPKG_NAME ZPKG_VERSION ZPKG_ROOT ZPKG_USE
```

実行方法:

- `ZPKG_ROOT=/` — ホスト上で直接実行(そのままターゲット)
- ターゲットに `/usr/bin/bash` がある — `chroot <root> /usr/bin/env ... /usr/bin/bash -s`(スクリプトは stdin)
- どちらでもない(テスト用の空ルート)— ホストの bash で `ZPKG_ROOT` を渡して実行

さらに install/remove の後、`<root>/usr/sbin/ldconfig` があれば**ライブラリキャッシュを自動更新**する(ベストエフォート)。

## パッケージリポジトリ(zignos-recipes)

専用の git リポジトリ(zignos-recipes)をパッケージツリーとする(Gentoo の gentoo/gentoo リポジトリと同じ発想):

```
zignos-recipes/
├── stable/   {core,main,desktop}   # 既定。stage3/イメージに同梱
├── testing/  {core,main,desktop}   # 次期 stable の検証
├── unstable/ {core,main,desktop}   # 開発中
└── <channel>/<category>/<pkg>/{version, sources, checksums, depends, build}
```

zpkg はカテゴリディレクトリを `ZPKG_REPOS` に指定して使う。複数リポジトリ(overlay、例: 個人用フォーク)は `ZPKG_REPOS` の複数指定で自然にサポート(先頭優先)。

インストール済みシステムでは **レシピツリーを `/usr/share/zignos/recipes/<channel>/{core,main,desktop}` に同梱**し、`ZPKG_REPOS` 未設定時は `/etc/zpkg/make.conf` の `CHANNEL=`(既定 stable)に対応する3カテゴリを自動で検索する(gentoo の `/var/db/repos` 相当)。M39 以前のフラットな `recipes/{core,main,desktop}` は stable として受理する。したがってビルド済みイメージでも `zpkg search` / `zpkg install <pkg>` がそのまま動く。`ZPKG_REPOS` を明示すれば上書きできる(開発時のソースツリー、overlay など)。

## bootstrap チェーン(M2)

分担方針: **転送用ツールチェーンの固定手順は bootstrap.sh(zignos-build)が LFS 13.1 に忠実に実行し、最終システムは zpkg レシピで組み立てる**。

- **stage0(host → `$ZIGNOS_ROOT/tools`)**: LFS ch5 相当 — cross binutils/gcc pass1、kernel headers、cross glibc、libstdc++、temp tools。bootstrap.sh に直書きする(一過性の決まりきった手順で、レシピ化する価値が薄い)
- **stage1(chroot 準備)**: chroot へ移行、ディレクトリ構造と essential files を作成。ホストビルドの静的 zpkg バイナリ・レシピツリー・Go bootstrap 用の公式バイナリ tarball(`GOROOT_BOOTSTRAP` 用)を chroot に配置
- **stage2(chroot 内、zpkg が主役)**: linux-headers → glibc → binutils → gcc → make/bash/coreutils/tar/gzip/e2fsprogs/util-linux/… → go(バイナリ Go を bootstrap にソースビルド)→ zpkg を自家ホスト。以降のパッケージは chroot 内の zpkg がレシピから構築する
- stage レシピ(pass1/pass2)は作らない: cross ビルドは stage0 に閉じ、zpkg のレシピ形式は「最終システムのパッケージ」に専念する(v0 は stage/cross の概念を持たない)

## ソース取得と検証

- fetch は Go の `net/http`(https/http のみ、キャッシュ優先)
- チェックサムは sha256(`crypto/sha256`)。sources と checksums のインデックス対応で検証
- 展開は外部 `tar -xf` に委譲(gz/bz2/xz など形式ごとの差分を tar に任せる)。Windows 開発ホストでは `--force-local` とスラッシュ形式パスを付与(`GOOS=windows` のみ。Linux ターゲットでは不要)

## install / remove の動作

- **install**: destroot のマニフェストを生成 → 既存のインストール済みパッケージとの**所有権競合検出** → ファイルコピー → DB 記録
- **remove**: マニフェストと実ファイルの整合確認(改変されていたら中断。`ZPKG_FORCE=1` で強制)→ ファイル削除 → 空ディレクトリ掃除 → DB から削除
  - ディレクトリ掃除は **Lstat で実ディレクトリと確認できたものだけ**を対象にする。usr-merge の `/lib`・`/bin`・`/sbin` はシンボリックリンクなので、`os.Remove` するとリンク自体が消えて全バイナリが起動不能になる(linux-firmware の `dir lib` で実際に発生 — M22 で修正)
