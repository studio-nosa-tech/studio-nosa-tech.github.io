---
title: zpkg 設計
description: zpkg の設計。レシピ形式、DB schema 2、USE フラグ、トランザクション、binpkg。
---

ステータス: v0.9 設計(実装と合わせて更新する。DB schema 2・world/upgrade・USE
フラグ・フック・トランザクションは実装済み — 後述の各節参照)

> 実際の設定ファイル(`use.conf` / `package.use` / `make.conf` / `binrepo.conf` /
> `sync.conf`)と環境変数は [zpkg 設定](/docs/zpkg-config/) にまとめています。

## 目標

- ソースベースのパッケージマネージャ。KISS Linux の `kiss` を最小構成の参考にする
- 最初は数百行〜1500 行程度のシンプルな実装。長期的に Gentoo Portage / Exherbo Paludis 相当へ進化させる
- **Go で書く**: 単一静的バイナリとして chroot 内でも動かせる。将来の USE フラグ・ソルバー拡張も同じコードベースで行う

## まだ無いもの(v0.9 時点)

- バイナリリポジトリの配布(index + 署名)— binpkg キャッシュとローカルリポジトリ対応はある

- 制約付き依存(`>=foo-1.2`、`!bar`)と本格的な依存解決ソルバー(provides/conflicts は記録のみ)

## 全体像

```
レシピリポジトリ(ZPKG_REPOS, 先頭一致で検索)
   ↓ recipe.Load
依存解決(internal/dep, トポロジカルソート)
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
recipes/core/<pkg>/
├── version       # 1 行。必須
├── sources       # 1 行 1 URL。省略可(ソースなしパッケージ)
├── checksums     # 1 行 1 個の sha256。sources と同じ順・同数
├── depends       # 1 行 1 パッケージ名(flag?pkg 可)。省略可
├── makedepends   # ビルド時のみの依存(flag?pkg 可)。省略可
├── revision      # -rN。内容を変えたら必ず上げる
├── slot          # 共存スロット(既定 0)
├── iuse          # このレシピが理解する USE フラグ
├── provides      # virtual 名(記録のみ)
├── conflicts     # 同時インストール禁止(記録のみ)
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
  "repo": "/sources/zignos-recipes/core",
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
| `provides` | 提供する virtual 名(1行1個) | なし |
| `conflicts` | 同時に入れてはいけないパッケージ | なし |
| `makedepends` | ビルド時のみ必要な依存(1行1個、`flag?pkg` 可) | なし |
| `iuse` | レシピが理解する USE フラグ(1行1個) | なし |
| `post_install` / `post_remove` | インストール/削除直後のフック(bash) | なし |

`depends` は実行時依存。ビルド順序には `depends` + `makedepends` の両方を使う。

## 依存解決(v0.9)

- `depends`(+`makedepends`)の宣言に従い DFS でトポロジカルソート(依存が先、循環はエラー)
- ソルバーなし。バージョン制約なし(名前のみ)。`provides`/`conflicts` は記録のみでまだ解決には使わない
- 既にインストール済みのパッケージは build/install の対象からスキップ(`-f` で強制)
- **`-f` は binpkg キャッシュを無視しない**: 同一 version+revision+実効 USE の
  binpkg があればそれを使う。レシピの内容を変えたときは revision を上げること
  (binpkg キーが変わり、ソースから再ビルドされる)

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

## binpkg リポジトリ(対応済み・配布は範囲外)

リポジトリは「`index.json` + binpkg 一式」を置いたディレクトリ(URL またはローカルパス)。
ホスティングは範囲外で、静的ファイルサーバがあればよい。

```
<binpkg-dir>/
├── index.json                                  # zpkg mkindex が生成
├── doas-6.8.2.pkg.tar.gz                       # binpkg 本体
├── doas-6.8.2.manifest                         # ファイル一覧サイドカー
└── doas-6.8.2.meta.json                        # name/version/revision/usehash/arch/deps
```

- **生成**: `zpkg mkindex [dir]`(既定はローカルの binpkg キャッシュ)。PackBinpkg が
  `.meta.json` サイドカーも書くので、レシピツリーなしで索引を作れる
- **消費**: `ZPKG_BINREPO`(env)または `/etc/zpkg/binrepo.conf` の `BINREPO=` を設定すると、
  install はローカル binpkg キャッシュがミスした後にリポジトリを試す
- **一致条件**: name・arch・version+revision・**実効 USE フラグのハッシュ**が全部一致。
  違えば黙ってソースビルドにフォールバック(誤ったビルドを入れない)。tarball の
  sha256 は索引と突き合わせて検証
- `ZPKG_NO_BINPKG=1` はローカル binpkg とリポジトリの両方を無効化する
- 署名は将来課題(index に signature フィールドを追加する形を想定)。配布と運用は
  コミュニティが形成された段階で整備する

## コマンド(v0.9)

| コマンド | 内容 |
|---|---|
| `build [-f] <pkg>...` | fetch → 検証 → destroot まで(インストールしない) |
| `install [-f] [-p] [--asdeps] <pkg>...` | build/install。`-p` は pretend、`--asdeps` は world に追加しない |
| `upgrade [-p] [--newuse] [pkg...]` | world(または指定 pkg)をレシピの版へ。`version.Compare(installed, recipe)` で判定。`--newuse` は実効 USE フラグが変わったパッケージも再ビルド |
| `remove <pkg>...` | 削除 + world から除去 |
| `info <pkg>...` | インストール済みメタデータと利用可能レシピ |
| `owner <path>...` | パスの所有パッケージ |
| `world` | 明示インストール一覧 |
| `use [flag|-flag]...` | グローバル USE の表示・編集(`-flag` で無効化) |
| `use --package <pkg> [flag|-flag]...` | パッケージ単位 USE の表示・編集(`package.use`) |
| `recover` | 中断されたトランザクションの修復(install はロールバック、remove は完了) |
| `mkindex [dir]` | binpkg リポジトリ用の `index.json` を生成(既定はローカルキャッシュ) |
| `depends/list/search` | 依存順の表示 / 導入済み一覧 / レシピ検索 |

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
├── core/     bootstrap 最小セット(LFS 相当)
├── main/     CLI 実用パッケージ
├── desktop/  GUI(M4 以降)
└── <カテゴリ>/<パッケージ>/{version, sources, checksums, depends, build}
```

zpkg はカテゴリディレクトリを `ZPKG_REPOS` に指定して使う。複数リポジトリ(overlay、例: 個人用フォーク)は `ZPKG_REPOS` の複数指定で自然にサポート(先頭優先)。

インストール済みシステムでは **レシピツリーを `/usr/share/zignos/recipes/{core,main,desktop}` に同梱**し、`ZPKG_REPOS` 未設定時はこの3カテゴリを自動で検索する(gentoo の `/var/db/repos` 相当)。したがってビルド済みイメージでも `zpkg search` / `zpkg install <pkg>` がそのまま動く。`ZPKG_REPOS` を明示すれば上書きできる(開発時のソースツリー、overlay など)。

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
