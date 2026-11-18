---
title: stage3 tarball
description: ZIGNOS の stage3 tarball をディスクへ展開し、chroot して zpkg でカーネルと GRUB を導入する手順。
---

ZIGNOS の **stage3 tarball** は、Gentoo / Exherbo の stage3 と同じ位置づけの
「カーネル抜きの最小ベースシステム」です。展開して chroot し、その中で zpkg を
使ってカーネルとブートローダーを導入します。

- 含むもの: `zignos-build/base.list` の**依存クロージャ**から linux と grub を除いた
  **51 パッケージ**(glibc / gcc / binutils / make / bash / coreutils / tar / gzip / xz /
  bzip2 / pkgconf / busybox / openrc / initscripts / util-linux / shadow / e2fsprogs /
  kbd / tzdata / eudev / kmod / gperf / dosfstools / zpkg / ca-certificates と、その依存・makedepends。
  meson / ninja / python3 / go など、ソースビルドに必要なものも含む)
- 含まないもの: カーネル、initramfs、カーネルモジュール、GRUB、ブート設定、
  ユーザーデータ、キャッシュ、SSH ホスト鍵、machine-id、root パスワード(ロック済み)。
  SSH / DHCP / WiFi / エディタ / man もベースには含まれない(Gentoo 流。chroot 後に
  `zpkg install` で追加する)
- 同梱: レシピツリー `/usr/share/zignos/recipes`、`/etc/zignos-stage3`(ビルド情報)、
  空の `/boot`、fstab の雛形

> 2026-11-18 の実測: **974 MiB(.tar.xz)/ 51 パッケージ**(M28 のベース最小化後)。
> 旧構成(2026-11-17)は 2.1 GiB / 86 パッケージだった。
> chroot 後に `zpkg install linux grub` でカーネルとブートローダーを導入する
> (linux の依存である bison/bc/elfutils/initramfs もこのときソースからビルドされる。kmod は eudev のため stage3 に含まれる)。

## 配布

stage3 のダウンロードは**準備中(Coming soon)**です。公開時は
[ダウンロードページ](/download/)とニュースで案内します。

現在の stage3 は 51 パッケージ / 約 974 MiB で、sha256 チェックサムを添付します。

## ビルド

build VM(`$ZIGNOS_ROOT` がマウント済み)で:

```sh
sudo ./make-stage3.sh
# 出力: ./zignos-stage3-YYYYMMDD-x86_64.tar.xz と .sha256
# 任意: ZIGNOS_ROOT=/mnt OUT=/var/tmp/stage3.tar.xz sudo -E ./make-stage3.sh
```

`make-stage3.sh` は `$ZIGNOS_ROOT` をコピーし、**base.list の依存クロージャ**
(chroot 内の `zpkg depends` で計算)に無いパッケージ(ツール類)と linux/grub を
**zpkg remove** で外してから固めます。DB と中身が一致した状態になります。

## 使い方(Gentoo のインストールに近い流れ)

`<DISK>` は `/dev/sda` や `/dev/nvme0n1`、`<PART>` は `sda1` / `nvme0n1p1` など。
**対象ディスクの全データが消えます。**

### 1. ディスクを準備する

BIOS の場合(SystemRescue などから):

```sh
sfdisk <DISK> <<'EOF'
label: dos
start=2048, type=83, bootable
EOF
partx -u <DISK>
mkfs.ext4 -L zignos-root <PART>
mount <PART> /mnt/zignos
```

UEFI の場合(GPT + ESP):

```sh
sfdisk <DISK> <<'EOF'
label: gpt
start=2048, size=204800, type=C12A7328-F81F-11D2-BA4B-00A0C93EC93B, name="ZIGNOS ESP"
start=206848, type=0FC63DAF-8483-4772-8E79-3D69D8477DE4, name="zignos-root"
EOF
partx -u <DISK>
mkfs.vfat -F32 -n ZIGNOSESP <DISK>1     # NVMe は p1
mkfs.ext4 -L zignos-root <DISK>2        # NVMe は p2
mount <DISK>2 /mnt/zignos
mkdir -p /mnt/zignos/boot/efi
mount <DISK>1 /mnt/zignos/boot/efi
```

### 2. stage3 を展開する

```sh
tar -xpf zignos-stage3-*-x86_64.tar.xz -C /mnt/zignos
cp /etc/resolv.conf /mnt/zignos/etc/resolv.conf   # ネットワーク用に上書き
```

### 3. chroot に入る

`zignos-enter.sh`(zignos-build リポジトリ)が /dev, /proc, /sys, /run を
マウントして chroot し、終了時に片付けます。

```sh
zignos-enter.sh /mnt/zignos
```

手動で入る場合:

```sh
for v in dev proc sys run; do mount --bind /$v /mnt/zignos/$v; done
chroot /mnt/zignos /bin/bash -l
```

### 4. カーネルとブートローダーを zpkg で導入する

