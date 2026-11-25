---
title: Workflow
description: The flow from adding or updating a recipe through building, testing, git sync and submitting a PR.
---

## Prerequisites

- A Linux x86_64 build environment (gcc / make / tar / xz / git)
- ZIGNOS stage3 or a built root, plus `zpkg`
- Network access (to fetch upstream sources and dependencies)
- Enough disk space (for sources, work and binpkgs)

Recipes come from a clone of `zignos-recipes` or from
`/usr/share/zignos/recipes` fetched with `zpkg sync`.

## 1. Choose a channel

New packages start in **unstable**.

```
zignos-recipes/unstable/{core,main,desktop}/<package>/
```

Once stable, promote to testing, and finally to stable. Do not add directly
to stable.

## 2. Create the recipe

The minimal set is these four files.

```sh
mkdir -p unstable/main/hello
cd unstable/main/hello

printf '1.0\n' > version
printf 'https://example.invalid/hello-1.0.tar.gz\n' > sources
sha256sum hello-1.0.tar.gz | awk '{print $1}' > checksums

cat > build <<'EOF'
#!/bin/sh
set -e
cd "$ZPKG_SRC/hello-$ZPKG_VERSION"
./configure --prefix=/usr
make -j"$(nproc)"
make DESTDIR="$ZPKG_DESTROOT" install
EOF
chmod +x build
```

If there are dependencies, create `depends` / `makedepends`.

```sh
printf 'zlib\n' > depends
printf 'pkgconf\n' > makedepends
```

## 3. Build and test

```sh
zpkg build hello
zpkg install -p hello
zpkg install hello
```

- `zpkg build` builds up to the destroot and does not install
- `zpkg install -p` shows what would be installed, including dependencies
- Run tests inside `build` with `make check` / `ctest` / `meson test` and so
  on
- If possible, also check reproducibility with
  `zpkg build --repro-check hello`

## 4. Update an existing recipe

1. Change `version` to the new release
2. Update the URL in `sources`
3. Update `checksums` to the SHA-256 of the new tarball
4. Adjust configure options or patches in `build` if needed
5. Raise `revision` (when the contents change)
6. Check with `zpkg build` / `zpkg install`

Do not change contents while keeping the same version+revision. binpkgs are
matched by channel and recipe digest, but revision is also used for
distribution order and identification.

## 5. git and sync

```sh
git switch -c hello-1.0
git add unstable/main/hello
git commit -m "hello: add 1.0"
git push origin hello-1.0
```

On an installed system, `zpkg sync` compares the git HEAD and fetches the tree
only when it changed.

```sh
zpkg sync
zpkg sync --git --branch main
```

## 6. Submit a PR

Include the following in the Pull Request.

- The channel and category you changed
- The build log (`/var/cache/zpkg/logs/<pkg>-<version>.log`)
- The output of `zpkg install -p`
- How you checked with QEMU / hardware, if you did
- Differences from the existing recipe (patches, configure options,
  dependencies)

## 7. After merge

- Verify in testing, then promote to stable
- To build stage3 / images, reflect the recipe tree in
  `/mnt/sources/zignos-recipes` first, then run `make-stage3.sh`
- Release notes and `release.json` are generated at build time

## Checking for updates

New upstream versions are not monitored automatically. Check them as follows.

- The upstream release page / announcements
- Matching the `sources` URLs against `checksums`
- `zpkg search <pkg>` and `zpkg info <pkg>`
- A regular `zpkg sync` and `zpkg upgrade -p`

For the meaning of each recipe file, see
[Recipes](/en/docs/packaging/recipes/); for build examples, see
[Build patterns](/en/docs/packaging/patterns/).
