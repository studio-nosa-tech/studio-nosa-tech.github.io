---
title: ZIGNOS の機能
description: ZIGNOS が提供するソースベース、zpkg、OpenRC、3チャンネル、KDE Plasma 6、検証機能。
---

## ソースベース

パッケージはシェルスクリプトのレシピからビルドします。バイナリはキャッシュされ、
同じレシピ・同じ入力から再ビルドできます。レシピは
[zignos-recipes](https://github.com/studio-nosa-tech/zignos-recipes) で公開しています。

## zpkg

Go 製のパッケージマネージャです。

- USE フラグとスロット
- world と依存解決(バージョン制約 / provides / conflicts / 逆依存)
- binpkg キャッシュと binpkg リポジトリ
- Ed25519 署名とロールバック・期限対策
- bubblewrap によるビルド隔離
- トランザクションと `zpkg recover`
- ビルドログ・provenance・SPDX SBOM
- `zpkg sync` によるレシピツリーの git 同期

## OpenRC

init は OpenRC です。ベースが有効化するのは udev とコンソールだけで、
DHCP、SSH、NetworkManager、デスクトップなどは opt-in です。
`rc-update add <service> <runlevel>` で自分で有効化します。

## 3つのリリースチャンネル

`stable` / `testing` / `unstable` を選べます。変更は
Unstable → Testing → Stable の順に検証されます。詳細は
[リリースチャンネル](/docs/channels/) を参照してください。

## KDE Plasma 6 (Wayland)

`desktop/` に Plasma 6 のスタックと KDE アプリを用意しています。

- `plasma-meta` — KWin / plasma-workspace / systemsettings / NetworkManager / PipeWire / UDisks2 など
- `kde-applications` — Konsole / Dolphin / Kate / Ark / Gwenview / Okular / Spectacle / kio-extras など

SDDM は全チャンネル、Plasma Login Manager は Testing / Unstable で利用できます。

## Flatpak

`flatpak` / `xdg-desktop-portal` / `xdg-desktop-portal-kde` を導入すると、
Flathub のアプリをサンドボックスで実行できます。ファイル選択・画面共有・
印刷は KDE ポータルが処理します。systemd は不要で、ポータルは D-Bus
アクティベーションで起動します。詳細は [Flatpak](/docs/desktops/flatpak/) を
参照してください。

## ファームウェアと起動

x86_64 の BIOS / UEFI に対応します。GRUB 2.14 を使い、UEFI では efibootmgr も
導入できます。Secure Boot は未対応です。

## 検証と再現性

QEMU で BIOS / UEFI の起動、PAM ログイン、Plasma セッションを確認しています。
ビルドは SOURCE_DATE_EPOCH を固定し、ログ・provenance・SBOM を記録します。
実機 GPU や一部の WiFi は継続検証中です。
