---
title: 初回起動と設定
description: ZIGNOS の初回起動後に行う root パスワード、ユーザー、ネットワーク、SSH、デスクトップ、更新の設定。
---

## 1. ログインして root を設定する

コンソールに root でログインし、パスワードを設定します。stage3 の root は
ロックされているため、初回は `passwd` で解除します。

```sh
passwd
```

日常用のユーザーを作る場合:

```sh
useradd -m -G wheel -s /bin/bash yourname
passwd yourname
```

## 2. ネットワークを設定する

有線で DHCP を使う場合:

```sh
zpkg install dhcpcd
rc-update add dhcpcd boot
rc-service dhcpcd start
```

NetworkManager を使う場合:

```sh
zpkg install networkmanager
rc-update add networkmanager default
rc-service networkmanager start
nmcli device status
```

WiFi は `zpkg install networkmanager-wifi` でファームウェアと
`wpa_supplicant` をまとめて導入できます。接続後は `ping` で確認してください。

## 3. SSH を有効にする

```sh
zpkg install openssh
rc-update add sshd default
rc-service sshd start
```

root の SSH ログインは無効です。一般ユーザーの `~/.ssh/authorized_keys` を
設定してから接続してください。

## 4. デスクトップを入れる

KDE Plasma 6 を使う場合:

```sh
zpkg install plasma-meta kde-applications
rc-update add networkmanager default
rc-update add upower default
rc-update add sddm default
```

SDDM と Plasma Login Manager は同時に有効化しないでください。
詳細は [デスクトップ (KDE)](/docs/system/desktop/) を参照してください。

## 5. システムを更新する

```sh
zpkg sync
zpkg channel
zpkg upgrade -p
zpkg upgrade
```

`-p` の差分を確認してから実行します。チャンネルを切り替える場合は
ダウングレードを含むことがあります。詳細は
[チャンネルとアップグレード](/docs/system/channels/) を参照してください。

## 6. 状態を確認する

```sh
uname -r
rc-status
zpkg list
df -h
```

うまく起動しない場合は [インストール FAQ](/docs/faq/install/) と
[インストールガイド](/docs/install/) のトラブルシューティングを確認してください。
