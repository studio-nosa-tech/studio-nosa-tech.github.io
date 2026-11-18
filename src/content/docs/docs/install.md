---
title: 実機インストール
description: stage3 tarball を既定とした ZIGNOS の実機インストール。ディスク準備、chroot、カーネル、UEFI GRUB と efibootmgr まで。
---

ZIGNOS の実機インストールは、**stage3 tarball をディスクへ展開し、chroot の中で
カーネルと GRUB を入れる方法を既定**とします。ベースは意図的に最小構成なので、
このガイドでは「何が入っていないか」と「何を自分で入れるか」も含めて説明します。

- **既定: stage3 tarball**(このガイドの 2〜9 章)
- 代替: ZIGNOS イメージから `zignos-install` でコピー(10 章 A)
- 代替: イメージを直接 `dd`(10 章 B)
- レスキュー: SystemRescue から chroot(10 章 C)

> **注意**: `<DISK>` は `/dev/nvme0n1` や `/dev/sda` などの**ディスク全体**、
> `<PART>` は `nvme0n1p1` / `sda1` などのパーティションです。コマンドを実行すると
> 対象ディスクの全データが消えます。必ず `lsblk` で確認してください。

## 対応ファームウェア

| ファームウェア | ディスク | GRUB | 備考 |
|---|---|---|---|
| **UEFI**(既定) | GPT + ESP(FAT32)+ ext4 root | `x86_64-efi` + efibootmgr | Secure Boot は無効化 |
| BIOS/CSM | MBR + ext4 root | `i386-pc` | 2 TiB 超のディスクは不可 |

---

## 1. SystemRescue を用意する

実機作業は **SystemRescue** から行います。BIOS/UEFI の両方で起動でき、
`sfdisk` / `mkfs` / `tar` / `chroot` / `efibootmgr` が揃っています。

- 公式: <https://www.system-rescue.org/>
- 2026-11-17 時点の最新: **SystemRescue 13.03**
- USB メモリは 2 GiB 以上

### USB へ書き込む

```sh
# ダウンロードと検証(例)
curl -LO https://fastly-cdn.system-rescue.org/releases/13.03/systemrescue-13.03-amd64.iso
curl -LO https://fastly-cdn.system-rescue.org/releases/13.03/systemrescue-13.03-amd64.iso.sha256
sha256sum --check systemrescue-13.03-amd64.iso.sha256

# USB へ書き込み(/dev/sdX は USB 全体。間違えるとディスクを壊す)
sudo dd if=systemrescue-13.03-amd64.iso of=/dev/sdX bs=4M status=progress conv=fsync
sync
```

### 起動

1. USB を挿してファームウェアの起動メニューを開く
2. **UEFI 機は UEFI モード**(CSM 無効)、BIOS 機はレガシーモードで起動
3. **Secure Boot を無効**にする(ZIGNOS の GRUB/カーネルは未署名)
4. 起動後、有線 LAN は自動で DHCP。WiFi は `nmtui` で設定

---

## 2. ディスクを準備する

### UEFI(GPT + ESP)の場合

ESP は 512 MiB にします(100 MiB でも足りますが、将来の余裕をみて 512 MiB)。

```sh
sfdisk <DISK> <<'EOF'
label: gpt
start=2048, size=1048576, type=C12A7328-F81F-11D2-BA4B-00A0C93EC93B, name="ZIGNOS ESP"
start=1050624, type=0FC63DAF-8483-4772-8E79-3D69D8477DE4, name="zignos-root"
EOF
partx -u <DISK>

# NVMe は <DISK>p1 / <DISK>p2、SATA は <DISK>1 / <DISK>2
mkfs.vfat -F32 -n ZIGNOSESP <DISK>p1
mkfs.ext4 -L zignos-root <DISK>p2

mkdir -p /mnt/zignos/boot/efi
mount <DISK>p2 /mnt/zignos
mount <DISK>p1 /mnt/zignos/boot/efi
```

### BIOS(MBR)の場合

```sh
sfdisk <DISK> <<'EOF'
label: dos
start=2048, type=83, bootable
EOF
partx -u <DISK>

mkfs.ext4 -L zignos-root <DISK>1
mount <DISK>1 /mnt/zignos
```

---

## 3. stage3 tarball を用意する

