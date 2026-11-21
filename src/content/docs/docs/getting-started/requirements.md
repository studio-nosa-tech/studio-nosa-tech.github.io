---
title: 要件
description: ZIGNOS をインストールするためのハードウェア、メディア、ネットワーク、ソフトウェアの要件。
---

## ハードウェア

| 項目 | 要件・目安 |
|---|---|
| CPU | x86_64 |
| ファームウェア | BIOS または UEFI(Secure Boot は無効) |
| メモリ | CLI は 512 MiB 以上、KDE Plasma は 2 GiB 以上を推奨 |
| ストレージ | CLI は 8 GiB 以上、デスクトップは 16 GiB 以上を推奨 |
| ネットワーク | 有線を推奨。WiFi はファームウェアが必要 |

stage3 は約 1.1 GiB です。カーネル、GRUB、追加パッケージ、ビルドキャッシュの
容量は別途必要です。

## 用意するもの

- **SystemRescue** を書き込んだ USB メモリ(現行ガイドは 13.03)
- **stage3 tarball**(現在は一般配布準備中。開発者は `make-stage3.sh` で生成)
- stage3 の SHA-256 を記録したファイル、または `release.json`
- 実機へ転送するための USB / SSH 環境

## ファームウェア

- **UEFI**: GPT + ESP(FAT32、512 MiB 目安)
- **BIOS**: MBR。2 TiB を超えるディスクからは BIOS 起動できません
- Secure Boot は無効にしてください。GRUB / カーネルは署名されていません

## ネットワーク

インストール中は SystemRescue のネットワークを使えます。stage3 の展開後、
chroot 内で追加パッケージを取得する場合は、`/etc/resolv.conf` と NIC の設定が
必要です。WiFi しか使えない機体では、chroot 内で WiFi スタックまで入れてから
再起動すると確実です。

## インストール後の追加

stage3 は最小ベースです。エディタ、SSH、DHCP、WiFi、man は含まれません。
必要に応じて `zpkg install` で追加します。
