---
title: システム設計
description: init、コンソール、サービス、特権昇格、カーネル方針。
---

ステータス: 決定事項の集約。詳細・履歴は roadmap.md の各マイルストーン節と
ブートストラップ設計(seed 方式・ローリング)を参照。

## ツールチェーン方針

- **レシピが唯一の真実**: パッケージの版・フラグ・パッチは ZIGNOS が決める。LFS 13.1
  の本は cross bootstrap(stage0/1)を作る時の参考にすぎない(2026-11-17 確定)
- libc は **glibc** から開始(実用ディストリ目標・LFS 手順の流用が最も容易)。musl 系への移行は将来の検討事項
- /usr 配下は完全に zpkg 管理(2026-11-17、linux-headers レシピ化で確定)。LFS 依存は
  cross toolchain の「構築手順」のみ

## init システム(決定: OpenRC 本命 / busybox init は M3 の起動検証用)

**2026-11-15 決定**(ユーザー方針: systemd は使わない — 重厚であるため):

- **本命: OpenRC**(導入済み 0.64.1)。依存順のサービス管理が実用的で、Gentoo 系の資産と素地が合い、将来の s6 併用(監督機能)も視野に取れる
- **デバイス管理: mdev を継続**(2026-11-16 決定)。比較結果:

  | 観点 | mdev(busybox) | eudev |
  |---|---|---|
  | 追加パッケージ | ゼロ(既存 busybox) | eudev + libudev + kmod(ビルド依存も増える) |
  | 起動時のデバイス作成 | `mdev -s` で十分 | 同等 |
  | hotplug(USB/挿抜) | `CONFIG_UEVENT_HELPER` + hotplug 設定が必要 | 標準対応 |
  | 永続的なデバイス名(by-id/by-path) | 無し | 有り(ストレージが増えた時に効く) |
  | 保守 | OpenRC の mdev サービスに統合済み | もう一つのデーモン |

  判断: 普段使いの当面の範囲(1台のディスク・シリアルコンソール・virtio)では mdev で十分。**USB ストレージや複数ディスクの永続命名が必要になった時点で eudev レシピを追加する**(それまでは作らない — YAGNI)。
- M3 では busybox init で起動検証済み(現在は openrc-init に移行、`/sbin/init → /usr/sbin/openrc-init`)
- LFS 13.x の systemd 専用手順には従わない(手順は ch5/ch6/ch7 の一時システム構築までを利用し、最終システム側は自前方針)

## コンソール・ログイン(M4b で確定)

- シリアルコンソール ttyS0 に agetty → shadow の login(自動ログインは廃止)
- OpenRC サービススクリプトの必須事項:
  - shebang は **`#!/sbin/openrc-run`**(`#!/bin/sh` だと OpenRC が黙ってスキップする)
  - supervise-daemon で agetty を動かすときは **`command_args_foreground`**(通常の `command_args` だと stdio が /dev/null に繋がり画面に出ない)
- `/etc/securetty` に ttyS0 を許可、`/etc/profile` で PATH/PS1/umask を設定、`/etc/motd` でバナー
- **`/etc/os-release`** は initscripts レシピが提供する(`NAME=ZIGNOS`、
  `PRETTY_NAME="ZIGNOS 2026.11.17-alpha"`、`LOGO=zignos`)。fastfetch の os モジュールや
  `ID=zignos` を見るツールが参照する。stage2 が書く `/etc/zignos-release`(ツリー判定用)とは別物
- root パスワードは bootstrap 時に `chpasswd` で設定(配布イメージでは初回に必ず変更)
- ベースアカウントは **initscripts レシピが所有する**(`/etc/passwd` の root/sshd/nobody、`/etc/group` の tty/sshd/utmp/nogroup 等)。個別パッケージのレシピはアカウントファイルを出さない — 部分的なファイルを destroot に置くと、インストール時に既存の `/etc/passwd` を丸ごと置き換えてしまう

## ネットワーク・SSH(M5 で確定)

- **DHCP は dhcpcd を直接サービス化**する(`initscripts/init.d/dhcpcd`)。**ベースでは自動有効化しない**
  (M28 以降の最小構成。`zpkg install dhcpcd && rc-update add dhcpcd boot`)。net-scripts を導入していないため stock の `network` サービスは使えない。`supervise-daemon` + `command_args_foreground="-q -B"`、`after mdev`、`provide net`
