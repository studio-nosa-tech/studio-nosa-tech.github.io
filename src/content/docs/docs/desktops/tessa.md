---
title: Tessa (タイル型 Wayland コンポジタ)
description: ZIGNOS で Tessa を導入し、SDDM から起動するための手順。詳しい設定は Tessa 公式サイトを参照。
---

**Tessa** は Zig と wlroots で書かれたタイル型の Wayland コンポジタ兼
デスクトップシェルです。ZIGNOS の公式リポジトリから `tessa` パッケージとして
インストールできます。パネル、ランチャー、ワークスペース、タイルレイアウト、
ウィンドウの角丸・ブラー・影(scenefx)をひとつに含み、Waybar や Rofi は
必要ありません。

Tessa と ZIGNOS は、どちらも [Studio NØSa.](https://studio-nosa.live/) が
開発しています。

## 導入

```sh
zpkg install tessa
```

`tessa` はビルドに `zig` / `wlroots` / `scenefx` / `libseat` を使い、実行には
`wayland` / `libinput` / `libxkbcommon` / `mesa` / `pango` / `cairo` /
`gdk-pixbuf` / `xcursor-themes` / `dbus` などを必要とします。依存は自動で
入ります。

- 初回ビルドでは Zig のビルド依存(`translate_c`)を取得するため、ネットワークと
  数分の時間を使います
- `zig` はビルド用で、Tessa の実行には不要です
- scenefx を有効にしてビルドされるため、角丸・ブラー・影が使えます

## 起動

SDDM のセッション選択で **Tessa** を選ぶと起動します
(`/usr/share/wayland-sessions/tessa.desktop`)。TTY から直接試す場合:

```sh
tessa
```

ZIGNOS には systemd user manager が無いため、`tessa-session` は
`dbus-run-session` でプライベートなセッション D-Bus を起動してから Tessa を
実行します。パネルの通知・メディア・トレイなどはこのバスを使います。
TTY から D-Bus 付きで起動する場合は `tessa-session` を使ってください。

```sh
tessa-session
```

終了は `Super+Shift+E` です。

## 初期設定

設定ファイルは `~/.config/tessa/config`、パネルは同じディレクトリの
`panel.conf` です。雛形をコピーして編集します。

```sh
mkdir -p ~/.config/tessa
cp /usr/share/tessa/config.example ~/.config/tessa/config
cp /usr/share/tessa/panel.example ~/.config/tessa/panel.conf
```

設定は保存すると自動で再読み込みされます。主な項目:

| 項目 | 内容 |
|---|---|
| `terminal` | ランチャーやキーバインドから起動するターミナル。既定は `kitty`。ZIGNOS では `konsole` など、インストール済みのものに変更する |
| `layout` | `master` / `mosaic` / `grid` / `columns` / `scrolling` / `monocle` / `stacking` |
| `gaps` / `outer_gaps` | ウィンドウ間・画面端の余白 |
| `border_width` | ウィンドウ枠の太さ |
| `window-rule` | app-id / タイトル / 出力ごとの浮動化・ワークスペース・透明度・角丸・ブラーなど |

設定の検証は `tessa --check-config` で行えます。`Super+T` でレイアウトを
切り替えます。

## 詳しい設定

**詳しい設定は Tessa 公式サイトをご覧ください。** キーバインド、ウィンドウルール、
レイアウトの詳細、IPC、テーマ、拡張などを確認できます。

- [Tessa 公式サイト(日本語)](https://keychrom.github.io/ja/)
- [Tessa 公式サイト(English)](https://keychrom.github.io/)

## X11 アプリと画面共有

Tessa は X11 アプリを `xwayland-satellite` 経由で起動します。ZIGNOS の公式
リポジトリから追加できます。

```sh
zpkg install xwayland-satellite
```

Tessa は PATH 上の `xwayland-satellite` を自動で見つけて起動します。
`TESSA_XWAYLAND_BIN` で絶対パスを指定することもできます。

画面共有は `xdg-desktop-portal-wlr` が提供します。

```sh
zpkg install xdg-desktop-portal-wlr
```

Tessa のセッションは起動後に `WAYLAND_DISPLAY` を D-Bus アクティベーション
環境へ登録するため、ポータルから Tessa に接続できます。`tessa.portal` は
`XDG_CURRENT_DESKTOP=Tessa` で選択されます。

## 注意点

- 端末が無い場合、Tessa のランチャーはターミナルを起動できません。
  `konsole` などを入れて `terminal` を設定してください
