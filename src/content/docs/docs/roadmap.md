---
title: ロードマップ
description: M0–M30 のマイルストーン記録と現在の状況。
---

マイルストーンごとに完了条件を明記する。進捗はこのファイルのチェックボックスで管理する。
M2 以降の各節は**実走行の記録**(実走行で判明した修正を含む)でもある。現状サマリは
/about/ の「ステータス」も参照。

> 各マイルストーン節の数値・構成は**その時点の記録**。パッケージ数やベース構成は
> 以後のマイルストーンで変わっている(現在は M28–M30 の節と下の「現在のシステム」が正)。

## 現在のシステム(2026-11-18)

- **base.list 34 トップレベル = 依存込み 57 パッケージ**(唯一の定義)/ 12G ブータブルイメージ(BIOS/UEFI 版)。レシピツリーは 157 個(core 75 + main 82)
- 起動: BIOS/MBR または UEFI/GPT → GRUB 2.14 → kernel 7.1.8 + initramfs(busybox) → OpenRC 0.64.1 → eudev 3.3.0 → serial/VGA ログイン(shadow)
- カーネル: x86_64_defconfig + `x86_64-generic.config`(起動系は組み込み、GPU/WiFi/追加 NIC はモジュール)。root は initramfs が `root=UUID=` で解決
- ネットワーク: **ベースには含まない**(Gentoo 流の opt-in)。`zpkg install dhcpcd openssh` の後 `rc-update add dhcpcd boot` / `rc-update add sshd default`
- 無線: wpa_supplicant 2.12 + iw(libnl、D-Bus 制御 IF)を main/ から任意インストール。WiFi ドライバはカーネルモジュール、firmware は `main/linux-firmware`
- サービス: ベースが有効化するのは udev(eudev)/ console(ttyS0)/ console-vga(tty1) のみ。mdev はフォールバックとして同梱するが無効。dhcpcd/dbus/sshd/chronyd/wpa_supplicant/crond/nftables は入れてから自分で有効化
- 運用: ベースは toolchain + coreutils + zpkg + tzdata + eudev。main/ には 82 パッケージ(エディタ / SSH / man / git / curl / wget / doas、M30 のネットワーク診断・ビルド・圧縮・監視)があり、任意インストール
- zpkg: DB schema 2・world/upgrade・USE フラグ(package.use/IUSE)・フック(ldconfig 自動)・トランザクション・slots・binpkg リポジトリ
- bootstrap: stage0/1(cross toolchain、メンテナ専用)→ stage2 フェーズ1(bootstrap core)→ **フェーズ2(base.list 全量)**。/usr は完全に zpkg 管理
- リリースモデル: **ローリングリリース**(ブートストラップ設計)。更新は `zpkg upgrade` と `build-system.sh`

| # | マイルストーン | 状態 | 目安 |
|---|---|---|---|
| M0 | リポジトリ骨格 + 設計ドキュメント | 完了 | - |
| M1 | zpkg v0 完成 | 完了(2026-11-15) | 2–3 週 |
| M2 | ベースシステム全レシピ化 + 自動 bootstrap | 完了(2026-11-15 実走行) | 2–3 週 |
| M3 | 起動イメージ(kernel + init + rootfs) | 完了(2026-11-15 QEMU 実走行) | 1 週 |
| M4a | init 本格化: OpenRC 導入 | 完了(2026-11-15 QEMU 実走行) | - |
| M4b | 実用化: installer・自己インストール・login 運用 | 完了(2026-11-16 実走行) | 継続 |
| M5 | ネットワーク + SSH(dhcpcd・openssh) | 完了(2026-11-16 実走行) | - |
| M6 | ユーザー管理 + SSH 硬化(installer が wheel ユーザー作成) | 完了(2026-11-16 実走行) | - |
| M7 | 特権昇格(doas デフォルト / sudo は main) | 完了(2026-11-16 実走行) | - |
| M8 | 常用ツール拡充 + seed 方式 | 完了(2026-11-16 実走行) | - |
| M9 | zpkg v0.9(DB schema 2・world/upgrade) | 完了(2026-11-16 実走行) | - |
| M10 | zpkg USE フラグ | 完了(2026-11-17 実走行) | - |
| M11 | zpkg package.use/IUSE + レシピフック | 完了(2026-11-17 実走行) | - |
| M12 | zpkg トランザクション | 完了(2026-11-17 実走行) | - |
| M13 | base.list 一本化 + ローリングリリース方針 | 完了(2026-11-17) | - |
| M14 | レシピ 18 個追加 + stage2 の base.list 化 | 完了(2026-11-17 実走行) | - |
| M15 | linux-headers レシピ化(/usr 完全 zpkg 管理) | 完了(2026-11-17 実走行) | - |
| M16 | man ページ環境(groff/man-db/man-pages) | 完了(2026-11-17 実走行) | - |
| M17 | meson レシピ化 + upgrade --newuse | 完了(2026-11-17 実走行) | - |
| M18 | chrony(NTP 同期) | 完了(2026-11-17 実走行) | - |
| M19 | binpkg リポジトリ対応(mkindex + BINREPO) | 完了(2026-11-17 実走行) | - |
| M20 | slots 共存(name@slot レコード) | 完了(2026-11-17 実走行) | - |
| M21 | CLI ツール 13 個追加(tree/jq/zip/unzip/…) | 完了(2026-11-17 実走行) | - |
| M22 | WiFi スタック(libnl/wpa_supplicant/iw)+ D-Bus + HW 情報ツール | 完了(2026-11-17 実走行) | - |
| M23 | 実機インストール準備(install.md・NVMe/PARTUUID・VGA) | 完了(2026-11-17) | - |
| M24 | initramfs + UEFI + 汎用カーネル(モジュール/kmod) | 完了(2026-11-17 実走行) | - |
| M25 | stage3 tarball(Gentoo 流の chroot ベース) | 完了(2026-11-17 実走行) | - |
| M26 | fastfetch ブランディング + CMake + zpkg ジャーナル高速化 | 完了(2026-11-18 実走行) | - |
| M27 | zpkg の emerge 風フェーズ表示(Building/Installing) | 完了(2026-11-18 実走行) | - |
| M28 | 最小ベース(base.list 32/依存込み 54)+ efibootmgr | 完了(2026-11-18 実走行) | - |
| M29 | grub の bios/uefi USE フラグ + efibootmgr 条件付き依存 | 完了(2026-11-18 実走行) | - |
| M30 | CLI ツール 26 個追加(ネットワーク/ビルド/圧縮/監視) | 完了(2026-11-18 実走行) | - |
| M31 | 実用システムツール 20 個追加(tzdata/GnuPG/cron/logrotate/nftables/…) | 完了(2026-11-18 実走行) | - |
| M32 | mdev → eudev 3.3.0 + udev サービス(initscripts r14) | 完了(2026-11-18 BIOS 起動) | - |

次の候補: **UEFI での eudev 起動確認と実機検証** / GUI 要素の調査 / ストレージ系(LUKS/LVM/XFS/Btrfs) / binpkg リポジトリの署名・配布(コミュニティ形成時)/ zpkg の `provides`/`conflicts` 解決。

## M25: stage3 tarball(2026-11-17 完走)

- [x] **`make-stage3.sh`** — `$ZIGNOS_ROOT` をコピーし、base.list に無いパッケージ(ツール類)と
  linux/grub を `zpkg remove` で外して tar.xz に固める。**base.list − linux/grub = 86
  パッケージ / 2.1 GiB**。DB・world と中身が一致する
- [x] **中身** — glibc/gcc/binutils/bash/coreutils/zpkg/openrc/initscripts/kmod/python3/
  perl/openssh/dbus/wpa_supplicant などビルド可能なベース。usr-merged(`/bin`,`/sbin`,
  `/lib` は symlink)、**root はロック**、fstab/resolv.conf の雛形、
  `/usr/share/zignos/recipes` 同梱、`/etc/zignos-stage3` にビルド情報
- [x] **除外** — カーネル、initramfs、モジュール、GRUB、`/boot` の中身、マシン固有情報
  (machine-id・ホスト鍵・root パスワード)。unowned の `core.img` も除去
- [x] **検証(2026-11-17)** — 2.1 GiB tarball を展開 → `zignos-enter.sh` で chroot →
  `zpkg list` 86 → `zpkg install linux grub`(binpkg から 1m38s)→ **88 パッケージ、
  `/boot/vmlinuz` 13MB + `initramfs.img` 1.3MB、EFI モジュール 601、grub-mkstandalone 動作**
- [x] **`docs/stage3.md`** — Gentoo 流の手順(ディスク準備 → 展開 → chroot → zpkg →
  fstab(UUID)→ GRUB(BIOS/UEFI)→ 初回設定)。seed/イメージ/installer との違いも記載
- [x] **GitHub Release `ZIGNOS-2026.11.17-alpha` 公開** — `studio-nosa-tech/zignos` に
  stage3 を公開。GitHub の 1 ファイル 2 GiB 制限のため
  **part-01/02(1000MiB)+ part-03(151MiB)+ sha256** の 4 アセットに分割。
  現在は非公開(公開準備中)

## M26: fastfetch ブランディング + CMake(2026-11-18 完走)

- [x] **`core/cmake 4.5.0`** — fastfetch のビルドに CMake >= 3.21 が必要。`./bootstrap` で
  自己完結ビルド(OpenSSL・ccmake・テスト無効、追加ビルド依存なし)。**base.list 89 パッケージ**
- [x] **`main/fastfetch 2.71.0`** — CMake ビルド。`ENABLE_IMAGE_LOGO=OFF`(sixel/kitty/chafa は
  使わない)、`BUILD_FLASHFETCH=OFF`、Lua/libzfs 無効。66 ファイル。実行時リンクは libc/libm のみ