stage3 は「カーネルと GRUB を除いた最小ベース」です。現在は公開準備中なので、
開発者向けには build VM で生成します(公開後はダウンロードページの tarball を使えます)。

```sh
# ビルドホストの作業ツリー内
sudo OUT=/var/tmp/zignos-stage3.tar.xz ./make-stage3.sh
sha256sum /var/tmp/zignos-stage3.tar.xz > /var/tmp/zignos-stage3.tar.xz.sha256
```

生成物を USB / SSH で実機へ運び、**展開前にチェックサムを検証**します。

```sh
sha256sum --check zignos-stage3.tar.xz.sha256
```

> 2026-11-18 時点の stage3 は **53 パッケージ / 約 976 MiB** です。
> root はロック済み、SSH ホスト鍵・machine-id・ユーザーは含みません。

---

## 4. stage3 を展開する

```sh
tar -xpf zignos-stage3.tar.xz -C /mnt/zignos
```

`/etc/resolv.conf` はビルド環境のものが入っているため、実機のネットワークに
合わせて上書きします(SystemRescue の 127.0.0.53 スタブは chroot では使えません)。

```sh
printf 'nameserver 1.1.1.1\nnameserver 8.8.8.8\n' > /mnt/zignos/etc/resolv.conf
```

---

## 5. chroot に入る

stage3 には `zignos-enter.sh` は含まれていません。手動でマウントして入るのが確実です。
**UEFI では `/sys` を rbind して efivarfs を chroot から見えるようにします**
(efibootmgr が NVRAM を読み書きするため)。

```sh
mkdir -p /mnt/zignos/{dev,proc,sys,run}
mount --rbind /dev /mnt/zignos/dev
mount --make-rslave /mnt/zignos/dev
mount -t proc proc /mnt/zignos/proc
mount --rbind /sys /mnt/zignos/sys
mount --make-rslave /mnt/zignos/sys
mount --rbind /run /mnt/zignos/run
mount --make-rslave /mnt/zignos/run

chroot /mnt/zignos /bin/bash -l
```

`zignos-enter.sh` を使う場合は、UEFI のときだけ `/sys` の rbind を
手動で追加してください(ヘルパーは sysfs を新規マウントするため efivarfs が
見えないことがあります)。

chroot に入ったら、まず root のパスワードを設定します(stage3 ではロック済み)。

```sh
passwd
```

---

## 6. ベースの初期設定

stage3 にはエディタ・DHCP・SSH・man がありません。設定ファイルは `cat` の
ヒアドキュメントで作れます(必要なら後で `zpkg install vim nano`)。

### ホスト名

```sh
echo zignos > /etc/hostname
```

### タイムゾーン

`tzdata` は入っています。既定は UTC です。

```sh
ln -sf /usr/share/zoneinfo/Asia/Tokyo /etc/localtime
date
```

### キーボード(必要な場合)

```sh
loadkeys jp106
cat > /etc/conf.d/keymaps <<'EOF'
keymap="jp106"
EOF
rc-update add keymaps boot
```

### fstab

UUID は `blkid` で確認します。UEFI では ESP も fstab に登録しておくと、
`grub-install` やカーネル更新時に `/boot/efi` が使えます。

```sh
blkid <DISK>p2     # root の UUID
blkid <DISK>p1     # ESP の UUID(UEFI のみ)

cat > /etc/fstab <<EOF
UUID=<ROOT-UUID> / ext4 defaults 0 0
UUID=<ESP-UUID> /boot/efi vfat defaults 0 0
proc  /proc proc  defaults 0 0
sysfs /sys  sysfs defaults 0 0
EOF
```

BIOS の場合は ESP の行を削除します。`/boot/efi` を常時マウントしたくない場合は
ESP の行をコメントアウトしても構いません(GRUB 導入時だけマウントします)。

---

## 7. カーネルを導入する

```sh
zpkg install linux
```

- `x86_64-generic.config` でビルドされ、`/boot/vmlinuz`、`/boot/initramfs.img`、
  `/usr/lib/modules/7.1.8` が入ります
- 初回はソースをダウンロードしてビルドするため **数分〜十数分**かかります
- 設定を変える場合は
  `/usr/share/zignos/recipes/core/linux/x86_64-generic.config` を編集し、
  `zpkg install -f linux` で再ビルドします

