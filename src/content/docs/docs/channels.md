---
title: リリースチャンネル
description: ZIGNOS の stable / testing / unstable チャンネルと、zpkg upgrade の差分表示・確認・整合性チェック。
---

ZIGNOS はローリングリリースです。レシピツリーの HEAD が現在のリリースですが、
すべてのユーザーに同じ速度で変更を届ける必要はありません。M40 では
**stable / testing / unstable** の3チャンネルを用意しました。

| チャンネル | 用途 | 同梱 |
|---|---|---|
| `stable` | 安定版。既定 | stage3 / イメージ |
| `testing` | 次期 stable の検証 | `zpkg sync` で追加 |
| `unstable` | 開発中の最新版。破壊的変更を含み得る | `zpkg sync` で追加 |

## レシピツリーの構造

```
/usr/share/zignos/recipes/
├── stable/{core,main,desktop}
├── testing/{core,main,desktop}
└── unstable/{core,main,desktop}
```

zpkg は `ZPKG_REPOS` が未設定のとき、選択チャンネルの
`core` / `main` / `desktop` を自動的に検索します。M39 以前のフラットな
`recipes/{core,main,desktop}` は **stable として** 引き続き動作します。

stage3 とイメージには **stable だけ**が同梱されます。testing / unstable を
使うには、全チャンネルを含むレシピ tarball を `zpkg sync` で取り込みます。

```sh
zpkg sync --from zignos-recipes-<date>-<revision>.tar.xz
```

## デスクトップ(KDE)のチャンネル方針

KDE デスクトップ導入後は、`desktop/` だけチャンネルごとにバージョン系列を
分けます。`core/` と `main/` は従来どおり同じ内容を基本とします。

| チャンネル | KDE の系列 |
|---|---|
| `stable` | KDE Plasma 6.6 LTS / Qt 6.8 LTS / KF6 6.18 / KDE Gear 25.04.3 |
| `testing` | stable と同じ LTS 系列。LTS ポイントリリースを先に検証 |
| `unstable` | 最新の Plasma / Qt / KF6 / KDE Gear を追従 |

- LTS のポイントリリースは testing → stable の順に適用します
- 最新版は unstable のみ。新しい LTS 系列に切り替えるときだけ
  stable / testing へ反映します
- KDE Gear には Plasma のような LTS が無いため、stable / testing では
  Qt 6.8 LTS でビルドできる最新の Gear(25.04.3)を固定します
- stable ↔ unstable の切り替えは Qt / KF6 / Plasma / Gear の大規模更新に
  なります。`zpkg upgrade -p` で差分を確認してください

## チャンネルの選択

設定は `/etc/zpkg/make.conf` です。

```ini
# /etc/zpkg/make.conf
CHANNEL=stable
CFLAGS="-O2 -pipe"
MAKEOPTS="-j8"
```

優先順位:

1. `ZPKG_CHANNEL` 環境変数(1回の実行だけ)
2. `zpkg upgrade --channel <ch>`(1回の実行だけ)
3. `/etc/zpkg/make.conf` の `CHANNEL=`
4. 既定 `stable`

永続的に切り替える場合:

```sh
zpkg channel                  # 実効値・取得元・利用可能チャンネル
zpkg channel testing          # make.conf を更新(他の行は保持)
```

`zpkg channel testing` は設定を書くだけで、パッケージは変更しません。
切り替え後は必ず差分を確認してから実行します。

```sh
zpkg upgrade -p               # 何が変わるか確認
zpkg upgrade                  # 実行
```

testing がまだ入っていない場合、repo が必要なコマンドは
「channel testing is not installed ... run zpkg sync」とエラーになります。

## upgrade の表示

`zpkg upgrade` は実行前に次を表示します。

```
Channel: testing (/etc/zpkg/make.conf; last applied: stable)
These are the packages that will be upgraded, in order:
  [1] lib 1.0 -> 2.0
  [2] newlib 1.0 (new dependency)
  [3] app 1.0 -> 2.0
      deps: +newlib -oldlib
      warning: app 2.0 needs /etc/app.conf migration
  [4] glibc 1.0 -> 2.0
      warning: major version 1.0 -> 2.0
  [5] rebuild 1.0 (rebuild: USE flags changed)
No longer required (use --prune to remove):
  oldlib-1.0
Total: 3 upgrades, 1 new dependency, 1 rebuild, 3 orphans
```

