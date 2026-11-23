---
title: インストール FAQ
description: ZIGNOS のインストールでよくある質問。stage3、SystemRescue、Secure Boot、WiFi、root パスワード。
---

## ZIGNOS のインストーラ ISO はありますか?

現在はありません。ZIGNOS のライブ ISO は配布しておらず、**SystemRescue で起動し、
stage3 tarball を展開して chroot する**のが既定の方法です。手順は
[インストールガイド](/docs/install/) にあります。

## stage3 tarball はどこから入手しますか?

現在は [ダウンロード](/download/)(GitHub Releases)から取得できます。
開発者は `zignos-build/make-stage3.sh` でも生成できます。ファイル名・サイズ・SHA-256 は
[現在のリリース](/releases/current/) と `/releases.json` に記録されます。

## Secure Boot を有効にしたままインストールできますか?

できません。GRUB とカーネルは署名されていないため、ファームウェア設定で
Secure Boot を無効にしてください。

## BIOS と UEFI のどちらでも入れられますか?

はい。UEFI は GPT + ESP(FAT32)、BIOS は MBR を使います。ディスクの
レイアウトは [インストールガイド](/docs/install/) の表を参照してください。

## root のパスワードが分かりません

stage3 の root はロックされています。chroot に入って `passwd` で設定します。
インストール後にログインできない場合は、SystemRescue から root パーティションを
マウントして `chroot` し、`passwd` を実行してください。

## WiFi が使えません

WiFi にはファームウェアと `wpa_supplicant` が必要です。NetworkManager を使う場合は
`zpkg install networkmanager-wifi` でまとめて導入できます。有線専用なら
`zpkg install networkmanager` だけでも構いません。詳細は
[インストールガイド](/docs/install/) の WiFi 節を参照してください。

## 起動時に GRUB のメニューが出ません

UEFI では ESP の `/EFI/BOOT/BOOTX64.EFI`、BIOS ではディスクの MBR に GRUB が
入っている必要があります。`grub-install` の対象と `grub.cfg` の
`/boot/vmlinuz-...` を確認してください。UEFI の NVRAM 登録が必要な場合は
`efibootmgr` を使います。

## インストール後にネットワークへつながりません

`ip addr` で NIC を確認し、DHCP を使う場合は `dhcpcd` を有効にします。
NetworkManager を使う場合は `rc-update add networkmanager default` を実行し、
`nmcli` または `nmtui` で接続します。
