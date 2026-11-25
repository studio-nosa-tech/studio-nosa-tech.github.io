---
title: Recipes
description: The current specification for zpkg recipes, covering file layout, metadata, dependencies, build contract, hooks and patches.
---

A recipe is a directory at
`zignos-recipes/<channel>/{core,main,desktop}/<package>/`. The package name is
the directory name; the channel and category come from the path.

## Files

| File | Required | Contents |
|---|---|---|
| `version` | Required | Upstream version |
| `sources` | Required | Source URLs (one URL per line) |
| `checksums` | Required | SHA-256 values in the same order as `sources` |
| `build` | Required | Shell script that builds and installs into the destroot |
| `revision` | Optional | Revision number within the same version (default 0) |
| `slot` | Optional | Slot (default 0) |
| `depends` | Optional | Runtime dependencies |
| `makedepends` | Optional | Build-time dependencies |
| `iuse` | Optional | USE flags the package understands |
| `provides` | Optional | Virtual packages |
| `conflicts` | Optional | Conflicts |
| `build_network` | Optional | Network access during the build (default from the sandbox settings) |
| `upgrade_warning` | Optional | Warning shown during `zpkg upgrade` |
| `post_install` | Optional | Hook after install |
| `post_remove` | Optional | Hook after removal |
| `*.patch` | Optional | Patches applied from the build script |

`license` / `maintainer` / `homepage` / `test` / `patches/` + `series` are not
standardized yet. They are candidates for a future recipe specification
extension.

## Sources and checksums

```sh
# sources
https://example.invalid/foo-1.2.3.tar.xz

# checksums
<64-character SHA-256>
```

With multiple sources, list the `sources` and `checksums` lines in the same
order. `zpkg` checks the fetched files against `checksums` before building.

## Build contract

`zpkg` runs `build` with **bash**. By convention the shebang is `#!/bin/sh`,
but it is safest to write within POSIX and avoid bash-specific features. The
following environment variables are available.

| Variable | Contents |
|---|---|
| `ZPKG_SRC` | Parent directory of the unpacked sources |
| `ZPKG_VERSION` | The value of `version` |
| `ZPKG_RECIPE_DIR` | The recipe directory |
| `ZPKG_DESTROOT` | Temporary root for the install |
| `ZPKG_ROOT` | The actual installation root |
| `ZPKG_USE` | Effective USE flags |

Typical example:

```sh
#!/bin/sh
set -e
cd "$ZPKG_SRC/foo-$ZPKG_VERSION"
./configure --prefix=/usr
make -j"$(nproc)"
make DESTDIR="$ZPKG_DESTROOT" install
```

Running `make check` / `ctest` / `meson test` and so on inside `build` runs
tests at build time.

## Dependencies

`depends` lists packages needed at runtime; `makedepends` lists packages
needed only at build time. Atoms can include version constraints and
`provides`. See [zpkg design](/en/docs/design-pkg/) for dependency resolution
details.

## USE flags

List the flags the package understands in `iuse`. The actual values are
decided by `/etc/zpkg/use.conf` and `package.use`, and passed to build as
`ZPKG_USE`.

## Hooks

`post_install` / `post_remove` run after the package is installed or removed.
They are used for creating service users, setting directory ownership,
refreshing caches and similar tasks.

```sh
#!/bin/sh
install -d -m755 -o foo -g foo "$ZPKG_ROOT/var/lib/foo"
```

Do not replace `/etc/passwd` / `/etc/group` wholesale from a package.
initscripts owns the base accounts and merges only the missing entries from
`/usr/share/zignos/base-accounts/`. See
[System accounts](/en/docs/packaging/accounts/) for details.

## Patches

Current recipes place patch files in the recipe directory and apply them
explicitly inside `build`.

```sh
patch -p1 -d "$ZPKG_SRC/foo-$ZPKG_VERSION" \
  < "$ZPKG_RECIPE_DIR/fix-build.patch"
```

There is no `patches/` directory or automatic application via `series` yet.
How to manage patches is under consideration together with standardizing the
recipe specification.
