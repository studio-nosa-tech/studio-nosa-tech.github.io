---
title: サービス (OpenRC)
description: OpenRC の確認、起動、自動起動、ZIGNOS でよく使うサービス。
---

ZIGNOS は OpenRC を使います。パッケージを入れただけではサービスは起動しません。
必要なものを `rc-update` で有効化します。

## 基本操作

```sh
rc-status                     # 現在の状態
rc-service <name> start       # 起動
rc-service <name> stop        # 停止
rc-service <name> restart     # 再起動
rc-update add <name> default  # 自動起動を有効化
rc-update del <name> default  # 自動起動を無効化
```

## ベースで有効なもの

stage3 の時点で有効なのは次の3つです。

| サービス | 役割 |
|---|---|
| `udev` | デバイス管理(eudev) |
| `console` | ttyS0 のログイン |
| `console-vga` | tty1 のログイン |

## よく使うサービス

| サービス | パッケージ | 用途 |
|---|---|---|
| `dbus` | `dbus` | システムバス |
| `elogind` | `elogind` | セッション / seat 管理 |
| `polkit` | `polkit` | 特権認証 |
| `upower` | `upower` | 電源管理 |
| `networkmanager` | `networkmanager` | ネットワーク |
| `sshd` | `openssh` | SSH |
| `sddm` | `plasma-meta` | グラフィカルログイン |
| `plasmalogin` | `plasma-meta` (Testing / Unstable) | Plasma Login Manager |

デスクトップでは `dbus` / `elogind` / `polkit` を default で有効化し、
UPower は専用サービスとして起動します。SDDM と PLM は**どちらか一方だけ**を
有効化してください。

## トラブルシュート

```sh
rc-service <name> status
rc-service <name> start
```

起動しない場合は、依存パッケージが入っているか、設定ファイルが正しいかを
確認します。カーネルログは `dmesg`、サービス個別のログは
`/var/log/` や起動時の出力を見てください。

設計の詳細は [システム設計](/docs/design-system/)、
デスクトップのサービス構成は [デスクトップ (KDE)](/docs/system/desktop/) を参照してください。
