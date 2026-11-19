---
title: 再現可能なビルド
description: ZIGNOS の再現可能なビルド。SOURCE_DATE_EPOCH、ビルドログ、provenance、SPDX 2.3 SBOM、--repro-check による検証。
---

ZIGNOS は「同じレシピ・同じソース・同じビルド環境なら、同じ成果物になる」
ことを目指しています。完全なバイト一致は上流ソフトウェアの作りに左右されますが、
`zpkg` は**入力を固定し、出力を記録し、2 回ビルドで検証する**仕組みを提供します。

## 何を固定するか

| 入力 | 既定 / 方法 |
|---|---|
| 時刻 | `SOURCE_DATE_EPOCH=946684800`(2000-01-01T00:00:00Z) |
| カーネルの UTS_VERSION | `KBUILD_BUILD_TIMESTAMP` / `KBUILD_BUILD_USER=zignos` / `KBUILD_BUILD_HOST=zignos-build` |
| Python の hash seed | `PYTHONHASHSEED=0` |
| umask | build スクリプトを `umask 022` の wrapper 経由で実行 |
| binpkg の mtime | gzip header と tar の全エントリを SOURCE_DATE_EPOCH に固定 |
| 作業ディレクトリ | `$ZPKG_CACHE/build/<name>-<version>[-rN][-opts]` |
| サンドボックス | bubblewrap。root は読み取り専用、work のみ書き込み可 |

SOURCE_DATE_EPOCH の優先順位:

1. `ZPKG_SOURCE_DATE_EPOCH`
2. 標準の `SOURCE_DATE_EPOCH`
3. `/etc/zpkg/build.conf` の `SOURCE_DATE_EPOCH=`
4. 既定値 `946684800`

```ini
# /etc/zpkg/build.conf
SOURCE_DATE_EPOCH=946684800
BUILD_LOG=1
SBOM=1
```

`BUILD_LOG=0` でビルドログを、`SBOM=0` で SBOM 生成を無効にできます
(環境変数 `ZPKG_BUILD_LOG` / `ZPKG_SBOM` が優先)。設定は
[zpkg 設定](/docs/zpkg-config/) も参照してください。

## ビルドログ

ビルドの stdout/stderr は既定で `$ZPKG_CACHE/logs/<name>-<version>[-rN].log`
に保存されます。失敗したビルドもログを残すため、画面をさかのぼる必要は
ありません。ログの先頭には次の情報が入ります。

```
zpkg build log
package: zlib-1.3.2
recipe: /usr/share/zignos/recipes/core/zlib
recipe_digest: 2c625969f0a9...
source_date_epoch: 946684800
sandbox: bwrap
network: on
started: 2026-11-19T00:25:42Z
build_script: /usr/share/zignos/recipes/core/zlib/build
---
```

```sh
zpkg log zlib          # ログを表示
zpkg log -p zlib       # パスだけ表示
```

## provenance(ビルド来歴)

`zpkg` はビルド・インストール時に `provenance.json` を生成します。

- `$ZPKG_DB/<name>[@slot]/provenance.json`(インストール後)
- `$ZPKG_CACHE/binpkgs/<base>.build.json`(binpkg の sidecar)

```json
{
  "schema": 1,
  "package": {"name": "zlib", "version": "1.3.2", "revision": 0, "slot": "0", "arch": "amd64"},
  "recipe": {"repo": "/usr/share/zignos/recipes/core", "dir": ".../core/zlib",
             "digest": "2c625969f0a9...", "keyid": "...", "generation": 42},
  "sources": [{"url": "https://zlib.net/fossils/zlib-1.3.2.tar.gz",
               "file": "zlib-1.3.2.tar.gz", "sha256": "bb32...", "size": 1502830}],
  "build": {"sandbox": "bwrap", "network": "on",
            "source_date_epoch": 946684800,
            "started": "2026-11-19T00:25:42Z", "finished": "2026-11-19T00:25:49Z",
            "origin": "source", "zpkg_version": "0.1.0-r11"},
  "toolchain": [{"name": "gcc", "version": "16.2.0"}, ...],
  "dependencies": [{"name": "glibc", "version": "2.44"}],
  "build_dependencies": [{"name": "gcc", "version": "16.2.0"}],
  "environment": {"hash": "...", "count": 54, "packages": ["glibc-2.44", ...]},
  "artifact": {"filename": "zlib-1.3.2.pkg.tar.gz", "sha256": "...",
               "size": 123456, "manifest_sha256": "..."},
  "log": {"path": "/var/cache/zpkg/logs/zlib-1.3.2.log", "sha256": "..."}
}
```

