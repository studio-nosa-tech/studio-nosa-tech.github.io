---
title: zpkg design
description: The design of zpkg. Recipe format, DB schema 2, USE flags, transactions, binpkgs.
---

Status: v0.3.3 design (updated together with the implementation. DB schema 2, world/upgrade, USE
flags, hooks, transactions, dependency atom resolution, recipe sync and reproducible build
are implemented — see the sections below)

> The actual configuration files (`use.conf` / `package.use` / `make.conf` / `binrepo.conf` /
> `sync.conf`) and environment variables are collected in [zpkg configuration](/en/docs/zpkg-config/).

## Goals

- A source-based package manager. Use the minimal setup of a lightweight package manager as a reference
- Start as a simple implementation of a few hundred to about 1500 lines. Evolve it toward a full package manager over the long term
- **Written in Go**: runs as a single static binary, even inside a chroot. Future USE flag and solver extensions use the same codebase

## Not there yet (as of v0.3.3)

- Distribution and operation of a public binary repository (the signing mechanism and `keys/` output are implemented)

- A full SAT solver. Resolution is currently deterministic backtracking (see "Dependency resolution" below), and a complete solution considering multiple versions and slots at the same time is not implemented

## Overview

```
Recipe repository (ZPKG_REPOS, first match wins)
   ↓ recipe.Load
Dependency resolution (internal/depspec + internal/resolve, backtracking + topological sort)
   ↓
fetch → checksum verification → extract (internal/source)
   ↓
build script execution → destroot (internal/build)
   ↓
manifest creation (internal/manifest)
   ↓
install (conflict detection + DB record) / remove (internal/install, internal/pkgdb)
```

Package DB: `$ZPKG_DB` (default `$ZPKG_ROOT/var/lib/zpkg`)
Cache: `$ZPKG_CACHE` (default `$ZPKG_ROOT/var/cache/zpkg`)

## Recipe format (directory-based, minimal)

```
recipes/<channel>/core/<pkg>/
├── version       # one line. required
├── sources       # one URL per line. optional (packages without sources)
├── checksums     # one sha256 per line. same order and count as sources
├── depends       # runtime dependencies (one atom per line). optional
├── makedepends   # build-only dependencies (one atom per line). optional
├── revision      # -rN. always bump when the content changes
├── slot          # coexisting slot (default 0)
├── iuse          # USE flags this recipe understands
├── provides      # virtual name (used for resolution. virtual/foo[-ver])
├── conflicts     # forbidden to install at the same time (used for resolution)
├── build_network # 1/0 overrides the build-time network (global when omitted)
├── build         # shell script. required (permanently shell)
├── post_install  # optional hook (bash)
└── post_remove   # optional hook (bash)
```

Parse rules: blank lines and lines starting with `#` are ignored. `sources` and `checksums` **correspond by line order**. `.patch` / `.diff` sources are not extracted and are placed in `$ZPKG_SRC` (used with `patch -Np1 -i` in the build script). Nothing other than tarballs is extracted. A `#filename` fragment on a URL specifies the cache file name (for URLs with poor basenames such as GitHub tag tarballs. The fragment is not sent to the server).

## Build script contract

`build` is **permanently shell** (the same idea as common source build recipes). Only the zpkg core is subject to rewriting; the recipe build script contract is preserved.

Execution environment:

| Variable | Description |
|---|---|
| `ZPKG_NAME` | Package name |
| `ZPKG_VERSION` | Version |
| `ZPKG_ROOT` | Target root |
| `ZPKG_CACHE` | Source cache directory (usable for referencing additional sources) |
| `ZPKG_DESTROOT` | Install location for build artifacts (staging root) |
| `ZPKG_SRC` | Extracted source directory (also the current directory) |
| `ZPKG_WORKDIR` | The package's work directory |

Rules:

- The build script must **place artifacts in the destroot**, e.g. `make DESTDIR="$ZPKG_DESTROOT" install`. zpkg manifests the destroot and then installs it
- Writing directly to `$ZPKG_ROOT` is forbidden (no manifest can be taken)
- Run as `bash <recipe>/build`, with the current directory = the extracted source

## Package DB format (schema 2)

