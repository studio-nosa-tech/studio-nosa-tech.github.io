---
title: zpkg configuration
description: Configuration files for the ZIGNOS package manager zpkg (USE, make.conf, binpkg repositories, recipe sync, signing, build cache) and a list of the environment variables.
---

`zpkg` configuration lives in `/etc/zpkg/` under the **target root**.
When working with `ZPKG_ROOT=/mnt/zignos`, it is `/mnt/zignos/etc/zpkg/`.
Every file is optional; when a file is absent, the defaults are used.

```text
/etc/zpkg/
├── use.conf       # global USE flags
├── package.use    # per-package USE flags
├── make.conf      # CHANNEL / CFLAGS / MAKEOPTS
├── binrepo.conf   # binpkg repository
├── sync.conf      # default source for zpkg sync
├── security.conf  # signature verification policy
├── sandbox.conf   # build sandbox
├── build.conf     # reproducibility / logs / SBOM / cache retention
└── trusted.d/     # trusted public keys (*.pub)
```

## Configuration files

| File | Purpose | Format |
|---|---|---|
| `use.conf` | USE flags for all packages | Space-separated flags. `#` starts a comment through end of line |
| `package.use` | Per-package USE overrides | One line `<package> flag -flag ...` |
| `make.conf` | Channel and build flags | `CHANNEL=stable|testing|unstable` / `CFLAGS=...` / `MAKEOPTS=...` |
| `binrepo.conf` | binpkg repository | `BINREPO=<URL or path>` |
| `sync.conf` | Default source for recipe sync | `RECIPEURL=` / `RECIPEGIT=` / `RECIPEBRANCH=` / `RECIPEALLOWUNSIGNED=` |
| `overlays.d/` | Extra recipe repositories | `<name>.conf` with `URL=` / `BRANCH=` / `PRIORITY=` / `ALLOW_UNSIGNED=` / `ENABLED=` |
| `security.conf` | Signature verification policy | `TRUSTED_KEYS=...` / `ALLOW_UNSIGNED=0|1` / `ALLOW_EXPIRED=0|1` |
| `sandbox.conf` | Build sandbox | `SANDBOX=auto|require|off` / `BUILD_NET=0|1` / `BWRAP=...` |
| `build.conf` | Reproducibility, records, build cache | `SOURCE_DATE_EPOCH=<unix>` / `BUILD_LOG=0|1` / `SBOM=0|1` / `KEEP_WORKDIR=0|1` / `BUILD_BINPKG=0|1` / `KEEP_SOURCES=0|1` |
| `trusted.d/` | Trusted public keys | `<keyid>.pub` (PKIX PEM) |

## USE flags

### Global (`use.conf`)

```sh
# /etc/zpkg/use.conf
ssl
zlib
```

They can also be edited with `zpkg use`.

```sh
zpkg use                 # show the current global USE
zpkg use ssl zlib        # enable
zpkg use -ssl            # disable
```

### Per package (`package.use`)

```sh
# /etc/zpkg/package.use
grub uefi -bios
```

This enables `uefi` and disables `bios` for `grub`. To edit from the CLI:

```sh
zpkg use --package grub uefi
zpkg use --package grub -bios
zpkg use --package grub          # show effective values and tokens
```

USE flags are also used for conditional dependencies (`flag?package`). If a
conditional dependency uses a flag that is not in the recipe's `iuse`, `zpkg`
raises an error.

### Precedence

1. Global flags in `use.conf`
2. Per-package tokens in `package.use` (later entries win)
3. The `ZPKG_USE` environment variable — **replaces the global configuration entirely** (it is not additive)

`package.use` is unaffected by `ZPKG_USE` and is always applied on top of the
global values.

Changing USE flags does not rebuild installed packages automatically.

```sh
zpkg install -f <pkg>       # force a rebuild of that package
zpkg upgrade --newuse       # rebuild packages whose effective USE changed
```

## Build flags (`make.conf`)

```sh
# /etc/zpkg/make.conf
CHANNEL=stable
CFLAGS="-O2 -pipe"
MAKEOPTS="-j8"
```

- `KEY=value` format. Surrounding quotes around the value are stripped.
- Shell command substitution is not performed. Write the actual number (such
  as `-j8`), not `MAKEOPTS="-j$(nproc)"`.
- The `ZPKG_CFLAGS` / `ZPKG_MAKEOPTS` environment variables take precedence
  over the file. Setting them explicitly to an empty string clears that
  setting.

