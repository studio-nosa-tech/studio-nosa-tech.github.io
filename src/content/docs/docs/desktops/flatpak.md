---
title: Flatpak
description: ZIGNOS で Flatpak アプリを動かす。インストール、Flathub の登録、xdg-desktop-portal によるデスクトップ連携。
---

ZIGNOS は **Flatpak** を公式にサポートしています。KDE Plasma 6 の
Wayland セッション上で、Flathub のアプリをサンドボックスで実行できます。
ファイル選択や画面共有は **xdg-desktop-portal** と KDE バックエンドを
通じてホスト側の Plasma と連携します。

## 仕組み

Flatpak はアプリを独自のランタイムとともにサンドボックスへ導入します。
ZIGNOS では次の構成で動作します。

- **flatpak** — 本体。bubblewrap、xdg-dbus-proxy、fusermount3 を使う
- **ostree / appstream / gpgme** — リポジトリの取得、メタデータ、署名検証
- **xdg-desktop-portal** — アプリとデスクトップをつなぐフロントエンド
- **xdg-desktop-portal-kde** — Plasma 側のバックエンド(ファイル選択・画面共有・印刷など)
- **flatpak システムヘルパー** — システム全体へのインストールを処理する D-Bus サービス

ZIGNOS は systemd を使いません。ポータルは systemd ユーザーユニットではなく
**D-Bus アクティベーション**で起動します。また、`fuse` はカーネルに組み込まれて
いるため(`CONFIG_FUSE_FS=y`)、`/dev/fuse` は起動時から存在します。

## パッケージの導入

```sh
zpkg install flatpak xdg-desktop-portal xdg-desktop-portal-kde
```

システムヘルパーは root で動作し、revokefs などの補助処理を `flatpak` ユーザー
(UID/GID 622)で実行します。このアカウントは `initscripts` が作成するため、
古い環境では先に更新してください。

```sh
zpkg install -f initscripts
```

## Flathub の登録

```sh
flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
```

`--user` を付けるとユーザー単位、付けない場合はシステム全体に登録されます。
システム全体への登録・インストールは polkit を経由し、`wheel` グループの
ローカルユーザーは追加の認証なしで実行できます。

```sh
flatpak remotes
```

## アプリのインストールと実行

```sh
flatpak install flathub org.mozilla.firefox
flatpak run org.mozilla.firefox
```

インストール済みの一覧と更新は次のとおりです。

```sh
flatpak list
flatpak update
flatpak uninstall org.mozilla.firefox
```

デスクトップ環境からは、アプリ一覧に追加されたエントリからも起動できます。

## ポータルとデスクトップ連携

Flatpak アプリはホストのファイルや画面へ直接アクセスせず、ポータル経由で
要求します。Plasma セッションでは `xdg-desktop-portal-kde` が処理します。

| 機能 | バックエンド |
|---|---|
| ファイル選択・保存 | xdg-desktop-portal-kde (KIO) |
| 画面共有・スクリーンキャスト | xdg-desktop-portal-kde + KWin ScreenCast + PipeWire |
| 印刷 | xdg-desktop-portal-kde + CUPS |
| 通知・設定・URL を開く | xdg-desktop-portal |

画面共有は KWin の ScreenCast 機能と PipeWire を使います。ZIGNOS の KWin は
PipeWire 対応でビルドされており、ウィンドウやモニタを Flatpak アプリへ
ストリームできます。

ポータルの状態は `flatpak permissions` で確認できます。

```sh
flatpak permissions
```

## 保存場所

| 場所 | 内容 |
|---|---|
| `/var/lib/flatpak` | システム全体のアプリとランタイム |
| `/var/cache/flatpak` | システム全体のキャッシュ |
| `~/.local/share/flatpak` | ユーザー単位のアプリとランタイム |

システム側のディレクトリは root 所有です。`flatpak repair` で不整合を
検査できます。

## トラブルシューティング

### アプリが起動しない

サンドボックスの作成に失敗している場合は、bubblewrap とユーザー名前空間を
確認します。

```sh
bwrap --ro-bind / / --dev /dev --proc /proc --unshare-user true && echo ok
```

`ok` が表示されれば、非特権ユーザー名前空間でサンドボックスを作れます。

### ファイル選択や画面共有が動かない

ポータルが D-Bus から起動できるか確認します。Plasma セッションのターミナルで
実行してください。`(1,)` または `(2,)` が返れば、サービスは登録され起動して
います。

```sh
gdbus call --session \
  --dest org.freedesktop.DBus \
  --object-path /org/freedesktop/DBus \
  --method org.freedesktop.DBus.StartServiceByName \
  org.freedesktop.portal.Desktop 0
```

KDE バックエンドも同様に確認できます。

```sh
gdbus call --session \
  --dest org.freedesktop.DBus \
  --object-path /org/freedesktop/DBus \
  --method org.freedesktop.DBus.StartServiceByName \
  org.freedesktop.impl.portal.desktop.kde 0
```

`xdg-desktop-portal` と `xdg-desktop-portal-kde` がインストールされていること、
`dbus` サービスが動作していることを確認してください。

### システム全体へのインストールが拒否される

SSH 越しなどローカルセッションでない場合、polkit の認証が必要になります。
`wheel` グループのユーザーで Plasma のターミナルから実行するか、root で
インストールしてください。

```sh
doas flatpak install flathub org.mozilla.firefox
```
