---
title: ビルドパターン
description: autotools、CMake、Meson、Cargo、Go、Python、Perl、Qt/KDE のレシピ例。
---

レシピの `build` は自由なシェルスクリプトですが、よく使うパターンをまとめます。
すべて `ZPKG_DESTROOT` に install し、`set -e` で失敗を止めます。

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

`CMAKE_INSTALL_LIBDIR=lib` を明示しないと `/usr/lib64` に入るプロジェクトが
あります。ZIGNOS は `/usr/lib` に統一しています。

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

`pyproject.toml` / `setup.py` の指示に従います。pip を使う場合は、ビルド環境に
pip があることを `makedepends` で保証してください。

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

KDE のアプリは `ECM` と Qt 6 を `makedepends` に入れます。テストを無効化しても
`add_subdirectory(tests)` が無条件に実行されるプロジェクトがあるため、必要なら
レシピ側でパッチを当てます。

## テスト

ビルド時にテストを実行する場合:

```sh
make check
ctest --test-dir build --output-on-failure
meson test -C build
```

テストがインストール後の環境を必要とする場合は、`post_install` ではなく
QEMU / 実機での確認手順として記録してください。

## パッチ

```sh
patch -p1 -d "$ZPKG_SRC/foo-$ZPKG_VERSION" \
  < "$ZPKG_RECIPE_DIR/fix-build.patch"
```

レシピのファイル構成は [レシピ](/docs/packaging/recipes/)、
ワークフローは [パッケージングワークフロー](/docs/packaging/workflow/) を
参照してください。