The values are passed to the build script as `ZPKG_CFLAGS` / `ZPKG_MAKEOPTS`.
Whether they reach the compiler depends on each recipe's `build`.

## Release channel (`make.conf`)

```sh
# /etc/zpkg/make.conf
CHANNEL=stable     # stable (default) / testing / unstable
```

- The `ZPKG_CHANNEL` environment variable overrides it for a single run
- `zpkg upgrade --channel <ch>` also overrides it once
- To switch permanently, use `zpkg channel <ch>` (other lines are preserved)
- After switching, check the differences with `zpkg upgrade -p` before running
  `zpkg upgrade`. upgrade shows the list of changes, dependency differences
  and warnings, installs after all builds succeed, and runs a consistency
  check when done
- `--prune` removes dependencies that are no longer needed,
  `--allow-downgrade` permits downgrades, and `--verify` checks the sha256 of
  every file

The recipe tree is at `$ZPKG_ROOT/usr/share/zignos/recipes/<channel>/`.
stage3 ships only stable, so to use testing / unstable, import the recipe
tarball containing all channels with `zpkg sync` first, then switch. See
[Release channels](/en/docs/channels/) for details.

## binpkg repository (`binrepo.conf`)

```sh
# /etc/zpkg/binrepo.conf
BINREPO=https://example.com/zignos/binpkgs
```

`zpkg install` looks in this repository when a package is not in the local
binpkg cache. The repository needs a signed `index.json`.

```sh
zpkg mkindex --key ~/zignos-signing.key /path/to/binpkgs
```

With `--key`, `index.json.sig` and `keys/<keyid>.pub` are also generated. On
the client side, trust the public key.

```sh
zpkg key import /path/to/binrepo/keys/<keyid>.pub
```

A match requires **name, architecture, version+revision, the hash of the
effective USE/build flags, channel and recipe digest**. The `ZPKG_BINREPO`
environment variable takes precedence over this file.
If verification of the signature, expiry, generation or sha256 fails, it is an
error and there is no fallback to a source build.

To skip binpkgs temporarily:

```sh
ZPKG_NO_BINPKG=1 zpkg install <pkg>
```

## Recipe sync (`sync.conf`)

```sh
# /etc/zpkg/sync.conf
RECIPEURL=https://github.com/studio-nosa-tech/zignos-recipes
RECIPEGIT=1
RECIPEBRANCH=main
RECIPEALLOWUNSIGNED=1
```

This is the default source for `zpkg sync`. If `--from` is given, it takes
precedence. In git mode, the commit is recorded in `.zpkg-git` in the replaced
tree and compared against the remote HEAD from `git ls-remote`. If they match,
nothing is fetched; on change, it shallow clones, verifies, then replaces.

```sh
zpkg sync                    # use sync.conf / ZPKG_RECIPE_URL
zpkg sync --git --from https://github.com/studio-nosa-tech/zignos-recipes
zpkg sync --from ./zignos-recipes          # tar.xz or a directory also works
zpkg sync --from zignos-stage3.tar.xz
zpkg sync --from ./zignos-recipes -n       # verify only
```

The `ZPKG_RECIPE_URL` / `ZPKG_RECIPE_GIT` / `ZPKG_RECIPE_BRANCH` environment
variables take precedence over `sync.conf`. The default repository is public
and can be fetched without authentication. A private repository needs a git
credential helper or an SSH key. `sync` only replaces the recipe tree; it does
not update installed packages. Run `zpkg upgrade` afterwards if needed.

`sync` verifies the tree's `recipes.manifest` with a trusted key. Unsigned
trees are rejected by default. `--allow-unsigned` (or
`ZPKG_ALLOW_UNSIGNED=1`) is only for unsigned development trees. If a
signature exists but is broken, it is rejected even with `--allow-unsigned`.

## Overlays (`overlays.d/`)

`zpkg overlay add` writes `/etc/zpkg/overlays.d/<name>.conf`. You can also edit
it by hand and apply it with `zpkg overlay sync <name>`.

```sh
# /etc/zpkg/overlays.d/zignos-menu.conf
URL=https://github.com/studio-nosa-tech/zignos-menu.git
BRANCH=main
PRIORITY=10
ALLOW_UNSIGNED=1
ENABLED=1
```

