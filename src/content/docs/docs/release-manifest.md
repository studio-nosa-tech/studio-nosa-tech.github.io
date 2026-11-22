---
title: リリースマニフェスト
description: ZIGNOS のビルドごとに生成する release.json のスキーマ、生成方法、サイトでの参照方法。
---

ZIGNOS は stage3 をビルドするたびに、**機械可読なリリースマニフェスト**
`release.json` を生成します。ウェブサイトのダウンロードページ、リリースノート、
インストールガイドは、この同じファイルからパッケージ数・サイズ・SHA-256・
バージョンを取得します。手書きの数値をページごとに持たないため、
リリース情報の食い違いが起きません。

## 公開 URL と配置

| 場所 | 用途 |
|---|---|
| `/releases.json` | 公開マニフェスト(サイトのビルド入力と同じ内容) |
| `src/data/release.json` | サイトのビルド入力 |
| `releases/<release>.json` | `zignos` リポジトリのアーカイブ |
| `<stage3>.tar.xz.release.json` | stage3 ビルドの sidecar |

stage3 tarball 自身には SHA-256 を埋め込めないため、マニフェストは
tarball の隣に置く sidecar です。

## スキーマ(schema 1)

```json
{
  "schema": 1,
  "release": "2026.11.20-alpha",
  "channel": "stable",
  "availability": "coming-soon",
  "generated": "2026-11-20T21:43:30Z",
  "build_date": "2026-11-20",
  "stage3": {
    "revision": "r20",
    "filename": "zignos-stage3-20261121-r20-x86_64.tar.xz",
    "size": 1114279740,
    "size_mib": 1063,
    "sha256": "9409ff19...",
    "package_count": 67,
    "packages": [
      {"name": "glibc", "version": "2.44", "revision": 0, "slot": "0", "category": "core"}
    ]
  },
  "zpkg": {"version": "0.3.1"},
  "kernel": {"package": "linux", "version": "6.18.64", "revision": 7, "in_stage3": false},
  "bootloader": {"package": "grub", "version": "2.14", "revision": 2, "in_stage3": false},
  "base": {"top_level": 38, "closure": 69},
  "recipes": {
    "filename": "zignos-recipes-20261120-r20.tar.xz",
    "size": 813948,
    "sha256": "5f3f7577...",
    "per_channel": 382,
    "total": 1160,
    "channels": {
      "stable": {"core": 77, "main": 100, "desktop": 205},
      "testing": {"core": 77, "main": 102, "desktop": 210},
      "unstable": {"core": 77, "main": 102, "desktop": 210}
    }
  },
  "boot": {"bios": "not-tested", "uefi": "not-tested", "hardware": "not-tested", "checked": null},
  "source": {
    "zignos": {"commit": "...", "dirty": false},
    "zpkg": {"commit": "...", "dirty": false},
    "recipes": {"commit": "...", "dirty": false},
    "build": {"commit": "...", "dirty": false}
  },
  "artifacts": [
    {"name": "stage3", "filename": "...", "size": 1114279740, "sha256": "..."},
    {"name": "recipes", "filename": "...", "size": 813948, "sha256": "..."},
    {"name": "zpkg", "filename": "zpkg-0.3.1-x86_64", "size": 12000000, "sha256": "..."}
  ]
}
```

> 上の値は r20 ビルドの値をもとにした抜粋です(packages / artifacts は省略)。
> 開発ツリーはこれより新しく、
> zpkg 0.3.3 / stable 389 / testing・unstable 399 レシピです。実際に配布する
> manifest は `make-stage3.sh` / `release-manifest.py` がビルドごとに生成します。
>
> `recipes.per_channel` はビルドしたチャンネル(stage3 なら stable)の数です。
> チャンネルごとの内訳は `recipes.channels` を使います。

`stage3.packages` は、stage3 の `/var/lib/zpkg` にあるインストール済み
レコードから生成します。schema 2 以前の `version` しか持たないレコードは、
`revision` / `slot` を既定値で補い、category は同梱レシピツリーから解決します。