```sh
# root パスワード(stage3 ではロックされている)
passwd

# カーネル + モジュール + initramfs(/boot に生成される)
# 続けて GRUB(USE フラグでファームウェアを選ぶ。指定なしは両方)
#   BIOS 機: zpkg use --package grub bios
#   UEFI 機: zpkg use --package grub uefi   (efibootmgr も依存で入る)
zpkg install linux grub

# ルートファイルシステムの UUID を確認して fstab を書く
blkid <PART>
cat > /etc/fstab <<EOF
UUID=<ROOT-UUID> / ext4 defaults 0 0
proc  /proc proc  defaults 0 0
sysfs /sys  sysfs defaults 0 0
EOF
```

- `linux` はカーネル設定 `x86_64-generic.config` でビルドされ、
  `/boot/vmlinuz` と `/boot/initramfs.img`、`/usr/lib/modules/7.1.8` を導入します
- 設定を変えたいときは `/usr/share/zignos/recipes/core/linux/x86_64-generic.config`
  を編集して `zpkg install -f linux`
- ソースはネットワークから取得します(レシピは同梱済み)

### 5. ブートローダーを設定する

#### BIOS(MBR)

```sh
grub-install --target=i386-pc --boot-directory=/boot <DISK>
```

`/boot/grub/grub.cfg` を書きます(`<ROOT-UUID>` は `blkid` の値):

```sh
cat > /boot/grub/grub.cfg <<EOF
serial --unit=0 --speed=115200
terminal_input serial console
terminal_output serial console
set timeout=5
set default=0
search --no-floppy --fs-uuid --set=root <ROOT-UUID>
menuentry "ZIGNOS" {
	linux /boot/vmlinuz root=UUID=<ROOT-UUID> console=tty0 console=ttyS0
	initrd /boot/initramfs.img
}
EOF
```

#### UEFI(GPT + ESP)

ESP が `/boot/efi` にマウントされている前提で、GRUB のスタンドアロン
バイナリ(設定埋め込み)を置きます。

```sh
mkdir -p /boot/efi/EFI/BOOT
cat > /tmp/grub.cfg <<EOF
serial --unit=0 --speed=115200
terminal_input serial console
terminal_output serial console
set timeout=5
set default=0
search --no-floppy --fs-uuid --set=root <ROOT-UUID>
menuentry "ZIGNOS" {
	linux /boot/vmlinuz root=UUID=<ROOT-UUID> console=tty0 console=ttyS0
	initrd /boot/initramfs.img
}
EOF
grub-mkstandalone -O x86_64-efi \
	-o /boot/efi/EFI/BOOT/BOOTX64.EFI \
	--modules="part_gpt part_msdos fat ext2 normal search search_fs_uuid linux echo serial terminal" \
	"boot/grub/grub.cfg=/tmp/grub.cfg"
```

ファームウェアのフォールバックパス(`/EFI/BOOT/BOOTX64.EFI`)を使うため、
NVRAM への登録(`efibootmgr`)は不要です。Secure Boot は無効にしてください
(GRUB/カーネルは未署名)。

### 6. 初回起動前の仕上げ

```sh
# 一般ユーザー(wheel 所属。doas は zpkg install doas で追加)
useradd -m -G wheel -s /bin/bash <user>
passwd <user>
install -d -m700 -o <user> -g <user> /home/<user>/.ssh
# authorized_keys を置く場合は 600

# ホスト名・キーボードなど
echo zignos > /etc/hostname
loadkeys jp106        # 必要なら
```

`/boot/efi` を起動後もマウントしたい場合は、`blkid` で ESP の UUID を調べて
fstab に `UUID=... /boot/efi vfat defaults 0 0` を追加します。

chroot を抜けて(`exit`)、`umount -R /mnt/zignos` してから再起動します。

## stage3 / seed / イメージの違い

| 形態 | 中身 | 用途 |
|---|---|---|
| **stage3**(本ドキュメント) | base.list の依存クロージャ − linux/grub(51)。カーネルなし | 自分でディスクへ展開し、chroot して zpkg で完成させる(Gentoo 流) |
| **seed**(`make-seed.sh`) | 実行中のフルシステム | 開発者が既存システムを複製・拡張する |
| **イメージ**(`make-image.sh`) | 起動可能な完成ディスク像(BIOS/UEFI) | dd してすぐ起動する |
| **installer**(`zignos-install`) | 実行中システムを別ディスクへコピー | USB から起動して内部ディスクへ導入する |

## 注意

- tarball の root は **ロック**されています。chroot 後に `passwd` で設定してください
- `/etc/resolv.conf` はビルド時のものが入ります。ネットワーク環境に合わせて上書きを
- stage3 は **usr-merged**(`/bin`, `/sbin`, `/lib` は `/usr` への symlink)
- `zpkg install linux` は初回にソースをダウンロードしてビルドします
  (数分〜十数分。binpkg リポジトリを設定していればそちらを使います)
- UEFI でインストールする場合は、stage3 を展開する前に ESP を作成して
  `/mnt/zignos/boot/efi` にマウントしておいてください
