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
  "release": "2026.11.19-alpha",
  "channel": "stable",
  "availability": "coming-soon",
  "generated": "2026-11-19T03:19:08Z",
  "build_date": "2026-11-19",
  "stage3": {
    "revision": "r12",
    "filename": "zignos-stage3-20261119-r12-x86_64.tar.xz",
    "size": 1023609792,
    "size_mib": 977,
    "sha256": "785b2222...",
    "package_count": 54,
    "packages": [
      {"name": "glibc", "version": "2.44", "revision": 0, "slot": "0", "category": "core"}
    ]
  },
  "zpkg": {"version": "0.2.0"},
  "kernel": {"package": "linux", "version": "7.1.8", "revision": 4, "in_stage3": false},
  "bootloader": {"package": "grub", "version": "2.14", "revision": 2, "in_stage3": false},
  "base": {"top_level": 37, "closure": 64},
  "recipes": {
    "filename": "zignos-recipes-20261119-r12.tar.xz",
    "size": 699180,
    "sha256": "78755800...",
    "per_channel": 162,
    "total": 486,
    "channels": {
      "stable": {"core": 76, "main": 86, "desktop": 0},
      "testing": {"core": 76, "main": 86, "desktop": 0},
      "unstable": {"core": 76, "main": 86, "desktop": 0}
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
    {"name": "stage3", "filename": "...", "size": 1023609792, "sha256": "..."},
    {"name": "recipes", "filename": "...", "size": 699180, "sha256": "..."},
    {"name": "zpkg", "filename": "zpkg-0.2.0-x86_64", "size": 11651815, "sha256": "..."}
  ]
}
```

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
  --release 2026.11.19-alpha --revision r12 --channel stable \
  --stage3 /var/tmp/zignos-stage3-20261119-r12-x86_64.tar.xz \
  --db-root /var/tmp/stage3-db/var/lib/zpkg \
  --recipes /mnt/sources/zignos-recipes \
  --base-list base.list --base-closure 64 \
  --boot-tests /var/tmp/zignos-boot-tests.json \
  --artifact recipes=/var/tmp/zignos-recipes-20261119-r12.tar.xz \
  --artifact zpkg=/var/tmp/zpkg-0.2.0-x86_64 \
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
  --mode bios --result passed --kernel 7.1.8 --image zignos.img
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
{{recipes.per_channel}}     チャンネルあたりのレシピ数
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