- **sshd**(`initscripts/init.d/sshd`, opt-in): `after dhcpcd`、`use net dns logger`。`start_pre` で `/run/sshd` を作り、ed25519 ホスト鍵が無ければ `ssh-keygen` で生成(イメージに鍵を同梱しないので、インストールごとに固有鍵になる)
- **root の SSH ログインは無効**(sshd を `-o PermitRootLogin=no` で起動。sshd 自体は openssh を入れた場合のみ)。ログインは `zignos-install` が作る一般ユーザー(wheel 所属)で行う。コンソールの root は復旧用に残す
- ユーザー作成はインストーラの責務: 対話でユーザー名/パスワード、`ZIGNOS_USER`/`ZIGNOS_PASSWORD` で非対話指定。SSH 鍵は実行中 root の `authorized_keys` を引き継ぐ(openssh を入れた場合に有効。対話時は貼り付けも可)
- dhcpcd 10 の lease は `/var/lib/dhcpcd/eth0.lease` に**バイナリ形式**で保存される(テキストではない)。動作確認は `/etc/resolv.conf` と実接続で行う

## D-Bus と WiFi(M22 で確定)

- **D-Bus は system bus のみ**(core/dbus 1.16.4)。セッションバスは GUI を入れるまで作らない。`messagebus` アカウント(uid/gid 25)は initscripts が所有し、machine-id は初回起動時に `dbus-uuidgen --ensure`(initscripts の `init.d/dbus` の `start_pre`)が生成する。**dbus-daemon は既定で fork するため `--nofork` が必須**(無いと supervise-daemon が親の終了を crash と見なし、再起動のたびにデーモンが増える — M22 の起動試験で 11 個になった)
- **サービス構成の原則**: デーモンは initscripts に OpenRC スクリプトを置き、パッケージ側はバイナリと設定だけを出す。runlevel も initscripts が決める
  **M28 以降、runlevel リンクは mdev と console/console-vga だけ**。以下は
  `zpkg install <pkg>` の後に `rc-update add <service> <runlevel>` で有効化する。

  | サービス | runlevel | 備考 |
  |---|---|---|
  | mdev | sysinit | デバイス管理(design-system の方針どおり) |
  | dhcpcd | 任意(boot) | `provide net` |
  | dbus | 任意(boot) | `--system --nopidfile`、`after mdev` |
  | console | default | agetty ttyS0 |
  | console-vga | default | agetty tty1(VT/VGA/simpledrm は汎用カーネルで有効) |
  | sshd | 任意(default) | `after dhcpcd`、ed25519 鍵は初回生成 |
  | chronyd | 任意(default) | `after dhcpcd`、rtcsync + makestep |
  | wpa_supplicant | 任意(default) | `WPA_IFACE`(既定 wlan0)。WiFi 機では `rc-update add wpa_supplicant default` で有効化 |
- **mdev は起動時のデバイス走査と MODALIAS ロード**を担当する。devtmpfs がノードを作り、
  `/etc/mdev.conf` の `$MODALIAS=.* ... @/usr/sbin/modprobe -q "$MODALIAS"` を
  `mdev -s` が起動時に適用してモジュールをロードする。サービスは短命な `mdev -s` を
  独自 `start()` で実行するため `rc-status` に "crashed" と出ない。
  **モダンカーネルは uevent helper(`/proc/sys/kernel/hotplug`)を廃止**しており、
  起動後に挿した機器の自動ロードはしない(必要なら udev 導入か手動 `modprobe`)
- **wpa_supplicant 2.12**(main/ から任意インストール)は nl80211 + libnl + システム OpenSSL でビルドし、D-Bus 制御 IF も有効(dbus を入れた場合)。`/etc/wpa_supplicant/wpa_supplicant.conf` はモード 600、`ctrl_interface=/run/wpa_supplicant`(group wheel)なので `wpa_cli` で設定できる(`update_config=1` で `save_config` が永続化)。**default runlevel には入れない**(wlan の無い機体で毎回 failed になるため)。WiFi 機では `rc-update add wpa_supplicant default` を実行する
- **WiFi ドライバは汎用カーネルのモジュール**として同梱(iwlwifi/ath9k/ath10k/ath11k/
  rtw88/rtw89/mt76/brcmfmac)。firmware は `main/linux-firmware` 20261019 を
  実機で `zpkg install linux-firmware` して導入する(1.0 GiB の tarball / 導入 2.0 GiB
  のため base イメージには同梱しない)。mdev + kmod が MODALIAS で自動ロードし、
  手動なら `modprobe iwlwifi` など
- **rfkill は util-linux が提供する** `/usr/sbin/rfkill` を使う(独立レシピはファイル競合になるため持たない)
- ハードウェア確認用に `lshw` / `dmidecode` / `smartctl` を main/ に用意(ベースには入れない)


## 特権昇格(M7 で確定)

- **ベースは `su` のみ**(M28 の最小化以降)。doas(core/doas、OpenDoas 6.8.2)は
  `zpkg install doas` で追加する任意パッケージ。`/etc/doas.conf` は `permit persist :wheel`。PAM は無いので shadow 認証(`--without-pam`)、persist は `/run/doas` のタイムスタンプ
