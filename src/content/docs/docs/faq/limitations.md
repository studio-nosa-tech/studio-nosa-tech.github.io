---
title: 制限・未実装
description: ZIGNOS 2026.11.24 時点の既知の制限。配布、Secure Boot、暗号化、実機 GPU、署名の現状。
---

ZIGNOS は 2026.11.24 で最初の正式版を公開しました。以下は現時点の既知の制限です。

## 配布

- stage3 は [ダウンロード](/download/)(GitHub Releases)から取得できます
- 配布用のブータブル ISO / UEFI イメージはありません。BIOS/MBR の検証用
  デスクトップイメージは開発元の QEMU 検証用です
- 公開 binpkg リポジトリは運用していません。パッケージはソースからビルドします

## セキュリティ

- **Secure Boot 非対応**。GRUB とカーネルは署名されていません
- 公式署名鍵はまだ運用しておらず、配布物は未署名です
- **LUKS / TPM 非対応**。公式インストール手順は暗号化なしです

## ハードウェア

- 対応アーキテクチャは **x86_64 のみ**
- 実機 GPU での Plasma / SDDM / PLM の目視確認は継続中です。QEMU の
  Mesa softpipe では greeter の透過合成で KWin が落ちる既知の問題があります
- WiFi は `linux-firmware` と `wpa_supplicant` が必要です。検証済みの一部
  チップ以外は実機確認が残っています
- Xwayland の GLX は有効ですが、実機 GPU での確認は残っています

## ソフトウェア

- stage3 は CLI のみで、エディタ / SSH / DHCP / WiFi / man は含まれません
- デスクトップの日本語 UI 翻訳は未対応です(IPAex フォントによる表示は対応)
- systemd は使いません。systemd 依存のソフトウェアはそのままでは動かない場合があります
- PipeWire の Bluetooth / RTKit 連携は未導入です
- SDDM と PLM は同時に有効化できません

## 運用

- セット全体を1トランザクションでロールバックする機能はありません。
  インストール失敗はパッケージ単位で戻します
- `zpkg sync` はツリー全体を置き換えます。1チャンネルだけを更新する
  コマンドはありません
- 孤立パッケージの検出は slot 0 の、以前の依存 closure に含まれるものに限ります

最新の状況は [ロードマップ](/docs/roadmap/) と [ニュース](/news/) を参照してください。
