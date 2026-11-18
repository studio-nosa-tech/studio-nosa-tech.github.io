---
title: 実機インストール
description: SystemRescue を使った BIOS / UEFI 実機インストール、zignos-install、WiFi、カーネル設定。
---

このドキュメントは、ZIGNOS を**実機**(ノート PC・デスクトップ・サーバ)へ
インストールする手順をまとめたものです。QEMU での起動確認は
`zignos-build/qemu-test.sh`(開発者向け)を参照してください。

> **現状の対応範囲(2026-11-18)**
> - **BIOS/MBR と UEFI/GPT の両方**に対応しました(イメージは `UEFI=1` で UEFI 版を生成)
> - カーネルは **x86_64_defconfig ベースの汎用設定**(ACPI/SATA/NVMe/USB/VT/VGA/
>   UEFI GOP framebuffer + 主要 NIC)で、多くの PC で起動できます。GPU/WiFi/追加 NIC は
>   モジュールとして同梱され、eudev が uevent 経由で kmod から自動ロードします
> - **initramfs** が root を `root=UUID=` で解決して `switch_root` します
> - UEFI は `/EFI/BOOT/BOOTX64.EFI` のフォールバックパスで起動し、`efibootmgr` が
>   あればインストーラが NVRAM エントリも登録します(ベースには含まない)
> - **ベースは最小構成**(Gentoo の @system 相当、依存込み 57 パッケージ)。
>   SSH / DHCP / エディタ / man は入っていないので、必要なものを `zpkg install` します
> - 未対応: Secure Boot(無効化が必要)、LUKS/TPM
> - 実機での動作検証はこれからです。問題があれば `dmesg` とカーネル設定
>   (`core/linux/x86_64-generic.config`)を確認してください

## 推奨 Live ISO: SystemRescue

実機作業のためのレスキュー環境として **SystemRescue** を推奨します
(旧名 SystemRescueCD。Arch Linux ベース)。

- 公式: <https://www.system-rescue.org/>
- 2026-11-17 時点の最新: **SystemRescue 13.03**(2026-11-07 リリース、1368 MiB)
- BIOS/レガシーと UEFI の両方で起動可能。`dd`・`parted`・`growpart`・`resize2fs`・
  `chroot`・`nmcli`/`nmtui`・`gpg` など、このガイドで使うツールが一通り入っている
- カーネルが新しいため、NVMe・USB・WiFi の認識確認にも使える

推奨する理由:

1. ZIGNOS のイメージ書き込み(`dd`)とパーティション操作を同じ環境で完結できる
2. ZIGNOS が起動しないときのレスキュー(mount + chroot)にそのまま使える
3. ローカルコンソール(VGA)とシリアルの両方で操作できる

### 入手と検証

```sh
# ダウンロード(高速な CDN ミラー)
curl -LO https://fastly-cdn.system-rescue.org/releases/13.03/systemrescue-13.03-amd64.iso
curl -LO https://fastly-cdn.system-rescue.org/releases/13.03/systemrescue-13.03-amd64.iso.sha256

# チェックサム検証
sha256sum --check systemrescue-13.03-amd64.iso.sha256

# 署名検証(任意だが推奨)
#   公開鍵: https://www.system-rescue.org/security/signing-keys/gnupg-pubkey-fdupoux-20210704-v001.pem
gpg --import gnupg-pubkey-fdupoux-20210704-v001.pem
gpg --verify systemrescue-13.03-amd64.iso.asc systemrescue-13.03-amd64.iso
```

> SourceForge のミラーを使う場合は
> `https://sourceforge.net/projects/systemrescuecd/files/sysresccd-x86/13.03/systemrescue-13.03-amd64.iso/download`
> から取得できます。

### USB メモリへの書き込み

Linux / macOS:

```sh
lsblk                      # 書き込み先を必ず確認(例: /dev/sdb)
sudo umount /dev/sdb* 2>/dev/null
sudo dd if=systemrescue-13.03-amd64.iso of=/dev/sdb bs=4M status=progress conv=fsync
sync
```