```
$ZPKG_DB/<name>/
├── version     # installed version (pkgver[-rN]. v1 compatible)
├── meta.json   # schema 2 metadata
└── manifest    # file list
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

- **v1 compatibility**: records without `meta.json` are read as v1, splitting `-rN` from the version file. Meta is written on the next install (no bulk migration needed)
- Writes are atomic via `tmp` + `rename`
- The `world` file (the explicitly installed set) lives at `$ZPKG_DB/world` (one package per line, sorted)

Manifest one-line format (space-separated):

```
file <sha256> <path>
dir  <path>
link <target> <path>
```

`<path>` is relative to the root (`$ZPKG_ROOT`). **Paths containing spaces, tabs, quotes or
backslashes are quoted as Go string literals**
(e.g. `file <sha> "usr/lib/firmware/...Intel Corp.-VALLEYVIEW C0 PLATFORM.txt"`).
The trigger was a real space-containing filename in linux-firmware (M22). Old-format
lines without quotes still read correctly (including spaces in the path), so existing
DBs stay compatible.

## Optional recipe metadata (schema 2)

| File | Meaning | Default |
|---|---|---|
| `revision` | Recipe revision number (`-rN`) | 0 |
| `slot` | Coexisting slot (for future multiple versions) | `0` |
| `provides` | Provided virtual names (one per line, `virtual/foo[-ver]`) | none |
| `conflicts` | Packages that must not be installed together (atoms allowed) | none |
| `makedepends` | Dependencies needed only at build time (one per line, atoms allowed) | none |
| `build_network` | Allow/deny build-time network (`1` / `0`) | global setting |
| `iuse` | USE flags the recipe understands (one per line) | none |
| `post_install` / `post_remove` | Hooks run right after install/remove (bash) | none |

`depends` are runtime dependencies. Both `depends` + `makedepends` are used for build order.

## Dependency resolution (v0.2.0+ backtracking)

`depends` / `makedepends` / `provides` / `conflicts` accept package atoms.

| Example | Meaning |
|---|---|
| `foo` | `foo` at any version |
| `>=foo-1.2` / `<foo-2.0` / `=foo-1.2-r3` | Version constraint (`>`, `<=`, `!=` also allowed) |
| `ssl?openssl` | `openssl` only when `ssl` is enabled |
| `!ssl?gnutls` | `gnutls` only when `ssl` is disabled |
| `foo[ssl]` / `foo[-ssl]` | The dependency must have `ssl` enabled / disabled |
| `foo[ssl?]` | Enabled only when the dependency knows about `ssl` |
| `ssl?foo[ssl,-zlib]` | Combination of condition and USE constraints |

- Version constraints are written with an operator. `foo-1.2` is treated as a package name
  (because some packages have `-` and digits in their names)
- `provides` is `virtual/mailer` or `virtual/mailer-1.2`. When the version is omitted,
  the providing package's version is used
- Resolution uses `internal/depspec` (atom parsing) and `internal/resolve` (deterministic backtracking):
  - Try the direct recipe and `provides` candidates in the order "installed → direct name → name order"
  - Exclude candidates that do not satisfy version / USE constraints and candidates that conflict
  - On a dead end, backtrack to another provider / candidate. The selection result is in topological order with dependencies first
  - Installing `virtual/foo` picks a provider and records the provider in world
- `conflicts` is checked against both selected and installed packages
- Reverse dependencies: `zpkg depends -r <pkg>` matches against `depends` / `builddepends` in the
  installed DB, including provides. `zpkg remove` stops when reverse dependencies exist, and `-f` forces it
- Limitations: one version per recipe name (multiple versions/slots are outside resolution).
  **No SAT solver is implemented**; candidate selection is isolated in `internal/resolve` so it can be replaced later
- Already installed packages are skipped from build/install (`-f` forces)
- **`-f` does not ignore the binpkg cache**: if a binpkg exists with the same channel,
  same recipe digest and same version+revision+effective USE, it is used. If the recipe
  content changes, the digest mismatches and the cache misses, so it is rebuilt from
  source. The revision is for distribution order and identification, so bumping it on
  content changes is the rule

## Build sandbox (M38)

The `build` script is not run with `bash` directly but inside a **bubblewrap** sandbox
(`internal/sandbox`).

- The whole root is made read-only with `--ro-bind / /`, and the only writable location is
  `$ZPKG_CACHE/build/<name>-<version>[-rN][-opts]`
- `/tmp` / `/run` / `/var/tmp` / `/var/lib` / `/var/log` / `/var/spool` /
  `/root` / `/home` / `/mnt` / `/media` / `/srv` are empty tmpfs
- `/etc/ssh` / `/etc/ssl/private` / `/etc/zpkg` / NetworkManager connection settings /
  wpa_supplicant are masked with tmpfs. `/etc/shadow` / `/etc/gshadow` /
  `/etc/sudoers` / `/etc/doas.conf` / `/etc/machine-id` are `/dev/null`
- `--unshare-pid` / `--unshare-ipc` / `--unshare-uts`, hostname is `zignos-build`
- Capabilities are limited to `CAP_CHOWN` / `CAP_FOWNER` / `CAP_DAC_OVERRIDE` / `CAP_FSETID` /
  `CAP_SYS_CHROOT`. Without `CAP_SYS_ADMIN`, the read-only root cannot be remounted
- Environment variables come from an allowlist (`PATH` / `HOME` / `TMPDIR` / `LANG` / `LC_ALL` /
  `GOCACHE` / `GOPATH` / `ZPKG_*` etc.). Only proxy variables are inherited
- Applied only when `ZPKG_ROOT=/` and on Linux. `SANDBOX=auto` (default) warns and builds
  directly if bwrap is missing/unusable, `require` fails, `off` disables
- `--no-sandbox` is a temporary escape hatch
- Network is allowed by default (`BUILD_NET=1`). `ZPKG_BUILD_NET=0` adds
  `--unshare-net`, and the recipe's `build_network` overrides the global setting
- A fingerprint of the build environment (sha256 and count of installed `name@slot-version`) is
  recorded in `meta.json` / the binpkg sidecar and shown by `zpkg info`
- `post_install` / `post_remove`, source extraction and resource limits are out of scope.
  What the sandbox sees is the whole installed system; a minimal dependency root is
  a later stage

bubblewrap's `pivot_root` requires the chroot target to be a mount point.
`zignos-enter.sh` bind-mounts the root inside a private mount namespace before
chrooting, so the sandbox works even with a stage3 directory chroot.
With a plain `chroot`, `auto` warns and falls back to a direct build.

## Reproducible builds (M39)

To aim for the same artifact from the same recipe, sources and build environment, inputs are
pinned and outputs recorded (`internal/provenance` / `internal/spdx`).

- **SOURCE_DATE_EPOCH** — default `946684800` (2000-01-01T00:00:00Z).
  Order: `ZPKG_SOURCE_DATE_EPOCH` → `SOURCE_DATE_EPOCH` → `/etc/zpkg/build.conf`.
  Also passes `KBUILD_BUILD_TIMESTAMP` / `KBUILD_BUILD_USER=zignos` /
  `KBUILD_BUILD_HOST=zignos-build` / `PYTHONHASHSEED=0` to the build environment
- **umask** — recipes run through the `umask 022; exec "$0" "$@"` wrapper
- **binpkg normalization** — the gzip header and the `ModTime` of every tar entry are
  set to SOURCE_DATE_EPOCH, and AccessTime/ChangeTime are zeroed. Owners, modes,
  content and order stay as built
- **work dir** — `build/<name>-<version>[-rN][-opts]`. `--clean` deletes the whole work
  dir, and `--repro-check` cleans automatically before the second build. By default the
  current work dir is deleted after a successful install, and old work dirs for the
  same package are deleted when a new build succeeds. `KEEP_WORKDIR=1` keeps the current work dir
- **build cache** — by default no binpkg is created, and the source archive used for the
  build is deleted after success. `BUILD_BINPKG=1` creates a binpkg and `KEEP_SOURCES=1`
  keeps the source archive. Old binpkgs are deleted when a new build succeeds
- **build log** — saved to `$ZPKG_CACHE/logs/<base>.log` by default. The header records
  package / recipe / recipe digest / epoch / sandbox / network / started /
  build script, and stdout/stderr are teed. `BUILD_LOG=0` disables
- **provenance.json** — package / recipe (digest, signing key/generation) /
  sources / build / toolchain / dependencies / build_dependencies /
  environment (all installed packages and hashes) / artifact (sha256, size,
  manifest_sha256) / log (sha256). Stored in the DB and the binpkg sidecar
- **SPDX 2.3 SBOM** — per-package and system. Artifact SHA-256, purl,
  `DEPENDS_ON` / `BUILD_DEPENDENCY_OF` / `BUILD_TOOL_OF`; for system, `CONTAINS`
  pointing at `SPDXRef-System-zignos`
- **Reproducibility check** — `zpkg build --repro-check` builds twice and compares the
  destroot manifest (Kind / Path / Hash / Link)
- **Limitations** — it is a manifest comparison and does not guarantee byte-identical
  tars, owners or mtimes. A fixed build root is not implemented. SBOM licenses are `NOASSERTION`

See [Reproducible builds](/en/docs/reproducibility/) for details.

## USE flags (v0.2.0)

- Configuration lives under the target root:
  - `$ZPKG_ROOT/etc/zpkg/use.conf` — global USE flags (whitespace/newline separated, `#` comments allowed)
  - `$ZPKG_ROOT/etc/zpkg/package.use` — per-package overrides (`<pkg> flag -flag ...`)
  - `$ZPKG_ROOT/etc/zpkg/make.conf` — `CFLAGS=...` / `MAKEOPTS=...`