- **sudo は main/sudo に置く**(1.9.17p2、インストールは任意)。sudo を使いたい層向けで、イメージには含めない。sudoers は `%wheel ALL=(ALL:ALL) ALL`、`env_reset` + `secure_path` + 5 分のタイムスタンプ
- sudo は **OpenSSL 無し**でビルドする(`--disable-log-client --disable-log-server`)。1.9.17p2 の hostcheck.c が OpenSSL 4 の不透明化した `ASN1_STRING` に非対応のため。TLS/logsrvd を使わない構成では sudo 内蔵 SHA-2 で問題ない
- **zpkg は setuid/setgid/sticky を保存する**(install 時の明示 chmod + binpkg の tar モード)。`open(2)` は setuid を無視するので、これが無いと昇格ツールが機能しない

## カーネル方針

- vanilla kernel(kernel.org)。LFS の本のバージョンに合わせる(現在 7.1.8)
- **x86_64_defconfig をベース**に `core/linux/x86_64-generic.config` を
  `merge_config.sh` でマージする(「基本はどの端末でも起動、細部は個人で弄る」方針)
- **起動に必要なドライバは組み込み(=y)**: ACPI/APIC、SATA AHCI、NVMe、USB
  (XHCI/EHCI/OHCI/UHCI + storage + HID + AT キーボード)、VT/VGA/simpledrm/fbcon、
  ext4/vfat、virtio、主要有線 NIC。initramfs は busybox だけで動く
- **追加ハードウェアはモジュール(=m)**: GPU(i915/amdgpu/nouveau/radeon)、WiFi
  (iwlwifi/ath/rtw/mt76/brcmfmac)、追加 NIC、XFS/Btrfs/NTFS3 など。
  mdev が `/etc/mdev.conf` の `$MODALIAS` ルールで kmod の `modprobe` を呼ぶ
- **initramfs は busybox ベース**(`core/initramfs` の `zignos-mkinitramfs` +
  `/usr/lib/zignos/initramfs/init`)。linux レシピがビルド時に
  `/boot/initramfs.img` を生成する(カーネル更新時に必ず再生成)
- **root デバイス指定は `root=UUID=`**。initramfs の `/init` が busybox `blkid` で
  UUID/LABEL を解決し、`mount -o ro` → `switch_root /root /sbin/init` する。
  fstab も UUID。PARTUUID は initramfs では扱わない(busybox blkid の制約)
- **ブートローダ**: BIOS は MBR + `grub-mkimage` の core.img、UEFI は GPT + ESP に
  `grub-mkstandalone` の `BOOTX64.EFI`(設定埋め込み、フォールバックパス)。
  grub の USE フラグ `bios` / `uefi` がビルド対象を選び、未指定なら両方
  (イメージ生成用)。`uefi` は条件付き依存(`uefi?efibootmgr`)で efibootmgr を
  引き込み、`zignos-install` が NVRAM エントリを登録する(無くてもフォールバック
  パスで起動する)。Secure Boot は無効前提
- 断片で忘れやすいシンボル(実走行で判明): `BLOCK`/`BLK_DEV`(virtio_blk の親メニュー)、
  `BINFMT_SCRIPT`(スクリプト init)、`BINFMT_MISC`(binfmt サービス)、
  `RTC_CLASS` + **`RTC_INTF_DEV`**(/dev/rtc0)、`SERIAL_8250_CONSOLE`、`DEVTMPFS_MOUNT`、
  UEFI 画面用の `SYSFB_SIMPLEFB` + `DRM_SIMPLEDRM` + `FRAMEBUFFER_CONSOLE`
- **`SECCOMP` + `SECCOMP_FILTER` は必須**(OpenSSH 10.6 の privsep サンドボックスが
  `prctl(PR_SET_SECCOMP)` を使う)。無いと sshd は起動表示のまま接続直後に落ち、
  クライアントには `Connection closed` としか見えない
- `merge_config.sh` は親メニューが無効なシンボルを黙って落とすため、レシピの
  `build` はマージ後の `.config` を grep して必須シンボルの消失を検出する

## リリース・チャネル(スケッチ)

- ソースベースなので「スナップショット」型リリースを想定: レシピツリーのタグ = ビルド可能な世界の状態
- バイナリキャッシュ(buildpkg 相当)導入後に連続性のあるチャネルを検討

## セキュリティ・品質(継続事項)

- ソースの sha256 検証は全パッケージ必須(レシピの checksums が空のまま正式ビルドは禁止)
- シェルスクリプトは shellcheck クリーンを維持
- bootstrap の再現性: `bootstrap.sh` は冪等に失敗を見せる(キャッシュ・中間成果物の隠蔽をしない)
