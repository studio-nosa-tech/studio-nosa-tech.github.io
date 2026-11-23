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
- 日本語表示は Noto CJK / Noto Emoji と IPAex フォント、日本語入力は fcitx5 + mozc

## 導入

実機の GPU に合わせて、先に `VIDEO_CARDS` を設定してください。Intel Gen8 以降なら
`zpkg video-cards iris`、QEMU なら `zpkg video-cards virgl` です。対応表は
[インストールガイド](/docs/install/) の「10. デスクトップと VIDEO_CARDS」に
あります。

```sh
zpkg video-cards iris
zpkg install plasma-meta kde-applications
rc-update add sddm default
```

必要なサービスと注意点は [KDE Plasma 6](/docs/system/desktop/) を参照してください。

## 日本語フォントと入力

フォントと入力メソッドは個別にインストールします。

```sh
zpkg install fonts-noto-cjk fonts-noto-emoji
zpkg install fcitx5 fcitx5-qt fcitx5-gtk fcitx5-configtool
```

`fcitx5-gtk` は GLib クライアント(GClient)と GTK 3 用 IM モジュールを提供します。
GTK 2 / GTK 4 用のモジュールは含みません。

`fonts-noto`(通常の Noto ファミリ)と `fonts-noto-extra`(Condensed / Semi /
Extra ウェイト)も用意しています。どちらも上流の Noto 全ファミリを含むため、
インストールサイズが大きくなります。

mozc は `fcitx5` USE フラグが必須です。フラグを設定してからインストールして
ください。設定しない場合、mozc のビルドは意図的に失敗します。

```sh
echo 'mozc fcitx5' >> /etc/zpkg/package.use
zpkg install mozc
```

`mozc` は fcitx/mozc フォークを Bazel でビルドし、fcitx5 アドオン
(`fcitx5-mozc.so`)と `/usr/lib/mozc/mozc_server` をインストールします。
初回ビルドは Bazel と依存モジュールの取得を含むため、時間とディスクを
消費します。

インストール後は fcitx5 を起動し、`fcitx5-configtool` で Mozc を追加します。

```sh
fcitx5 -d
fcitx5-configtool
```

環境変数(`/etc/environment`)の設定を含む詳しい手順は
[日本語入力 (fcitx5 + Mozc)](/docs/desktops/japanese/) にまとめています。

## ページ

- [KDE Plasma 6](/docs/system/desktop/) — 導入、ログイン、サービス
- [Wayland と Xwayland](/docs/desktops/wayland/) — セッション、X11 アプリ、GLX
- [日本語入力 (fcitx5 + Mozc)](/docs/desktops/japanese/) — 導入、環境変数、Mozc の設定
- [デスクトップ環境(詳細)](/docs/desktop/) — チャンネル構成と実装状況

現時点で KDE Plasma 以外のデスクトップ環境は公式には提供していません。