- Effective flags = global + that package's `package.use` tokens (`-flag` disables). The hash and binpkg name are also computed from the **per-package effective values**
- The recipe's `iuse` file lists "the flags this recipe understands". If a recipe has `iuse` and a `flag?pkg` flag is not in iuse, it is an **error** (typo detection)
- The `ZPKG_USE` / `ZPKG_CFLAGS` / `ZPKG_MAKEOPTS` environment variables take precedence over the files. **Even an empty string overrides as "explicitly empty"** (`ZPKG_USE= zpkg build ...` disables flags)
- **Conditional dependencies**: writing `flag?pkg` in `depends` / `makedepends` adds pkg to the dependencies only when the flag is enabled
- Passes `ZPKG_USE` (space-separated), `ZPKG_CFLAGS` and `ZPKG_MAKEOPTS` to the build script. Recipes can branch freely in shell
- binpkg cache name: `<name>-<version>[-rN]-<8hex>` if at least one option is set. The hash is the first 8 hex digits of the sha256 of `USE` + `CFLAGS` + `MAKEOPTS`. If empty, the conventional name
- On install, enabled flags are recorded in `useflags` in `meta.json` and shown by `zpkg info`
- Not there yet: `IUSE` defaults (`+flag` notation), and warning instead of silently ignoring disabled flags
  (`upgrade --newuse` automatic rebuild on USE changes is implemented)

