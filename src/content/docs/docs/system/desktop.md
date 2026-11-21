---
title: デスクトップ (KDE)
description: ZIGNOS に KDE Plasma 6 (Wayland) を導入し、SDDM / Plasma Login Manager を設定する。
---

ZIGNOS のデスクトップは任意です。stage3 は CLI のみで、KDE Plasma 6 は
`desktop/` のレシピから追加します。

## 導入

```sh
zpkg install plasma-meta kde-applications
```

- `plasma-meta` — Plasma セッション本体(KWin / plasma-workspace /
  systemsettings / NetworkManager / PipeWire / UDisks2 など)
- `kde-applications` — Konsole / Dolphin / Kate / Ark / Gwenview /
  Okular / Spectacle / kio-extras などのアプリ

## ログイン

```sh
# SDDM(全チャンネル)
rc-update add sddm default

# または Plasma Login Manager(Testing / Unstable)
# rc-update add plasmalogin default
```

SDDM と PLM は同時に有効化しないでください。コンソールの getty が tty1 を
掴んで SDDM が起動できない場合は、`rc-update del console default` で
tty1 を空けます。

## デスクトップ向けサービス

```sh
rc-update add dbus default
rc-update add elogind default
rc-update add polkit default
rc-update add upower default
rc-update add networkmanager default
```

PipeWire / WirePlumber は Plasma の XDG autostart から起動します。

## チャンネル

| チャンネル | Qt | KF6 | Plasma | Gear |
|---|---|---|---|---|
| stable | 6.8.5 LTS | 6.18 | 6.4.5 | 25.04.3 |
| testing | 6.11.3 | 6.32 | 6.8.3 | 26.08.3 |
| unstable | 6.11.3 | 6.32 | 6.8.3 | 26.11.80 beta |

## 注意

- 実機 GPU での Plasma / SDDM / PLM の目視確認は継続中です
- QEMU の Mesa softpipe では greeter の透過合成で KWin が落ちる既知の問題があります
- 日本語表示は IPAex フォントで対応していますが、UI の日本語翻訳は未対応です
- デスクトップ入りイメージは配布していません。stage3 から自分で追加してください

構成と実装状況の詳細は [デスクトップ環境](/docs/desktop/) を参照してください。
