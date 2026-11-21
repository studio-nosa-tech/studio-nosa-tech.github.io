---
title: コントリビュート
description: ZIGNOS のリポジトリ構成、レシピ変更の流れ、バグ報告とドキュメント修正の方法。
---

ZIGNOS は [Studio NØSa.](https://studio-nosa.live/) が開発しています。
公開しているレシピと公式サイトは GitHub で確認・改善できます。

## リポジトリ

| リポジトリ | 内容 | 公開 |
|---|---|---|
| [zignos-recipes](https://github.com/studio-nosa-tech/zignos-recipes) | stable / testing / unstable のレシピ | 公開 |
| [studio-nosa-tech.github.io](https://github.com/studio-nosa-tech/studio-nosa-tech.github.io) | この公式サイト | 公開 |
| `zignos` | 設計文書とロードマップ | 非公開 |
| `zpkg` | パッケージマネージャ本体 | 非公開 |
| `zignos-build` | bootstrap・stage3 / イメージ作成 | 非公開 |

## レシピを変更する

レシピは `zignos-recipes/<channel>/{core,main,desktop}/<package>/` にあります。

1. 既存の近いレシピをコピーして、`version` / `sources` / `checksums` / `build` を用意する
2. 依存は `depends` / `makedepends` に明示する
3. 内容を変えたら `revision` を上げる
4. 変更は **unstable → testing → stable** の順に検証する
5. ビルドログと、可能なら QEMU / 実機での確認結果を添える

ビルドと依存解決の詳細は [zpkg 設計](/docs/design-pkg/)、
レシピツリーの同期は [zpkg 設定](/docs/zpkg-config/) を参照してください。

## バグを報告する

GitHub の Issue で、次の情報を添えてください。

- `zpkg info <package>` の出力
- 使用チャンネル(`stable` / `testing` / `unstable`)
- `uname -r` と `zpkg --version` 相当の情報
- 失敗したコマンドとビルドログ(`/var/cache/zpkg/logs/...`)
- QEMU の場合は起動方法と GPU / ファームウェア

セキュリティ上の問題は、公開 Issue ではなく開発元へ直接連絡してください。

## ドキュメントを直す

このサイトの Markdown は
[studio-nosa-tech.github.io](https://github.com/studio-nosa-tech/studio-nosa-tech.github.io)
にあります。誤字、古いバージョン、リンク切れの修正は歓迎します。
リリース情報は `src/data/release.json` を参照しているため、数値を直接書き換える
代わりにマニフェストを更新してください。

## コミュニティ

現在の公開窓口は GitHub です。チャットやフォーラムはありません。
詳しくは [コミュニティ](/docs/faq/community/) を参照してください。
