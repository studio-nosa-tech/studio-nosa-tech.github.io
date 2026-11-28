---
title: ZIGNOS MENU (オーバーレイ)
description: ZIGNOS MENU と zpkg overlay による追加レシピリポジトリの登録・更新・削除、優先度、チャンネル、署名。
---

ZIGNOS の公式ツリーには、ベースシステムと常用アプリだけを収録しています。
**ZIGNOS MENU** は、そこに入れない追加パッケージを配布する公式オーバーレイです。
Gentoo の overlay に相当し、`zpkg overlay` で誰でも自分のリポジトリを重ねられます。

## ZIGNOS MENU を追加する

```sh
sudo zpkg overlay add zignos-menu
zpkg overlay list
```

公式 URL は `zpkg` に組み込みなので、名前だけで登録できます。現在 ZIGNOS MENU は
未署名のため、`ALLOW_UNSIGNED=1` が自動で設定ファイルに記録されます。

```
NAME             PRIORITY ACTIVE   CHANNELS   STATUS   PACKAGES URL
zignos-menu (ZIGNOS MENU) 10       yes      all        synced   0        unsigned https://github.com/studio-nosa-tech/zignos-menu.git
```

追加後は公式ツリーと同じように検索・導入できます。`zpkg search` と `zpkg info`
ではリポジトリが `zignos-menu/apps` のように表示されます。

```sh
zpkg search <term>
sudo zpkg install <pkg>
```

更新と削除:

```sh
sudo zpkg overlay sync                  # すべてのオーバーレイを更新
sudo zpkg overlay sync zignos-menu      # 1つだけ更新
sudo zpkg overlay remove zignos-menu    # 設定とツリーを削除
```

`overlay remove` は導入済みパッケージを削除しません。レシピが無くなった
パッケージはインストール済みのまま依存解決に参加し、`zpkg upgrade` は
「オーバーレイが有効でない」と警告して再ビルドしません。再ビルドするには
オーバーレイを戻すか、`sudo zpkg remove <pkg>` で削除してください。

## 仕組み

登録内容は `/etc/zpkg/overlays.d/<name>.conf`、取得したツリーは
`$ZPKG_ROOT/var/lib/zpkg/overlays/<name>` に置きます。

```ini
# /etc/zpkg/overlays.d/zignos-menu.conf
URL=https://github.com/studio-nosa-tech/zignos-menu.git
BRANCH=main
PRIORITY=10
ALLOW_UNSIGNED=1
ENABLED=1
```

- 有効なオーバーレイは**公式ツリーより先**に検索します。同じパッケージ
  キー(`name@slot`)は最初のリポジトリが勝ち、そのリポジトリの全バージョンが
  候補になります。公式レシピを上書きすることもできます。
- `PRIORITY` は**大きいほど優先**です(既定 10)。複数のオーバーレイが同じ
  パッケージを持つ場合は、優先度の高い側だけが使われます。
- ツリー側の `overlay.conf` が `CATEGORIES=` でカテゴリディレクトリを宣言します。
  ZIGNOS MENU は `apps` / `games` / `tools` です。`CATEGORIES=` が無い場合は
  ツリー直下がレシピの並びになります。
- `CHANNELS=` で対象チャンネルを限定できます(例: `CHANNELS=testing unstable`)。
  空欄なら全チャンネルで有効です。
- インストールしたパッケージは `meta.json` と provenance にオーバーレイ名を
  記録します。オーバーレイを削除しても表示は `zignos-menu/apps` のままです。

## 任意のオーバーレイを追加する

git リポジトリ、tarball の URL、ローカルディレクトリを登録できます。

```sh
sudo zpkg overlay add myoverlay https://github.com/<user>/<repo>.git
sudo zpkg overlay add local-overlay /path/to/tree --allow-unsigned
sudo zpkg overlay add experimental https://example.com/overlay.tar.xz \
  --branch main --priority 20 --allow-unsigned
```

| オプション | 意味 |
|---|---|
| `--branch <name>` | git のブランチ(既定 `main`) |
| `--priority <n>` | 優先度(既定 10。大きいほど優先) |
| `--allow-unsigned` | 署名の無いツリーを許可する(開発用) |
| `--no-sync` | 設定だけを書き、ツリーは取得しない |

`zpkg overlay remove <name> --keep-tree` は設定だけを消し、取得済みツリーを
残します。`zpkg overlay sync` は git のリモート commit を比較し、変わって
いなければ何もしません。

## 署名

オーバーレイも公式ツリーと同じ `recipes.manifest` / `recipes.manifest.sig` で
検証します。trusted key(`/etc/zpkg/trusted.d`)に登録した鍵で署名を確認し、
generation のロールバックはオーバーレイごとに
`$ZPKG_DB/.security.json` の `overlay:<name>` で拒否します。

```sh
# オーバーレイ作者
zpkg sign-recipes --key ~/overlay-signing.key --generation 1 /path/to/overlay
git add recipes.manifest recipes.manifest.sig
```

署名が存在するのに壊れている場合は、`--allow-unsigned` でも拒否されます。
公式 ZIGNOS MENU は鍵の運用開始まで未署名で、`overlay add zignos-menu` が
`ALLOW_UNSIGNED=1` を記録します。署名が付き次第、そのまま検証に移行します。
詳しくは [署名と検証](/docs/signing/) を参照してください。

## ZIGNOS MENU にパッケージを追加する

[zignos-menu](https://github.com/studio-nosa-tech/zignos-menu) の
`apps/` / `games/` / `tools/` に通常のレシピを置き、Pull Request を送ります。

```
zignos-menu/
├── overlay.conf      # NAME / CATEGORIES / CHANNELS
├── apps/<pkg>/{version, sources, checksums, depends, build}
├── games/<pkg>/...
└── tools/<pkg>/...
```

レシピの書き方は [レシピ](/docs/packaging/recipes/) と
[ビルドパターン](/docs/packaging/patterns/) を参照してください。stable /
testing / unstable のどれでも動くレシピを歓迎します。特定チャンネルだけで
提供する場合は `overlay.conf` の `CHANNELS=` で限定できます。

## 制限

- 同じパッケージキーを複数のオーバーレイが持つ場合、優先度で1つに決まります。
  別々の slot に分ければ共存できます。
- オーバーレイを削除したパッケージは再ビルドできません(レシピが戻るまで
  installed-only として残ります)。
- 公式 ZIGNOS MENU は未署名です。