```sh
ls -l /boot/vmlinuz /boot/initramfs.img
ls /usr/lib/modules
```

---

## 8. GRUB を導入する

### UEFI(既定。efibootmgr を使う)

GRUB の `uefi` USE フラグを有効にすると、**efibootmgr と efivar が依存として
自動で入ります**。これが以前の「フォールバックパスに置くだけ」より簡単な点です。

```sh
# UEFI 用にビルド(efibootmgr/efivar も依存で入る)
zpkg use --package grub uefi
zpkg install linux grub

# x86_64-efi モジュールと efibootmgr を確認
ls /usr/lib/grub/x86_64-efi
command -v efibootmgr
```

> すでに GRUB を入れてしまった場合は、USE を変えたあと
> `zpkg upgrade grub` または `zpkg install -f grub` で再ビルドしてください。

`/etc/default/grub` を作ります(シリアルコンソールも有効にする例)。

```sh
cat > /etc/default/grub <<'EOF'
GRUB_DISTRIBUTOR="ZIGNOS"
GRUB_TIMEOUT=5
GRUB_DEFAULT=0
GRUB_CMDLINE_LINUX_DEFAULT="console=tty0 console=ttyS0"
GRUB_CMDLINE_LINUX=""
GRUB_TERMINAL="console serial"
GRUB_SERIAL_COMMAND="serial --unit=0 --speed=115200"
EOF
```

ESP が `/boot/efi` にマウントされていることを確認して、GRUB をインストールします。

```sh
mountpoint /boot/efi || mount <DISK>p1 /boot/efi

/usr/sbin/grub-install \
  --target=x86_64-efi \
  --efi-directory=/boot/efi \
  --bootloader-id=ZIGNOS \
  --recheck

/usr/sbin/grub-mkconfig -o /boot/grub/grub.cfg
```

`grub-install` は efibootmgr が使える環境なら **NVRAM エントリまで自動で作ります**。
確認します。

```sh
efibootmgr -v
```

`Boot####` に `ZIGNOS` があり、`\EFI\ZIGNOS\grubx64.efi` を指していれば完了です。
`BootOrder` の先頭に来ていない場合は、`Boot####` の番号を確認して設定します。

```sh
# 例: ZIGNOS が Boot0003 の場合
efibootmgr --bootorder 0003,0000
```

自動登録されなかった場合(または `--no-nvram` で入れた場合)は、手動で追加します。

```sh
efibootmgr --create \
  --disk <DISK> --part 1 \
  --label ZIGNOS \
  --loader '\EFI\ZIGNOS\grubx64.efi'

efibootmgr -v
```

- `--part 1` は **ESP のパーティション番号**です(NVMe でも `1`)
- `--loader` はバックスラッシュで書きます(シェルではシングルクォート)
- `efibootmgr` が「EFI variables are not supported」と言う場合は、UEFI モードで
  起動していないか、chroot に efivarfs が見えていません。SystemRescue を UEFI で
  起動し直し、`/sys` を rbind してからやり直してください

フォールバック(`/EFI/BOOT/BOOTX64.EFI`)も置きたい場合は、NVRAM が消えたとき用に
スタンドアロン版を作れます(必須ではありません)。

```sh
/usr/bin/grub-mkstandalone -O x86_64-efi \
  -o /boot/efi/EFI/BOOT/BOOTX64.EFI \
  --modules="part_gpt part_msdos fat ext2 normal search search_fs_uuid linux echo serial terminal" \
  "boot/grub/grub.cfg=/boot/grub/grub.cfg"
```

### BIOS(MBR)

```sh
zpkg use --package grub bios
zpkg install linux grub

cat > /etc/default/grub <<'EOF'
GRUB_DISTRIBUTOR="ZIGNOS"
GRUB_TIMEOUT=5
GRUB_CMDLINE_LINUX_DEFAULT="console=tty0 console=ttyS0"
GRUB_TERMINAL="console serial"
GRUB_SERIAL_COMMAND="serial --unit=0 --speed=115200"
EOF

/usr/sbin/grub-install --target=i386-pc --boot-directory=/boot <DISK>
/usr/sbin/grub-mkconfig -o /boot/grub/grub.cfg
```

---

## 9. 初回起動前の仕上げ

