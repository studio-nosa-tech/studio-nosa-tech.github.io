---
title: パッケージの管理
description: zpkg によるパッケージの検索、導入、削除、情報表示、world と binpkg の扱い。
---

## 検索と情報

```sh
zpkg search networkmanager
zpkg info networkmanager
zpkg owner /usr/bin/nmcli
zpkg depends networkmanager
```

`zpkg depends` は依存をビルド順に表示します。`-r` で逆依存を確認できます。

## 導入

```sh
zpkg install vim
zpkg install --asdeps some-library
zpkg install -p vim            # 何が入るか確認
```

`--asdeps` は world に追加せず、依存として記録します。通常の `install` は
world に追加されます。

## 削除

```sh
zpkg remove vim
```

逆依存がある場合は停止します。強制する場合は `-f` を付けますが、依存関係を
壊す可能性があります。不要になった依存の削除は `zpkg upgrade --prune` で
確認できます。

## 一覧と world

```sh
zpkg list
zpkg world
```

`world` は明示的に入れたパッケージの一覧です。`zpkg upgrade` は world を
起点に更新計画を作ります。

## 更新

```sh
zpkg upgrade -p
zpkg upgrade
```

`zpkg install` は新規導入・再導入、`zpkg upgrade` はチャンネルの差分適用です。
更新の詳細は [チャンネルとアップグレード](/docs/system/channels/) を参照してください。

## binpkg

ビルドしたパッケージは `/var/cache/zpkg/binpkgs/` にキャッシュされます。
同じ版・同じ USE の binpkg があれば再利用されます。`ZPKG_NO_BINPKG=1` で
キャッシュを無効化できます。

## レシピ

レシピは `/usr/share/zignos/recipes/<channel>/{core,main,desktop}/` にあります。
`zpkg sync` で最新ツリーへ更新できます。レシピの書き方は
[zpkg 設計](/docs/design-pkg/) を参照してください。

## オーバーレイ (ZIGNOS MENU)

公式ツリーにないパッケージは、公式オーバーレイ **ZIGNOS MENU** から導入できます。

```sh
sudo zpkg overlay add zignos-menu
zpkg overlay list
zpkg search <term>
```

オーバーレイは公式ツリーより先に検索され、`zpkg search` では
`zignos-menu/apps` のように表示されます。更新・削除、独自オーバーレイの
追加、優先度と署名は
[ZIGNOS MENU (オーバーレイ)](/docs/system/overlays/) を参照してください。
