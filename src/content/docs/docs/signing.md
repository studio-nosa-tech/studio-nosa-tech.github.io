---
title: パッケージ署名と検証
description: ZIGNOS の Ed25519 署名による binpkg リポジトリとレシピツリーの検証、信頼済み鍵、ロールバック・期限対策。
---

ZIGNOS は、配布されるパッケージとレシピの完全性を **Ed25519 の detached
signature** で検証します。GPG や外部ライブラリには依存せず、`zpkg` の単一
バイナリで鍵生成・署名・検証を行います。

## 何を守るか

| 対象 | 署名されるもの | 守るもの |
|---|---|---|
| binpkg リポジトリ | `index.json` の実バイト列 | パッケージ本体・manifest・バージョン情報の改ざん |
| レシピツリー | `recipes.manifest`(全ファイルの sha256/size/mode) | レシピ・ビルドスクリプト・同梱パッチの改ざん |
| ロールバック | `generation` と最終受理状態 | 古い署名済み index/manifest への差し替え |
| 期限 | `expires` | 長期間放置された署名の再利用 |

レシピの `checksums` は manifest に含まれるため、**レシピツリーの署名 →
ソース tarball の sha256** まで検証が連鎖します。

## 鍵の生成と管理

```sh
# 署名用の鍵ペア(秘密鍵は 0600、既存ファイルは上書きしない)
zpkg key generate --private ~/zignos-signing.key --public ~/zignos-signing.pub

# クライアント: 公開鍵を信頼する
zpkg key import zignos-signing.pub
zpkg key list
```

- key ID は Ed25519 公開鍵 32 バイトの SHA-256(64 hex)です
- 信頼する鍵は `$ZPKG_ROOT/etc/zpkg/trusted.d/*.pub` に置かれます
- TOFU(初回接続時の自動信頼)はしません。**公開鍵の fingerprint は別経路で
  確認してから import** してください
- 秘密鍵はリポジトリやレシピツリーの中に置かないでください。`zpkg mkindex` と
  `zpkg sign-recipes` は、秘密鍵が対象ディレクトリ内にある場合を拒否します
- 鍵を替えるときは、新しい公開鍵を import してから新しい鍵で署名し、最後に
  古い鍵を `zpkg key remove <keyid>` で外します

## binpkg リポジトリの署名

推奨レイアウト:

```text
binrepo/
├── index.json
├── index.json.sig
├── keys/<keyid>.pub
└── packages/
    ├── gcc.pkg.tar.gz
    ├── gcc.manifest
    └── gcc.meta.json
```

```sh
zpkg mkindex --key ~/zignos-signing.key \
  --generation 42 --expires 90d /srv/binrepo
```

- `index.json` は schema 2 で、`generation` / `expires` / `keyid` を持ちます
- `index.json.sig` は `index.json` の実バイト列への署名です
- 各エントリの `sha256` と `manifest_sha256` が binpkg 本体と file list を拘束します
- `keys/<keyid>.pub` も自動で出力されます。配布する場合は、この鍵の fingerprint を
  別経路(Web サイト・リリースノート等)で公開してください

`--generation` を省略すると、既存 `index.json` の generation + 1 になります。
新規リポジトリでは 1 から始まります。`--expires` は RFC3339 または `90d` /
`720h` 形式です(既定 +90 日)。

## レシピツリーの署名

```sh
zpkg sign-recipes --key ~/zignos-signing.key \
  --generation 42 --expires 90d /path/to/zignos-recipes
```

`recipes.manifest` は `.git` と署名自身を除く全 regular file の
`path` / `sha256` / `size` / `mode` を列挙します。`recipes.manifest.sig` が
その manifest の実バイト列への署名です。

`zpkg sync` は展開後のステージングツリーに対して次を検証します。

- manifest の署名と key ID
- 期限と generation
- 全ファイルの sha256 / size(Unix では mode も)
- manifest にない余計なファイルがないこと

ディレクトリ、レシピ tarball、stage3 tarball のどの入力でも同じ検証が行われます。

## クライアント側の検証

```sh
# 信頼済み鍵を登録
zpkg key import zignos-signing.pub

# 署名済みレシピツリーへ更新
zpkg sync --from zignos-recipes.tar.xz

# binpkg リポジトリを使う
export ZPKG_BINREPO=https://example.com/zignos/binpkgs
zpkg install <pkg>
```

検証に失敗した場合、`install` や `sync` は**エラーで停止**します。改ざんされた
リポジトリからソースビルドへ黙ってフォールバックすることはありません。

### ロールバックと期限

最後に受理した generation と SHA-256 は
`$ZPKG_DB/.security.json` に保存されます。

- 新しい generation が保存値より小さい → ロールバックとして拒否
- 同じ generation で内容が違う → 同一世代のすり替えとして拒否
- `expires` を過ぎている → 拒否

### 明示的な例外

| 設定 | 意味 |
|---|---|
| `--allow-unsigned` / `ZPKG_ALLOW_UNSIGNED=1` | 署名が**存在しない**場合だけ許可。壊れた署名は常に拒否 |
| `ZPKG_ALLOW_EXPIRED=1` | 期限切れだけ許可。署名とロールバック検証は残る |

`/etc/zpkg/security.conf` にも同じ設定を書けます。

```ini
TRUSTED_KEYS=/etc/zpkg/trusted.d
ALLOW_UNSIGNED=0
ALLOW_EXPIRED=0
```

## 現在の配布物について

署名の仕組みは zpkg に実装済みですが、公式の署名鍵はまだ運用を開始していません。
そのため、現行の stage3 / レシピ tarball は未署名です。未署名の配布物を
`zpkg sync` する場合は、明示的に例外を指定してください。

```sh
zpkg sync --from zignos-recipes-....tar.xz --allow-unsigned
```

公式鍵の生成・公開後は、`zpkg key import` で信頼してから `--allow-unsigned`
なしで運用する形に移行します。鍵の生成は `zpkg key generate` で行えます。

## 限界

- 秘密鍵の漏洩や root 権限の奪取は防げません
- 鍵失効リスト(CRL)は未対応です。鍵のローテーションで運用します
- 初回の信頼は fingerprint の out-of-band 確認に依存します
- Secure Boot(GRUB/kernel の署名)はパッケージ署名とは別の仕組みで、未対応です
- GPG/OpenPGP は未対応です。署名 envelope の `algorithm` を拡張して将来追加します
