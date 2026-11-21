---
title: コミュニティ
description: ZIGNOS の公開窓口、GitHub、バグ報告、コントリビュートの参加方法。
---

## 公開窓口はどこですか?

現在の公式窓口は GitHub です。

- [Studio NØSa. GitHub](https://github.com/studio-nosa-tech)
- [zignos-recipes](https://github.com/studio-nosa-tech/zignos-recipes)
- [公式サイトのリポジトリ](https://github.com/studio-nosa-tech/studio-nosa-tech.github.io)

チャット、フォーラム、メーリングリストはありません。

## バグはどこに報告しますか?

GitHub の Issue を使ってください。次の情報があると調査が早くなります。

- 使用チャンネルと `zpkg` のバージョン
- `uname -r`
- 実行したコマンドとエラー全文
- ビルドログ(`/var/cache/zpkg/logs/...`)
- QEMU の場合は起動方法、GPU、ファームウェア

## レシピを追加・修正できますか?

はい。`zignos-recipes` の変更は Issue / Pull Request で提案できます。
ビルド確認と、可能なら QEMU / 実機での動作確認を添えてください。

## ドキュメントの誤りを見つけました

公式サイトのリポジトリへ Issue / Pull Request を送ってください。
リリース情報は `src/data/release.json` を参照しているため、数値の直接修正ではなく
マニフェストの更新が必要です。

## サポートはありますか?

個人開発の alpha プロジェクトのため、無償の個別サポートは保証していません。
公開 Issue とドキュメントを一次情報としてください。
