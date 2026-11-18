---
title: ビルド環境の隔離
description: ZIGNOS の bubblewrap によるビルドサンドボックス。読み取り専用 root、tmpfs、capability 制限、ネットワーク分離。
---

ZIGNOS のレシピは shell スクリプトでビルドします。柔軟な反面、build
スクリプトは任意のコマンドを実行できるため、悪意ある・事故を起こしたレシピが
システムファイルやユーザーデータを変更できてしまいます。

`zpkg` は Linux 上で **bubblewrap (`bwrap`)** を使い、build スクリプトを
サンドボックス内で実行します。bubblewrap は base に同梱されています。

## 何が隔離されるか

| 対象 | 内容 |
|---|---|
| ファイルシステム | `/` は読み取り専用。書き込みできるのは `$ZPKG_CACHE/build/<pkg>` のみ |
| 一時領域 | `/tmp` / `/run` / `/var/tmp` / `/var/lib` / `/var/log` / `/var/spool` は空の tmpfs |
| ユーザーデータ | `/root` / `/home` / `/mnt` / `/media` / `/srv` は空の tmpfs |
| 機密設定 | `/etc/ssh` / `/etc/ssl/private` / `/etc/zpkg` / WiFi 接続設定をマスク。`/etc/shadow` 等は `/dev/null` |
| プロセス | PID / IPC / UTS namespace。hostname は `zignos-build` |
| 権限 | `CAP_CHOWN` / `CAP_FOWNER` / `CAP_DAC_OVERRIDE` / `CAP_FSETID` / `CAP_SYS_CHROOT` のみ。`CAP_SYS_ADMIN` なし |
| 環境変数 | allowlist。ホストの secret やコンパイラ設定は引き継がない(proxy 系のみ例外) |
| ネットワーク | 既定は許可。`BUILD_NET=0` で network namespace に分離 |

`doas` / `sudo` の chown、setuid ビット、`zignos-mkinitramfs` の chroot は
サンドボックス内でも動きます。

## モード

```sh
ZPKG_SANDBOX=auto      # 既定: bwrap があれば隔離、無ければ警告して直接ビルド
ZPKG_SANDBOX=require   # bwrap が無い/使えない場合は失敗
ZPKG_SANDBOX=off       # サンドボックスなし
```

`/etc/zpkg/sandbox.conf` にも書けます。

```ini
SANDBOX=auto
BUILD_NET=1
#BWRAP=/usr/bin/bwrap
```

一時的に無効化する場合:

```sh
zpkg build --no-sandbox <pkg>
zpkg install --no-sandbox <pkg>
```

`auto` で bwrap が見つからない、またはこの環境で sandbox を作れない場合は、
警告を出して従来どおり直接ビルドします。`require` にすると失敗します。

## ネットワーク

ビルド時のネットワークは**既定で許可**されます。再現性と安全性を重視する
場合は、グローバルに拒否できます。

```sh
ZPKG_BUILD_NET=0 zpkg install <pkg>
```

または `/etc/zpkg/sandbox.conf` に `BUILD_NET=0`。

ネットワークが必要なレシピは `build_network` ファイルで個別に許可します。

```text
# recipes/main/age/build_network
1
```

逆に、グローバルが許可でも `build_network 0` でそのレシピだけ拒否できます。
`age` / `fzf` / `restic` は Go モジュールを取得するため `1` を明示しています。

## chroot と stage3

bubblewrap の `pivot_root` は、chroot 先が mount point であることを要求します。
stage3 を展開しただけのディレクトリを素の `chroot` で入ると、bwrap は
サンドボックスを作れません。

`zignos-enter.sh` は private mount namespace を作り、root を bind mount してから
chroot するため、stage3 のディレクトリ chroot でもサンドボックスが動きます。

```sh
./zignos-enter.sh /mnt/zignos
```

素の `chroot` を使う場合、`auto` は警告して直接ビルドにフォールバックします。
`require` にするとエラーになります。

## ビルド環境の記録

source build では、その時点でインストールされているパッケージ集合
(`name@slot-version` のソート済み sha256 と件数)を記録します。

```sh
zpkg info <pkg>
# build: bwrap, network on, env 54 packages (....)
```

サンドボックス内に見えるのはインストール済みシステム全体(読み取り専用)で、
makedepends だけの最小ルートではありません。最小依存ルートは今後の課題です。

## bootstrap

bootstrap の stage2 は bubblewrap がまだ入っていないため、
`ZPKG_SANDBOX=off` で実行します。base の構築が終わると bubblewrap が入り、
以降の `zpkg install` はサンドボックスを使います。

## 制限

- `post_install` / `post_remove` フックはサンドボックス対象外です
  (レシピ署名で信頼する領域)
- ソース tarball の展開は build 前のため対象外です
- CPU / メモリ / ディスクの resource limit は未実装です
- サンドボックスは bubblewrap のみです(unshare/chroot の独自実装はしない)
