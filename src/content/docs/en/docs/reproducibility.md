---
title: Reproducible builds
description: Reproducible builds in ZIGNOS, covering SOURCE_DATE_EPOCH, build logs, provenance, SPDX 2.3 SBOMs and verification with --repro-check.
---

ZIGNOS aims for this: the same recipe, the same source and the same build
environment produce the same artifact. Exact byte-for-byte equality depends on
how upstream software is written, but `zpkg` provides a mechanism to **fix the
inputs, record the outputs, and verify with two builds**.

## What is fixed

| Input | Default / method |
|---|---|
| Time | `SOURCE_DATE_EPOCH=946684800` (2000-01-01T00:00:00Z) |
| Kernel UTS_VERSION | `KBUILD_BUILD_TIMESTAMP` / `KBUILD_BUILD_USER=zignos` / `KBUILD_BUILD_HOST=zignos-build` |
| Python hash seed | `PYTHONHASHSEED=0` |
| umask | Build scripts run through a wrapper that sets `umask 022` |
| binpkg mtime | The gzip header and every tar entry are pinned to SOURCE_DATE_EPOCH |
| Work directory | `$ZPKG_CACHE/build/<name>-<version>[-rN][-opts]` |
| Sandbox | bubblewrap. The root is read-only; only work is writable |

SOURCE_DATE_EPOCH precedence:

1. `ZPKG_SOURCE_DATE_EPOCH`
2. The standard `SOURCE_DATE_EPOCH`
3. `SOURCE_DATE_EPOCH=` in `/etc/zpkg/build.conf`
4. The default `946684800`

```ini
# /etc/zpkg/build.conf
SOURCE_DATE_EPOCH=946684800
BUILD_LOG=1
SBOM=1
```

`BUILD_LOG=0` disables build logs and `SBOM=0` disables SBOM generation (the
`ZPKG_BUILD_LOG` / `ZPKG_SBOM` environment variables take precedence). See
[zpkg configuration](/en/docs/zpkg-config/) for the settings as well.

## Build logs

Build stdout/stderr is saved to `$ZPKG_CACHE/logs/<name>-<version>[-rN].log`
by default. Failed builds also keep a log, so there is no need to scroll back
through the screen. The log starts with this information.

```
zpkg build log
package: zlib-1.3.2
recipe: /usr/share/zignos/recipes/stable/core/zlib
recipe_digest: 2c625969f0a9...
source_date_epoch: 946684800
sandbox: bwrap
network: on
started: 2026-11-19T00:25:42Z
build_script: /usr/share/zignos/recipes/stable/core/zlib/build
---
```

```sh
zpkg log zlib          # show the log
zpkg log -p zlib       # show only the path
```

## Provenance

`zpkg` generates `provenance.json` at build and install time.

- `$ZPKG_DB/<name>[@slot]/provenance.json` (after install)
- `$ZPKG_CACHE/binpkgs/<base>.build.json` (binpkg sidecar)

```json
{
  "schema": 1,
  "package": {"name": "zlib", "version": "1.3.2", "revision": 0, "slot": "0", "arch": "amd64"},
  "recipe": {"repo": "/usr/share/zignos/recipes/stable/core", "dir": ".../core/zlib",
             "digest": "2c625969f0a9...", "keyid": "...", "generation": 42},
  "sources": [{"url": "https://zlib.net/fossils/zlib-1.3.2.tar.gz",
               "file": "zlib-1.3.2.tar.gz", "sha256": "bb32...", "size": 1502830}],
  "build": {"sandbox": "bwrap", "network": "on",
            "source_date_epoch": 946684800,
            "started": "2026-11-21T00:25:42Z", "finished": "2026-11-21T00:25:49Z",
            "origin": "source", "zpkg_version": "0.3.2"},
  "toolchain": [{"name": "gcc", "version": "16.2.0"}, ...],
  "dependencies": [{"name": "glibc", "version": "2.44"}],
  "build_dependencies": [{"name": "gcc", "version": "16.2.0"}],
  "environment": {"hash": "...", "count": 69, "packages": ["glibc-2.44", ...]},
  "artifact": {"filename": "zlib-1.3.2.pkg.tar.gz", "sha256": "...",
               "size": 123456, "manifest_sha256": "..."},
  "log": {"path": "/var/cache/zpkg/logs/zlib-1.3.2.log", "sha256": "..."}
}
```

- The **recipe digest** is a hash of every regular file's path / sha256 / mode
  (and symlink targets), sorted. It does not depend on git and identifies the
  recipe actually used
- **environment** is every package installed at build time
  (`name@slot-version`) plus a hash of that set
- **artifact** is the binpkg's sha256 / size / manifest sha256
- When installing from a binpkg / binrepo, only what can be determined is
  recorded (origin, artifact hash, and the recipe digest and build environment
  from the binpkg sidecar)

```sh
zpkg provenance zlib
```

## SPDX 2.3 SBOM

SBOMs are generated in SPDX 2.3 JSON for each package and for the whole
system.

- `$ZPKG_DB/<name>[@slot]/sbom.json`
- `$ZPKG_CACHE/binpkgs/<base>.spdx.json`

Contents:

- `spdxVersion: "SPDX-2.3"`, `dataLicense: "CC0-1.0"`
- The target package gets the artifact SHA-256, a purl
  (`pkg:generic/zignos/<name>@<version>`) and the recipe digest as
  `sourceInfo`
- Runtime dependencies use `DEPENDS_ON`, makedepends use
  `BUILD_DEPENDENCY_OF`, and the toolchain uses `BUILD_TOOL_OF`
- Per-package `creationInfo.created` is SOURCE_DATE_EPOCH; the system SBOM
  uses the generation time
- The system SBOM includes a synthetic package `SPDXRef-System-zignos` and
  adds `CONTAINS` to every installed package

```sh
zpkg sbom zlib                     # one package
zpkg sbom --system -o system.spdx.json
python3 -m json.tool system.spdx.json
```

License information is `NOASSERTION` because recipes do not carry it.

## Reproducibility check

```sh
zpkg build --repro-check zlib
```

1. Build from source as usual and create a binpkg
2. Delete the work directory (same as `--clean`)
3. Build again with the same recipe, source cache, environment and
   SOURCE_DATE_EPOCH
4. Compare the destroot manifests (Kind / Path / Hash / Link)
5. If they differ, show the difference per path and fail. If they match, print
   `Reproducible: zlib (manifest matches, artifact <sha256>)`

```
>>> Reproducible: m39test-1.0 (manifest matches, artifact c95cc...)
```

Byte equality of binpkgs is not guaranteed. Even when the tar contents,
ownership, modes and order match, the byte stream can differ because of the
compression level or information embedded by upstream. If the two artifact
SHA-256 values differ, a note is added.

`--clean` deletes the work directory before a normal build. `--repro-check`
never uses a cached binpkg and always builds twice from source.

```sh
zpkg install --clean zlib           # rebuild without using the cache
zpkg install --repro-check zlib     # verify, then install
```

## Limitations

- `--repro-check` compares manifests. It does not guarantee matching
  ownership, mtime or tar bytes (the artifact hash is recorded)
- Software such as the kernel, perl and openssl that embeds time, hostname or
  build paths upstream may not match exactly with SOURCE_DATE_EPOCH alone
- The build environment is the entire installed system (read-only). A fixed
  build root exposing only makedepends is not implemented
- Build logs live under the cache, so clearing the cache loses them
- provenance / SBOM depend on the version of zpkg that performed the build
