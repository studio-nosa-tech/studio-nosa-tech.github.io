---
title: パッケージングワークフロー
description: レシピの追加・更新、ビルド、テスト、git 同期、PR 提出までの流れ。
---

## 前提

- Linux x86_64 のビルド環境(gcc / make / tar / xz / git)
- ZIGNOS の stage3 またはビルド済み root と `zpkg`
- ネットワーク(上流ソースと依存の取得)
- 十分なディスク(ソース、work、binpkg 用)

レシピは `zignos-recipes` のクローン、または `zpkg sync` で取得した
`/usr/share/zignos/recipes` を使います。

## 1. チャンネルを選ぶ

新しいパッケージは **unstable** から始めます。

```
zignos-recipes/unstable/{core,main,desktop}/<package>/
```

安定したら testing、最後に stable へ昇格します。stable へ直接追加しないでください。

## 2. レシピを作る

最小構成は次の4ファイルです。

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

依存があれば `depends` / `makedepends` を作ります。

```sh
printf 'zlib\n' > depends
printf 'pkgconf\n' > makedepends
```

## 3. ビルドとテスト

```sh
zpkg build hello
zpkg install -p hello
zpkg install hello
```

- `zpkg build` は destroot まで作り、インストールしません
- `zpkg install -p` で依存を含む導入内容を確認できます
- テストは `build` の中で `make check` / `ctest` / `meson test` などを実行します
- 可能なら `zpkg build --repro-check hello` で再現性も確認します

## 4. 既存レシピを更新する

1. `version` を新しい版へ変更
2. `sources` の URL を更新
3. `checksums` を新しい tarball の SHA-256 へ更新
4. 必要なら `build` の configure オプションやパッチを修正
5. `revision` を上げる(内容を変えた場合)
6. `zpkg build` / `zpkg install` で確認

同じ version+revision のまま内容を変えないでください。binpkg はチャンネルと
レシピ digest で照合されますが、revision は配布順序と識別のためにも使います。

## 5. git と同期

```sh
git switch -c hello-1.0
git add unstable/main/hello
git commit -m "hello: add 1.0"
git push origin hello-1.0
```

インストール済みシステムでは `zpkg sync` が git の HEAD を比較し、変更時だけ
ツリーを取得します。

```sh
zpkg sync
zpkg sync --git --branch main
```

## 6. PR を出す

Pull Request には次を添えてください。

- 変更したチャンネルとカテゴリ
- ビルドログ(`/var/cache/zpkg/logs/<pkg>-<version>.log`)
- `zpkg install -p` の結果
- QEMU / 実機で確認した場合はその方法
- 既存レシピからの差分(パッチ、configure オプション、依存)

## 7. マージ後

- testing で検証してから stable へ昇格
- ステージ3 / イメージを作る場合は、レシピツリーを
  `/mnt/sources/zignos-recipes` に反映してから `make-stage3.sh`
- リリースノートと `release.json` はビルド時に生成

## 更新の確認

上流の新版本は自動監視していません。次の方法で確認します。

- 上流のリリースページ / アナウンス
- `sources` の URL と `checksums` の照合
- `zpkg search <pkg>` と `zpkg info <pkg>`
- 定期的な `zpkg sync` と `zpkg upgrade -p`

レシピの各ファイルの意味は [レシピ](/docs/packaging/recipes/)、
ビルド方法の例は [ビルドパターン](/docs/packaging/patterns/) を参照してください。
