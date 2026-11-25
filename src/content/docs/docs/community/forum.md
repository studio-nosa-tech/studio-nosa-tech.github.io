---
title: フォーラム
description: ZIGNOS のユーザーフォーラム (GitHub Discussions) の場所、カテゴリ、投稿のコツ。
---

ZIGNOS のユーザーフォーラムは **GitHub Discussions** で運営しています。
質問、トラブルの相談、要望、作品の共有はこちらへ。不具合報告は Issue を使います。

- [フォーラムを開く](https://github.com/studio-nosa-tech/zignos/discussions)
- [Issue (不具合報告)](https://github.com/studio-nosa-tech/zignos/issues)

閲覧はログインなしでできます。投稿・返信には GitHub アカウントが必要です。

## カテゴリ

GitHub 上のカテゴリ名は英語ですが、用途は次のとおりです。

| カテゴリ | 用途 |
|---|---|
| [Announcements](https://github.com/studio-nosa-tech/zignos/discussions/categories/announcements) | リリース・メンテナンスのお知らせ |
| [Q&A](https://github.com/studio-nosa-tech/zignos/discussions/categories/q-a) | インストール、起動、Plasma、日本語入力などの質問 |
| [Ideas](https://github.com/studio-nosa-tech/zignos/discussions/categories/ideas) | 機能追加・改善の要望 |
| [Show and tell](https://github.com/studio-nosa-tech/zignos/discussions/categories/show-and-tell) | スクリーンショット、導入事例 |
| [General](https://github.com/studio-nosa-tech/zignos/discussions/categories/general) | 雑談 |
| [Polls](https://github.com/studio-nosa-tech/zignos/discussions/categories/polls) | アンケート |

はじめての質問は **Q&A** へ。回答が付いたら、いちばん役に立った返信を
「回答」に採用してください。同じ問題で検索してきた人の助けになります。

## 質問に書くとよい情報

- チャンネル (stable / testing / unstable) と `zpkg --version`
- `uname -r`
- 実行したコマンドと、エラー全文 (省略せずに)
- ビルドの場合: レシピ名と `/var/cache/zpkg/logs/...` のログ
- VM の場合: QEMU / VMware / VirtualBox、ファームウェア (BIOS / UEFI)、GPU (`-vga` の種類)
- デスクトップの場合: セッション (Wayland / X11)、GPU と `VIDEO_CARDS`

## 投稿のルール

- まず検索し、同じ話題があれば新しいスレッドを立てずにそこへ追記する
- 個人情報 (IP アドレス、SSH 鍵、パスワード、ライセンスキー) を貼らない
- 攻撃的な言辞、宣伝、無関係な話題は削除することがあります

不具合の報告は [Issue](https://github.com/studio-nosa-tech/zignos/issues) へ。
フォーラムは「質問・相談・要望・共有」の場所として使ってください。
