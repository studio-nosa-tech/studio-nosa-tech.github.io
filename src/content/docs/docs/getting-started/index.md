---
title: はじめに
description: ZIGNOS を実機または QEMU で動かすまでの流れ。要件、stage3、SystemRescue、インストール、初回起動。
---

ZIGNOS は **SystemRescue で起動し、stage3 tarball をディスクへ展開して
chroot する**流れでインストールします。ZIGNOS のライブ ISO はまだありません。

## 全体の流れ

1. [要件を確認する](/docs/getting-started/requirements/)
2. [stage3 と配布物を確認する](/docs/getting-started/download/)
3. [SystemRescue と USB を準備する](/docs/getting-started/media/)
4. [SystemRescue を起動する](/docs/getting-started/boot/)
5. [ディスクを準備して ZIGNOS を入れる](/docs/getting-started/install/)
6. [初回起動と設定を行う](/docs/getting-started/first-boot/)

## 最初に決めること

| 項目 | 選択肢 |
|---|---|
| ファームウェア | UEFI(GPT + ESP)/ BIOS(MBR) |
| ルート | ext4(現行ガイドの前提) |
| スワップ | あり / なし |
| ネットワーク | 有線 / WiFi(ファームウェアが必要) |
| デスクトップ | なし(CLI)/ KDE Plasma 6 |

## 注意

- stage3 の一般配布は現在**準備中**です。公開は [ニュース](/news/) で案内します
- Secure Boot は無効にしてください
- 実ディスクへ書き込む前に、`lsblk` で対象ディスクを必ず確認してください
- コマンドの完全なリファレンスは [インストールガイド](/docs/install/) にあります

QEMU で試す場合は、仮想ディスクと BIOS / UEFI ファームウェアを用意すれば
実ディスクを変更せずに確認できます。