- [x] **ネオンオービットロゴ** — ユーザー作成の PNG(白 Z + 紫の軌道リング + スパークル)を
  chafa で **47x15 の ANSI トゥルーカラー**に変換し `/usr/share/zignos/fastfetch/logo.txt` として同梱。
  透過処理(輝度→アルファ)で黒背景を消し、端末の背景色に馴染ませる。元 PNG も同梱
- [x] **`/etc/fastfetch/config.jsonc`** — `file-raw` ロゴ(width 47/height 15)、キー色 magenta、
  OS/Host/Kernel/Uptime/Init System/Packages/Shell/Terminal/CPU/GPU/Memory/Disk/Local IP + colors
- [x] **`/etc/os-release` を initscripts r10 で提供** — `NAME=ZIGNOS`,
  `PRETTY_NAME="ZIGNOS 2026.11.17-alpha"`。fastfetch の os モジュールが ZIGNOS と表示する
- [x] **Packages 行** — fastfetch は zpkg を知らないため command モジュールで
  `zpkg list | wc -l` を表示(実測 105)
- [x] **表示確認** — chroot 内 `fastfetch` で 15 行のロゴ + 情報が桁揃えで表示されることを確認
- [x] **zpkg ジャーナルの高速化** — install のパス一覧を毎ファイル `journal.json` へ書き直す
  方式は O(n²) で、cmake(4381 ファイル)に **13 分**かかっていた。追記専用の
  `journal.log`(1 行 1 イベント、fsync 付き、クラッシュ時は途中行を無視)に変更し **49 秒**へ。
  旧形式のジャーナルも引き続き読める


## M27: zpkg の emerge 風フェーズ表示(2026-11-18 完走)

ビルド/インストールが「どのパッケージの何の最中か」分からないという指摘を受け、
Portage(emerge)風のフェーズ行を入れた。

- [x] **事前サマリ** — 処理前に「These are the packages that will be installed, in order:」として
  `[i] name-version` + `(dependency)` + `USE="flags"` を並べ、最後に
  `Total: N packages (T targets, D dependencies)` を出す。USE は `iuse` を基準に
  `flag` / `-flag` 表記(有効フラグのみならず無効も見える)。`-p` はこの一覧だけ出して終了
- [x] **Building** — `>>> Building fastfetch-2.71.0-r2` をビルドスクリプトの前に、
  `>>> Built ... (66 files) in 1m2s` を後に出す。ビルドスクリプトの出力はそのまま流す
- [x] **Installing** — `>>> Installing (1 of 2) fastfetch-2.71.0-r2`(実際に処理する
  パッケージだけを数える)。binpkg から入れるときは `... (binpkg)` を付け、Building は出さない。
  完了で `>>> Installed ...`
- [x] **その他の書式統一** — `>>> Skipping foo-1.0 (already installed)`、
  `>>> Would install/build foo-1.0`(pretend)、`>>> Packed binpkg <path>`、
  `>>> Removing (1 of 2) foo` / `>>> Removed foo`
- [x] **色** — stdout が端末のときだけ緑(`NO_COLOR` / `TERM=dumb` で無効)。ログ・パイプは
  ANSI なし。`elapsed` と `useColor` に回帰テスト
- [x] **実走行確認** — chroot で which のソースビルド(Building → Built 3s → Packed →
  Installing → Installed)、tree の binpkg インストール、pretend、remove、NO_COLOR を確認
- [x] **zpkg レシピ r5** で source snapshot を取り込み


## M28: 最小ベース + efibootmgr(2026-11-18 完走)

「base.list に無駄なソフトが多すぎる。Gentoo のように最低限だけ入れ、大半は手動で」
という方針に合わせてベースを組み直した。

- [x] **base.list を Gentoo の @system 相当へ** — トップレベル 32 個 / 依存込み 54 パッケージ。
  残したのは toolchain(glibc/gcc/binutils/make/linux-headers)、POSIX ツール
  (bash/coreutils/sed/grep/gawk/diffutils/findutils/tar/gzip/xz/bzip2/m4/patch/file/pkgconf)、
  起動とログイン(busybox/openrc/initscripts/util-linux/shadow/e2fsprogs/kbd/linux/grub)、
  パッケージ管理(zpkg/ca-certificates)、UEFI ESP 用 dosfstools だけ。
  エディタ・SSH・DHCP・WiFi・D-Bus・chrony・man・git/curl/wget・perl/python/cmake・
  doas/sudo は main/ からの任意インストール(依存と makedepends は zpkg が自動で解決する)
- [x] **initscripts r11** — runlevel リンクを mdev / console / console-vga だけに。
  sshd/dhcpcd/dbus/chronyd の自動有効化をやめ、`zpkg install` 後の `rc-update add` を
  install.md に記載(サービススクリプト自体は同梱したまま)
- [x] **make-stage3 の allowed セットを依存クロージャに** — トップレベルのみの base.list でも
  「ビルド可能な stage3」を維持するため、chroot 内の `zpkg depends` で閉包を計算。
  linux/grub と、linux 専用の bison/bc/elfutils/kmod/initramfs を除いた **47 パッケージ**
- [x] **efibootmgr 18 + efivar 39(main/)** — efibootmgr は efivar(libefivar/libefiboot)に依存。
  efivar 39 は GCC 16 の `-Werror`(discarded-qualifiers)で落ちるため `ERRORS=` で無効化し、
  既定の lib64 を `LIBDIR=/usr/lib` に。efibootmgr は popt を使わない本体だけをビルドして
  インストール(efibootdump/eficonman は popt 必須のため入れない)
- [x] **zignos-install** — 実行中のイメージに efibootmgr があれば UEFI NVRAM エントリを
  自動作成(無ければ従来どおりリムーバブル `\EFI\BOOT\BOOTX64.EFI` で起動)。SSH の
  案内は sshd の有無で出し分け
- [x] **検証(2026-11-18)** — ツリーを 54 パッケージへ剪定 → BIOS/UEFI イメージとも
  **BOOT CHECK PASSED**(`ZIGNOS-BOOT-OK 7.1.8`)、stage3 は **47 パッケージ**で生成成功


## M29: grub の bios/uefi USE フラグ(2026-11-18 完走)

- [x] **core/grub r2** — `iuse` に `bios`(i386-pc)と `uefi`(x86_64-efi)を宣言。
  有効なフラグのプラットフォームだけを configure/make する。**未指定なら両方**を
  ビルド(イメージ生成の従来動作と互換)。不要になったプラットフォームのモジュールは
  アップグレード時の prune で消える
- [x] **条件付き依存 `uefi?efibootmgr`** — `zpkg use --package grub uefi` にすると
  `zpkg install grub` が main/efibootmgr(+efivar)を依存として自動インストールする。
  bios のみでは入らない。zpkg の USE 条件付き依存(M10)をブートローダーに適用した形
- [x] **zignos-install** — ファームウェアに合うモジュール一式が無い場合に停止し、
  `zpkg use --package grub uefi`(または bios)+ `zpkg install -f grub` を案内
- [x] **検証(2026-11-18)** — chroot で 3 通りをビルド:
  uefi のみ 797 ファイル(efivar/efibootmgr が依存で入る)/ bios のみ 813 ファイル
  (efibootmgr は入らない)/ 両方 1415 ファイル。USE 変更で旧プラットフォームの
  owned ファイルが prune されることも確認。両プラットフォーム構成で BIOS/UEFI
  イメージとも **BOOT CHECK PASSED**(7.1.8)


## M32: mdev → eudev(2026-11-18 完走)

GUI や周辺機器の自動認識に備えて、busybox mdev から **eudev 3.3.0** に移行した。

- [x] **`core/eudev 3.3.0`** — systemd-udev 系のスタンドアロン版。`--with-net-ifnames-default=no` で
  カーネルが付けた `eth0` / `wlan0` を維持(ドキュメント・dhcpcd と整合)。SELinux / SMACK /
  TPM2 / man ページは無効、blkid と libkmod を有効化。`hwdb.bin` はビルド時に生成
- [x] **`core/gperf 3.3`** — eudev のキーワード/hwdb 生成に必要(makedepends)
- [x] **initscripts r14** — `/etc/init.d/udev` を追加し、sysinit の mdev リンクを udev に置換。
  mdev スクリプトは緊急用に同梱するが無効。udev は devfs の後、`udevd --daemon` →
  `udevadm trigger` → `udevadm settle` で coldplug する。dhcpcd/dbus/chronyd/
  wpa_supplicant/nftables の `after` も udev に更新
- [x] **base.list に eudev** — トップレベル 34 / 依存込み 57(kmod/libblkid は既存)。
  既存の devtmpfs / proc / sysfs / netlink 設定で動作し、カーネル変更は不要
- [x] **stage3 再生成** — **51 パッケージ / 974 MiB**(eudev・kmod・gperf を追加)。
  `/etc/udev/hwdb.bin`、`/usr/lib/udev/rules.d`、`/etc/runlevels/sysinit/udev` を収録
- [x] **BIOS イメージ起動試験** — **BOOT CHECK PASSED**。devfs → udev 起動 → boot/default
  の順で進み、root ログインと `uname` を確認(TCG の IO-APIC パニックは既知の再試行対象)
- 残: UEFI イメージでの確認、実機での uevent/ファームウェアロード検証

## M31: 実用システムツール 20 個追加(2026-11-18 完走)

ベースの穴(timezone / 署名 / firewall / ログ / cron)を埋め、実機運用に必要な
保守・診断ツールを追加した。tzdata は base.list に入れて全システムでタイムゾーンを
設定できるようにし、残り 19 個は main/ に置いた。

