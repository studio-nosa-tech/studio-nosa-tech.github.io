---
title: stage3 tarball
description: ZIGNOS の stage3 tarball の中身・ビルド・配布・注意点。実機インストールは install ガイドを参照。
---

ZIGNOS の **stage3 tarball** は、カーネルとブートローダーを除いた
「chroot 可能な最小ベース」です。実機インストールの**既定の方法**であり、
ディスクへ展開して chroot し、その中で `zpkg` を使ってカーネルと GRUB を導入します。

> **実際のインストール手順は [実機インストール](/docs/install/) にまとめています。**
> このページは tarball の中身・ビルド・配布・注意点のリファレンスです。

## 中身

- `base.list` の**依存クロージャ**から linux と grub を除いた
  **{{stage3.package_count}} パッケージ**({{build_date}} 時点 / 約 {{stage3.size_mib}} MiB):
  glibc / gcc / binutils / make / bash / coreutils / tar / gzip / xz / bzip2 /
  pkgconf / busybox / openrc / initscripts / eudev / kmod / gperf / util-linux /
  shadow / e2fsprogs / kbd / tzdata / inetutils / procps / dosfstools / zpkg /
  ca-certificates / bubblewrap と、その依存・makedepends
- PAM 対応の `login` と `/etc/pam.d`(login / su / passwd / system-auth /
  system-login / system-local-login)。開発ツリーの最新は **r15**
  (2026.11.20-alpha / 55 パッケージ / 976 MiB、SHA-256
  `0f54ff44cae3491b77282583bbf326667d1f603bc24116c8283895723feeaac0`)
- meson / ninja / python3 / go など、ソースビルドに必要なものも含む
- **含まないもの**: カーネル、initramfs、カーネルモジュール、GRUB、ブート設定、
  ユーザーデータ、キャッシュ、SSH ホスト鍵、machine-id、root パスワード(ロック済み)
- SSH / DHCP / WiFi / エディタ / man は含まれない(Gentoo 流。chroot 後に
  `zpkg install` で追加する)
- 同梱: レシピツリー `/usr/share/zignos/recipes/stable/{core,main,desktop}`、
  `/etc/zpkg/make.conf`(`CHANNEL=stable`)、`/etc/zignos-stage3`(ビルド情報)、
  空の `/boot`、fstab の雛形(root 行は未記載。
  `/mnt/zignos/usr/sbin/zignos-fstab /mnt/zignos` で生成するか `blkid` の
  UUID を記入する。間違った UUID を有効にすると `/` が read-only で起動する)
- 署名済みツリーでは `recipes.manifest` / `recipes.manifest.sig` も同梱される。
  現行の {{stage3.revision}} は公式署名鍵が未運用のため未署名。stage3 の
  `/etc/zpkg/sync.conf` が `RECIPEALLOWUNSIGNED=1` を設定している
  (詳細は [パッケージ署名と検証](/docs/signing/))。zpkg は {{zpkg.version}} で、
  DB には provenance と SPDX SBOM も含まれる
- `/etc/zpkg/sync.conf` は既定で GitHub のレシピリポジトリを指す。
  `zpkg sync` は `.zpkg-git` の commit とリモート HEAD を比較し、変更がある
  ときだけ shallow clone する。レシピ tarball を手動で作る必要はない。
  private リポジトリの場合は git の credential helper か SSH 鍵が必要
- testing / unstable は同梱されない。`zpkg sync` で全チャンネルを取得してから
  `zpkg channel testing` で切り替える
  (詳細は [リリースチャンネル](/docs/channels/))

> 旧構成(2026-11-17)は 2.1 GiB / 86 パッケージだった。現在は最小ベース化と
> eudev / tzdata / inetutils / procps の追加を経て {{stage3.package_count}} パッケージ / {{stage3.size_mib}} MiB。

## 配布

- stage3 の一般配布は**準備中(Coming soon)**。公開時はサイトの
  ダウンロードページと GitHub Releases で案内する
