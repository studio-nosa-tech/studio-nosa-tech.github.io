---
title: SystemRescue の起動
description: SystemRescue を起動し、ネットワークとディスクを確認してインストールの準備をする。
---

## 1. SystemRescue を起動する

USB から SystemRescue を起動します。起動メニューで通常のブートを選び、
コンソールが表示されるまで待ちます。

## 2. ネットワークを確認する

```sh
ip addr
ping -c 3 example.com
```

有線接続が使えない場合は、SystemRescue の NetworkManager / `nmtui` で
WiFi に接続します。stage3 の取得や追加パッケージのダウンロードに使えます。

## 3. ディスクを確認する

```sh
lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINTS
```

インストール先のディスク、USB、既存パーティションを確認します。**対象ディスクを
間違えるとデータを失います。** 必要なら `smartctl` で健康状態も確認してください。

## 4. stage3 を確認する

stage3 tarball と `.sha256` が同じディレクトリにある状態で検証します。

```sh
sha256sum --check zignos-stage3-*.tar.xz.sha256
```

`OK` が出たら [ZIGNOS のインストール](/docs/getting-started/install/) へ進みます。

## 注意

- UEFI の場合は `efivarfs` が見えるか確認します(`ls /sys/firmware/efi`)
- Secure Boot が有効だと ZIGNOS の GRUB / カーネルを起動できません
- ディスクの暗号化(LUKS)や LVM は現行ガイドの対象外です
