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
使うには、`zpkg sync` で全チャンネルを取得します。stage3 の
`/etc/zpkg/sync.conf` は既定で GitHub のレシピリポジトリを git モードで
参照し、`.zpkg-git` の commit とリモート HEAD を比較して変更時だけ取得します。

```sh
zpkg sync
# 明示する場合
zpkg sync --git --from https://github.com/studio-nosa-tech/zignos-recipes
```

既定のリポジトリは public のため未認証で取得できます。private の場合は git の credential helper か SSH 鍵が必要です。

## カーネルとデスクトップ(KDE)のチャンネル方針

ZIGNOS のチャンネルは、ベースのカーネルと KDE デスクトップで性格を分けます。
変更は必ず **Unstable → Testing → Stable** の順に検証し、逆流させません。

| チャンネル | Linux | KDE | 性格 |
|---|---|---|---|
| `stable` | **6.18.65 LTS** | Qt 6.8.5 LTS / KF6 6.18 / Plasma 6.4.6 / Gear 25.04.3 / Mesa 26.2.7 | 安定・長期サポート |
| `testing` | **7.3.6 最新安定** | Qt 6.11.3 / KF6 6.32 / Plasma 6.8.3 / Gear 26.08.3 / Mesa 26.3.1 | 最新安定版 |
| `unstable` | **7.4-rc3 mainline** | Qt 6.11.3 / KF6 6.32 / Plasma 6.8.3 / Gear 26.11.80 beta / Mesa 26.3.1 | 挑戦的 |

- **Stable** は Linux と Qt の LTS を固定し、Plasma / Gear も検証済みの安定系列に留めます
- **Testing** は Linux / KDE の最新安定版(またはそれに準ずるもの)を採用します
- **Unstable** は Testing よりさらに新しく、RC / beta / mainline / git snapshot を含みます
- 新機能・新バージョンは Unstable → Testing → Stable の順に昇格します
- Stable は LTS ブランチのため、Testing の最新版をそのまま入れるのではなく、
  検証済みの修正を LTS へバックポートします
- `core/linux` と `desktop/` はチャンネルで系列が分岐します。その他の
  `core/` / `main/` は原則共有します
- `stable ↔ unstable` の切り替えは大規模な更新になります。
  `zpkg upgrade -p` で差分を確認してください

> Unstable の Qt 6.12 / KF6 6.33 / Plasma 6.9 は Plasma 6.9 の公開後に
> まとめて移行するため、現時点では Testing と同じ Qt 6.11.3 / KF6 6.32 /
> Plasma 6.8.3 を使います。Mesa main snapshot も、QEMU の softpipe で
> KWin が `sp_find_cached_tile` で落ちたため 26.3.1 に据え置いています
> (実 GPU での再検証待ち)。

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

upgrade はまず **新しく必要になった依存**(計画の `new dependency`)を
ビルドしてインストールし、その後でアップグレード対象を**すべてビルドしてから**
インストールします。新規依存は追加のみで、既存パッケージの版を置き換えません。

1. 新規依存のビルドに失敗した場合、既存パッケージは変更されない
2. アップグレード対象のビルドに失敗した場合、既存パッケージは置き換えられない
   (先にインストールされた新規依存は残る。追加のみなので既存システムは壊れない)
3. インストールはパッケージ単位のトランザクション。失敗したパッケージは
   ロールバックされ、それ以前のパッケージは整合状態のまま残る
4. 失敗後は `zpkg upgrade` を再実行すると続きから再開できる
5. 電源断などで中断した場合は `zpkg recover`

セット全体を1トランザクションで巻き戻す機能はありません。この方式では
「壊れたビルドでシステムを壊さない」ことを最優先し、インストール段階の
失敗はパッケージ単位で戻します。新規依存の先行インストールは、新しい
makedepends を必要とするパッケージをビルドできるようにするためのものです。

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
- binpkg は name / version / revision / 実効 USE に加えて **チャンネルと
  レシピ digest** で照合する。同じ版数でもレシピ内容が違えばキャッシュを
  使わず再ビルドする。それでも識別と配布順序のため、内容を変えたら
  revision を上げる
- チャンネル間で版数とレシピ内容が同じパッケージは `zpkg upgrade` では
  再インストールされない。版数が同じでもレシピ digest が違えば
  `KindRebuild` として再ビルドされる
- 破壊的変更にはレシピの `upgrade_warning` を書く。主要パッケージ
  (glibc/gcc/binutils/linux/openrc/initscripts/eudev/busybox/shadow/util-linux 等)
  のメジャー版本変更は自動で警告される

## 制限

- `zpkg sync` はツリー全体を置き換える。stage3 の stable のみの状態から
  全チャンネル入り tarball に更新することはできるが、1チャンネルだけを
  追加・更新するコマンドはない
- 署名はツリー全体単位。stage3 同梱の stable サブツリーは現行どおり未署名
- 孤立パッケージの検出は slot 0 のみで、以前の依存 closure に含まれるものに限る