- [x] **時刻** — `tzdata 2026f`(tzcode + tzdata。`/etc/localtime` は UTC、`/usr/share/zoneinfo` を提供)。
  glibc が持つ tzselect/zdump/zic との競合を除き、データだけを所有する
- [x] **GnuPG** — `gnupg 2.5.24` + `libgpg-error 1.61` / `libgcrypt 1.12.4` /
  `libassuan 3.0.2` / `libksba 1.9.0` / `npth 1.8` / `pinentry 1.3.3`(curses/tty)。
  SQLite を有効にして keyboxd/TOFU を利用。スマートカード・TPM・dirmngr は無効
  (TLS ライブラリを入れていないため keyserver 取得は不可。署名/検証/暗号化は可)
- [x] **cron / ログ** — `cronie 1.7.2`(PAM/SELinux/audit/anacron 無効、crontab 4755)、
  `logrotate 3.22.0` + `popt 1.19`(週次・dateext・compress の既定設定)
- [x] **firewall** — `nftables 1.1.7` + `libnftnl 1.3.2`(readline CLI、JSON/xtables 無効)。
  `/etc/nftables.conf` と OpenRC サービスを同梱
- [x] **保守・診断** — `cpio 2.15`、`lm-sensors 3.6.2`、`screen 5.0.2`、
  `gdb 18.1`(Python/NLS 無効、gdbserver 同梱)、`sshfs 3.7.7` + `fuse3 3.18.3` + `glib 2.88.4`
- [x] **initscripts r12** — `crond` / `nftables` サービスを追加(どちらも opt-in)
- [x] **ビルド修正** — GCC 16 の C23 既定で壊れる cronie/cpio は `-std=gnu17`、
  nftables は libedit ではなく readline を選択、cpio の rmt と gdb の bfd/locale は
  tar/binutils と重複するため除外、fuse3 は `/dev/fuse` を作らず fusermount3 を 4755 に
- [x] **実走行(2026-11-18)** — chroot で全 19 パッケージをビルド・インストール。
  gpg の鍵生成/署名/検証、logrotate のローテーション、nft の ruleset 読み込み、
  cpio/screen/sensors/sshfs の起動を確認
- [x] **stage3 再生成** — base 33 / 依存込み 55、**stage3 48 パッケージ / 967 MiB**。
  `/usr/share/zoneinfo/Asia/Tokyo`、`/etc/localtime`、crond/nftables サービスを収録

## M30: CLI ツール 26 個追加(2026-11-18 完走)

ベースを最小のまま、実用 CLI を main/ にまとめて追加した(すべて `zpkg install`)。

- [x] **ネットワーク診断** — `iputils 20250605`(ping/arping/tracepath、ping は setuid)、
  `ethtool 7.2`(libmnl)、`mtr 0.96`(ncurses)、`nmap 7.993`(同梱 pcap/pcre/zlib、
  zenmap/ndiff/nping は無効)、`whois 5.6.6`(perl / libxcrypt)、`iperf 3.22`
- [x] **ビルド・開発支援** — `automake 1.20`(perl/autoconf)、`libtool 2.6.2`、
  `ccache 4.14.3`(xxhash。redis/http バックエンドは無効)、`sqlite 3.54.1`
  (FTS5/readline)、`fzf 0.75.0`(Go)、`lua 5.4.9`(readline)
- [x] **圧縮・ファイル操作** — `7zip 26.06`(7zz と 7z symlink)、`lz4 1.11.1`、
  `brotli 1.2.1`、`pigz 2.8`、`pv 1.12.7`、`nnn 5.3`、`entr 5.9`
- [x] **監視・セキュリティ** — `btop 1.4.8`、`wireguard-tools 1.0.20260223`(libmnl)、
  `age 1.3.2`、`restic 0.19.1`(いずれも Go ソースビルド)、`zsh 5.9.2`、
  `moreutils 0.70`(man ページは xsltproc が必要なため省略)
- [x] **依存追加** — `xxhash 0.8.3`(ccache が使用)
- [x] **実走行(2026-11-18)** — chroot に 26 パッケージをインストールし、
  ping/ethtool/mtr/nmap/whois/iperf3、automake/libtool/ccache/sqlite3/fzf/lua、
  7zz/lz4/brotli/pigz/pv/nnn/entr、btop/wg/age/restic/zsh/sponge の動作を確認
- ベースは変更なし(base.list 32 / 依存込み 54)


## M0: リポジトリ骨格(完了条件)

- [x] `studio-nosa-tech` 配下に 4 リポジトリを作成済み(`zignos` / `zpkg` / `zignos-recipes` / `zignos-build`)
- [x] 各リポジトリに骨格ファイルと設計ドキュメントを初回コミット済み
- [x] zpkg が Go モジュールとして `go build` できる

## M1: zpkg v0(完了条件)

v0 のコマンド: `zpkg build|install|remove|list|search|depends`

- [x] 依存のトポロジカルソート(循環検出含む)
- [x] ソース取得(キャッシュ付き)+ sha256 チェックサム検証(実ダウンロード + 改変検知も確認)
- [x] destroot へのビルド(`build` スクリプト実行契約の実装)
- [x] マニフェスト記録 + 競合検出 + install / remove(競合は hello-conflict フィクスチャで実証)
- [x] テストレシピ(hello / hello2 / dl-test)の install → remove が通る(2026-11-15、Windows Git Bash e2e。VM では同手順 — zpkg/README.md のクイックスタート)
- [x] `go vet` / `shellcheck`(全 15 スクリプト)クリーン

## M2: ベースシステム全レシピ化(完了条件)

土台は LFS 13.1-systemd(GCC 16.2.0 / Glibc 2.44 / Binutils 2.47 / Linux 7.1.8)。一時システム(cross ビルド)は zignos-build の stage スクリプトが担当し、**最終システムは zpkg レシピで組み立てる**。

- [x] `stage0.sh`: LFS ch4/ch5/ch6(cross toolchain + 一時ツール)を書籍忠実に実装
- [x] `stage1.sh`: ch7(chroot・essential files・追加一時ツール + ninja/meson + Go bootstrap)
- [x] `stage2.sh`: zpkg で glibc → 圧縮ライブラリ → binutils/gcc → ユーザーランド → go → zpkg 自家ホスト(core 25 レシピ)
- [x] ソース 48 ファイルの sha256 を実ダウンロードで確定し、レシピの checksums に反映
- [x] zpkg: build スクリプトへ `ZPKG_CACHE` を公開(pkgconf が meson tarball を参照)
- [x] build VM で `bootstrap.sh` が最後まで通る — **2026-11-15 完走**(26 パッケージが zpkg DB 登録、zpkg 0.1.0 自家ホスト、go 1.27.4 ソースビルド、`/etc/zignos-release` 生成)
- [ ] 残レシピの追加(e2fsprogs・util-linux 最終版・shadow などは M4 で継続)

### 実走行で修正したもの(2026-11-15、build VM)

- **bootstrap/stage 側**: preflight の `makeinfo` チェック、`$ZIGNOS_ROOT/tmp` 作成、`set -e` 安全化、symlink 冪等化(`ln -sfnv`)、essential files に `tty` 等の標準グループ追加、chroot への `resolv.conf` 提供と busybox のキャッシュシード、stage 再開モード(`all|stage1|stage2`)と vfs 再マウントガード
- **zpkg コア**: patch/diff sources は展開せず `$ZPKG_SRC` へ配置、`usr/share/info/dir` を所有権対象から除外、**ファイル置換を rename で原子的に**(実行中バイナリの ETXTBSY 回避 — 自家ホストに必須)
- **レシピ**: glibc install を `-j1`(並列 install レース)、gcc はオプション生成に mawk(gawk 5.4.1 回帰回避)、coreutils の destroot 内 `usr/sbin` 生成、busybox 1.37.0 へ更新 + TC アプレット無効化(kernel 6.8+ で CBQ UAPI 削除)+ バイナリのみインストール(coreutils と `[` 等で衝突)、go に `GOROOT_FINAL`(trimmed バイナリの GOROOT 検出)

## M3: 起動イメージ(完了条件)

- [x] Linux kernel レシピ + 最小設定(allnoconfig + qemu-x86_64 断片: virtio / ext4 / serial / BINFMT_SCRIPT / BLK_DEV)
- [x] init システム決定 — **OpenRC 本命(M4)/ busybox init(M3)/ mdev**(design-system.md 参照)
- [x] rootfs イメージ生成 + QEMU 起動 — **2026-11-15 `BOOT CHECK PASSED`**(rc.init バナー表示 + ゲストシェルが `uname -r` に応答、serial console)
- [x] 追加レシピ: `bc` / `bison`(kernel kconfig 用)/ `elfutils`(libelf — objtool 用)

### M3 実走行で修正したもの(2026-11-15)

- zpkg: `ZPKG_RECIPE_DIR` を build スクリプトへ公開(レシピがカーネルコンフィグ断片などの資産を持てる)
- kernel 断片: `BLOCK`/`BLK_DEV`(allnoconfig で Block devices メニューが消え virtio_blk が黙って落ちる)、`BINFMT_SCRIPT`(無いと `#!/bin/sh` init が ENOEXEC で起動しない)
- 追加: busybox 1.37.0(TC アプレット無効化 — kernel 6.8+ で CBQ UAPI 削除)+ バイナリのみインストール(coreutils と `[` 等で衝突するため)
- go: `GOROOT_FINAL=/usr/local/go`(trimmed バイナリの GOROOT 検出)
- make-image / qemu-test: tar exclude の `./` 照合問題、`timeout` に関数を渡せない問題、子 bash への環境変数引き渡し、bootfiles の実行権限

