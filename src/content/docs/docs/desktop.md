---
title: デスクトップ環境(KDE Plasma 6)
description: ZIGNOS のデスクトップ環境として KDE Plasma 6 を Wayland で導入するための設計方針。
---

ZIGNOS はコンソール主体の最小ベースとして育ってきましたが、最初のデスクトップ
環境として **KDE Plasma 6 (Wayland)** を導入する設計を始めました。

**現在は設計段階で、`desktop/` にパッケージはまだありません。** stage3 と既定の
イメージは CLI の最小ベースのままです。

## 目標

- Plasma 6 の Wayland セッションで、ログイン → パネル/デスクトップ →
  ターミナル/設定 → ログアウトまでを動作させる
- OpenRC のまま、systemd へ移行しない
- デスクトップは `desktop/` の任意パッケージとし、CLI ベースを肥大化させない
- 日本語表示、NetworkManager、PipeWire、電源管理までを最終形に含める

## 設計の基準

最初の実装は LTS 系で固定します。現行の Plasma 6.8 は Qt 6.11 以上を要求し、
Wayland 専用のため、最初のデスクトップとしては変更量が大きいからです。

| コンポーネント | 目標 |
|---|---|
| KDE Plasma | 6.6 LTS(Wayland セッション) |
| Qt | 6.8 LTS |
| KDE Frameworks | 6.18 |
| Wayland | 1.25 |
| Mesa | 26.2 系 |
| セッション | elogind + Linux-PAM + polkit |
| 音声 | PipeWire + WirePlumber |
| ログイン | Plasma Login Manager(SDDM は代替) |

Plasma 6.8 への移行は、基盤が安定してから別フェーズで行います。

## OpenRC との統合

Plasma の Wayland セッションは、OpenRC 上では次の順序で支えます。

```
dbus → elogind → polkit → upower → display-manager
```

KWin 6 は logind API に依存しており、seatd/libseat は使いません。そのため
OpenRC では **elogind が必須**です。また、セッション作成と画面ロックには
PAM が必要になります。現在の ZIGNOS は PAM を使っていないため、デスクトップ
導入に合わせて PAM の追加と認証まわりの整備を行います。

## フェーズ

| # | 内容 |
|---|---|
| M42 | 設計調査(完了) |
| M43 | 基盤(PAM / elogind / polkit / Wayland / Mesa / フォント / Qt6) |
| M44 | KF6 + KWin + Plasma 最小(QEMU でデスクトップ表示) |
| M45 | フル Plasma(ログイン / 音声 / ネットワーク / 電源 / 設定) |
| M46 | デスクトップ入りイメージ / 実機検証 / 6.8 移行 |

各フェーズの完了条件と依存関係は [ロードマップ](/docs/roadmap/) に記録します。

## 検証方針

QEMU の virtio-gpu と Wayland を使い、DRM/seat を含む実際のセッション起動を
確認します。

- QEMU に virtio-gpu、virtio-keyboard、virtio-tablet を追加
- elogind の PAM セッションから `startplasma-wayland` を起動
- スクリーンショットと入力イベントでパネル/デスクトップ/設定画面を確認
- `loginctl` のセッション状態と KWin のログを確認

実機 GPU(Intel / AMD)での検証は、QEMU で基盤が安定した後に行います。

## 現在の制限

- `desktop/` はまだ 0 パッケージ
- カーネルに音声(`CONFIG_SND*`)の設定が無く、PipeWire の前に追加が必要
- PAM がベースに無く、認証まわりの整備が前提
- デスクトップ入りイメージ/ISO はまだ無い

設計の詳細は、リポジトリ内の `zignos/docs/desktop-kde.md` にあります。