## slots (supported in M20)

- DB records are keyed by `<name>@<slot>`. **Slot "0" (the default) keeps the plain
  `<name>` directory as before**, so pre-slots records need no migration
- Installing the same name+slot is an upgrade (replacement). **File overlap with a
  different slot is a conflict error** (so files of another slot are not broken by
  mistake). Only packages designed so paths do not overlap between slots (such as
  v1/v2 soname separation) can coexist
- `remove` deletes **all slots** of that name. `upgrade` updates only the recipe's slot
  and leaves other slots alone
- `zpkg list` / `info` / `world` show non-zero slots as `name@slot` (slot 0 keeps the
  plain name)
- Use cases: coexisting sonames of the same library, keeping an older toolchain, and so on

## Removing obsolete files on upgrade (added in M22)

- On an upgrade of the same name+slot, **files in the old manifest that are not in the new manifest**
  are deleted when the install completes (e.g. when a runlevel link is removed from a recipe)
- Deletion is conservative: **only files whose content matches** the old manifest (sha256 for
  files, link target for symlinks). Configuration files edited by the administrator are kept
- Deleted paths move to the transaction backup, so a rollback on Apply failure restores
  them. Directories are not deleted (they may be shared with other packages)
- Implementation: `internal/install.pruneObsolete`. Reuses the existing Replaced list

## binpkg repository (signing support)

A repository is a directory (URL or local path) holding `index.json` + its signature + the binpkg
set. Hosting is out of scope; a static file server is enough.