## M4b: 実用化(継続)

- [x] **GRUB 2.14 レシピ + パーティション済みブータブルイメージ** — make-image.sh が MBR パーティション + システムコピー + GRUB core.img 手動導入(prefix `(hd0,msdos1)/boot/grub` を grub-mkimage で明示)+ serial grub.cfg
- [x] **QEMU GRUB ブート — 2026-11-15 `BOOT CHECK PASSED`**(BIOS → GRUB → kernel → OpenRC → agetty)
- [x] **zpkg バイナリキャッシュ**(Portage buildpkg 相当): ビルド成功時に destroot を `$ZPKG_CACHE/binpkgs/<name>-<version>.pkg.tar.gz` に pack、install は一致する binpkg を再利用(`ZPKG_NO_BINPKG=1` で強制ソースビルド)。grub で実走行確認
- [x] **installer(実ディスク版)** — `zignos-install [--yes] /dev/sdX`: MBR 1パーティション + 実行中システムのコピー + GRUB 導入 + PARTUUID の fstab/grub.cfg。**2026-11-16 実走行合格**: ゲスト内で空白 8G ディスクへインストール → そのディスクを GRUB 単体起動して `TARGET-BOOT-OK 7.1.8`(ログイン込み)。イメージには `/usr/sbin/zignos-install` として同梱
- [x] initscripts の本格化 — **shadow 導入済み(2026-11-16)**: login/passwd/su/chpasswd がシリアルコンソールで動作(root/zignos で自動ログインテスト合格)、自動ログイン廃止。ca-certificates・openssh は完了(M5)
- [x] stock OpenRC サービスの依存整備 — **2026-11-15 完走: boot runlevel 16 サービス中 15 が [ ok]**(残 1: hwclock の RTC 認識 — カーネル設定は適用済み、要調査)
- [x] 追加レシピ: `procps 4.0.7`(sysctl/ps)、`kbd 2.10.0`(keymaps)、`inetutils 2.8`(ifconfig/loopback)、`autoconf 2.73`(kbd testsuite 用)、`libcap`
- [x] kernel 断片: `BINFMT_MISC`(binfmt サービス)、`RTC_CLASS`/`RTC_DRV_CMOS`/`RTC_HCTOSYS`(hwclock)
- [x] e2fsprogs: fsck.ext2/3/4 リンクを提供(--disable-fsck はフロントエンドのみ無効)、openrc は `-Duucp_group=root` で cachepath 警告解消
- [x] network/netmount サービスを runlevel から除去(未整備のため)
- [x] stray symlink `/usr/libexec/rc/console → /proc/self/mounts` を除去(save-keymaps がディレクトリ作成に失敗していた原因)
- [x] 追加レシピ(2026-11-16): `shadow 4.20.2`(yescrypt)+ `libxcrypt 4.5.2`(shadow の依存)
- [x] ca-certificates(Mozilla bundle via curl.se)— chroot 内の zpkg https fetch が TLS 検証付きで成功することを確認
- [x] openssh 方向(リモート運用)— M5 で完了(sshd + ホストからの SSH ログイン検証)
- [x] デバイス管理: **mdev 継続**を決定(比較表と判断理由は design-system.md。USB hotplug・永続命名が要る時点で eudev)
- [ ] リポジトリの公開方法(その時点で Private → Public 判断)

### M4b-3 実走行で修正したもの(2026-11-15)

- **OpenRC サービススクリプトの shebang は `#!/sbin/openrc-run` でなければならない** — `#!/bin/sh` のサービスは OpenRC が黙ってスキップする(エラーなし)。console/mdev サービスを修正して agetty が起動するようになった — 「シェルが表示されない」問題の真の原因
- **M4b(2026-11-16 追記)**: console サービスは `command_args` ではなく **`command_args_foreground`** を使う(supervise-daemon は通常の args だと stdio を /dev/null に繋ぎ、agetty が起動してもコンソールに何も出ない)。agetty の引数順は「ポート → ボーレート」(util-linux)。起動チェックは**解決済み出力のみ**をマッチする(入力エコーの誤検知排除)+ ログインフロー(root/zignos)対応、TCG の起動遅延に合わせたタイミング調整
- chroot 内 https fetch が CA 無しで TLS 失敗 → 当面はキャッシュシード運用(手動 chroot のたびに vfs 再マウントが必要な点も再確認)
- 孤立 qemu がイメージの書き込みロックを保持する問題 → 実行前の pkill(`[q]emu-system` ブラケット記法 — 素のパターンは自分自身にマッチして自殺する)
- 40G ツリーの ext4 が二度の破損を起こし `/bin` symlink 等が消失 → オフライン e2fsck + root symlink 再構築の手順確立(破損の根本原因は kill された make-image/chroot の異常終了の連鎖)

### M4b 実走行で修正したもの(2026-11-15)

- **make-image: exclude がマウントポイント自体を消していた** — `dev/proc/sys/run` を除外した結果、イメージに `/dev` 等が存在せず devtmpfs も OpenRC も全滅(ユーザー起動時の `/dev/null: No such file or directory` カスケード)。コピー後にマウントポイント(dev/proc/sys/run/tmp/opt/var/tmp/var/lib/seedrng)を再作成するよう修正
- make-image: leftover vfs マウントが tar に混入する問題(proc/sys/dev/run を除外 + 事前 unmount)、40G イメージの ext4 破損対応(e2fsck)、同一 backing file への複数 loop アタッチが page cache 不整合を起こす問題(全 detach + drop_caches を make-image 自身に組み込み)
- GRUB ブート fs: e2fsprogs 1.47+ 既定の `orphan_file`/`metadata_csum_seed` は GRUB 2.14 未対応(mkfs で機能制限)
- grub-install の loop probing は chroot 環境で誤った UUID を埋め込む → **grub-mkimage による手動 core.img + dd 導入**に変更
- qemu-test: KERNEL 未指定時は GRUB ブート(直接 kernel ブートも `KERNEL=` で残存)
- make-image: `$ZIGNOS_ROOT/dev` はホスト `/dev` の bind なので `umount $ZIGNOS_ROOT/dev/pts` がホストの devpts を外すことがある(「sudo: unable to allocate pty」)→ 自己修復ガード(mountpoint チェック + devpts 再マウント)を追加
- **hwclock 解決(2026-11-16)**: `CONFIG_RTC_CLASS` だけでは sysfs エントリしか作られず `/dev/rtc0` が無い → **`CONFIG_RTC_INTF_DEV`** を断片に追加して `Setting system clock ... [ ok ]` を確認
- **installer の実走行で修正**: `partprobe` は base system に無い(parted 未導入)→ `partx -u` に変更、対象ディスクサイズ不足(4G→8G)、**最小カーネルは `root=UUID=` を解決できない** → PARTUUID に変更(disk-id + パーティション番号は vda/sda の変更に強い)
- network サービスは未設定で除去済み

## M24: initramfs + UEFI + 汎用カーネル(2026-11-17)

- [x] **`core/initramfs`** — `zignos-mkinitramfs`(busybox + /init を cpio+gzip)と
  `/usr/lib/zignos/initramfs/init`。`root=UUID=`/`LABEL=`/`/dev/*` を busybox blkid で
  解決し、`mount -o ro` → `switch_root`。失敗時は rescue shell。`-m` でモジュール同梱
- [x] **汎用カーネル** — `x86_64_defconfig` + `core/linux/x86_64-generic.config`：
  起動系(ACPI/APIC、SATA AHCI、NVMe、USB/XHCI/storage/HID、VT/VGA/simpledrm/fbcon、
  ext4/vfat、virtio、主要 NIC)は **=y**、GPU/WiFi/追加 NIC/FS は **=m**。
  `make modules_install` + `kmod depmod`、ビルド時に `/boot/initramfs.img` を生成
- [x] **`core/kmod 34.3`** — modprobe/depmod/insmod/lsmod(libkmod)。initscripts r8:
  mdev を hotplug helper に登録、`/etc/mdev.conf` の MODALIAS ルールで自動ロード、
  `console-vga` を default runlevel に追加
- [x] **GRUB の BIOS + UEFI ビルド** — `i386-pc` と `x86_64-efi`(601 モジュール)を
  別ビルドツリーで構築し同梱(grub r1)
- [x] **イメージ** — root=UUID + initramfs に統一。`UEFI=1` で GPT(100MiB ESP +
  ext4 root)+ `grub-mkstandalone` の `BOOTX64.EFI` を生成。BIOS 版は従来の MBR + core.img
- [x] **インストーラ** — 起動ファームウェアを判定し、UEFI なら GPT+ESP
  (`/EFI/BOOT/BOOTX64.EFI`、NVRAM 登録なし)、BIOS なら MBR。grub.cfg は UUID + initrd
- [x] **QEMU テスト** — `UEFI=1` で OVMF(edk2)の pflash 起動に対応
- [x] **実走行検証(2026-11-17)**:
  - BIOS イメージ: `BOOT CHECK PASSED`、`/proc/cmdline` が `root=UUID=...`(initramfs が解決)、
    `console`/`console-vga`/`mdev`/`dbus`/`sshd`/`chronyd` started、`mdev -s` が
    `cfg80211` を自動ロード、`modprobe iwlwifi` / `modinfo i915` が動作
  - UEFI イメージ(OVMF): `BOOT CHECK PASSED`、`/sys/firmware/efi` あり、
    `simpledrm` + `fbcon` で VGA コンソール有効、GPT の `/dev/vda2` を UUID でマウント
  - **UEFI インストーラ e2e**: 12G 空ディスクへ GPT+ESP でインストール →
    `ZIGNOS-INSTALL-COMPLETE` → そのディスク単体を OVMF で起動 → `TARGET-BOOT-OK 7.1.8`
  - **BIOS インストーラ e2e**: MBR へインストール → 単体起動 → `TARGET-BOOT-OK 7.1.8`
