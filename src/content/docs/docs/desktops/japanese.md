---
title: 日本語入力 (fcitx5 + Mozc)
description: ZIGNOS で fcitx5 と Mozc を導入し、KDE Plasma 6 (Wayland) で日本語を入力するための手順。
---

ZIGNOS の日本語入力は **fcitx5 + Mozc** の組み合わせです。Plasma 6 の
Wayland セッションでも、Qt / GTK / Xwayland の各アプリから利用できます。

## パッケージの導入

```sh
zpkg install fonts-noto-cjk fonts-noto-emoji
zpkg install fcitx5 fcitx5-qt fcitx5-gtk fcitx5-configtool
```

- `fcitx5` — 入力メソッド本体
- `fcitx5-qt` — Qt 6 アプリ用の入力コンテキストプラグイン
- `fcitx5-gtk` — GLib クライアントと GTK 3 用 IM モジュール
- `fcitx5-configtool` — 入力メソッドを設定する GUI
- `fonts-noto-cjk` — 日本語表示用フォント(`ipaex-fonts` でも可)

Mozc は **`fcitx5` USE フラグが必須**です。先に `package.use` へ追加してから
インストールします。フラグが無い場合、Mozc のビルドは意図的に失敗します。

```sh
echo 'mozc fcitx5' >> /etc/zpkg/package.use
zpkg install mozc
```

Mozc は fcitx/mozc フォークを Bazel でビルドするため、初回は時間とディスクを
消費します。完了すると fcitx5 アドオン(`fcitx5-mozc.so`)、`mozc_server`、
`mozc_tool` がインストールされます。

## 環境変数

入力メソッドモジュールを確実に読み込ませるため、`/etc/environment` に次の
3 行を追加します。`/etc/environment` はシェルスクリプトではないので、
`export` や引用符は付けません。

```sh
cat >> /etc/environment <<'EOF'
GTK_IM_MODULE=fcitx5
QT_IM_MODULE=fcitx5
XMODIFIERS=@im=fcitx5
EOF
```

| 変数 | 対象 |
|---|---|
| `GTK_IM_MODULE=fcitx5` | GTK 3 アプリ |
| `QT_IM_MODULE=fcitx5` | Qt 6 アプリ |
| `XMODIFIERS=@im=fcitx5` | X11 / Xwayland アプリ |

これらの値は PAM の `pam_env` がログイン時に読み込みます。反映には
**ログアウト → ログイン**(または再起動)が必要です。

> **古いインストール環境の場合**: `pam_env` が PAM スタックに無いと
> `/etc/environment` は読まれません。linux-pam r4 以降で対応しているため、
> それ以前の環境では先に `zpkg install -f linux-pam` で更新してください。

現在のセッションだけで試す場合は、ターミナルで直接設定して fcitx5 を
起動し直します。

```sh
export GTK_IM_MODULE=fcitx5
export QT_IM_MODULE=fcitx5
export XMODIFIERS=@im=fcitx5
fcitx5 -d --replace
```

## 入力メソッドの設定

1. 環境変数を設定したら、ログインし直す
2. `fcitx5-configtool` を起動する
3. 「入力メソッド」タブで **Mozc** を追加する
4. 既定では `Ctrl+Space` で日本語入力のオン/オフを切り替えられる

fcitx5 は XDG autostart で Plasma と一緒に起動します。起動していない場合は
`fcitx5 -d` をシステム設定 → 自動起動 に追加してください。

Wayland ネイティブのアプリはコンポジタの入力メソッドプロトコルを使うため、
上記の環境変数が無くても動作します。ただし Electron アプリ(Chromium 系)は
`--enable-wayland-ime` を明示する必要があります。ZIGNOS の Discord
(r1 以降)はランチャーでこのフラグを渡します。KDE Plasma の
「システム設定 → 入力デバイス → 仮想キーボード」で Fcitx5 を選んでおくと、
Wayland の入力メソッドプロトコルが有効になります。

## 動作確認

```sh
echo "GTK=$GTK_IM_MODULE QT=$QT_IM_MODULE X=$XMODIFIERS"
pgrep -a fcitx5
fcitx5-diagnose
```

Konsole や Kate で日本語を入力し、`Ctrl+Space` で Mozc に切り替われば完了です。
GTK 3 アプリ(例: `gtk3-demo`)でも同様に確認できます。

## うまくいかないとき

- **Mozc が入力メソッド一覧に出ない** — `mozc` を `fcitx5` USE 付きで
  ビルドしたか確認してください。`/usr/lib/fcitx5/fcitx5-mozc.so` が無ければ
  再インストールします
- **環境変数が空になる** — `/etc/environment` を書き換えたあとログインし直したか
  確認してください。PAM はログイン時にしか読みません
- **GTK アプリだけ変換できない** — `fcitx5-gtk` を再インストールし、
  `/usr/lib/gtk-3.0/3.0.0/immodules/im-fcitx5.so` があるか確認してください
- **Xwayland のアプリだけ変換できない** — `XMODIFIERS` が反映されていません。
  `/etc/environment` の 3 行と再ログインを確認してください
- **Discord で入力できない** — Discord (r1 以降)は Wayland で
  `--enable-wayland-ime` 付きで起動します。古いパッケージの場合は
  `zpkg install -f discord` で更新してください。KDE の「仮想キーボード」で
  Fcitx5 が選ばれていることも確認してください
- **日本語が表示されない** — `fonts-noto-cjk`(または `ipaex-fonts`)を
  インストールしてください

関連: [デスクトップ](/docs/desktops/) /
[KDE Plasma 6](/docs/system/desktop/) /
[Wayland と Xwayland](/docs/desktops/wayland/)