```
binrepo/
├── index.json                                  # generated by zpkg mkindex (schema 2)
├── index.json.sig                              # Ed25519 signature over index.json
├── keys/<keyid>.pub                            # repository public key
└── packages/
    ├── doas-6.8.2.pkg.tar.gz                   # the binpkg itself
    ├── doas-6.8.2.manifest                     # file list sidecar
    └── doas-6.8.2.meta.json                    # name/version/revision/usehash/arch/deps
```

Packages can also be placed directly in the repository root as before (`packages/` is optional).

- **Generation**: `zpkg mkindex [--key <private>] [--generation N] [--expires ...] [dir]`
  (defaults to the local binpkg cache). PackBinpkg also writes the `.meta.json` sidecar,
  so an index can be built without a recipe tree. With `--key`, `index.json.sig` and
  `keys/<keyid>.pub` are written too
- **Consumption**: setting `ZPKG_BINREPO` (env) or `BINREPO=` in `/etc/zpkg/binrepo.conf`
  makes install try the repository after a local binpkg cache miss
- **Match conditions**: name, arch, version+revision and the **effective USE flag hash**,
  plus **the channel and recipe digest**. Only when no package matches does it fall
  back to a source build
- **Verification**: verifies the index signature, expiry, generation, and each entry's
  `sha256` and `manifest_sha256`. Tampering, expiry, rollback and sha256 mismatch are
  **hard errors** and do not silently fall back to a source build
- **Fetching**: index / signature are fetched every time (a cached old index is not used).
  package / manifest are reused if the cached sha256 matches, otherwise re-fetched and
  re-verified
- `ZPKG_NO_BINPKG=1` disables both the local binpkgs and the repository

## Signing and trust chain (M37)

### Keys and signatures

- Signatures are **Ed25519** (Go standard library). Private keys are PKCS#8 PEM, public keys are PKIX PEM
- key ID = SHA-256 of the 32-byte public key (64 hex)
- Trusted keys live in `$ZPKG_ROOT/etc/zpkg/trusted.d/*.pub`. They are added explicitly
  with `zpkg key import`; no TOFU. `TRUSTED_KEYS=` in `security.conf` / `ZPKG_TRUSTED_KEYS`
  can change the directory
- Private keys must be 0600 (Unix). `mkindex` / `sign-recipes` refuse a private key inside
  the repository or recipe tree (to prevent leaks into stage3)
- Detached signatures are `<file>.sig`:

```json
{
  "schema": 1,
  "algorithm": "ed25519",
  "keyid": "<64hex>",
  "signature": "<base64 64 bytes>"
}
```

### What gets signed

- **binrepo**: the actual bytes of `index.json`. The index (schema 2) carries `generation` /
  `expires` / `keyid` and binds each package's `sha256` and `manifest_sha256`.
  Binpkg bodies and manifests are signed indirectly through the index
- **Recipe tree**: `recipes.manifest`. Lists path / sha256 / size / mode of all regular files
  except `.git` and the signature itself, and signs the actual bytes of that manifest.
  The same verification works for directories, recipe tarballs and trees bundled in stage3
- **Recipe source tarballs**: each recipe's `checksums` (sha256) are included in the manifest,
  so the recipe tree signature chains through to source fetching
- **Installed packages**: recorded in `origin` / `origin_repo` /
  `origin_keyid` / `origin_generation` / `origin_index_sha256` /
  `origin_pkg_sha256` in `meta.json` and shown by `zpkg info`

### Rollback and expiry

- `generation` increases monotonically. `mkindex` / `sign-recipes` use existing file +1
  when omitted. Can be set explicitly with `--generation N`
- `expires` is RFC3339 or `90d` / `720h`. Default +90 days
- The client stores the last accepted generation / SHA-256 / keyid in
  `$ZPKG_DB/.security.json`
  - A new generation lower than the stored value → rejected as a rollback
  - The same generation with a different SHA-256 → rejected as substitution within the same generation
  - Expired → rejected
- `--allow-unsigned` / `ZPKG_ALLOW_UNSIGNED=1` allow only when the signature **does not exist**.
  If a signature exists and fails verification, it is always rejected
- `ZPKG_ALLOW_EXPIRED=1` lifts only the expiry. Signature and rollback verification remain

### Limits