Windows:

- **Rufus** を推奨。パーティション方式 **MBR**、ターゲット **BIOS または UEFI**、
  ファイルシステム FAT32、ISO モードで書き込む(BIOS/UEFI 両対応になる)
- または SystemRescue USB writer(AppImage)を使う

### SystemRescue の起動

1. USB を挿して電源投入 → ブートメニュー(F12/F11/Esc など)で USB を選択
2. 作業する ZIGNOS イメージに合わせたモードで起動する
   (BIOS 版なら CSM/レガシー、UEFI 版なら UEFI。SystemRescue は両対応)
3. ファームウェア設定で **Secure Boot を無効**にする(ZIGNOS の GRUB/カーネルは未署名)
4. SystemRescue が起動したら、必要に応じて `nmtui` でネットワークを設定
   (有線なら自動で DHCP。WiFi は `nmtui` または `iwctl`)

## 準備するもの

| もの | 目安 | 備考 |
|---|---|---|
| ターゲットディスク | BIOS: 12 GiB / UEFI: 12 GiB+ | BIOS は MBR(2 TiB まで)、UEFI は GPT + 100MiB ESP |
| SystemRescue USB | 2 GiB 以上 | 上記 |
| ZIGNOS イメージ | 12 GiB(スパース) | `zignos-build/make-image.sh`(開発者向け・非公開)で生成。公開配布は準備中 |
| ZIGNOS 起動用 USB(方法 B) | 12 GiB 以上 | イメージを `dd` したもの |
| 有線 LAN | - | WiFi は firmware 導入後(`linux-firmware`) |

### ZIGNOS イメージの用意

現時点では公開イメージはありません。ビルドホスト(または build VM)で生成します。
**ファームウェアに合ったイメージを選んでください**(両対応のハイブリッドでは
ありません)。

```sh
# zignos-build リポジトリ内で

# BIOS/レガシー(MBR、1 パーティション)
sudo ZIGNOS_ROOT=/mnt OUT=/var/tmp/zignos-bios.img ./make-image.sh

# UEFI(GPT、100MiB ESP + ext4 root)
sudo ZIGNOS_ROOT=/mnt OUT=/var/tmp/zignos-uefi.img UEFI=1 ./make-image.sh

sha256sum /var/tmp/zignos-*.img | tee zignos-images.sha256
```

UEFI 版の生成にはホストに `mkfs.vfat`(dosfstools)と `losetup` が必要です。
生成したイメージを USB メモリや SSH で実機へ運びます(12 GiB あるので、
`gzip`/`xz` で圧縮すると転送が楽です)。

```sh
# 例: 圧縮して転送
gzip -c zignos-uefi.img | ssh user@target 'cat > zignos-uefi.img.gz'
```

## インストール方法 A: ZIGNOS の USB から内部ディスクへ(推奨)

`zignos-install` が**実行中の ZIGNOS を丸ごとコピー**し、GRUB とユーザーを作ります。
起動したファームウェアを自動判定し、BIOS なら MBR(ext4 1 パーティション)、
UEFI なら GPT(100MiB ESP + ext4 root)でディスク全面を使います。

### 1. ZIGNOS イメージを USB へ書き込む

SystemRescue 上で、ファームウェアに合ったイメージを書き込みます
(UEFI 機なら `zignos-uefi.img`)。

```sh
lsblk                                  # USB のデバイス名を確認(例: /dev/sdX)
sudo dd if=zignos-uefi.img of=/dev/sdX bs=4M status=progress conv=fsync
sync
```

> `/dev/sdX` は**ディスク全体**を指定します。`/dev/sdX1` ではありません。
> 書き込み先を間違えると作業用ディスクを破壊します。

### 2. ZIGNOS を USB から起動

BIOS なら CSM/レガシーモード、UEFI なら UEFI モード(CSM 無効)で USB を起動します。
Secure Boot は無効にしてください(GRUB/カーネルは未署名)。