`base.closure` は `base.list` の全トップレベル(linux / grub を含む)を
`zpkg depends` に渡したときのパッケージ数です。ビルド時の依存と
makedepends を含みます。

## 生成

`zignos-build` の `release-manifest.py` が生成します。stage3 ビルドでは
`make-stage3.sh` が自動で呼び出します。

```sh
python3 release-manifest.py generate \
  --release 2026.11.20-alpha --revision r20 --channel stable \
  --stage3 /var/tmp/zignos-stage3-20261121-r20-x86_64.tar.xz \
  --db-root /var/tmp/stage3-db/var/lib/zpkg \
  --recipes /mnt/sources/zignos-recipes \
  --base-list base.list --base-closure 69 \
  --boot-tests /var/tmp/zignos-boot-tests.json \
  --artifact recipes=/var/tmp/zignos-recipes-20261120-r20.tar.xz \
  --artifact zpkg=/var/tmp/zpkg-0.3.1-x86_64 \
  --commit zignos=<sha> --commit zpkg=<sha> \
  --commit recipes=<sha> --commit build=<sha> \
  --out /var/tmp/<stage3>.release.json
```

リリース名と revision は `zignos-build/release.conf` が既定値を持ちます。

### 起動結果の記録

`qemu-test.sh check` は起動の成否を自動で記録します。

```sh
python3 release-manifest.py record-boot \
  --file /var/tmp/zignos-boot-tests.json \
  --mode bios --result passed --kernel 6.18.64 --image zignos.img
```

`--mode` は `bios` / `uefi` / `hardware`、`--result` は `passed` / `failed` /
`not-tested` です。結果ファイルが無い場合、manifest は全項目 `not-tested` に
なります。

### 検証

```sh
python3 release-manifest.py validate release.json
```

schema、必須文字列、stage3 のサイズと SHA-256、`package_count` と
`packages` 件数の一致、配布物の SHA-256 の長さを検証します。

## サイトでの参照

Markdown では `{{...}}` トークンを書くと、ビルド時に `release.json` の値へ
置換されます。fenced code block の中は置換しません。

```text
{{release}}                 リリース名
{{build_date}}              ビルド日
{{stage3.revision}}         stage3 リビジョン
{{stage3.package_count}}    stage3 のパッケージ数
{{stage3.size_mib}}         stage3 のサイズ (MiB)
{{stage3.filename}}         stage3 のファイル名
{{stage3.sha256}}           stage3 の SHA-256
{{zpkg.version}}            zpkg のバージョン
{{kernel.full}}             kernel の version-revision
{{bootloader.full}}         GRUB の version-revision
{{base.top_level}}          base.list のトップレベル数
{{base.closure}}            依存込みのベースパッケージ数
{{recipes.per_channel}}     ビルドチャンネル(stable)のレシピ数
{{recipes.total}}           全チャンネルのレシピ数
{{recipes.filename}}        レシピ tarball のファイル名
{{boot.bios}}               BIOS の起動検証結果
{{boot.uefi}}               UEFI の起動検証結果
{{boot.hardware}}           実機の起動検証結果
```

Astro のページでは `import release from '../data/release.json'` で直接参照します。

## 公開

```sh
# manifest を検証し、zignos/releases/ とサイトの src/data/ に配置
./publish-release.sh /var/tmp/<stage3>.release.json
```

`publish-release.sh` は検証に失敗した manifest を配置しません。サイトは
配置された `src/data/release.json` を使ってビルドされます。

## 制限

- マニフェストは **stage3 ビルド単位**です。ブータブルイメージ専用の
  マニフェストはまだありません
- 起動検証は `qemu-test.sh check` を実行した場合だけ記録されます
- 実機検証は自動化していません。`record-boot --mode hardware` で手動記録できます
- 配布物の自動アップロードと CI 連携はまだありません