- 現在は開発者向けに `make-stage3.sh` で生成する。実際のファイル名・SHA-256 は
  リリースマニフェスト(`/releases.json`、[仕様](/docs/release-manifest/))を参照
- GitHub の 1 ファイル 2 GiB 制限があるため、公開時は分割して添付する

## ビルド

build VM(`$ZIGNOS_ROOT` がマウント済み)で:

```sh
sudo OUT=/var/tmp/zignos-stage3.tar.xz ./make-stage3.sh
sha256sum /var/tmp/zignos-stage3.tar.xz > /var/tmp/zignos-stage3.tar.xz.sha256
```

`make-stage3.sh` は `$ZIGNOS_ROOT` をコピーし、**base.list の依存クロージャ**
(chroot 内の `zpkg depends` で計算)に無いパッケージ(ツール類)と linux/grub を
`zpkg remove` で外してから固めます。DB と中身が一致した状態になります。

## クイックスタート

詳細(パーティション作成、chroot、UEFI GRUB/efibootmgr、初回設定)は
**[実機インストール](/docs/install/)** を参照してください。要点だけ:

```sh
# 1. ディスクを準備(UEFI: GPT + ESP / BIOS: MBR)
# 2. 展開
tar -xpf zignos-stage3.tar.xz -C /mnt/zignos

# 3. chroot(UEFI では /sys を rbind して efivarfs を見せる)
mount --rbind /dev /mnt/zignos/dev
mount -t proc proc /mnt/zignos/proc
mount --rbind /sys /mnt/zignos/sys
chroot /mnt/zignos /bin/bash -l

# 4. root パスワード(ロック解除)
passwd

# 5. カーネルと GRUB
#    UEFI: zpkg use --package grub uefi && zpkg install linux grub
#    BIOS: zpkg use --package grub bios && zpkg install linux grub

# 6. UEFI の GRUB 登録(efibootmgr は uefi USE の依存で入る)
grub-install --target=x86_64-efi --efi-directory=/boot/efi \
  --bootloader-id=ZIGNOS --recheck
grub-mkconfig -o /boot/grub/grub.cfg
efibootmgr -v
```

## 注意

- root は**ロック**されています。chroot 後に `passwd` で設定してください
- `/etc/resolv.conf` はビルド時のものが入ります。ネットワーク環境に合わせて上書きする
- stage3 は **usr-merged**(`/bin`, `/sbin`, `/lib` は `/usr` への symlink)
- `zignos-enter.sh` は tarball に含まれません。開発者向けリポジトリから持ってくるか、
  上記のように手動でマウントして chroot します
- **ビルドのサンドボックスを使うなら `zignos-enter.sh` を推奨**します。private
  mount namespace 内で root を bind mount してから chroot するため、bubblewrap の
  `pivot_root` が動きます。素の `chroot` では `zpkg` が警告してサンドボックスを
  無効化します
- **UEFI では `/sys` を rbind** してください。efivarfs が chroot から見えないと
  `efibootmgr` が NVRAM を読み書きできません
- `zpkg install linux` は初回にソースをダウンロードしてビルドします
  (数分〜十数分。binpkg リポジトリを設定していればそちらを使います)
- UEFI でインストールする場合は、stage3 を展開する前に ESP を作成して
  `/mnt/zignos/boot/efi` にマウントしておいてください

## stage3 / seed / イメージの違い

| 形態 | 中身 | 用途 |
|---|---|---|
| **stage3**(本ドキュメント) | base.list の依存クロージャ − linux/grub({{stage3.package_count}}) | 既定の実機インストール。自分で展開・chroot して完成させる |
| **seed**(`make-seed.sh`) | 実行中のフルシステム | 開発者が既存システムを複製・拡張する |
| **イメージ**(`make-image.sh`) | 起動可能な完成ディスク像(BIOS/UEFI) | dd してすぐ起動する |
| **installer**(`zignos-install`) | 実行中システムを別ディスクへコピー | USB から起動して内部ディスクへ導入する |
