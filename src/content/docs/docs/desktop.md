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

チャンネルは **Stable = 安定/LTS、Testing = 最新安定版、Unstable = さらに挑戦的**
の3段階です。変更は必ず **Unstable → Testing → Stable** の順に検証し、
逆流させません。

| コンポーネント | Stable(LTS/安定) | Testing(最新安定) | Unstable(挑戦的) |
|---|---|---|---|
| Linux kernel | 6.18 LTS | 7.3 最新安定 | 7.4-rc / mainline |
| KDE Plasma | 6.6 LTS | 6.8 | 6.9 dev / beta |
| Qt | 6.8 LTS | 6.11 | 6.12 dev / beta |
| KDE Frameworks | 6.18 | 6.32 | 6.33 / master |
| KDE Gear(アプリ) | 25.04.3 | 26.08 | 26.12 beta |
| Wayland | 1.25 | 最新安定版 | git snapshot |
| Mesa | 26.2 系 | 26.3 系 | 27.0 dev / git |
| セッション | elogind + Linux-PAM + polkit | 同じ | 同じ |
| 音声 | PipeWire + WirePlumber | 最新安定版 | git snapshot |
| ログイン | Plasma Login Manager 6.6 | 6.8 | 6.9 dev / beta |

- **Stable** は Linux LTS と KDE LTS を固定します
- **Testing** は Linux / KDE の最新安定版(またはそれに準ずるもの)を採用します
- **Unstable** は Testing よりさらに新しく、RC / beta / mainline / git snapshot を含みます
- 新機能・新バージョンは Unstable → Testing → Stable の順に昇格します
- Stable は LTS ブランチのため、Testing の最新版をそのまま入れるのではなく、
  検証済みの修正を LTS へバックポートします
- `core/linux` と `desktop/` はチャンネルで系列が分岐し、その他の
  `core/` / `main/` は原則共有します

KDE Gear には Plasma のような LTS がありません。そのため Stable では
Qt 6.8 LTS でビルドできる最新の Gear(25.04.3)を固定し、Testing は最新安定版
(26.08)、Unstable は次期版(26.12 beta)を追従します。

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
