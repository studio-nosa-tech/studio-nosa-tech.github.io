---
title: Release manifest
description: The schema of release.json, generated for every ZIGNOS build, plus how to generate it and how the site reads it.
---

Every time ZIGNOS builds stage3, it generates a **machine-readable release
manifest**, `release.json`. The website's download page, release notes and
installation guide all read package counts, sizes, SHA-256 values and versions
from this same file. No page keeps hand-written numbers, so release
information cannot disagree.

## Public URL and placement

| Location | Purpose |
|---|---|
| `/releases.json` | Public manifest (same contents as the site's build input) |
| `src/data/release.json` | The site's build input |
| `releases/<release>.json` | Archive in the `zignos` repository |
| `<stage3>.tar.xz.release.json` | Sidecar for the stage3 build |

A stage3 tarball cannot embed its own SHA-256, so the manifest is a sidecar
placed next to the tarball.

## Schema (schema 1)

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

> The values above are an excerpt based on the r20 build (packages / artifacts
> omitted). The development tree is newer: zpkg 0.3.3 / 389 stable and 399
> testing and unstable recipes. The manifest actually distributed is generated
> per build by `make-stage3.sh` / `release-manifest.py`.
>
> `recipes.per_channel` is the count for the built channel (stable for stage3).
> Use `recipes.channels` for the per-channel breakdown.

`stage3.packages` is generated from the installed records in stage3's
`/var/lib/zpkg`. For records from schema 2 or earlier that only have
`version`, `revision` / `slot` are filled with defaults and category is
resolved from the bundled recipe tree.

`base.closure` is the package count when every top-level entry in `base.list`
(including linux / grub) is passed to `zpkg depends`. It includes build-time
dependencies and makedepends.

## Generation

`release-manifest.py` in `zignos-build` generates it. For stage3 builds,
`make-stage3.sh` calls it automatically.

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

`zignos-build/release.conf` holds the defaults for the release name and
revision.

### Recording boot results

`qemu-test.sh check` records whether the boot succeeded.

```sh
python3 release-manifest.py record-boot \
  --file /var/tmp/zignos-boot-tests.json \
  --mode bios --result passed --kernel 6.18.64 --image zignos.img
```

`--mode` is `bios` / `uefi` / `hardware`; `--result` is `passed` / `failed` /
`not-tested`. If there is no result file, every item in the manifest is
`not-tested`.

### Validation

```sh
python3 release-manifest.py validate release.json
```

It validates the schema, required strings, the stage3 size and SHA-256, that
`package_count` matches the number of `packages`, and the length of artifact
SHA-256 values.

## Using it from the site

In Markdown, writing a `{{...}}` token replaces it with the value from
`release.json` at build time. Tokens inside fenced code blocks are not
replaced.

```text
{{release}}                 Release name
{{build_date}}              Build date
{{stage3.revision}}         stage3 revision
{{stage3.package_count}}    Number of packages in stage3
{{stage3.size_mib}}         stage3 size (MiB)
{{stage3.filename}}         stage3 filename
{{stage3.sha256}}           stage3 SHA-256
{{zpkg.version}}            zpkg version
{{kernel.full}}             kernel version-revision
{{bootloader.full}}         GRUB version-revision
{{base.top_level}}          Number of top-level entries in base.list
{{base.closure}}            Number of base packages including dependencies
{{recipes.per_channel}}     Number of recipes in the built channel (stable)
{{recipes.total}}           Number of recipes across all channels
{{recipes.filename}}        Recipe tarball filename
{{boot.bios}}               BIOS boot test result
{{boot.uefi}}               UEFI boot test result
{{boot.hardware}}           Hardware boot test result
```

In Astro pages, import it directly with
`import release from '../data/release.json'`.

## Publishing

```sh
# validate the manifest, then place it in zignos/releases/ and the site's src/data/
./publish-release.sh /var/tmp/<stage3>.release.json
```

`publish-release.sh` does not place a manifest that fails validation. The site
builds using the placed `src/data/release.json`.

## Limitations

- The manifest is **per stage3 build**. There is no manifest dedicated to
  bootable images yet
- Boot verification is recorded only when `qemu-test.sh check` is run
- Hardware verification is not automated. It can be recorded manually with
  `record-boot --mode hardware`
- Automatic artifact upload and CI integration are not available yet
