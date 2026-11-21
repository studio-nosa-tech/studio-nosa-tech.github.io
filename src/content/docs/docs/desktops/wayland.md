---
title: Wayland と Xwayland
description: ZIGNOS の Plasma セッション、KWin、Xwayland、PAM / elogind の関係。
---

## セッションの構成

ZIGNOS の Plasma は **Wayland セッション**です。ログインから画面ロックまでを
PAM と elogind で支えます。

```
dbus → elogind → polkit → upower → display-manager
                                      ↓
                              startplasma-wayland
                                      ↓
                              KWin (DRM / Wayland)
                                      ↓
                              Xwayland (X11 アプリ用)
```

KWin 6 は logind API に依存しており、seatd / libseat は使いません。OpenRC では
**elogind が必須**です。PAM はログインと画面ロックに必要で、M44 以降
`linux-pam` は `core` に入っています。

## Xwayland

X11 専用のアプリは Xwayland 経由で動きます。ZIGNOS では Xwayland の GLX を
有効にしており、GLX 1.4 を確認しています。Xwayland はキーマップ生成に
`xkbcomp` を使うため、これも依存に含まれます。

## グラフィックス

- Mesa は stable 26.2.7 / testing・unstable 26.3.1
- QEMU では `virtio-gpu` + `kms_swrast` で Plasma のパネル / デスクトップを確認
- 実機 GPU での Plasma / SDDM / PLM の目視確認は継続中
- QEMU の Mesa softpipe では greeter の透過合成で KWin が落ちる既知の問題がある

## ログイン

- SDDM 0.21 — 全チャンネル
- Plasma Login Manager 6.8.3 — Testing / Unstable

両方を同時に有効化しないでください。VT の扱いと tty1 の getty については
[KDE Plasma 6](/docs/system/desktop/) を参照してください。

設計の詳細は [デスクトップ環境](/docs/desktop/) にあります。