- [x] **実走行で踏んだ罠**:
  - busybox が**動的リンク**で initramfs 内で実行不能(`/init` が ENOENT)→
    `CONFIG_STATIC=y` で静的ビルドに変更(busybox r1)
  - `busybox --install -s` のリンク先が**ビルド時の一時パス**になる → 展開ツリー内で
    `chroot "$TMP" /bin/busybox --install -s /bin` して `/bin/busybox` を指すように
  - `mke2fs` のサイズ引数は `-b` 未指定だと **1KiB 単位**(1/4 の FS を作って populate 失敗)
    → `-b 4096` を明示
  - GPT の**バックアップテーブル末尾 34 セクター**まで ext4 を広げると
    「bad geometry ... exceeds size of device」→ root パーティションと FS を
    末尾 34 セクター手前で揃える
  - make-image の `unmount_vfs` が `$ZIGNOS_ROOT/dev`(ホスト /dev の bind)経由で
    **ホストの devpts を外し、build VM の sshd を壊した** → unmount を廃止
    (tar の exclude で十分)
  - TCG で既知の `IO-APIC + timer doesn't work!` パニックが OVMF 起動でも稀に出る
    → 再試行で通る(従来どおり)

## M23: 実機インストール準備(2026-11-17)

- [x] **インストールガイド** — SystemRescue 13.03 を推奨 Live ISO とし、入手/検証/USB
  書き込み、方法 A(ZIGNOS USB → `zignos-install`)、方法 B(イメージ直書き + 拡張)、
  方法 C(レスキュー/chroot)、初回設定・WiFi・トラブルシューティングを記載。
  カーネル設定の参考として Gentoo ハンドブック(Configuring the Linux kernel)を紹介
- [x] **`zignos-install` の実機対応** — NVMe/eMMC のパーティション名(`nvme0n1p1`)に対応。
  grub.cfg を `console=tty0 console=ttyS0` に(timeout 5 秒)
- [x] **イメージの root=PARTUUID 化** — `make-image.sh` が MBR の disk id から PARTUUID を
  求めて grub.cfg に書く。イメージを USB/SATA/NVMe のどこへ `dd` しても起動できる
  (従来は QEMU 専用の `/dev/vda1`)。**実走行で罠**: GRUB の `boot.img` を 446 バイト
  書くと MBR disk id(オフセット 440)がゼロ上書きされ PARTUUID が壊れる → **440 バイト**
  に変更し、書き込み後に disk id と PARTUUID の一致をアサート。`BOOT CHECK PASSED`
- [x] **initscripts r6** — VGA ログイン用 `console-vga`(agetty tty1)を同梱。
  ただし現カーネルに `CONFIG_VT` が無いため **runlevel には未登録**
  (VT 追加後に `rc-update add console-vga default`)。securetty に tty1/tty2 を追加、
  `wpa_supplicant` が `/etc/conf.d/wpa_supplicant` を読むよう修正(`WPA_IFACE`)
- [ ] **実機用カーネルプロファイル** — ACPI/APIC/SATA/NVMe/USB/VT/有線・無線ドライバ。
  現行 `qemu-x86_64.config` は virtio + serial のみ(実機ブートの次作業)

## M22: WiFi スタック + D-Bus + HW 情報ツール(2026-11-17 完走)

- [x] **D-Bus 1.16.4(core、meson ビルド)** — system bus のみ(セッションバスは GUI 導入時)。
  `messagebus` アカウント(uid/gid 25)は initscripts、machine-id は `dbus-uuidgen --ensure`
  (サービスの `start_pre`)。selinux/apparmor/libaudit/systemd/x11_autolaunch は無効
- [x] **WiFi userland(main/)** — `libnl 3.12.0`(nl80211 の土台)/ `wpa_supplicant 2.12`
  (WPA2/WPA3、nl80211 + OpenSSL + D-Bus 制御 IF)/ `iw 6.17`(scan/link)。rfkill は
  util-linux が `/usr/sbin/rfkill` を提供するため**別パッケージにしない**(ビルド中に
  「already owned by util-linux」で判明 → レシピ削除)
- [x] **HW 情報ツール(main/)** — `lshw B.02.20` / `dmidecode 3.7` / `smartmontools 7.5`(smartctl)。
  実機持ち込み時の型番・メモリスロット・ディスク健全性の確認用
- [x] **linux-firmware 20261019(main/)** — kernel がロードする firmware 一式(導入 2.0 GiB、
  7794 ファイル)。tarball 1.0 GiB かつ 12G イメージの空きが ~3.9 GiB しかないため
  **base.list 外**。実機では `zpkg install linux-firmware` で導入。`make dedup` は
  rdfind 未導入のため未使用。検証: インストール → 空白入りパスを `zpkg owner` で解決 →
  削除で `/lib` が残ることまで確認
- [x] **manifest の空白パス対応** — linux-firmware に `...Intel Corp.-VALLEYVIEW C0
  PLATFORM.txt` のような空白入りファイル名があり、旧パーサ(`strings.Fields`)が
  `malformed file entry` で停止。**空白・引用符・バックスラッシュを含むパスを Go の
  クォート形式で書く**ようにし、旧形式の行も読めるよう後方互換を維持(unit test 追加)。
  インストール先は usr-merge に合わせて `/usr/lib/firmware`(kernel は `/lib/firmware`
  経由で解決)
- [x] **usr-merge 削除バグ(重大)** — linux-firmware の remove で、マニフェストの
  `dir lib` を空ディレクトリとして `os.Remove` した結果 **`/lib` シンボリックリンクが
  消え**、動的リンクのバイナリが全て `required file not found` で起動不能になった。
  ディレクトリ掃除は **Lstat で実ディレクトリと確認できたものだけ**に修正し、
  `/lib` が残る回帰テストを追加。chroot は `ln -s usr/lib /lib` で復旧
- [x] **initscripts r4** — messagebus アカウント + `init.d/dbus`(boot runlevel、
  `start_pre` で uuid 生成と `/run/dbus`)/ `init.d/wpa_supplicant`(`WPA_IFACE` で IF 指定、
  ctrl_interface は `/run/wpa_supplicant`・group wheel)。**r5 で起動試験の修正**:
  dbus に `--nofork`(fork すると supervisor が crash と誤認し多重起動)、sshd を
  supervise-daemon + `-D` に(pidfile が無く「crashed」表示だった)、wpa_supplicant は
  default runlevel から外す(wlan の無い機体で failed になるため。WiFi 機で
  `rc-update add wpa_supplicant default`)
- [x] **zpkg: upgrade 時の不要ファイル削除** — 旧マニフェストにあって新マニフェストに
  無いファイルを、内容一致(sha256/リンク先)を条件に削除。編集済みファイルは残す。
  削除は backup 経由なので失敗時ロールバック可能(unit test + `prunepkg` の
  v1→v2 e2e で確認: drop だけが消え keep は残る)
- [x] **zpkg レシピの罠** — `cp -a /sources/zignos-zpkg "$ZPKG_WORKDIR/zpkg-src"` は
  workdir に旧コピーがあると**その中へネスト**し、古い v0 バイナリを黙って再ビルド
  していた(実走行で判明)。`rm -rf` してからコピーするよう修正し revision 1 に。
  さらに bootstrap の Go は trimmed ビルドで `GOROOT` を環境からしか取らないため、
  レシピで `GOROOT=/usr/local/go` を既定にする修正(r2)
- [x] **base.list 85 パッケージ** — dbus + libnl/wpa_supplicant/iw を追加。
  カーネル側は CFG80211/MAC80211 + ドライバ + firmware が実機で別途必要(コメントに明記)
- [x] **dbus ビルドの知見** — 1.16 は autotools を削除済み(meson のみ)。`--runstatedir` は
  meson に無く、`tests` オプションも無い(`modular_tests`/`asserts`)。`modular_tests` は
  combo なので **`disabled`**(`false` は不可)
- [x] 実走行検証(2026-11-17): dbus 1.16.4 + WiFi/HW 7 パッケージをビルド・インストール、
  `dbus-uuidgen --ensure` が `/var/lib/dbus/machine-id` を生成、`wpa_supplicant v2.12` /
  `iw 6.17` / `lshw B.02.20` / `dmidecode 3.7` / `smartctl 7.5`、`zpkg list` **101**
- [x] **イメージ再生成 + ゲスト起動確認(2026-11-17)**: `BOOT CHECK`(ログイン込み)+
  `rc-service dbus status` = started(プロセスは supervise-daemon + dbus-daemon の 2 行)、
  `dbus-send ... ListNames` が success、`ss -ltn` に :22(sshd started)、
  wpa_supplicant は default runlevel に居ない(設計どおり)
- [ ] 次: 実機 WiFi 検証(kernel の CFG80211/MAC80211 + ドライバ + firmware を断片へ追加)

## M21: CLI ツール 13 個追加(2026-11-17 完走)