- Private key compromise, root compromise and Secure Boot (GRUB/kernel signing) are separate issues
- Key revocation lists (CRL) are not supported. Operate with `zpkg key remove` and rotation to a new key
- Initial trust depends on out-of-band confirmation of the public key fingerprint
- GPG/OpenPGP is not supported. Will be added in the future by extending the signature envelope `algorithm`

## Release channels and upgrade (M40 / M51)

In zpkg 0.3.3 the recipe tree has three channels: `stable` / `testing` / `unstable`.
The selection is overridden in the order `CHANNEL=` in `/etc/zpkg/make.conf` (default stable),
the `ZPKG_CHANNEL` environment variable, `--channel`.

- The default repos are `$ZPKG_ROOT/usr/share/zignos/recipes/<channel>/{core,main,desktop}`.
  A flat tree is accepted as stable (compatibility with r11 and earlier)
- `zpkg channel` shows the effective value, where it came from and the available channels;
  `zpkg channel <ch>` updates `make.conf` atomically
- `zpkg upgrade` plans version comparison (upgrade / downgrade / rebuild /
  new dependency), differences in dependencies and makedepends, warnings (`upgrade_warning`, major
  version changes of key packages, new conflicts, slot changes, channel changes)
  and orphaned packages in `internal/upgrade`
- **New dependencies are installed first**. The plan's `KindInstall` entries are built and
  installed first, then Upgrade / Rebuild / Downgrade are all built and then installed.
  Builds that need new makedepends do not fail because the dependency is missing.
  Existing packages are replaced only after all builds succeed
- If building a new dependency fails, existing packages are not changed. If the upgrade
  build fails, the existing version is not replaced (newly added dependencies remain).
  An install failure rolls back per package and resumes on re-run;
  a crash is handled by `zpkg recover`
- After completion, re-resolve world / targets and verify the closure manifests.
  `--verify` also checks the sha256 of every file
- Limitations: no automatic rollback of the whole set. If the recipe digest changes, the
  same version+revision is rebuilt, but bump the revision on content changes for
  identification and distribution order

See [Release channels](/en/docs/channels/) for details.

## Commands (v0.3.3)

| Command | Description |
|---|---|
| `build [-f] [--no-sandbox] [--clean] [--repro-check] <pkg>...` | fetch → verify → destroot (does not install). `--clean` deletes the work dir; `--repro-check` builds twice and compares manifests |
| `install [-f] [-p] [--asdeps] [--no-sandbox] [--clean] [--repro-check] <pkg>...` | build/install. `-p` is pretend; `--asdeps` does not add to world. `--clean` / `--repro-check` build from source without using the cache |
| `upgrade [-p] [-y] [--newuse] [--prune] [--allow-downgrade] [--channel <ch>] [--verify] [pkg...]` | moves world (or the given pkgs) to the selected channel's versions. Shows the change list, dependency differences and warnings, installs new dependencies first, then installs upgrades after all builds succeed. `--newuse` rebuilds on USE changes; `--prune` removes orphaned dependencies; `--allow-downgrade` permits downgrades; `--verify` checks the sha256 of every file |
| `remove [-f] <pkg>...` | remove + drop from world. Stops if reverse dependencies exist (`-f` forces) |
| `info <pkg>...` | installed metadata and available recipes |
| `owner <path>...` | owning package of a path |
| `world` | explicitly installed list |
| `use [flag\|-flag]...` | show/edit global USE (`-flag` disables) |
| `use --package <pkg> [flag\|-flag]...` | show/edit per-package USE (`package.use`) |
| `channel [stable\|testing\|unstable]` | show the effective channel and available trees; update `CHANNEL=` in `make.conf` |
| `recover` | repair an interrupted transaction (install rolls back, remove completes) |
| `mkindex [--key <private>] [--generation N] [--expires ...] [dir]` | generate `index.json` for a binpkg repository. Signs with `--key` and also outputs `keys/<keyid>.pub` |
| `sync [--from <src>] [--dest <dir>] [--git] [--branch <name>] [-n] [--allow-unsigned]` | atomically replace the recipe tree from a stage3/recipe tarball, directory, URL or git repository. For git, compares the commit in `.zpkg-git` with the remote HEAD and shallow-clones only when it changed. Verifies `recipes.manifest` |
| `key generate --private <path> [--public <path>]` | generate an Ed25519 key pair (private key 0600) |
| `key import <pubkey>...` / `key list` / `key remove <keyid>` | manage keys in trusted.d |
| `sign --key <private> <file>...` / `verify <file>...` | create/verify detached signatures |
| `sign-recipes --key <private> [--generation N] [--expires ...] [dir]` | generate the recipe tree manifest and signature |
| `depends [-r] <pkg>...` | show dependency order. `-r` shows installed reverse dependencies |
| `provenance <pkg>...` | show the recorded build provenance (JSON) |
| `sbom <pkg>...` / `sbom --system [-o <file>]` | show/output an SPDX 2.3 SBOM |
| `log [-p] <pkg>...` | show the build log (`-p` path only) |
| `list` / `search <term>` | installed list / recipe search (provides are searched too) |