| Key | Meaning |
|---|---|
| `URL` | git URL, tarball URL or directory |
| `BRANCH` | git branch (default `main`) |
| `PRIORITY` | larger wins (default 10) |
| `ALLOW_UNSIGNED` | accept an unsigned tree for this overlay |
| `ENABLED` | `0` disables it (configuration and tree stay) |

The tree is synced to `$ZPKG_ROOT/var/lib/zpkg/overlays/<name>`. The tree's own
`overlay.conf` supplies `CATEGORIES=` / `CHANNELS=`. See
[ZIGNOS MENU (overlays)](/en/docs/system/overlays/) for usage.

## Signing and trusted keys (`security.conf`)

```sh
# /etc/zpkg/security.conf
TRUSTED_KEYS=/etc/zpkg/trusted.d
ALLOW_UNSIGNED=0
ALLOW_EXPIRED=0
```

- `TRUSTED_KEYS` is the directory holding `*.pub` files. Add keys with
  `zpkg key import <pubkey>` and list them with `zpkg key list`
- `ALLOW_UNSIGNED=1` only permits repositories/recipe trees **with no
  signature**. It is not a loophole for accepting a broken signature
- `ALLOW_EXPIRED=1` only permits expired signatures. Signature and rollback
  verification remain in place
- The last accepted generation and SHA-256 are stored in
  `$ZPKG_DB/.security.json`, which rejects swapping in an older signed index /
  manifest
- The `ZPKG_TRUSTED_KEYS` / `ZPKG_ALLOW_UNSIGNED` / `ZPKG_ALLOW_EXPIRED`
  environment variables take precedence over this file

For key generation, repository signing and recipe tree signing, see
[Package signing and verification](/en/docs/signing/).

## Build sandbox (`sandbox.conf`)

```sh
# /etc/zpkg/sandbox.conf
SANDBOX=auto
BUILD_NET=1
#BWRAP=/usr/bin/bwrap
```

- `SANDBOX=auto` (the default) isolates the build when bubblewrap is available
  and warns and builds directly if it is missing or unusable. `require` fails,
  `off` disables the sandbox
- `BUILD_NET=1` allows network access during the build. `0` isolates it in a
  network namespace
- A recipe's `build_network` (`1` / `0`) overrides the global setting
- The `ZPKG_SANDBOX` / `ZPKG_BUILD_NET` / `ZPKG_BWRAP` environment variables
  take precedence
- Use `zpkg build --no-sandbox` / `zpkg install --no-sandbox` to disable it
  temporarily

For the contents of the sandbox and notes on chroot, see
[Build environment isolation](/en/docs/build-sandbox/).

## Reproducibility (`build.conf`)

```sh
# /etc/zpkg/build.conf
SOURCE_DATE_EPOCH=946684800
BUILD_LOG=1
SBOM=1
```

- `SOURCE_DATE_EPOCH` is the fixed build time. The default is `946684800`
  (2000-01-01T00:00:00Z). Precedence is `ZPKG_SOURCE_DATE_EPOCH`, then the
  `SOURCE_DATE_EPOCH` environment variable, then this file
- `BUILD_LOG=1` (the default) saves build logs to `$ZPKG_CACHE/logs/`
- `SBOM=1` (the default) generates an SPDX 2.3 SBOM
- The `ZPKG_BUILD_LOG` / `ZPKG_SBOM` environment variables take precedence
  over this file

Changing the value changes the tar/gzip mtime in binpkgs, and therefore the
artifact SHA-256. See [Reproducible builds](/en/docs/reproducibility/) for
details.

## Build cache (`build.conf`)

By default, working data from successful builds is not kept, to limit disk
usage.

```sh
# /etc/zpkg/build.conf
KEEP_WORKDIR=0   # remove the work directory after a successful install
BUILD_BINPKG=0   # do not create local binpkgs
KEEP_SOURCES=0   # remove source archives used for the build
```

| Key | Default | When `1` |
|---|---|---|
| `KEEP_WORKDIR` | `0` | Keep `$ZPKG_CACHE/build/<base>/` |
| `BUILD_BINPKG` | `0` | Create a binpkg in `$ZPKG_CACHE/binpkgs/` on success |
| `KEEP_SOURCES` | `0` | Keep downloaded source archives |

- When a new build succeeds, the old work directory and old binpkg for the
  same package are removed. Old data does not accumulate as versions rise
- A created binpkg is reused by the next `zpkg install` when the recipe digest
  and channel match