```text
zignos login: root
Password: <初期パスワード>  # 配布イメージの初期パスワード。必ず変更する
```

**ログインは VGA(tty1)とシリアル(ttyS0)の両方**で可能です。画面が出ない場合は
シリアルケーブルを使ってください。

### 3. 内部ディスクへインストール

```sh
lsblk                   # ターゲットを確認(例: /dev/nvme0n1, /dev/sda)
zignos-install /dev/nvme0n1
```

- 対話でユーザー名・パスワードを設定(既定ユーザー名は `zignos`)
- `/root/.ssh/authorized_keys` があれば新ユーザーへ引き継ぎます(openssh を入れた場合に有効)
- 確認のため `YES` の入力を求められます。**対象ディスクの全データが消えます**
- NVMe/eMMC(`/dev/nvme0n1` など)のパーティション名 `p1` にも対応しています
- UEFI で起動した場合は自動的に GPT + ESP になり、`/EFI/BOOT/BOOTX64.EFI`
  (ファームウェアのフォールバックパス)が書かれます。`efibootmgr` が入っていれば
  NVRAM エントリも登録します(無ければフォールバックパスだけで起動)
- 画面に `installing GRUB (UEFI)` / `installing GRUB (BIOS)` と表示されます

> UEFI の ESP は**インストール時に `/boot/efi` へマウントされるだけ**で、fstab には
> 登録していません(起動後の通常運用では未マウント)。ESP を常時マウントしたい場合は
> `blkid /dev/nvme0n1p1` で UUID を調べ、`/etc/fstab` に
> `UUID=... /boot/efi vfat defaults 0 0` を追加してください。

非対話で実行する場合:

```sh
ZIGNOS_USER=yourname ZIGNOS_PASSWORD='...' zignos-install --yes /dev/nvme0n1
```

完了すると `ZIGNOS-INSTALL-COMPLETE` と表示されます。USB を抜いて再起動し、
内部ディスクから起動してください。

### 4. 初回起動後の確認

```sh
uname -r                              # 7.1.8
rc-status                             # udev / console / console-vga が started
lsmod                                 # モジュールがロードされている
```

ベースシステムは最小構成(Gentoo の @system 相当)なので、SSH や DHCP は入っていません。
使うものを自分で入れて有効化します:

```sh
zpkg install openssh && rc-update add sshd default    # root の SSH ログインは無効
zpkg install dhcpcd  && rc-update add dhcpcd boot
```

## インストール方法 B: イメージを直接ディスクへ書き込む

ZIGNOS を USB から起動せず、SystemRescue から直接ターゲットディスクへ `dd` します。
ユーザー作成は手動になります。BIOS イメージは MBR、UEFI イメージは GPT+ESP の
レイアウトで、**それぞれ対応するファームウェアでしか起動できません**。

```sh
# 1) ターゲットへ書き込み(全データ消去)
#    UEFI 機は zignos-uefi.img、BIOS 機は zignos-bios.img
sudo dd if=zignos-uefi.img of=/dev/nvme0n1 bs=4M status=progress conv=fsync
sync

# 2) ルートパーティションをディスク全面まで拡張(12G イメージを 500G ディスクへ)
#    BIOS イメージ: root = パーティション 1
#    UEFI イメージ: ESP = 1、root = 2
sudo parted /dev/nvme0n1 resizepart 2 100%     # BIOS なら 1
sudo partprobe /dev/nvme0n1
sudo e2fsck -f /dev/nvme0n1p2                  # BIOS なら nvme0n1p1
sudo resize2fs /dev/nvme0n1p2                  # BIOS なら nvme0n1p1

# 3) 起動して root でログインし、ユーザーを作成
#    (root の初期パスワードはイメージの案内を参照)
useradd -m -G wheel -s /bin/bash yourname
passwd yourname
install -d -m700 -o yourname -g yourname /home/yourname/.ssh
# 必要なら authorized_keys を配置(600)
```