- **アップグレード** — 版が上がるパッケージ
- **新規依存** — 新しいレシピ closure で必要になったパッケージ
- **再ビルド** — `--newuse` で実効 USE が変わったパッケージ
- **ダウングレード** — チャンネル切り替えなどで版が下がるパッケージ
- **依存関係の差分** — `+追加` / `-削除` / `~制約変更`
- **警告** — レシピの `upgrade_warning`、主要パッケージのメジャー版本変更、
  新しい conflict、slot 変更、チャンネル変更
- **孤立パッケージ** — 以前の依存関係(インストール時の Meta.Depends を辿った closure)
  にあり、新しい closure では不要になった slot 0 のパッケージ。既定では残す。
  world に入っていない無関係なパッケージは対象にしない

## 確認と実行

- 通常は `Proceed? [Y/n]`
- ダウングレードを含む場合は、`--allow-downgrade` が無ければ
  `Downgrades are included. Continue? [y/N]` を出して中止できる。
  フラグがある場合はこの確認を省略する
- `--yes` は通常の確認を省略する(非対話実行では必須)
- `-p` / `--pretend` は表示だけ

## ビルドと復旧

upgrade は計画したパッケージを**すべてビルドしてから**インストールします。

1. 1つでもビルドが失敗すれば、システムは一切変更されない
2. インストールはパッケージ単位のトランザクション。失敗したパッケージは
   ロールバックされ、それ以前のパッケージは整合状態のまま残る
3. 失敗後は `zpkg upgrade` を再実行すると続きから再開できる
4. 電源断などで中断した場合は `zpkg recover`

セット全体を1トランザクションで巻き戻す機能はありません。この方式では
「壊れたビルドでシステムを壊さない」ことを最優先し、インストール段階の
失敗はパッケージ単位で戻します。

## 更新後の整合性チェック

インストール後に以下を検証します。

- 選択チャンネルで world / ターゲットを再解決し、依存欠落・conflict が無い
- 更新したパッケージ(および closure 全体)の DB レコードと manifest
  - 既定: パス存在・種類(dir/link/file)・symlink target・版
  - `--verify`: 全ファイルの sha256 まで照合

成功すると `Integrity check OK (N packages, M files)` と表示し、
`$ZPKG_DB/.channel` に適用チャンネルを記録します。失敗時は問題 path を
列挙して非ゼロ終了します。

## 孤立パッケージ

既定では一覧表示のみです。`--prune` を付けると、他の残存パッケージから
依存されていない孤立パッケージだけを削除します。依存されているものは
`kept: required by ...` と表示して残します。複数スロットを持つパッケージは
対象外です。

## 運用ルール(チャンネル間)

- 変更は **unstable → testing → stable** の順に昇格させる
- **同じ version+revision のまま内容を変えない**。binpkg のキーは
  name / version / revision / 実効 USE で決まるため、内容だけ変えると
  キャッシュが衝突する。内容を変えたら必ず revision を上げる
- チャンネル間で版が同じパッケージは `zpkg upgrade` では再インストール
  されない。強制する場合は `zpkg install -f <pkg>`
- 破壊的変更にはレシピの `upgrade_warning` を書く。主要パッケージ
  (glibc/gcc/binutils/linux/openrc/initscripts/eudev/busybox/shadow/util-linux 等)
  のメジャー版本変更は自動で警告される

## 制限

- `zpkg sync` はツリー全体を置き換える。stage3 の stable のみの状態から
  全チャンネル入り tarball に更新することはできるが、1チャンネルだけを
  追加・更新するコマンドはない
- 署名はツリー全体単位。stage3 同梱の stable サブツリーは現行どおり未署名
- 孤立パッケージの検出は slot 0 のみで、以前の依存 closure に含まれるものに限る