- Source archives: only the archives used by that build are removed. Bundled
  files such as patches remain
- `zpkg build` returns the destroot as its result, so it keeps the work
  directory while running. Removal happens after a successful
  `zpkg install`
- `--repro-check` creates a binpkg for comparison. With `BUILD_BINPKG=0` it is
  removed after the comparison
- The `ZPKG_KEEP_WORKDIR` / `ZPKG_BUILD_BINPKG` / `ZPKG_KEEP_SOURCES`
  environment variables take precedence over `build.conf`
- Work directories created by 0.3.2 and earlier do not record the package
  name, so they are not removed automatically. Remove
  `/var/cache/zpkg/build` manually

The cache locations and contents are:

```text
/var/cache/zpkg/
├── build/      # work directories (removed after success by default)
├── binpkgs/    # local binpkgs and sidecars (not created by default)
├── logs/       # build logs
└── *.tar.*     # source archives (removed after success by default)
```

If the cache can be discarded entirely, deleting `/var/cache/zpkg` does not
affect installed packages. It is fetched and regenerated on the next build.

## Paths and environment variables

| Variable | Default | Description |
|---|---|---|
| `ZPKG_ROOT` | `/` | Target root. `/etc/zpkg/` is also under it |
| `ZPKG_REPOS` | Bundled tree | Recipe repositories. Separate multiple with the path separator (Unix `:` / Windows `;`). Earlier entries win |
| `ZPKG_CACHE` | `$ZPKG_ROOT/var/cache/zpkg` | Source cache, build work area, binpkgs |
| `ZPKG_DB` | `$ZPKG_ROOT/var/lib/zpkg` | Installed package DB |
| `ZPKG_FORCE` | None | `1` allows removing modified packages |
| `ZPKG_NO_BINPKG` | None | `1` ignores local and repository binpkgs |
| `ZPKG_BINREPO` | None | binpkg repository (takes precedence over `binrepo.conf`) |
| `ZPKG_RECIPE_URL` | None | Default source for `zpkg sync` (takes precedence over `sync.conf`) |
| `ZPKG_RECIPE_GIT` | `0` | `1` fetches it as a git repository |
| `ZPKG_RECIPE_BRANCH` | `main` | git branch |
| `ZPKG_TRUSTED_KEYS` | `$ZPKG_ROOT/etc/zpkg/trusted.d` | Directory of trusted `*.pub` files |
| `ZPKG_ALLOW_UNSIGNED` | None | `1` permits unsigned index/recipe trees (for development) |
| `ZPKG_ALLOW_EXPIRED` | None | `1` permits only expired signatures (for recovery) |
| `ZPKG_CHANNEL` | `stable` | `stable` / `testing` / `unstable` (takes precedence over `make.conf`) |
| `ZPKG_SANDBOX` | `auto` | `auto` / `require` / `off` |
| `ZPKG_BUILD_NET` | `1` | `0` isolates the build from the network |
| `ZPKG_BWRAP` | `bwrap` | bubblewrap executable |
| `ZPKG_SOURCE_DATE_EPOCH` | `946684800` | Fixed build time (the standard `SOURCE_DATE_EPOCH` also works) |
| `ZPKG_BUILD_LOG` | `1` | `0` disables build log saving |
| `ZPKG_SBOM` | `1` | `0` disables SPDX SBOM generation |
| `ZPKG_KEEP_WORKDIR` | `0` | `1` keeps the work directory after a successful install |
| `ZPKG_BUILD_BINPKG` | `0` | `1` creates a local binpkg after a source build |
| `ZPKG_KEEP_SOURCES` | `0` | `1` keeps downloaded source archives |
| `ZPKG_USE` | None | Overrides the global USE entirely |
| `ZPKG_CFLAGS` | None | Overrides `CFLAGS` (an empty string is valid) |
| `ZPKG_MAKEOPTS` | None | Overrides `MAKEOPTS` (an empty string is valid) |

If `ZPKG_REPOS` is omitted, `core` / `main` / `desktop` under
`$ZPKG_ROOT/usr/share/zignos/recipes` are used. When the same package exists
in multiple repositories, the repository listed first wins.

## Example configuration

An example that configures GRUB for UEFI and the build flags on a minimal base:

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

After changing the configuration, rebuild as needed.

```sh
zpkg use --package grub uefi
zpkg install -f grub
```