- [x] **main/ に 13 レシピ** — `tree 2.2.1` `jq 1.8.2` `zip 3.0` / `unzip 6.0`(Info-ZIP)/ `ncdu 1.22` `socat 1.8.1.3` `lsof 4.99.7` `strace 6.19` `libpcap 1.11.0` / `tcpdump 4.99.7` `dosfstools 4.2`(mkfs.vfat — EFI 準備)/ `pciutils 3.15.0`(pci.ids をレシピ資産として同梱)/ `sysstat 12.7.7`。base.list は据え置き(81)
- [x] 実走行で修正したもの(古いパッケージの現代環境対策が集中):
  - **tree**: タグアーカイブの man ページは `doc/tree.1`
  - **zip 3.0**: `unix/configure` のプローブが現代環境を誤検出し `-DZMEM`(glibc と競合)を注入 → **flags ファイルを事前作成**(unix/configure より新しい mtime にして make に再生成させない)
  - **unzip 6.0**: `unxcfg.h` の古式 `gmtime()/localtime()` 宣言パッチ + **`linux_noasm`**(linux ターゲットは 32bit CRC asm を x86_64 でアセンブルしてしまう)
  - **socat**: OpenSSL 4 で `ASN1_OCTET_STRING` 非透明化 → `--disable-openssl`(リレー機能には不要)
  - **strace**: kernel 7.1 で io_uring 構造体の予約フィールド名が変わった → パッチではなく **`--enable-bundled=yes`**(strace 同梱ヘッダを使う。エラーメッセージ自体が指示してくれた)
  - pciutils: pci.ids の全ミラーが VM から到達不能だったため、Debian スナップショットを**レシピ資産として同梱**(実機では `update-pciids` で更新)
- [x] 実走行検証: 13 パッケージ全ビルド・インストール(`zpkg list` 94)。tree/jq/zip/unzip/ncdu/socat/lsof/strace/tcpdump+libpcap/mkfs.vfat/**lspci(pci.ids でデコード表示)**/iostat すべて動作
- [ ] 次: 実機ブート検証、GUI 調査、binpkg リポジトリの署名(配布開始時)

## M20: slots 共存(2026-11-17 完走)

- [x] **DB レコードを `<name>@<slot>` キー化** — slot "0"(既定)は素の名前ディレクトリのまま(既存レコード移行不要)、非 0 スロットは `name@slot` で共存
- [x] **競合ルール** — 同一 name+slot は upgrade、**別スロット・他パッケージとのファイル重複はエラー**
- [x] **remove は全スロット削除**(各スロット毎にジャーナル)、`upgrade` はレシピのスロットのみ更新(他スロット温存)
- [x] **install の rec に Slot を記録** — 記録漏れがあるとスロットが素の名前に潰れる(実走行で発見・修正)
- [x] ユニットテスト: スロットキー / 共存 / クロックスロット競合 / 全スロット削除。実機 e2e: slot 0(v1.0)と slot 1(v2.0)が共存し、slot 0 を 1.5 に upgrade しても slot 1 は温存、slot 1 が slot 0 のファイルを要求すると競合で拒否
- [ ] 次: 実機ブート検証、GUI 調査、binpkg リポジトリの署名(配布開始時)

## M19: binpkg リポジトリ対応(2026-11-17 完走)

- [x] **`zpkg mkindex [dir]`** — binpkg ディレクトリから `index.json` を生成
  (schema 1: name/version/revision/usehash/arch/sha256/size/filename/deps)。
  PackBinpkg が `.meta.json` サイドカーを書くようになったため、**レシピツリーなしで**索引を作れる
