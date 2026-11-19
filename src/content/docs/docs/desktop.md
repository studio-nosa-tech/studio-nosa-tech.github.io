---
title: デスクトップ環境(KDE Plasma 6)
description: ZIGNOS のデスクトップ環境として KDE Plasma 6 を Wayland で導入するための設計方針。
---

ZIGNOS はコンソール主体の最小ベースとして育ってきましたが、最初のデスクトップ
環境として **KDE Plasma 6 (Wayland)** を導入する設計をまとめました。

**現在は設計段階で、`desktop/` にパッケージはまだありません。実装は M43 以降です。** stage3 と既定の
イメージは CLI の最小ベースのままです。

## 目標

- Plasma 6 の Wayland セッションで、ログイン → パネル/デスクトップ →
  ターミナル/設定 → ログアウトまでを動作させる
- OpenRC のまま、systemd へ移行しない
- デスクトップは `desktop/` の任意パッケージとし、CLI ベースを肥大化させない
- 日本語表示、NetworkManager、PipeWire、電源管理までを最終形に含める

## チャンネル方針

デスクトップは stable / testing と unstable でバージョン系列を分けます。

- **stable / testing**: KDE Plasma の **LTS 系(6.6)** を固定
- **unstable**: 最新の Plasma(現在 6.8)を追従

`core/` と `main/` は従来どおりチャンネル間で同じ内容を基本とし、
`desktop/` だけを系列ごとに分岐させます。

| コンポーネント | stable / testing(LTS) | unstable(最新追従) |
|---|---|---|
| KDE Plasma | 6.6 LTS | 6.8(以降は最新安定版) |
| Qt | 6.8 LTS | 6.11(以降は最新安定版) |
| KDE Frameworks | 6.18 | 6.32(以降は最新安定版) |
| KDE Gear(アプリ) | 25.04.3 | 26.08(以降は最新安定版) |
| Wayland | 1.25 | 最新安定版 |
| Mesa | 26.2 系 | 26.3 系(以降は最新安定版) |
| セッション | elogind + Linux-PAM + polkit | 同じ |
| 音声 | PipeWire + WirePlumber | 同じ |
| ログイン | Plasma Login Manager 6.6 | Plasma Login Manager 6.8 |

KDE Gear には Plasma のような LTS がありません。そのため stable / testing では
Qt 6.8 LTS でビルドできる最新の Gear(25.04.3)を固定し、unstable は最新の
Gear を追従します。

LTS のポイントリリースは testing → stable の順に適用し、最新版は unstable
だけに入れます。新しい LTS 系列に切り替えるときだけ、stable / testing の
系列を更新します。

## パッケージ構成

デスクトップ本体と KDE アプリは、別のメタパッケージに分けます。

- **`plasma-meta`** — Plasma セッション本体(kwin / plasma-workspace /
  plasma-desktop / systemsettings / plasma-nm / plasma-pa / powerdevil /
  Plasma Login Manager など)。KDE アプリは含めません
- **`kde-applications`** — KDE Gear のアプリ(Dolphin / Konsole / Kate / Ark /
  Gwenview / Okular / Spectacle / KCalc / Filelight / KWalletManager など)。
  Plasma 本体には依存しません

`plasma-meta` と `kde-applications` は独立してインストール・削除できます。
将来は `kde-applications-{utilities,graphics,multimedia,network,office,pim,sdk}`
のサブメタへ分割できる構成にします。

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
| M43 | 基盤(PAM / elogind / polkit / Wayland / Mesa / フォント / Qt6)+ メタレシピ骨格 |
| M44 | KF6 + KWin + Plasma 最小 + `plasma-meta`(QEMU でデスクトップ表示) |
| M45 | フル Plasma(ログイン / 音声 / ネットワーク / 電源 / 設定)+ `kde-applications` |
| M46 | デスクトップ入りイメージ / 実機検証 / 次期 LTS 移行 |

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