### 一般ユーザー

```sh
useradd -m -G wheel -s /bin/bash yourname
passwd yourname
```

`wheel` グループは initscripts が提供します。特権昇格は base では `su` のみです。
`doas` を使うなら:

```sh
zpkg install doas
```

### SSH(任意)

```sh
zpkg install openssh
rc-update add sshd default
install -d -m700 -o yourname -g yourname /home/yourname/.ssh
# /home/yourname/.ssh/authorized_keys を 600 で置く
```

`sshd` は root ログインを無効にして起動します。コンソールの root は復旧用に残ります。

### ネットワーク(任意)

stage3 には DHCP クライアントが入っていません。有線で使うなら:

```sh
zpkg install dhcpcd
rc-update add dhcpcd boot
```

WiFi は firmware と supplicant が必要です。

```sh
zpkg install wpa_supplicant iw linux-firmware
rc-update add wpa_supplicant default
# /etc/conf.d/wpa_supplicant の WPA_IFACE(既定 wlan0)を必要なら変更
```

`linux-firmware` は約 2 GiB あります。必要なファームウェアだけを入れる運用も可能です。

### chroot を抜けて再起動

```sh
exit

umount -R /mnt/zignos/dev
umount -R /mnt/zignos/sys
umount -R /mnt/zignos/run
umount /mnt/zignos/proc
umount /mnt/zignos/boot/efi 2>/dev/null || true
umount /mnt/zignos
sync
reboot
```

ファームウェアの起動メニューで **ZIGNOS** を選びます。UEFI で NVRAM 登録が
うまくいっていない場合は、USB を抜いて再起動し、ファームウェアの一時起動メニューから
`\EFI\ZIGNOS\grubx64.efi` または `\EFI\BOOT\BOOTX64.EFI` を選びます。

---

## 10. 初回起動後

```sh
uname -r                 # 7.1.8
rc-status                # udev / console / console-vga が started
ip addr                  # 有線 DHCP を入れた場合
```

- root のパスワードはインストール時に設定済みです
- ネットワーク・SSH・エディタ・man は必要に応じて `zpkg install`
- 時刻同期: `zpkg install chrony && rc-update add chronyd default`
- システム更新: `zpkg upgrade`

### 代替 A: ZIGNOS イメージから `zignos-install`

ZIGNOS の起動イメージを USB に書き、そこから `zignos-install` で内部ディスクへ
コピーする方法です。ユーザー作成と GRUB 導入まで自動化されます。

```sh
# SystemRescue でイメージを USB へ
dd if=zignos-uefi.img of=/dev/sdX bs=4M status=progress conv=fsync

# ZIGNOS を USB から起動後
lsblk
zignos-install /dev/nvme0n1
```

UEFI で起動した場合は GPT + ESP、BIOS なら MBR になります。`efibootmgr` が
入っていれば NVRAM も登録します。イメージは `make-image.sh` で
生成します(公開配布は準備中)。

### 代替 B: イメージを直接 `dd`

```sh
dd if=zignos-uefi.img of=/dev/nvme0n1 bs=4M status=progress conv=fsync
sync

# root パーティションをディスク全面へ(UEFI は 2、BIOS は 1)
parted /dev/nvme0n1 resizepart 2 100%
partprobe /dev/nvme0n1
e2fsck -f /dev/nvme0n1p2
resize2fs /dev/nvme0n1p2
```

起動後に root でログインし、ユーザーを作成します(初期パスワードはイメージの案内を参照)。

### 代替 C: レスキューと保守

```sh
mount <DISK>p2 /mnt/zignos
mount <DISK>p1 /mnt/zignos/boot/efi   # UEFI

# 設定確認
cat /mnt/zignos/etc/fstab
cat /mnt/zignos/boot/grub/grub.cfg

# chroot して zpkg を操作
mount --rbind /dev /mnt/zignos/dev
mount -t proc proc /mnt/zignos/proc
mount --rbind /sys /mnt/zignos/sys
chroot /mnt/zignos /bin/bash
```

`/etc/fstab` と GRUB の `root=` は **ファイルシステムの UUID** です。ディスクを
コピーした場合は `blkid` で確認して書き換えてください。

---

## ネットワークと WiFi の補足