- [x] **リポジトリからのインストール** — `ZPKG_BINREPO`(env)または
  `/etc/zpkg/binrepo.conf` の `BINREPO=`。ローカル binpkg キャッシュがミスした後に
  リポジトリを試す。一致条件: name/arch/version+revision/**実効 USE ハッシュ**、
  tarball は索引の sha256 と照合。違えば黙ってソースビルドにフォールバック
- [x] **配布は範囲外** — 静的ファイルサーバで十分(ユーザー方針: 開発力の現状では
  配布はやらず、対応だけしておく。コミュニティができた時点で index.json の署名などへ拡張)
- [x] ユニットテスト: 索引生成 + リポジトリ復元 + ハッシュ不一致フォールバック +
  未設定/NO_BINPKG での無効化。実機検証: pack → mkindex → 別ルートで
  `installed from binpkg`(ソースビルドなし)→ フラグを変えるとソースビルドへフォールバック
- [ ] 次: slots 共存、実機ブート検証、GUI 調査、chrony の drift 運用観察

## M18: chrony(2026-11-17 完走)

- [x] **`core/chrony 4.9` レシピ** — pool 同期 + `rtcsync`(RTC をカーネルに同期)+
  `makestep`(大きい偏りは段階補正せず飛ばす)。chrony アカウント(uid/gid 45)は
  initscripts、drift ディレクトリの chown は `post_install` フック
- [x] **initscripts r2** — chrony アカウント + `chronyd` サービス(supervise-daemon、
  `after dhcpcd`)+ default runlevel
- [x] base.list 81 パッケージ(core 68 + main 14)
- [x] 実走行検証(2026-11-17): ゲスト起動で `Starting chronyd [ ok ]`、
  **`chronyc sources` が `^* ntp-jp.vulp.ca`(同期済みマーク、Stratum 3)** —
  QEMU slirp 経由で実際に NTP 同期している。VM の時計ずれ問題の解消も期待

## M17: meson レシピ化 + `upgrade --newuse`(2026-11-17 完走)

- [x] **`core/meson` レシピ** — pip 無しのスタンドアロン導入: `mesonbuild/` を
  インタプリタの site-packages へ、`meson.py` を `/usr/bin/meson` へ、man ページも同梱
- [x] **openrc r1** — ビルド時にキャッシュから meson tarball を展開する前方式を廃止し、
  システムの `meson setup` + `ninja` に移行(`makedepends: meson ninja`)。
  `zpkg upgrade openrc` で再ビルド → `BOOT CHECK PASSED`(meson ビルド版 openrc で正常起動)
- [x] **`zpkg upgrade --newuse`** — 実効 USE フラグ(package.use 含む)がインストール時の
  `meta.useflags` と異なるパッケージを再ビルド。実機検証: フラグ変更で `rebuilding`
  → 成果物のマーカーが変化、`--newuse` 無しは up to date のまま
- [x] base.list 80 パッケージ(core 67 + main 14、desktop 0)
- 備考: build VM に `/dev/kvm` が無い(ネステッド仮想化なし)→ KVM 検証は実機持ち込み課題
- [ ] 次: chrony 等のユーザー整備(NTP — VM の時計ずれ対策)、slots 共存、binpkg リポジトリ配布

## M16: man ページ環境(2026-11-17 完走)

- [x] **man チェーン 5 レシピ** — core/: `groff 1.25.0`(troff フォーマッタ)`gdbm 1.26`(man-db のキャッシュ DB)`libpipeline 1.5.8` `man-db 2.13.2`(`--enable-cache-owner=bin`、`--with-groff`)/ `man-pages 6.20-r1`(セクション 2/3 など)
- [x] **bin アカウントを initscripts に追加**(uid/gid 1、man-db のキャッシュ所有者)+ **revision r1 へ更新**
- [x] **`zpkg upgrade initscripts` をドッグフーディング** — revision による rolling 更新が実機で初めて動作(r0→r1 再ビルド・再インストール、passwd/group のトランザクション置換)
- [x] **man-pages の crypt(3) 競合** — libxcrypt が crypt.3 を所有 → LFS と同じく `rm man3/crypt*`。古い binpkg(crypt.3 含む)が再利用されたため **revision 1 に bump**して binpkg キーを無効化 — 「レシピ内容変更 → revision を上げる」運用の実証
- [x] base.list 79 パッケージ。実走行検証: chroot + ゲスト起動で `man ls` / `man 2 open` / `man 3 printf` が整形表示
- [ ] 次: meson レシピ化(pip が無いことが障壁)、USE 変更時の自動再ビルド、slots 共存、binpkg リポジトリ配布

## M15: linux-headers レシピ化(2026-11-17 完走)

- [x] **`core/linux-headers` レシピ** — linux と同じ tarball から `make headers` + `headers_install`。stage0 が `$ZIGNOS_ROOT/usr` へ直コピーしていた kernel headers を同版数(7.1.8)で採用(adopt)
- [x] **glibc の depends に `linux-headers` を追加** — `zpkg depends glibc` は linux-headers を先に返す(新規 bootstrap の順序が依存解決で決まる)
- [x] 実走行検証(2026-11-17): 1086 ファイルを採用、`zpkg owner /usr/include/linux/version.h` → linux-headers、`zpkg list` 74、イメージ再生成 + `BOOT CHECK PASSED`
- **これで /usr 配下の全ファイルが zpkg 管理。LFS への依存は cross toolchain の「構築手順」(stage0/1 のスクリプト)だけになった**
- [ ] 残: `meson` レシピ化(pip が無いことが障壁)、man-db/man-pages、slots 共存、binpkg 配布

## M14: レシピ拡充 + stage2 の base.list 化(2026-11-17 完走)

- [x] **レシピ 18 個追加** — core/: `m4 1.4.21` `texinfo 7.3` `diffutils 3.12` `patch 2.8` `findutils 4.11.0` `gawk 5.4.1`(mpfr+readline) `gettext 1.0` `perl 5.44.0` `mpdecimal 4.0.1` `libffi 3.5.2` `python3 3.14.10` `ninja 1.13.2` `libevent 2.1.12` / main/: `wget 1.25.0` `tmux 3.5a` `htop 3.4.0` `rsync 3.5.2` `which 2.25`
- [x] **stage1 の場当たりインストールを採用(adopt)** — perl/python3/gettext/texinfo/mpdecimal/ninja は stage1 が zpkg 外に直接入れていた。同版数のレシピで `zpkg owner` が全部答える状態になり、アップデート可能に
- [x] **stage2 を base.list 化** — フェーズ1 = bootstrap core(zpkg 自家ホストまで、ハードコードのまま)+ フェーズ2 = `/sources/base.list` 全量適用(scaffold が base.list を /sources へ配布)。skip-installed で冪等
- [x] **OpenSSL 4 対応パッチ** — `python3`(`TLSv1_method` 等の fixed-version メソッドが OpenSSL 4 で削除、`OPENSSL_NO_*_METHOD` マクロも消えた → OPENSSL_VERSION_NUMBER ガード)と `wget`(`SSLv3_client_method` 同様)。両レシピとも `makedepends: patch` で自家パッチを当てる(patch パッケージのドッグフーディング)
- [x] その他の実走行修正: depends は**1行1パッケージ**(zpkg は行単位で読む)、`rsync 3.5` は optional ライブラリ欠落で abort するので `--disable-xxhash --disable-lz4 --disable-idn`
- [x] 実走行検証(2026-11-17):
  - `bootstrap.sh stage2` 完走: 18 パッケージをビルド・インストール(`zpkg list` 55 → **73**)
  - `zpkg owner /usr/bin/perl /usr/bin/python3 /usr/bin/ninja /usr/bin/msgfmt /usr/bin/makeinfo /usr/bin/find /usr/bin/awk /usr/bin/wget /usr/bin/tmux /usr/bin/rsync` 全部答える
  - `python3 -c "import ssl, ctypes, xml..."` → OpenSSL 4.0.1 で動作、イメージ起動でも tmux/wget/rsync 動作
  - `build-system.sh /mnt` → 全 73 skipping(base.list と完全一致)
- [ ] 残: `linux-headers` レシピ化(kernel headers がまだ stage0 直設置)、meson のレシピ化(openrc はキャッシュから meson tarball を直接展開)、man-db/man-pages

## M13: base.list 一本化 + ローリングリリース方針(2026-11-17)

- [x] **`zignos-build/base.list`** — ベースシステムの唯一の定義(55 パッケージ、カテゴリコメント付き)。sudo は意図的に除外(main/ のみ)
- [x] **`zignos-build/build-system.sh <root>`** — base.list をルートへ適用。レシピはルート内 `/sources/zignos-recipes` 優先 → 同梱 `/usr/share/zignos/recipes`。`-p` 対応、実行中システム(`build-system.sh /`)は chroot なしで直接 zpkg
- [x] **実機検証** — bootstrap ツリー(`/mnt`)に pretend + apply を実行: **全 55 パッケージが skipping** = ツリーが base.list と完全一致
- [x] **ローリングリリース方針を明文化** — README と ブートストラップ設計:
  - レシピツリーの HEAD が常に現在のリリース(固定版なし)
  - 更新経路: システムは `zpkg upgrade`、ビルドホスト/seed は `build-system.sh`(冪等)
  - スナップショット = レシピツリーの git タグ、seed tarball はそのバイナリ配布
- [ ] 次: stage2 の最終システム構築を base.list 経由に寄せる / `linux-headers` レシピ化(kernel headers がまだ stage0 直設置)/ seed の配布先

## M12: zpkg トランザクション(2026-11-17 完走)

- [x] **ジャーナル付き install/remove** — `$ZPKG_DB/.txn`(journal.json + backup/)。置き換え対象は backup へ移動してから配置
- [x] **Apply 失敗時のその場ロールバック** — backup から復元・作成ファイル削除。アップグレード失敗時は旧レコードを保持(`hadrecord`)
- [x] **クラッシュ復旧** — 次の zpkg 操作の冒頭 or `zpkg recover`。中断 install はロールバック、中断 remove は完了。破損ジャーナルは `.txn.corrupt` に退避
- [x] **fsync** — DB の version/meta.json/manifest を tmp+rename + fsync(ファイル+ディレクトリ)
- [x] ユニットテスト: commit / rollback / upgrade 失敗で旧レコード保持 / remove クラッシュ完了 / 未遂トランザクション無し
- [x] 実機検証(2026-11-17):
  - `zpkg recover` → `no interrupted transaction`
  - install + post_install フック正常
  - remove の途中クラッシュを再現(手で marker を消して journal を設置)→ `zpkg recover` が `completed the interrupted removal of hookpkg 1.0`、レコードと `.txn` が消滅、再 `recover` は無し
  - イメージ起動で `zpkg recover` が動作
- [ ] 次: slots 共存、並列ビルド --jobs、USE 変更時の自動再ビルド、binpkg リポジトリ index + 署名

## M11: パッケージ単位 USE + フック(2026-11-17 完走)

- [x] **package.use** — `/etc/zpkg/package.use`(`<pkg> flag -flag ...`)。実効フラグ = グローバル + パッケージトークン。binpkg のオプションハッシュもパッケージごとの実効値から計算
- [x] **IUSE 検証** — レシピの `iuse` に無いフラグを `flag?pkg` で使うとエラー(タイポ検出)
- [x] **CLI** — `zpkg use --package <pkg> [flag|-flag]...`(表示・編集)
- [x] **レシピフック** — `post_install` / `post_remove` を実行。`ZPKG_ROOT=/` は直接、bash のあるルートは chroot、空ルートはホスト実行 + `ZPKG_ROOT` 環境
- [x] **ldconfig トリガー** — install/remove 後に `<root>/usr/sbin/ldconfig` をベストエフォート実行
- [x] 実機検証(2026-11-17):
  - `use --package usetest demo` → `usetest: demo`、グローバルは空のまま
  - その状態で `depends usetest` → `usetest-dep usetest-make usetest`、`-demo` で依存が消える
  - `iuse` に無い `bogus?` → `conditional dependency uses flag "bogus", which is not in iuse`
  - `post_install` が `post_install usetest 1.0 root=... use=demo` を記録、`post_remove` も実行
  - イメージ起動で `zpkg use` / `use --package vim` が動作
- [ ] 次: トランザクション(ジャーナル/ロールバック)、slots 共存、並列ビルド、USE 変更時の自動再ビルド

## M10: zpkg の USE フラグ(2026-11-17 完走)

- [x] **options パッケージ** — `$ZPKG_ROOT/etc/zpkg/use.conf` + `make.conf`、`ZPKG_USE`/`ZPKG_CFLAGS`/`ZPKG_MAKEOPTS` の上書き(空文字でも明示すれば上書き)、`flag?pkg` の展開、オプションハッシュ
- [x] **build** — レシピへ `ZPKG_USE` / `ZPKG_CFLAGS` / `ZPKG_MAKEOPTS` を渡し、binpkg キャッシュ名にオプションハッシュを付与
- [x] **CLI** — `zpkg use [flag|-flag]...`、依存解決での条件付き依存展開、`meta.json` の `useflags` と `zpkg info` 表示
- [x] 実機検証(2026-11-17):
  - `zpkg use` 空 → `zpkg use demo` → `demo`、`zpkg use -demo` で解除
  - `depends usetest`: USE 無し → `usetest` のみ / `ZPKG_USE=demo` → `usetest-dep usetest-make usetest`
  - binpkg 名: `usetest-1.0.pkg.tar.gz`(オプション無し)/ `usetest-1.0-c906b4fc.pkg.tar.gz`(USE=demo)
  - ビルド成果物のマーカーに `demo`、インストール後の `zpkg info usetest` に `useflags: demo`
  - イメージ起動で `zpkg use` が動作
- [ ] 次: パッケージ単位の USE(`package.use`)、`IUSE` による既定値/無効フラグ検証、hooks/triggers、slots 共存

## M9: zpkg v0.9(DB schema 2・world/upgrade)(2026-11-16 完走)

- [x] **pkgdb schema 2** — `meta.json`(slot/repo/arch/installed/useflags/depends/builddepends)、tmp+rename の原子的書き込み。**v1 レコードはそのまま読める**(次の install で meta 付与)
- [x] **レシピの任意メタデータ** — `revision` / `slot` / `provides` / `conflicts` / `makedepends`。無いレシピは従来どおり(revision 0, slot "0")
- [x] **バージョン比較** `internal/version` — pkgver のセグメント比較 + `-rN`(`1.0_rc1 < 1.0 < 1.0_p1`、`1.0 == 1.0.0`)
- [x] **world** — `$ZPKG_DB/world` に明示インストールを記録。`install` は指定ターゲットのみ追加(依存は追加しない)、`--asdeps` で抑止、`remove` で除去
- [x] **新コマンド** — `upgrade [-p] [pkg...]` / `info` / `owner` / `world`、`install/build -p`(pretend)
- [x] binpkg キャッシュ名に `-rN` を追加
- [x] 実機検証(2026-11-16):
  - `zpkg info vim`(v1 レコード)→ installed 9.2.1355 / available 9.2.1355 (slot 0, repo main) / depends ncurses
  - `zpkg owner /usr/bin/vim /usr/sbin/ip /etc/passwd` → vim / iproute2 / initscripts
  - `zpkg install -f doas` → meta 付きで記録、`zpkg info doas` に slot/repo/installed、`zpkg world` に doas
  - `zpkg upgrade -p` → up to date、偽レシピ(99.0)で `doas: 6.8.2 -> 99.0 / would install`
  - イメージ起動で `zpkg info` が動作
- [ ] 次: USE フラグ + 条件付き依存 + binpkg キーへの USE ハッシュ、hooks/triggers、slots 共存(設計は /docs/design-pkg/)

## M8: 常用ツールの拡充 + seed 方式(LFS 依存の解消)(2026-11-16)

- [x] **main にツールを追加**: `libmnl 1.0.5` / `iproute2 6.19.0`(ip/ss/tc)/ `less 710` / `nano 9.3` / `vim 9.2.1355`(コンソール版、vi リンク付き)/ `curl 8.23.0` / `git 2.56.1`
- [x] 依存関係: iproute2→libmnl、less/nano/vim→ncurses、curl→openssl+zlib、git→curl+zlib。git の https は curl 経由(OpenSSL)
- [x] **seed 方式の導入(LFS 依存からの脱却・第一歩)**: `make-seed.sh`(現システム→tar.gz)と `zignos-enter.sh`(展開先に mount+chroot)。**cross bootstrap は seed を作るためのメンテナ専用経路**と位置づけ、利用者・開発者は seed から入って zpkg で拡張する。設計は ブートストラップ設計(非公開)
- [x] 実走行検証(2026-11-16):
  - chroot: 全ツールをビルド・インストール、`ip -V` / `less` / `nano` / `vim` / `curl` / `git --version`、`curl -sI https://example.com`(200)、`git ls-remote https://github.com/git/git` を確認
  - イメージ起動(コピー): `iproute2-6.19.0` / `less 710` / `VIM 9.2` / `curl 8.23.0 (OpenSSL 4.0.1, zlib 1.3.2)` / `git 2.56.1`
  - seed: `make-seed.sh` → `/var/tmp` に展開 → `zignos-enter.sh` で **zpkg 55 パッケージ**・`git`・`ip`・`vim` を確認、終了後に vfs マウント残存ゼロ
  - 注意: build VM の `/tmp` は tmpfs(7.9GB)。イメージ/seed は `/var/tmp` を使う(満杯になると展開が壊れる)
- [ ] `base.list` の一本化 / seed からの world rebuild / cross bootstrap の完全独立(ブートストラップ設計(非公開) の残作業)

## M7: 特権昇格(doas デフォルト + sudo は main)(2026-11-16 完走)

- [x] **doas 6.8.2(core、デフォルト)** — OpenDoas。`--without-pam`(shadow 認証)+ `--with-timestamp`(persist は `/run/doas` を使用)。4755 root:root、`/etc/doas.conf` は `permit persist :wheel`
- [x] **sudo 1.9.17p2(main、リポジトリのみ)** — configure 既定の shadow 認証。`--disable-log-client --disable-log-server` で **OpenSSL を使わない**: 1.9.17p2 の `hostcheck.c` は `ASN1_STRING` の内部構造に触れており OpenSSL 4.0 でコンパイルできない。ログ/TLS は使わないので sudo 内蔵 SHA-2 で十分。wheel 用 sudoers を同梱
- [x] **zpkg の setuid 保持** — `open(2)` は setuid/setgid を無視するため install で明示的に chmod、binpkg は `tar.FileInfoHeader` でモードを保存。これが無いと doas/sudo がただの実行ファイルになる
- [x] **レシピツリーの同梱** — イメージの `/usr/share/zignos/recipes/{core,main,desktop}` にレシピを収録し、`ZPKG_REPOS` 未設定時は zpkg が自動で検索(gentoo の `/var/db/repos` 相当)。ゲストで `zpkg search sudo` → `main sudo 1.9.17p2`、`zpkg install sudo` がレシピ同梱だけで解決することを確認
- [x] 実走行検証(2026-11-16): doas はコンソールで zuser(wheel)→`doas id`→`uid=0(root)`、sudo は chroot 内で `sudo -S id`→`uid=0(root)`(その後 sudo はイメージから除去)。清浄イメージはコピーを起動して doas 4755・テストユーザー不在を確認。ゲスト内 sudo のフルビルドは TCG で時間切れ(ビルド自体は chroot で実証済み)
- [ ] ベースシステムのパッケージ一覧が `stage2.sh` + 手動インストールに分散している → `base.list` に一本化する(再現性の課題)

## M6: ユーザー管理と SSH 硬化(完了条件 — 2026-11-16 完走)

- [x] **zignos-install が一般ユーザーを作成** — 対話時はユーザー名(既定 `zignos`)とパスワード(2回入力)を尋ねる。`--yes` は `ZIGNOS_USER` / `ZIGNOS_PASSWORD` で指定。`useradd -m -G wheel -s /bin/bash` + `chpasswd`、wheel グループは initscripts が提供
- [x] **SSH 公開鍵の配布** — 実行中 root の `/root/.ssh/authorized_keys` があれば新ユーザーへコピー(対話時は鍵を貼り付けも可)。`~/.ssh` 700 / `authorized_keys` 600、所有者は新ユーザー
- [x] **root の SSH ログインを無効化** — sshd を `-o PermitRootLogin=no` で起動。コンソールの root は復旧用に維持
- [x] **root fs の起動時 fsck をスキップ** — initramfs 無しでは ro マウント済みの `/` を fsck できない(`/dev/vda is in use`)。イメージとインストーラの fstab を pass 0 に統一し、fsck はレスキュー環境から手動で行う
- [x] 実走行検証(2026-11-16): イメージから 8G 空ディスクへ `zignos-install --yes /dev/vdb` → `INSTALL_RC=0` → そのディスクを単体起動 → `ssh zignos@127.0.0.1` が **USER_SSH_OK**(uid=1000, wheel)、`ssh root@...` は **Permission denied**

## M5: ネットワークと SSH(完了条件 — 2026-11-16 完走)

- [x] **dhcpcd 10.5.2 レシピ + 独自 OpenRC サービス `dhcpcd`** — net-scripts を入れていないため stock の `network` サービス(modules=dhcpcd)は使えない。`supervise-daemon` + `command_args_foreground="-q -B"`、`provide net` で netmount 等の依存を満たす
- [x] **openssl 4.0.1 / openssh 10.6p2 レシピ**(openssh は openssl 依存)
- [x] **sshd サービス** — 初回起動時に ed25519 ホスト鍵を生成、`/run/sshd` を checkpath で作成。現段階は `PermitRootLogin=yes`(ユーザー管理を入れるまで)
- [x] **ベースアカウントの所有権を initscripts に集約** — `/etc/passwd`(root/sshd/nobody)と `/etc/group`(tty/sshd/utmp/nogroup 等)は initscripts レシピが提供し、openssh は触らない
- [x] **カーネル: `SECCOMP` + `SECCOMP_FILTER`** — 無いと OpenSSH 10.6 の privsep サンドボックスが `prctl(PR_SET_SECCOMP)` で EINVAL になり、sshd は「起動 [ ok ]」のまま接続直後に落ちる(クライアントには `Connection closed` としか見えない)
- [x] **zpkg: `build -f` / `install -f`** — 同一バージョンでも明示ターゲットを強制再ビルド・再インストール(依存はスキップ)
- [x] 実走行検証(2026-11-16): QEMU user-mode NIC + ポート転送でホストから `ssh -p 2222 root@127.0.0.1` → **`RESULT=SSH_OK`**、dhcpcd が `/etc/resolv.conf` に 10.0.2.3 を書き込み(eth0 は 10.0.2.15)
- [x] イメージ再生成 + `qemu-test.sh check`(ログイン込み)合格

### M5 実走行で修正したもの(2026-11-16)

- レシピ更新 → 再インストールの順序を守る。古いレシピで先に再インストールすると古いファイル所有権が再登録され、新しいパッケージが `already owned by ...` で入らない(openssh の passwd 問題)
- **root で `git pull` すると dubious ownership で失敗**し、`set -e` の無いスクリプトが古いレシピのままビルドを続ける → pull はリポジトリ所有者で実行し、ビルドスクリプトは `set -e` にする
- `KCONFIG_ALLCONFIG` は行順評価。依存先(`PROC_FS` 等)より後ろにシンボルを置き、レシピの `build` がマージ後の `.config` を grep して必須シンボルの消失を検出する
- TCG で稀に `Kernel panic - not syncing: IO-APIC + timer doesn't work!` が出る(同一イメージの再起動では再現せず)。起動テストは再試行前提で運用する
- make-image の `${stage:?}`(小文字)タイポで usr-merge 分岐が落ちる / EXIT トラップが終了コードを潰す → 両方修正

## M4a: OpenRC 導入(完了条件 — 2026-11-15 完走)

- [x] `openrc 0.64.1` レシピ(meson ビルド、-Dpam=false。0.64 は libcap 必須 → `libcap` レシピ追加)
- [x] `initscripts` レシピ: mdev/console サービス、`/sbin/init → openrc-init`、runlevel リンク(標準リンクは openrc パッケージ側が提供)
- [x] `util-linux 2.42.2`(systemd 無し構成)+ `e2fsprogs 1.47.4` レシピ
- [x] zpkg: ソース URL の `#ファイル名` fragment でキャッシュ名指定(GitHub タグ tarball 対応)
- [x] QEMU 起動 — **`BOOT CHECK PASSED`**: `OpenRC 0.64.1 is starting up` → sysinit(mdev)→ boot(root/hostname)→ default(console)→ agetty ログイン
- [x] M3 の inittab/respawn 方式からの移行完了

### M4a 実走行で修正したもの

- openrc 0.64 は meson ビルドに移行していた(make スクリプトを修正)、libcap 必須(レシピ追加)、pam boolean 既定 true(`-Dpam=false`)
- openrc パッケージが標準 runlevel リンクを同梱するようになった → initscripts は独自サービスだけに縮小
- GitHub タグ tarball の basename 問題 → zpkg に URL fragment 機能
- キャッシュミス時に chroot 内 https fetch が CA 無しで失敗する → ca-certificates レシピを M4b へ追加予定

## その後: zpkg v1 方向

同一 Go コードベースで段階拡張。USE フラグ・world・upgrade・トランザクションは
v0.9 として実装済み(M9–M12):

- slots(同名複数バージョン共存)— メタデータの slot は準備済み
- 本格的依存解決ソルバー(制約付き依存・provides/conflicts の解決)
- 署名付きリポジトリ・binpkg の配布(index + 公開)
- world rebuild(`upgrade --newuse`: USE 変更時の自動再ビルド)