binpkg cache names are `<name>-<version>[-rN][-<opts8>].pkg.tar.gz`. A change in revision or effective options produces a different file.

### Output (phase display)

Before building, the packages to be processed and the effective USE flags are listed.
The count goes below them:

```
These are the packages that will be installed, in order:
  [1] fastfetch-2.71.0-r2     USE=""
  [2] cmake-4.5.0 (dependency)  USE=""

Total: 2 packages (1 target, 1 dependency)
```

Builds and installs are separated by phase lines prefixed with `>>>`. Build script output
flows through as is, so you can tell where one package starts and ends:

```
>>> Building fastfetch-2.71.0-r2
...compiler output...
>>> Built fastfetch-2.71.0-r2 (66 files) in 1m2s
>>> Installing (1 of 1) fastfetch-2.71.0-r2
>>> Installed fastfetch-2.71.0-r2
```

- With `BUILD_BINPKG=1`, `>>> Packed binpkg /var/cache/zpkg/binpkgs/fastfetch-2.71.0-r2.pkg.tar.gz`
  appears between Built and Installing. By default (`BUILD_BINPKG=0`) no binpkg is created
- The USE in the list is based on the recipe's `iuse`, showing enabled as `flag` and disabled as `-flag`
  (flags that are enabled but not in iuse are shown at the end too). Sorted alphabetically
- `(dependency)` marks packages pulled in automatically as dependencies. Packages given on the
  command line count as targets
- `(i of n)` is the number of packages actually processed in that run (skipped
  already-installed ones are not counted). Dependencies are processed first automatically
- When installing from the binpkg cache/repository, it becomes `>>> Installing (1 of 1) foo-1.0 (binpkg)`
  and no Building line appears
- Skips are `>>> Skipping foo-1.0 (already installed)`. pretend (`-p`) prints only the list and Total
  and exits
- `remove` also prints `>>> Removing (1 of 2) foo` / `>>> Removed foo`
- Color is green only when stdout is a terminal (disabled by `NO_COLOR` or `TERM=dumb`). No ANSI
  in logs or pipes

## Transactions (Step 5)

install / remove run as **journaled transactions**:

- In-progress state lives in `$ZPKG_DB/.txn/`:
  - `journal.json` — kind (install/remove), phase, paths to delete (remove). For install only the header
  - `journal.log` — an **append-only** log of the created/replaced paths of an install, one event per line (with fsync)
  - `backup/` — destination for files being replaced
- **Apply flow**: write events to the append log (`replaced` **before** moving to backup, `created`
  **before** placing) → move replaced files to backup → place new files with tmp+rename →
  phase=installed → `db.Save` (with fsync) → delete `.txn` (commit)
  - Why append-only: rewriting the path list into `journal.json` each time was O(files²), and
    installing cmake (4381 files) took 13 minutes. After the change it takes **49 seconds** (measured 2026-11-18).
    Journals in the old format (array in journal.json) can still be read
- **If Apply fails, roll back on the spot** (restore from backup, delete created files).
  On a failed upgrade **the old record is kept** (`hadrecord` flag, because the restored old files
  match the manifest)
- **If the process dies** (kill, power loss), `.txn` remains. It is repaired at the start of the
  next zpkg operation or by `zpkg recover`:
  - Interrupted install → **roll back** (restore)
  - Interrupted remove → **complete** (continue deleting; remove is not reversible)