> UEFI イメージの ESP は 100MiB 固定です。カーネル/initramfs は root 側の
> `/boot` にあり、ESP には `BOOTX64.EFI` だけが入ります。
> BIOS イメージは MBR のため 2 TiB を超えるディスクでは末尾が使えません
> (UEFI/GPT イメージは 2TiB 超でも可)。

## インストール方法 C: レスキューと保守

ZIGNOS が起動しないときは SystemRescue から修復します。

```sh
# ルートパーティションをマウント
mkdir -p /mnt/zignos
mount /dev/nvme0n1p1 /mnt/zignos

# 設定ファイルの確認・修正(例: fstab, grub.cfg)
cat /mnt/zignos/etc/fstab
cat /mnt/zignos/boot/grub/grub.cfg

# chroot して zpkg を操作する場合
mount --bind /dev  /mnt/zignos/dev
mount -t proc proc /mnt/zignos/proc
mount -t sysfs sys /mnt/zignos/sys
chroot /mnt/zignos /bin/bash
zpkg list
zpkg upgrade
```

`/etc/fstab` と GRUB の `root=` は **ファイルシステムの UUID** で書かれています
(initramfs が busybox `blkid` で解決)。イメージを別ディスクへコピーした場合は
UUID が変わるため、`blkid` で確認して書き換えてください。

```sh
blkid /dev/nvme0n1p1
# → UUID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" PARTUUID="xxxxxxxx-01"
```

## インストール後の設定

### パスワードとユーザー

- root の初期パスワードは配布イメージの案内を参照し、**最初に `passwd` で変更**してください
- 通常ユーザーは `zignos-install`(方法 A)が作成します。方法 B では手動作成
- 特権昇格はベースでは `su` のみ。`doas`(`wheel` グループ、`permit persist :wheel`)や
  `sudo` は好みで `zpkg install doas` / `zpkg install sudo` としてください

### ネットワーク

- 有線: dhcpcd を入れて有効化します(ベースには含まれません)

```sh
zpkg install dhcpcd
rc-update add dhcpcd boot
rc-service dhcpcd start              # /etc/resolv.conf に DNS も書かれる
```

- WiFi:

```sh
zpkg install wpa_supplicant iw linux-firmware   # 約 1.0 GiB DL / 2.0 GiB 導入
modprobe iwlwifi                     # チップに合わせて ath10k / rtw89 / mt7921e など
dmesg | tail                         # firmware ロードと wlan の生成を確認
rc-update add wpa_supplicant default # 初回のみ
rc-service wpa_supplicant start

wpa_cli
> add_network
> set_network 0 ssid "MySSID"
> set_network 0 psk "MyPassphrase"
> enable_network 0
> save_config
> quit

# インターフェース名を変える場合(既定 wlan0)
#   /etc/conf.d/wpa_supplicant に WPA_IFACE=wlp2s0 などを書く
```

- WiFi ドライバは**モジュール**として同梱されています(`iwlwifi`/`ath10k`/`ath11k`/
  `rtw88`/`rtw89`/`mt76`/`brcmfmac` など)。**起動時に存在するデバイス**も、
  起動後に挿した USB 機器も、eudev + kmod が uevent 経由で自動ロードします。
  それでも読み込まれない場合は `lspci -k` / `lsusb` でチップを調べて
  `modprobe <driver>` を実行してください
- `iw dev` でインターフェースが見えない場合は `dmesg | grep -i firmware` と
  `lspci -k` を確認してください

### UEFI ブートエントリ(efibootmgr)

UEFI インストールは**リムーバブルパス**(`/EFI/BOOT/BOOTX64.EFI`)に GRUB を置くため、
NVRAM に何も登録しなくても起動します。`efibootmgr` は main/ にあり、ベースには含みません:

