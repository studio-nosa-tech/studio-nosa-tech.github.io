---
title: インストール環境の準備
description: SystemRescue の USB 作成と、stage3 tarball を実機へ運ぶ方法。
---

ZIGNOS のライブ ISO はまだありません。インストールには **SystemRescue** と
**stage3 tarball** を使います。

## 1. SystemRescue を USB に書く

1. SystemRescue の ISO をダウンロードする
2. 配布元の SHA-256 を確認する
3. USB メモリへ書き込む

```sh
# /dev/sdX は USB 全体。間違えるとディスクを壊す
sudo dd if=systemrescue-*.iso of=/dev/sdX bs=4M status=progress oflag=sync
```

書き込み前に `lsblk` で対象を確認してください。USB のパーティション
(`/dev/sdX1`)ではなく、デバイス全体(`/dev/sdX`)へ書きます。

## 2. stage3 tarball を用意する

stage3 は現在一般配布準備中です。開発者はビルドホストで生成し、USB または
SSH で実機へ運びます。

- USB: stage3 tarball、`.sha256`、`release.json` を同じ USB へ置く
- SSH: SystemRescue 起動後に `scp` で転送する

転送後は必ず検証します。

```sh
sha256sum --check zignos-stage3-*.tar.xz.sha256
```

## 3. 起動順を確認する

UEFI の場合は USB の FAT32 パーティション、BIOS の場合は USB 全体から起動します。
ファームウェアの起動順を一時的に USB へ変更してください。

## 次へ

- [SystemRescue の起動](/docs/getting-started/boot/)
- [ZIGNOS のインストール](/docs/getting-started/install/)
- [インストールガイド(詳細)](/docs/install/)
