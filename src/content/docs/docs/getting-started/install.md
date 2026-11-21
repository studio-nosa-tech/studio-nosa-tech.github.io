---
title: ZIGNOS のインストール
description: stage3 を展開し、root パスワード、ネットワーク、SSH、カーネルと GRUB を設定して ZIGNOS を完成させる。
---

このページは流れをつかむための概要です。コマンドの完全な手順、UEFI の
`efibootmgr`、WiFi、トラブルシューティングは
[インストールガイド(詳細)](/docs/install/) を参照してください。

> stage3 の一般配布は現在**準備中**です。手元に stage3 tarball と
> `.sha256` がある前提で説明します。

## 1. ディスクを準備する

| ファームウェア | レイアウト |
|---|---|
| UEFI | GPT: ESP(FAT32、512 MiB 目安)+ root(ext4) |
| BIOS | MBR: root(ext4)。必要なら swap |

```sh
lsblk
cfdisk /dev/sdX          # GPT / DOS を選択してパーティション作成
mkfs.fat -F32 /dev/sdX1  # UEFI の ESP
mkfs.ext4 /dev/sdX2      # root
```

スワップを作る場合は `mkswap` / `swapon` を使います。既存データがあるディスクを
消す操作なので、デバイス名を必ず確認してください。

## 2. stage3 を展開する

```sh
mount /dev/sdX2 /mnt/zignos
mkdir -p /mnt/zignos/boot/efi
mount /dev/sdX1 /mnt/zignos/boot/efi   # UEFI のみ
tar -xpf zignos-stage3-*.tar.xz -C /mnt/zignos
```

## 3. chroot に入る

stage3 には `zignos-enter.sh` は含まれていません。手動でマウントして入ります。

```sh
mkdir -p /mnt/zignos/{dev,proc,sys,run}
mount --rbind /dev /mnt/zignos/dev
mount --make-rslave /mnt/zignos/dev
mount -t proc proc /mnt/zignos/proc
mount --rbind /sys /mnt/zignos/sys
mount --make-rslave /mnt/zignos/sys
mount --rbind /run /mnt/zignos/run
mount --make-rslave /mnt/zignos/run
chroot /mnt/zignos /bin/bash -l
```

UEFI では `/sys` を rbind することで、chroot 内から `efivarfs` が見えます。
詳細は [インストールガイド](/docs/install/) を参照してください。

## 4. root のパスワードを変更する

stage3 の root はロックされています。chroot 内で新しいパスワードを設定して
ロックを解除します。

```sh
passwd
```

## 5. ネットワークを設定する

stage3 には DHCP クライアントも NetworkManager も入っていません。chroot 内で
どちらか一方を導入します。まず DNS を設定してからパッケージを取得します。

```sh
printf 'nameserver 1.1.1.1\nnameserver 8.8.8.8\n' > /etc/resolv.conf
```

### A. dhcpcd(有線の最小構成)

```sh
zpkg install dhcpcd
rc-update add dhcpcd boot
```

### B. NetworkManager(有線 / WiFi)

```sh
zpkg install networkmanager-wifi
rc-update add networkmanager default
```

`networkmanager-wifi` は NetworkManager + `wpa_supplicant` + `iw` +
`linux-firmware` をまとめて導入します。dhcpcd と NetworkManager は
同時に有効化しないでください。接続の確認は再起動後に行います。

## 6. SSH を有効にする(任意)

```sh
zpkg install openssh
rc-update add sshd default
```

root の SSH ログインは無効です。一般ユーザーを作成し、そのユーザーの
`~/.ssh/authorized_keys` を設定してから接続してください。

```sh
useradd -m -G wheel -s /bin/bash yourname
passwd yourname
```

## 7. カーネルと GRUB を導入する

```sh
# UEFI
zpkg use --package grub uefi
zpkg install linux grub

# BIOS
zpkg use --package grub bios
zpkg install linux grub
```

## 8. fstab と GRUB を設定する

```sh
zignos-fstab /
grub-mkconfig -o /boot/grub/grub.cfg
```

UEFI では `grub-install --target=x86_64-efi --efi-directory=/boot/efi`、
BIOS では `grub-install --target=i386-pc /dev/sdX` を実行します。
PARTUUID / UUID が正しいことを確認してから再起動してください。

## 9. 再起動する

```sh
exit
umount -R /mnt/zignos
reboot
```

ファームウェアの起動順を ZIGNOS のディスクへ変更します。初回起動後の設定は
[初回起動と設定](/docs/getting-started/first-boot/) に進んでください。