- 有線: `dhcpcd` を入れて `rc-update add dhcpcd boot`
- WiFi: `wpa_supplicant` + `iw` + `linux-firmware`。`/etc/conf.d/wpa_supplicant` の
  `WPA_IFACE`(既定 `wlan0`)を環境に合わせる
- WiFi ドライバはカーネルモジュールです。起動時もホットプラグも **eudev + kmod** が
  uevent 経由で自動ロードします
- 読み込まれない場合は `lspci -k` / `lsusb` でチップを確認し、`modprobe <driver>`
- `iw dev` でインターフェースが見えない場合は `dmesg | grep -i firmware` を確認

## カーネル設定とカスタマイズ

- 既定は `x86_64_defconfig` + `core/linux/x86_64-generic.config`
- 起動系(ACPI/APIC、SATA AHCI、NVMe、USB/XHCI、VT/VGA/simpledrm、ext4/vfat、
  virtio、主要 NIC)は組み込み、GPU/WiFi/追加 NIC はモジュール
- 変更する場合はレシピの設定ファイルを編集し、`zpkg install -f linux`
- カーネル更新時は initramfs も同時に再生成されます

## トラブルシューティング

### `grub-install` が EFI variables を読めない

- SystemRescue を **UEFI モード**で起動しているか確認
- chroot に `/sys` を rbind しているか確認(`mount --rbind /sys /mnt/zignos/sys`)
- `efibootmgr -v` が動くか確認。動かなければ NVRAM 登録はできないので、
  フォールバック `\EFI\BOOT\BOOTX64.EFI` で起動するか、UEFI 環境で再実行

### NVRAM に ZIGNOS が出ない

```sh
efibootmgr -v
efibootmgr --create --disk <DISK> --part 1 --label ZIGNOS \
  --loader '\EFI\ZIGNOS\grubx64.efi'
efibootmgr --bootorder <ZIGNOSのBoot番号>,<他>
```

### stage3 の root にログインできない

stage3 の root はロックされています。chroot に入って `passwd` で設定してください。

### エディタ / ネットワーク / SSH がない

stage3 は最小ベースです。`zpkg install vim nano dhcpcd openssh` などで追加します。
chroot 内でネットワークを使うには `/etc/resolv.conf` と NIC の設定が必要です。

### `zpkg install linux` が遅い / 失敗する

初回はカーネルソースのダウンロードとビルドが走ります。ネットワークと空き容量
(数 GiB)を確認してください。binpkg リポジトリを設定していればそちらを使います。

### `certs/extract-cert.c: openssl/bio.h: No such file or directory`

古い stage3 では linux のビルド依存に openssl が含まれていませんでした。
カーネル 7.1.8 は `certs/extract-cert` のビルドに OpenSSL のヘッダーを要求します。

```sh
zpkg install openssl
zpkg install linux
```

最新の stage3 / レシピでは linux の `makedepends` に openssl を追加済みです
(openssl のビルドに perl も自動で入ります)。

## 既知の制約

- **Secure Boot 非対応**(GRUB/カーネルは未署名。無効化が必要)
- **LUKS / TPM 非対応**
- **GUI は未収録**(CLI の最小ベース。必要なものを自分で追加)
- **WiFi は firmware 導入後**。`linux-firmware` は約 2 GiB
- **stage3 の公開は準備中**。現在は `make-stage3.sh` で生成
- **x86_64 のみ**。BIOS/UEFI の両方に対応
- root の初期パスワードは配布イメージの案内を参照し、**最初に変更**する

---

## インストール完了! — Fastfetch を投稿しよう

インストールが完了したら、X(旧Twitter)で **[@amanoremi](https://x.com/amanoremi)** を
メンションして、`fastfetch` の画面を投稿してください。**きっと反応してくれるはずです!**

`fastfetch` は stage3 には含まれていないので、まずインストールします。

```sh
zpkg install fastfetch
fastfetch
```

ZIGNOS のロゴと一緒に、OS・カーネル・CPU・メモリ・ディスクなどの情報が表示されます。
自慢の構成、工夫した点、動かしてみた感想なども添えてください。`#ZIGNOS` を付けると
見つけてもらいやすくなります。

![QEMU 上の ZIGNOS で fastfetch を実行した画面](images/fastfetch-qemu.png)

*開発環境の QEMU で実行した fastfetch*