```sh
zpkg install efibootmgr
efibootmgr -v                        # 現在のエントリ一覧

# ZIGNOS エントリを追加(ESP が /dev/nvme0n1p1 の場合)
efibootmgr --create --disk /dev/nvme0n1 --part 1 \
  --label ZIGNOS --loader '\EFI\BOOT\BOOTX64.EFI'

# 起動順の変更(例: ZIGNOS を最初に)
efibootmgr -o 0003,0001,0002
```

- `zignos-install` は、実行中のイメージに `efibootmgr` があれば**自動でエントリを追加**します
  (無い場合はリムーバブルパスで起動)
- GRUB を自分で入れる場合、`zpkg use --package grub uefi` にしておくと
  `zpkg install grub` の依存として efibootmgr も入ります(指定なしは BIOS/UEFI 両方、
  `bios` のみなら efibootmgr は入りません)
- Secure Boot は無効にしてください(GRUB/カーネルは未署名)

### 時刻・キーボード

- RTC は UTC で扱います。NTP 同期は `zpkg install chrony` のうえで
  `rc-update add chronyd default`(ベースには含まれません)
- `tzdata` はベースに含まれます(既定は UTC)。日本時間にするには
  `ln -sf /usr/share/zoneinfo/Asia/Tokyo /etc/localtime`
- キーボード: `loadkeys jp106`(kbd の keymaps を使用)。恒久設定は
  `/etc/conf.d/keymaps` と keymaps サービス

### システム更新(ローリングリリース)

ZIGNOS はローリングリリースです。レシピツリーの HEAD が現在のリリースで、
システムは `zpkg upgrade` で追従します。

```sh
zpkg upgrade             # world 全体をレシピの版へ
zpkg upgrade --newuse    # USE フラグが変わったパッケージも再ビルド
zpkg recover             # 中断したトランザクションの復旧
```

レシピは `/usr/share/zignos/recipes/{core,main}` に同梱されています。

## カーネル設定とカスタマイズ