- If the journal cannot be read (corrupt), move it to `.txn.corrupt` and continue
- `db.Save` uses tmp+rename + fsync for version/meta.json/manifest alike (both file and directory)

## Hooks

Placing `post_install` / `post_remove` (optional, bash) in the recipe directory runs them
right after install / right after remove. The environment passed:

```
ZPKG_NAME ZPKG_VERSION ZPKG_ROOT ZPKG_USE
```

How they run:

- `ZPKG_ROOT=/` — run directly on the host (which is the target)
- The target has `/usr/bin/bash` — `chroot <root> /usr/bin/env ... /usr/bin/bash -s` (script on stdin)
- Neither (an empty root for tests) — run with the host's bash and `ZPKG_ROOT` passed in

After install/remove, if `<root>/usr/sbin/ldconfig` exists, the **library cache is updated
automatically** (best effort).

## Package repository (zignos-recipes)

A dedicated git repository (zignos-recipes) serves as the package tree (the same idea as managing a package tree in a dedicated repository):

```
zignos-recipes/
├── stable/   {core,main,desktop}   # default. bundled in stage3/images
├── testing/  {core,main,desktop}   # validation for the next stable
├── unstable/ {core,main,desktop}   # in development
└── <channel>/<category>/<pkg>/{version, sources, checksums, depends, build}
```

zpkg uses the category directories specified in `ZPKG_REPOS`. Multiple repositories (overlays, e.g. personal forks) are naturally supported by specifying several in `ZPKG_REPOS` (first takes precedence).

On an installed system the **recipe tree is bundled at `/usr/share/zignos/recipes/<channel>/{core,main,desktop}`**, and when `ZPKG_REPOS` is unset it automatically searches the three categories matching `CHANNEL=` (default stable) in `/etc/zpkg/make.conf` (equivalent to a conventional package tree layout). The flat `recipes/{core,main,desktop}` from M39 and earlier is accepted as stable. `zpkg search` / `zpkg install <pkg>` therefore work as is on built images. Setting `ZPKG_REPOS` explicitly overrides this (source trees during development, overlays, etc.).

## bootstrap chain (M2)

Division of roles: **the fixed procedure for the transfer toolchain is executed by bootstrap.sh (zignos-build) faithfully following LFS 13.1, and the final system is assembled with zpkg recipes**.

- **stage0 (host → `$ZIGNOS_ROOT/tools`)**: LFS ch5 equivalent — cross binutils/gcc pass1, kernel headers, cross glibc, libstdc++, temp tools. Written directly into bootstrap.sh (a transient, fixed procedure with little value in recipe form)
- **stage1 (chroot preparation)**: move into the chroot and create the directory structure and essential files. Place the host-built static zpkg binary, the recipe tree and the official Go binary tarball for Go bootstrap (`GOROOT_BOOTSTRAP`) into the chroot
- **stage2 (inside the chroot, zpkg takes the lead)**: linux-headers → glibc → binutils → gcc → make/bash/coreutils/tar/gzip/e2fsprogs/util-linux/… → go (source-build the binary Go using it as bootstrap) → self-host zpkg. From then on, packages are built by the zpkg inside the chroot from recipes
- No stage recipes (pass1/pass2): cross builds stay within stage0, and zpkg's recipe format focuses on "packages of the final system" (v0 has no concept of stage/cross)

## Source fetching and verification

- fetch uses Go's `net/http` (https/http only, cache first)
- Checksums are sha256 (`crypto/sha256`). Verified by index correspondence between sources and checksums
- Extraction delegates to external `tar -xf` (leaving per-format differences such as gz/bz2/xz to tar). On a Windows development host, `--force-local` and slash-style paths are added (`GOOS=windows` only. Not needed for Linux targets)

## install / remove behavior

- **install**: generate the destroot manifest → **ownership conflict detection** against existing installed packages → copy files → record in the DB
- **remove**: verify the manifest matches the actual files (abort if modified. `ZPKG_FORCE=1` forces) → delete files → clean empty directories → remove from the DB
  - Directory cleanup targets **only those confirmed as real directories with Lstat**. The usr-merge `/lib`, `/bin` and `/sbin` are symlinks, so `os.Remove` would delete the links themselves and make every binary unbootable (this actually happened with `dir lib` in linux-firmware — fixed in M22)