- **recipe digest** はレシピディレクトリの全 regular file の
  path / sha256 / mode(と symlink の target)をソートして hash したもの。
  git に依存せず、実際に使ったレシピを特定できます
- **environment** はビルド時にインストール済みだった全パッケージ
  (`name@slot-version`)と、その集合の hash です
- **artifact** は binpkg の sha256 / size / manifest sha256 です
- binpkg / binrepo からインストールした場合は、判明する範囲(origin、
  artifact hash、binpkg sidecar の recipe digest とビルド環境)だけを記録します

```sh
zpkg provenance zlib
```

## SPDX 2.3 SBOM

各パッケージと、システム全体の SBOM を SPDX 2.3 JSON で生成します。

- `$ZPKG_DB/<name>[@slot]/sbom.json`
- `$ZPKG_CACHE/binpkgs/<base>.spdx.json`

内容:

- `spdxVersion: "SPDX-2.3"`, `dataLicense: "CC0-1.0"`
- target パッケージに artifact の SHA-256、purl
  (`pkg:generic/zignos/<name>@<version>`)、レシピ digest を `sourceInfo` として付与
- runtime 依存は `DEPENDS_ON`、makedepends は `BUILD_DEPENDENCY_OF`、
  toolchain は `BUILD_TOOL_OF`
- per-package の `creationInfo.created` は SOURCE_DATE_EPOCH、
  system SBOM は生成時刻
- system SBOM は合成パッケージ `SPDXRef-System-zignos` を含み、
  全インストール済みパッケージに `CONTAINS` を張る

```sh
zpkg sbom zlib                     # 1 パッケージ
zpkg sbom --system -o system.spdx.json
python3 -m json.tool system.spdx.json
```

ライセンス情報はレシピが持っていないため `NOASSERTION` です。

## 再現性検証

```sh
zpkg build --repro-check zlib
```

1. 通常どおりソースビルドして binpkg を作成
2. work ディレクトリを削除(`--clean` と同じ)
3. 同じレシピ・ソースキャッシュ・環境・SOURCE_DATE_EPOCH でもう一度ビルド
4. destroot の manifest(Kind / Path / Hash / Link)を比較
5. 差分があれば path ごとに表示して失敗。一致すれば
   `Reproducible: zlib (manifest matches, artifact <sha256>)` を表示

```
>>> Reproducible: m39test-1.0 (manifest matches, artifact c95cc...)
```

binpkg のバイト一致は保証しません。tar の内容・所有者・モード・順序が同じでも、
圧縮率や上流が埋め込む情報でバイト列が変わることはあります。2 回の artifact
SHA-256 が異なる場合は注記します。

`--clean` は通常ビルドの前に work ディレクトリを削除します。`--repro-check` は
キャッシュ済み binpkg を使わず、必ずソースから 2 回ビルドします。

```sh
zpkg install --clean zlib           # キャッシュを使わずに作り直す
zpkg install --repro-check zlib     # 検証してからインストール
```

## 制限

- `--repro-check` は manifest の比較です。所有者・mtime・tar のバイト一致は
  保証しません(artifact hash は記録します)
- カーネル・perl・openssl など、上流が時刻・ホスト名・ビルドパスを埋め込む
  ソフトウェアは、SOURCE_DATE_EPOCH だけでは完全一致しないことがあります
- ビルド環境はインストール済みシステム全体(読み取り専用)です。
  makedepends だけが見える固定ビルドルートは未実装です
- ビルドログは cache 配下なので、cache を消すと失われます
- provenance / SBOM はビルドした zpkg のバージョンに依存します