> **Kernel Config には以下のガイドが役に立つでしょう。**
>
> - [Gentoo AMD64 ハンドブック — Configuring the Linux kernel](https://wiki.gentoo.org/wiki/Handbook:AMD64/Installation/Kernel)
> - [Gentoo Kernel Configuration Guide](https://wiki.gentoo.org/wiki/Kernel/Gentoo_Kernel_Configuration_Guide)(個別オプションの意味を調べるとき)

ZIGNOS のカーネルは **`x86_64_defconfig`(カーネル同梱の汎用設定)をベース**に、
`zignos-recipes/core/linux/x86_64-generic.config` をマージして作ります
(`scripts/kconfig/merge_config.sh` + `make olddefconfig`)。

- **起動に必要なものは組み込み(=y)**: ACPI/APIC、SATA AHCI、NVMe、USB
  (XHCI/EHCI/OHCI/UHCI + storage + HID + AT キーボード)、VT/VGA/simpledrm/fbcon、
  ext4/vfat、virtio、e1000e/r8169/igb など。initramfs は busybox だけで動きます
- **追加ハードウェアはモジュール(=m)**: Intel/AMD/NVIDIA GPU、WiFi
  (iwlwifi/ath/rtw/mt76/brcmfmac)、追加 NIC、XFS/Btrfs/NTFS3 など。
  eudev が uevent 経由で kmod の `modprobe` を呼び、デバイスの
  `MODALIAS` に合うドライバを自動ロードします
- **UEFI の画面**: ファームウェアの GOP framebuffer を使う `simpledrm` + `fbcon` が
  入っているため、GPU ドライバが動く前でも VGA/HDMI にログインプロンプトが出ます
- **ログイン**: `console`(ttyS0)と `console-vga`(tty1)の両方が default runlevel で動きます

### 自分用に調整する

方針は「基本はどの端末でも起動、細部は個人で弄る」です。設定を変えたいときは
`x86_64-generic.config` を編集してカーネルを再ビルドします。

```sh
# ベースにはエディタが無いので、まず好きなものを入れる(例: vim / nano)
zpkg install vim

# 例: NVIDIA GPU を組み込みにする / 使わないドライバを外す
vim /usr/share/zignos/recipes/core/linux/x86_64-generic.config
zpkg install -f linux          # カーネル + モジュール + initramfs を再生成
```

- 実行中のカーネル設定は `/boot/config-$(uname -r)` で確認できます
- モジュールは `/lib/modules/$(uname -r)`、`lsmod` / `modprobe <driver>` で操作
- WiFi を使うときは `main/linux-firmware` を導入してから
  `modprobe iwlwifi`(または該当ドライバ)を実行します

## トラブルシューティング

| 症状 | 確認・対処 |
|---|---|
| USB から起動しない | ファームウェアに合ったイメージか(BIOS 版/MBR、UEFI 版/GPT)。Secure Boot を無効に。USB を `dd` で書いたか |
| GRUB は出るがカーネルで止まる | `root=UUID` が実際の root と一致しているか。`blkid` で UUID を確認し grub.cfg を修正 |
| initramfs が rescue shell に落ちる | 表示された `Available filesystems` に root が見えるか。UUID 不一致 or ストレージドライバ不足 |
| `VFS: Unable to mount root fs` | initramfs が読まれていない(grub.cfg の `initrd` 行、`/boot/initramfs.img` の存在) |
| 画面にログインプロンプトが出ない | VGA は tty1(`console-vga`)、シリアルは ttyS0。`rc-status` で両サービスの状態を確認 |
| `iw dev` に wlan が出ない | `lspci -k` でチップを確認し `modprobe <driver>`。`dmesg` に `MODALIAS` の失敗が出ていないか |
| WiFi が association で失敗する | `linux-firmware` 未導入。`dmesg` の `firmware: failed to load` を確認 |
| 起動時に fsck が走らない | 仕様(root は initramfs が ro マウント、fstab pass 0)。必要ならレスキュー環境で `e2fsck -f` |
| ディスクが `/dev/nvme0n1` と表示される | 正常。`zignos-install` は `p1` 形式に対応。手動操作時は `nvme0n1p1` |
| UEFI で OS が見つからない | UEFI モードで起動したか。ESP の `/EFI/BOOT/BOOTX64.EFI` を確認。BIOS 設定で CSM を切る |
| root で SSH できない | 仕様(`PermitRootLogin=no`)。`zignos-install` が作ったユーザーでログイン(openssh を入れていない場合はローカルコンソールのみ) |

ログの確認:

```sh
dmesg | less
rc-service <name> status
rc-status --all
```

システムログの常駐コレクタ(rsyslog 等)は未導入です。必要なら `main/` に追加します。

## 既知の制約と今後の予定

- **イメージはファームウェア別**: BIOS 版(MBR)と UEFI 版(GPT+ESP)を別々に生成。
  1 つのイメージで両対応(ハイブリッド)ではない
- **Secure Boot は無効化が必要**: GRUB/カーネルは未署名
- **UEFI の NVRAM 登録は任意**: 基本は `/EFI/BOOT/BOOTX64.EFI` のフォールバックパス。
  `efibootmgr`(main/)を入れておけばインストーラが自動登録し、手動でも
  `efibootmgr --create ...` で追加できる
- **暗号化なし**: LUKS、署名付きモジュール、TPM は未対応
- **インストーラの構成は単純**: スワップや `/home` 分離は未対応(UEFI は ESP + root の 2 つ)
- **WiFi は firmware 導入後**: `main/linux-firmware`(約 2.0 GiB)を入れて
  `modprobe` する。自動ロードは eudev + kmod が行う
- **公開イメージなし**: 現状は自分でビルドする開発者向け。配布時は署名付きイメージを想定
- **タイムゾーンの既定は UTC**: `tzdata` は入っているので `/etc/localtime` を差し替えれば任意の地域に設定できる
- **モジュール署名なし**: `CONFIG_MODULE_SIG` は無効(改ざん検知は未対応)
