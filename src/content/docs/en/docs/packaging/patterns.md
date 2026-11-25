---
title: Build patterns
description: Recipe examples for autotools, CMake, Meson, Cargo, Go, Python, Perl and Qt/KDE.
---

A recipe's `build` is an arbitrary shell script; here are the common patterns.
All of them install into `ZPKG_DESTROOT` and stop on failure with `set -e`.

## autotools

```sh
#!/bin/sh
set -e
cd "$ZPKG_SRC/foo-$ZPKG_VERSION"
./configure --prefix=/usr
make -j"$(nproc)"
make DESTDIR="$ZPKG_DESTROOT" install
```

## CMake

```sh
#!/bin/sh
set -e
cd "$ZPKG_SRC/foo-$ZPKG_VERSION"
cmake -S . -B build \
  -DCMAKE_INSTALL_PREFIX=/usr \
  -DCMAKE_INSTALL_LIBDIR=lib \
  -DBUILD_TESTING=OFF
cmake --build build -j"$(nproc)"
DESTDIR="$ZPKG_DESTROOT" cmake --install build
```

Some projects install into `/usr/lib64` unless `CMAKE_INSTALL_LIBDIR=lib` is
set explicitly. ZIGNOS standardizes on `/usr/lib`.

## Meson

```sh
#!/bin/sh
set -e
cd "$ZPKG_SRC/foo-$ZPKG_VERSION"
meson setup build --prefix=/usr --libdir=lib
ninja -C build
DESTDIR="$ZPKG_DESTROOT" meson install -C build
```

## Cargo

```sh
#!/bin/sh
set -e
cd "$ZPKG_SRC/foo-$ZPKG_VERSION"
cargo build --release --locked
install -Dm755 target/release/foo "$ZPKG_DESTROOT/usr/bin/foo"
```

## Go

```sh
#!/bin/sh
set -e
cd "$ZPKG_SRC/foo-$ZPKG_VERSION"
GOTOOLCHAIN=local go build -trimpath -buildvcs=false \
  -o "$ZPKG_DESTROOT/usr/bin/foo" ./cmd/foo
```

## Python

Follow the instructions in `pyproject.toml` / `setup.py`. When using pip, make
sure pip is present in the build environment via `makedepends`.

```sh
#!/bin/sh
set -e
cd "$ZPKG_SRC/foo-$ZPKG_VERSION"
python3 -m pip install --root="$ZPKG_DESTROOT" --prefix=/usr --no-deps .
```

## Perl

```sh
#!/bin/sh
set -e
cd "$ZPKG_SRC/foo-$ZPKG_VERSION"
perl Makefile.PL INSTALL_BASE=/usr
make
make DESTDIR="$ZPKG_DESTROOT" install
```

## Qt / KDE

```sh
#!/bin/sh
set -e
cd "$ZPKG_SRC/foo-$ZPKG_VERSION"
cmake -S . -B build \
  -DCMAKE_INSTALL_PREFIX=/usr \
  -DCMAKE_INSTALL_LIBDIR=lib \
  -DBUILD_TESTING=OFF
cmake --build build -j"$(nproc)"
DESTDIR="$ZPKG_DESTROOT" cmake --install build
```

KDE applications put `ECM` and Qt 6 in `makedepends`. Some projects run
`add_subdirectory(tests)` unconditionally even when tests are disabled, so
patch the recipe if needed.

## Tests

To run tests at build time:

```sh
make check
ctest --test-dir build --output-on-failure
meson test -C build
```

If a test needs the installed environment, record it as a QEMU / hardware
verification step rather than in `post_install`.

## Patches

```sh
patch -p1 -d "$ZPKG_SRC/foo-$ZPKG_VERSION" \
  < "$ZPKG_RECIPE_DIR/fix-build.patch"
```

For the recipe file layout, see [Recipes](/en/docs/packaging/recipes/); for
the workflow, see [Packaging workflow](/en/docs/packaging/workflow/).
