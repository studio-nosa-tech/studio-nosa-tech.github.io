---
title: デスクトップ
description: ZIGNOS のデスクトップ環境。KDE Plasma 6 (Wayland) の位置づけと導入方法。
---

ZIGNOS のデスクトップ環境は **KDE Plasma 6 (Wayland)** です。stage3 は CLI の
最小ベースなので、デスクトップは `desktop/` のレシピから任意で追加します。

## 方針

- Plasma 本体と KDE アプリを別メタパッケージに分離する
  - `plasma-meta` — セッション本体
  - `kde-applications` — Konsole / Dolphin / Kate / Ark / Gwenview / Okular / Spectacle など
- OpenRC のまま、PAM / elogind / polkit でセッションを作る
- ログインは SDDM(全チャンネル)、または Plasma Login Manager(Testing / Unstable)
- 日本語表示は IPAex フォント、UI 翻訳は未対応

## 導入

```sh
zpkg install plasma-meta kde-applications
rc-update add sddm default
```

必要なサービスと注意点は [KDE Plasma 6](/docs/system/desktop/) を参照してください。

## ページ

- [KDE Plasma 6](/docs/system/desktop/) — 導入、ログイン、サービス
- [Wayland と Xwayland](/docs/desktops/wayland/) — セッション、X11 アプリ、GLX
- [デスクトップ環境(詳細)](/docs/desktop/) — チャンネル構成と実装状況

現時点で KDE Plasma 以外のデスクトップ環境は公式には提供していません。
