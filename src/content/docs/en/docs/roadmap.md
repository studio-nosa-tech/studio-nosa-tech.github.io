---
title: Roadmap
description: The milestone log from M0 to M51 and the current state.
---

Each milestone states its completion criteria. Progress is tracked with the
checkboxes in this file. Every section from M2 onward is also a **record of a
live run** (including fixes found during the run). For a summary of the current
state, see "Status" at /en/about/.

> The numbers and composition in each milestone section are **a record at that
> point in time**. Package counts and the base composition have changed in
> later milestones (the current values are the M51 row below and "Current
> system").

## Current system (2026-11-21)

- **GUI: M51 complete** — Implemented up to series branching for Stable / Testing / Unstable, SDDM / Plasma Login Manager, Spectacle / kio-extras, and zpkg 0.3.2's self-update and advance installation of new dependencies. Stable is Linux 6.18.64 LTS / Qt 6.8.5 LTS / KF6 6.18 / Plasma 6.4.5 / Gear 25.04.3 / Mesa 26.2.7, Testing is Linux 7.3.5 / Qt 6.11.3 / KF6 6.32 / Plasma 6.8.3 / Gear 26.08.3 / Mesa 26.3.1, and Unstable is Linux 7.4-rc3 / Gear 26.11.80 beta. The Testing desktop was verified in QEMU through the panel, wallpaper, KRunner, Dolphin, Kate and UDisks2, with 0 unresolved sonames. SDDM / PLM were verified through the daemon, PAM session and KWin startup, but QEMU's Mesa softpipe (`sp_find_cached_tile`) crashes during the greeter's transparent compositing, so the on-screen display waits for a real GPU
- **base.list 39 top-level = 72 packages with dependencies** (including linux / grub). Excluding the kernel and bootloader gives **stage3 r21 at 64 packages / about 1.1 GiB** (published). The recipe tree is **stable 429 (core 78 + main 109 + desktop 242) / testing and unstable 439 (core 78 + main 111 + desktop 250)**
- Boot: BIOS/MBR or UEFI/GPT → GRUB 2.14 → kernel 6.18.64 (stable) + initramfs (busybox) → OpenRC 0.64.1 → eudev 3.3.0 → serial/VGA login (shadow / PAM)
- Kernel: x86_64_defconfig + `x86_64-generic.config` (boot path built in, GPU/WiFi/additional NICs as modules). root is resolved by initramfs with `root=UUID=`
- Network: **not included in the base** (opt-in). After `zpkg install dhcpcd openssh`, run `rc-update add dhcpcd boot` / `rc-update add sshd default`
- NetworkManager 1.58.1 is an optional install from main. polkit authentication is enabled, and `zpkg install plasma-nm` lets you operate it from the KDE tray/KCM. WiFi uses `networkmanager-wifi`
- Wireless: wpa_supplicant 2.12 + iw (libnl, D-Bus control interface) as optional installs from main/. WiFi drivers are kernel modules, firmware is `main/linux-firmware`
- Services: the base enables only udev (eudev) / console (ttyS0) / console-vga (tty1). mdev is bundled as a fallback but disabled. dhcpcd/dbus/sshd/chronyd/wpa_supplicant/crond/nftables are enabled by you after installing them. On the desktop, dbus/elogind/polkit are enabled in default, UPower is a dedicated OpenRC service, and PipeWire/WirePlumber start from Plasma's XDG autostart
- Operation: the base is toolchain + coreutils + zpkg + tzdata + eudev + inetutils/procps. main/ has 100–102 packages (editors / SSH / man / git / curl / wget / doas, M30's network diagnostics, build, compression and monitoring tools, M34's NetworkManager/nmtui, M46's storage/graphics libraries), all optional installs
- zpkg: DB schema 2, world/upgrade, USE flags (package.use/IUSE), hooks (automatic ldconfig), transactions, slots, binpkg repository, recipe sync (`zpkg sync`), dependency atom resolution (version constraints / provides / conflicts / reverse dependencies / USE constraints), Ed25519 signing (index / recipe manifest / rollback expiry), bubblewrap build sandbox (ro root / namespace / capability / network), reproducible builds (SOURCE_DATE_EPOCH / logs / provenance / SBOM), release channels (stable/testing/unstable), upgrade diff display / advance installation of new dependencies / install after all builds / integrity check, release manifest (release.json per build)
- bootstrap: stage0/1 (cross toolchain, maintainer only) → stage2 phase 1 (bootstrap core) → **phase 2 (full base.list)**. /usr is entirely zpkg-managed
- Release model: **rolling release** (bootstrap design). Updates via `zpkg upgrade` and `build-system.sh`

| # | Milestone | Status | Target |
|---|---|---|---|
| M0 | Repository skeleton + design documents | Done | - |
| M1 | zpkg v0 complete | Done (2026-11-15) | 2–3 weeks |
| M2 | Base system fully recipe-based + automatic bootstrap | Done (2026-11-15 live run) | 2–3 weeks |
| M3 | Boot image (kernel + init + rootfs) | Done (2026-11-15 QEMU live run) | 1 week |
| M4a | Full init: OpenRC introduction | Done (2026-11-15 QEMU live run) | - |
| M4b | Practical use: installer, self-install, login operation | Done (2026-11-16 live run) | Ongoing |
| M5 | Network + SSH (dhcpcd, openssh) | Done (2026-11-16 live run) | - |
| M6 | User management + SSH hardening (installer creates a wheel user) | Done (2026-11-16 live run) | - |
| M7 | Privilege escalation (doas default / sudo in main) | Done (2026-11-16 live run) | - |
| M8 | More common tools + seed method | Done (2026-11-16 live run) | - |
| M9 | zpkg v0.9 (DB schema 2, world/upgrade) | Done (2026-11-16 live run) | - |
| M10 | zpkg USE flags | Done (2026-11-17 live run) | - |
| M11 | zpkg package.use/IUSE + recipe hooks | Done (2026-11-17 live run) | - |
| M12 | zpkg transactions | Done (2026-11-17 live run) | - |
| M13 | Unified base.list + rolling release policy | Done (2026-11-17) | - |
| M14 | 18 recipes added + stage2 on base.list | Done (2026-11-17 live run) | - |
| M15 | linux-headers recipe (/usr fully zpkg-managed) | Done (2026-11-17 live run) | - |
| M16 | man page environment (groff/man-db/man-pages) | Done (2026-11-17 live run) | - |
| M17 | meson recipe + upgrade --newuse | Done (2026-11-17 live run) | - |
| M18 | chrony (NTP synchronization) | Done (2026-11-17 live run) | - |
| M19 | binpkg repository support (mkindex + BINREPO) | Done (2026-11-17 live run) | - |
| M20 | slots coexistence (name@slot records) | Done (2026-11-17 live run) | - |
| M21 | 13 CLI tools added (tree/jq/zip/unzip/…) | Done (2026-11-17 live run) | - |
| M22 | WiFi stack (libnl/wpa_supplicant/iw) + D-Bus + HW information tools | Done (2026-11-17 live run) | - |
| M23 | Real hardware installation preparation (install.md, NVMe/PARTUUID, VGA) | Done (2026-11-17) | - |
| M24 | initramfs + UEFI + generic kernel (modules/kmod) | Done (2026-11-17 live run) | - |
| M25 | stage3 tarball (chrootable minimal base) | Done (2026-11-17 live run) | - |
| M26 | fastfetch branding + CMake + zpkg journal speedup | Done (2026-11-18 live run) | - |
| M27 | emerge-style phase display in zpkg (Building/Installing) | Done (2026-11-18 live run) | - |
| M28 | Minimal base (base.list 32/54 with dependencies) + efibootmgr | Done (2026-11-18 live run) | - |
| M29 | grub bios/uefi USE flags + conditional efibootmgr dependency | Done (2026-11-18 live run) | - |
| M30 | 26 CLI tools added (network/build/compression/monitoring) | Done (2026-11-18 live run) | - |
| M31 | 20 practical system tools added (tzdata/GnuPG/cron/logrotate/nftables/…) | Done (2026-11-18 live run) | - |
| M32 | mdev → eudev 3.3.0 + udev service (initscripts r14) | Done (2026-11-18 BIOS boot) | - |
| M33 | inetutils/procps in base (hostname/ifconfig/sysctl) | Done (2026-11-18 BIOS boot) | - |
| M34 | NetworkManager 1.58.1 + nmtui added to main | Done (2026-11-19 live run) | - |
| M35 | zpkg sync (recipe tree synchronization) | Done (2026-11-19 live run) | - |
| M36 | zpkg dependency resolution (atoms / backtracking / reverse dependencies) | Done (2026-11-19 live run) | - |
| M37 | Package signing and verification (Ed25519 / index / recipes) | Done (2026-11-19 live run) | - |
| M38 | Build environment isolation (bubblewrap / ro root / network) | Done (2026-11-19 live run) | - |
| M39 | Reproducible builds (SOURCE_DATE_EPOCH / log / provenance / SBOM) | Done (2026-11-19 live run) | - |
| M40 | Release channels and safe upgrade (zpkg 0.2.0) | Done (2026-11-19 live run) | - |
| M41 | Centralized release information (release.json / automatic artifact generation) | Done (2026-11-19 live run) | - |
| M42 | KDE Plasma 6 (Wayland) design (plasma-meta/kde-applications split, three-stage channels) | Design complete (2026-11-19) | - |
| M43 | Desktop foundation (PAM / elogind / Wayland / Mesa / fonts / Qt6) | Done (2026-11-19 live run) | - |
| M44 | KF6 + KWin + minimal Plasma (Xwayland / kactivitymanagerd / PAM login) | Done (2026-11-20 QEMU live run) | - |
| M45 | Full Plasma (audio / NetworkManager / power / apps / GLX) | Done (2026-11-20 QEMU live run) | - |
| M46 | Artifacts (images/ISO/real hardware/LTS migration) + UDisks2 / KDE apps | UDisks2, apps and BIOS verification image done (2026-11-20). Distribution ISO / real hardware / LTS migration ongoing | Distribution ISO, real hardware GPU |
| M47 | Stable / Testing / Unstable package series branching | Done (2026-11-21 Testing desktop verified in QEMU, stage3 r17) | Qt 6.12 / Plasma 6.9 next |
| M48 | SDDM on all channels + Plasma Login Manager | Done (2026-11-21 packages, PAM and groups fixed. Greeter visual check waits for a real GPU) | Waiting for a QEMU softpipe fix |
| M49 | Recipe sync over git | Done (2026-11-21 zpkg 0.3.1 / initscripts r26 / stage3 r20) | - |
| M50 | Spectacle / kio-extras | Done (2026-11-21 stable 6.4.5, Testing/Unstable 6.8.3, kio-extras all channels) | GUI operation check on a real GPU |
| M51 | zpkg self-update and automatic new-dependency install | Done (2026-11-21 zpkg 0.3.2 / initscripts r27) | - |

Next candidates: **the rest of M48 (visual check of the greeter on a real GPU)** / the rest of M47 (Unstable verification on a real GPU, Qt 6.12 / Plasma 6.9 migration, Mesa main) / distribution ISO and UEFI / real hardware GPU and WiFi / CI integration for the release manifest / storage (LUKS/LVM/XFS/Btrfs) / operating an official signing key and publishing the binpkg repository / minimal-dependency build root / fully pinned build root / resource limits.

## M25: stage3 tarball (2026-11-17 completed)

- [x] **`make-stage3.sh`** — copies `$ZIGNOS_ROOT`, removes packages not in base.list (tools) and
  linux/grub with `zpkg remove`, and packs the rest into a tar.xz. **base.list − linux/grub = 86
  packages / 2.1 GiB**. The DB and world match the contents
- [x] **Contents** — glibc/gcc/binutils/bash/coreutils/zpkg/openrc/initscripts/kmod/python3/
  perl/openssh/dbus/wpa_supplicant and other buildable base packages. usr-merged (`/bin`, `/sbin`,
  `/lib` are symlinks), **root is locked**, fstab/resolv.conf skeletons,
  `/usr/share/zignos/recipes` bundled, build information in `/etc/zignos-stage3`
- [x] **Excluded** — kernel, initramfs, modules, GRUB, contents of `/boot`, machine-specific
  information (machine-id, host keys, root password). Unowned `core.img` is also removed
- [x] **Verification (2026-11-17)** — unpacked the 2.1 GiB tarball → chroot with `zignos-enter.sh` →
  `zpkg list` 86 → `zpkg install linux grub` (1m38s from binpkg) → **88 packages,
  `/boot/vmlinuz` 13MB + `initramfs.img` 1.3MB, 601 EFI modules, grub-mkstandalone works**
- [x] **`docs/stage3.md`** — standard procedure (disk preparation → unpack → chroot → zpkg →
  fstab (UUID) → GRUB (BIOS/UEFI) → first-time configuration). Also covers differences from
  seed/images/installer
- [x] **GitHub Release `ZIGNOS-2026.11.17-alpha` published** — stage3 published in
  `studio-nosa-tech/zignos`. Because of GitHub's 2 GiB per-file limit, split into
  4 assets: **part-01/02 (1000MiB) + part-03 (151MiB) + sha256**.
  Currently private (preparing for publication)

## M26: fastfetch branding + CMake (2026-11-18 completed)

- [x] **`core/cmake 4.5.0`** — building fastfetch requires CMake >= 3.21. Self-contained
  build with `./bootstrap` (OpenSSL, ccmake and tests disabled, no additional build dependencies). **base.list 89 packages**
- [x] **`main/fastfetch 2.71.0`** — CMake build. `ENABLE_IMAGE_LOGO=OFF` (sixel/kitty/chafa are
  not used), `BUILD_FLASHFETCH=OFF`, Lua/libzfs disabled. 66 files. Runtime links only libc/libm
- [x] **Neon orbit logo** — a user-created PNG (white Z + purple orbit ring + sparkles)
  converted with chafa into **47x15 ANSI true color** and bundled as `/usr/share/zignos/fastfetch/logo.txt`.
  Transparency processing (luminance → alpha) removes the black background so it blends with the
  terminal's background color. The original PNG is bundled too
- [x] **`/etc/fastfetch/config.jsonc`** — `file-raw` logo (width 47/height 15), key color magenta,
  OS/Host/Kernel/Uptime/Init System/Packages/Shell/Terminal/CPU/GPU/Memory/Disk/Local IP + colors
- [x] **`/etc/os-release` provided by initscripts r10** — `NAME=ZIGNOS`,
  `PRETTY_NAME="ZIGNOS 2026.11.17-alpha"`. fastfetch's os module displays ZIGNOS
- [x] **Packages line** — fastfetch does not know about zpkg, so a command module displays
  `zpkg list | wc -l` (measured 105)
- [x] **Display check** — confirmed in a chroot that `fastfetch` shows the 15-line logo + information
  with aligned columns
- [x] **zpkg journal speedup** — rewriting the full install path list to `journal.json` for every
  file was O(n²) and took **13 minutes** for cmake (4381 files). Changed to an append-only
  `journal.log` (one event per line, with fsync; partial lines ignored on crash), reducing it to **49 seconds**.
  Old-format journals are still readable


## M27: emerge-style phase display in zpkg (2026-11-18 completed)

Following feedback that build/install gave no indication of which package was in which phase,
phase lines prefixed with `>>>` were added.

- [x] **Pre-summary** — before processing, prints "These are the packages that will be installed, in order:"
  followed by `[i] name-version` + `(dependency)` + `USE="flags"`, and at the end
  `Total: N packages (T targets, D dependencies)`. USE is shown as `flag` / `-flag` based on
  `iuse` (both enabled and disabled flags are visible). `-p` prints only this list and exits
- [x] **Building** — prints `>>> Building fastfetch-2.71.0-r2` before the build script and
  `>>> Built ... (66 files) in 1m2s` after. Build script output is passed through as-is
- [x] **Installing** — `>>> Installing (1 of 2) fastfetch-2.71.0-r2` (counts only packages
  actually processed). When installing from a binpkg, appends `... (binpkg)` and does not print Building.
  On completion, `>>> Installed ...`
- [x] **Other formats unified** — `>>> Skipping foo-1.0 (already installed)`,
  `>>> Would install/build foo-1.0` (pretend), `>>> Packed binpkg <path>`,
  `>>> Removing (1 of 2) foo` / `>>> Removed foo`
- [x] **Color** — green only when stdout is a terminal (disabled by `NO_COLOR` / `TERM=dumb`). No
  ANSI in logs or pipes. Regression tests for `elapsed` and `useColor`
- [x] **Live run check** — in a chroot, confirmed a source build of `which` (Building → Built 3s → Packed →
  Installing → Installed), binpkg install of tree, pretend, remove and NO_COLOR
- [x] **zpkg recipe r5** absorbs the source snapshot


## M28: minimal base + efibootmgr (2026-11-18 completed)

The base was rebuilt to match the policy: "base.list has too much unnecessary software.
Install only the minimum and add most things manually."

- [x] **base.list reduced to a minimal system** — 32 top-level / 54 packages with dependencies.
  What remains is the toolchain (glibc/gcc/binutils/make/linux-headers), POSIX tools
  (bash/coreutils/sed/grep/gawk/diffutils/findutils/tar/gzip/xz/bzip2/m4/patch/file/pkgconf),
  boot and login (busybox/openrc/initscripts/util-linux/shadow/e2fsprogs/kbd/linux/grub),
  package management (zpkg/ca-certificates), and dosfstools only for the UEFI ESP.
  Editors, SSH, DHCP, WiFi, D-Bus, chrony, man, git/curl/wget, perl/python/cmake and
  doas/sudo are optional installs from main/ (zpkg resolves dependencies and makedepends automatically)
- [x] **initscripts r11** — runlevel links reduced to mdev / console / console-vga only.
  Stopped auto-enabling sshd/dhcpcd/dbus/chronyd and documented `rc-update add` after
  `zpkg install` in install.md (service scripts themselves remain bundled)
- [x] **make-stage3 allowed set becomes the dependency closure** — to keep a "buildable stage3"
  even with a top-level-only base.list, compute the closure with `zpkg depends` inside the chroot.
  **47 packages** after excluding linux/grub and linux-only bison/bc/elfutils/kmod/initramfs
- [x] **efibootmgr 18 + efivar 39 (main/)** — efibootmgr depends on efivar (libefivar/libefiboot).
  efivar 39 fails with GCC 16's `-Werror` (discarded-qualifiers), so disable it with `ERRORS=`
  and set the default lib64 to `LIBDIR=/usr/lib`. For efibootmgr, build and install only the
  main binary that does not use popt (efibootdump/eficonman require popt, so they are not installed)
- [x] **zignos-install** — if efibootmgr is present in the running image, automatically creates a
  UEFI NVRAM entry (otherwise boots the removable `\EFI\BOOT\BOOTX64.EFI` as before). SSH
  guidance is shown depending on whether sshd is present
- [x] **Verification (2026-11-18)** — pruned the tree to 54 packages → **BOOT CHECK PASSED** for
  both BIOS/UEFI images (`ZIGNOS-BOOT-OK 7.1.8`), stage3 generated successfully with **47 packages**


## M29: grub bios/uefi USE flags (2026-11-18 completed)

- [x] **core/grub r2** — declares `bios` (i386-pc) and `uefi` (x86_64-efi) in `iuse`.
  configure/make only the platforms with enabled flags. **If unspecified, both** are
  built (compatible with the previous image-generation behavior). Modules for platforms that are
  no longer needed disappear via prune on upgrade
- [x] **Conditional dependency `uefi?efibootmgr`** — `zpkg use --package grub uefi` makes
  `zpkg install grub` automatically install main/efibootmgr (+efivar) as a dependency.
  It is not installed with bios only. This applies zpkg's USE conditional dependencies (M10) to the bootloader
- [x] **zignos-install** — stops if the module set matching the firmware is missing, and suggests
  `zpkg use --package grub uefi` (or bios) + `zpkg install -f grub`
- [x] **Verification (2026-11-18)** — built 3 variants in a chroot:
  uefi only 797 files (efivar/efibootmgr installed as dependencies) / bios only 813 files
  (efibootmgr not installed) / both 1415 files. Also confirmed that changing USE prunes the old
  platform's owned files. With both platforms configured, **BOOT CHECK PASSED** for both BIOS/UEFI
  images (7.1.8)


## M44: KF6 + KWin + minimal Plasma (2026-11-20 QEMU live run)

Implemented the Qt 6.8.5 / KF6 6.18.0 / Plasma 6.4.5 desktop stack and confirmed that it
starts from `startplasma-wayland` through to the panel and desktop on QEMU's
virtio-gpu. Details are in [Desktop environment](/en/docs/desktop/).

- **Qt / KF6 / Plasma** — added qtbase / qtdeclarative / qtwayland / qt5compat /
  qttools / qtpositioning / qtlocation / qtsensors / qtshadertools, ECM and the
  KF6 6.18 dependency set, and Plasma 6.4.5's KWin / plasma-workspace /
  plasma-desktop / plasma-integration / breeze / systemsettings /
  kscreenlocker / kactivitymanagerd etc. Stable's Plasma is pinned to 6.4.5, which runs on
  Qt 6.8 LTS (6.6 requires Qt 6.10 / KF6 6.22)
- **PAM login** — moved `linux-pam` to `core/` and rebuilt shadow with PAM support.
  Added login/su/passwd etc. to `/etc/pam.d`. Console login becomes an elogind seat0
  session, allowing KWin to acquire DRM
- **Xwayland / XKB** — Xwayland 24.1.9 / xkbcomp 1.4.7 / libXfont2 /
  libfontenc / libxshmfence. ksmserver forces xcb even on Wayland, so
  Xwayland is required, and Xwayland crashes immediately after startup without xkbcomp
- **Mesa DRI drivers** — Mesa 26 does not build the DRI megadriver (`dril`) with
  `platforms=wayland` alone, so `wayland,x11` and
  `gallium-drivers=virgl,softpipe` were used to add `virtio_gpu` / `kms_swrast` / `swrast`
- **kactivitymanagerd** — required for plasmashell to start. Without it,
  it exits with `Aborting shell load: The activity manager daemon is not running`
- **Avoiding kcminit** — the phase 0 hook of kcm_style does not return from krdb's xrdb
  call, stopping startplasma, so `kcm_style_init.so` is not installed.
  The permanent fix is M45
- **QEMU verification** — 36G MBR image / virtio-vga / TCG / noapic. PAM login on
  tty1 → `dbus-run-session -- startplasma-wayland` → KWin (DRM) →
  Xwayland → ksmserver → plasmashell, and confirmed the panel and desktop with QMP
  screenshots (GPU is `kms_swrast` software GL)

## M42: KDE Plasma 6 (Wayland) desktop design (meta split, three-stage channels) (2026-11-19)

Design investigation for introducing KDE Plasma 6 on Wayland as the first desktop
environment. At M42, `desktop/` had 0 packages; dependencies, OpenRC integration and the
PoC procedure were settled.

- [x] **Metapackage split** — split into `desktop/plasma-meta` (Plasma session) and
  `desktop/kde-applications` (KDE Gear apps). `plasma-meta` does not include
  apps, and `kde-applications` does not depend on Plasma itself
- [x] **Channel policy** — stable is **Linux 6.18 LTS + Plasma 6.6 LTS**,
  testing is **Linux 7.3 + the latest stable Plasma 6.8**, and unstable is the
  ambitious **Linux 7.4-rc/mainline + Plasma 6.9 dev/beta**.
  `core/linux` and `desktop/` branch by series, while the rest of `core` / `main` is shared.
  Changes are always validated in the order **Unstable → Testing → Stable**, and Stable
  backports to LTS
- [x] **Design policy** — based on Wayland 1.25 / Mesa 26.2 series / elogind / Linux-PAM /
  polkit / PipeWire. Plasma 6.8 requires Qt 6.11 + KF6 6.30 and is
  Wayland-only, so it goes on the unstable side
- [x] **KWin and seat** — KWin 6 depends on the logind API, not libseat/seatd.
  Under OpenRC, elogind is required and is not combined with seatd
- [x] **PAM issue** — current shadow / util-linux / openssh / sudo have PAM disabled.
  In the PoC, PAM is limited to `desktop/`, and when productizing it is promoted to `core`
  and the authentication stack rebuilt. **M44 moved `linux-pam` to core and made shadow
  PAM-aware** (SSH/doas regression tests in M45)
- [x] **Kernel** — DRM/KMS and virtio-gpu, input already present. Audio (`CONFIG_SND*`) is
  unset, so HDA/USB/virtio-snd must be added before PipeWire
- [x] **QEMU verification plan** — use QEMU 10.0.13's `virtio-vga-gl` / `egl-headless` /
  virtio input, start `startplasma-wayland` from an elogind PAM session,
  and verify with screenshots and input
- [x] **M43: foundation** — done (2026-11-19). Added PAM / elogind / polkit, Wayland / input,
  fonts, Mesa 26.2.7 and Qt 6.8.5, and confirmed EGL 1.5 + OpenGL ES 3.1 and QML offscreen
  (`QML_OK 6.8.5`). `plasma-meta` / `kde-applications` are skeletons only.
  Also added `zignos-fstab` and `root-rw` to initscripts r18, fixing and automatically
  recovering from `/` becoming read-only due to an fstab UUID mismatch
- [x] **M44: KF6 + KWin + minimal Plasma** — done (2026-11-20 QEMU live run). Added
  Qt 6.8.5 / KF6 6.18.0 / Plasma 6.4.5 / Xwayland 24.1.9 / xkbcomp 1.4.7 / kactivitymanagerd.
  Moved `linux-pam` to core and made shadow PAM-aware, and confirmed that login on tty1
  becomes an elogind seat0 session. On virtio-gpu + TCG, started `startplasma-wayland` →
  KWin (DRM) → Xwayland → ksmserver → plasmashell and confirmed the panel and desktop by
  screenshot. kickoff (kirigami-addons), volume (plasma-pa), wallpaper, UDisks2, PLM,
  PipeWire and Xwayland GLX are M45
- [x] **M45: full Plasma** — done (2026-11-20 QEMU live run). Implemented PipeWire /
  WirePlumber / plasma-pa, NetworkManager polkit support + plasma-nm, UPower + powerdevil,
  kirigami-addons / wallpaper / polkit-kde-agent, Konsole / Dolphin / KCalc / Filelight,
  Xwayland GLX 1.4, and the kcm_style xrdb fix. PLM is Plasma 6.6 and later, so it moved to M46
- [x] **M46: UDisks2 / KDE apps** — done (2026-11-20). Added libatasmart / libblockdev
  (part/fs/loop/swap/mdraid/crypto/nvme) / udisks2 and cryptsetup / LVM2 / libnvme / json-c /
  keyutils / libbytesize. Confirmed UDisks2's D-Bus startup and `udisksctl status` in a chroot.
  Added libarchive + Ark, Kate, Gwenview (Exiv2 / LCMS2 / kImageAnnotator / kColorPicker),
  Okular (Poppler 25.04.0) and KWalletManager, updating `kde-applications` to 9 apps.
  main 98 / desktop 205 / 380 per channel. Booted the BIOS/MBR verification image
  `zignos-m46.img` (16 GiB sparse / 8.8 GiB used) in QEMU and confirmed the Plasma
  wallpaper and panel, 5 apps and `udisksctl status`. Also confirmed the wallpaper, panel
  and clock, Kate / Ark / Dolphin and Japanese display, and UDisks2 on a **clean 291-package
  BIOS image** `zignos-m46-clean.img` installed from stage3 (10 GiB sparse / 6.5 GiB used),
  and reflected missing dependencies found under the clean root (libltdl / Xwayland / xkbcomp /
  DejaVu etc.) in the recipes. Added `shared-mime-info 2.4` and confirmed MIME associations
  and Dolphin's file type display. Added `ipaex-fonts` and confirmed Japanese display in Kate
- [ ] **M46: artifacts** — distribution ISO (BIOS/UEFI), real hardware GPU, migration to the next Plasma LTS
- [x] **M50: Spectacle / kio-extras** — done (2026-11-21). Stable uses
  Spectacle 6.4.5 + OpenCV 4.14.0; Testing / Unstable use Spectacle 6.8.3 +
  KQuickImageEditor 0.7.0.1 / Tesseract 5.5.4 / Leptonica 1.87.0.
  For PrisonScanner, stable uses Prison 6.18 + ZXing-cpp 1.4.0,
  and Testing / Unstable use Prison 6.32 + ZXing-cpp 3.1.1.
  kio-extras is 25.04.3 / 26.08.3 / 26.11.80, adding workers such as archive / fish / info / man /
  thumbnail / recentlyused / search. Added FFmpeg 8.0.1 and libva 2.24.1 to KPipeWire for
  recording
- [x] **M51: zpkg self-update and new dependencies** — done (2026-11-21). Bundled the source
  archive in the zpkg 0.3.2 recipe so that `zpkg upgrade zpkg` can
  build on a normal system too. `zpkg upgrade` installs newly required dependencies
  (`KindInstall`) first, then builds the upgrade targets.
  initscripts r27 adds `git` as a dependency, required by the sync.conf git mode.
  The 0.2.0 → 0.3.0 update path is a known unsupported path and is not fixed

## M41: centralized release information (2026-11-19 verification)

stage3's package count, size, versions and checksums were hand-written across multiple pages
and were already inconsistent. A machine-readable **release manifest** is generated per build,
and the website, download page, release notes and installation guide now reference the
same data. The release name is **2026.11.19-alpha**.

- [x] **`release-manifest.py`** — generates schema 1 JSON. Records stage3's
  revision / filename / size / SHA-256 / package_count / packages, zpkg,
  kernel, GRUB, base top-level and closure, recipe counts, build date,
  source commit, boot verification and artifacts. Also has `record-boot` and `validate`
- [x] **`make-stage3.sh`** — determines release / revision from `release.conf` and
  generates `release.json` and `.sha256` after packing. The stage3 DB also
  supports pre-schema-2 records that only have `version`
- [x] **Artifact auto-generation** — generates recipe tarballs for all channels and the zpkg
  binary at build time, recording their SHA-256 in the manifest's `artifacts`
- [x] **`qemu-test.sh`** — records BIOS / UEFI boot results into JSON via `record-boot`.
  Does not fail the boot test when python3 is missing or recording fails
- [x] **`publish-release.sh`** — validates the manifest and places the same byte sequence
  in `zignos/releases/` and the site's `src/data/release.json`
- [x] **Site** — replaces tokens such as `{{stage3.package_count}}` from the manifest at
  build time. Added `/releases.json` and `/releases/current/`, and
  download, news, about and what-is reference the same data
- [x] **initscripts r15** — updated `/etc/os-release` to `ZIGNOS 2026.11.19-alpha`
- [x] **Tests** — four unit tests for manifest generation, legacy DB records, record-boot and
  validate. Checked shell script syntax and shellcheck
- [x] **stage3 r12** — 54 packages / 977 MiB, zpkg 0.2.0,
  kernel 7.1.8-r4, GRUB 2.14-r2.
  Bundled recipes are stable only, and the duplicate channel copies were fixed
- [ ] **Boot verification measurement** — this time BIOS / UEFI / real hardware are all `not-tested`.
  The next image build will reflect the results of `qemu-test.sh check` in the manifest
- [ ] **CI integration** — currently `publish-release.sh` is run manually at release time.
  Automating from build to site publication is future work

## M40: release channels and safe upgrade (zpkg 0.2.0)

To prepare for breaking changes in a rolling release, the recipe tree was split into three
channels, **stable / testing / unstable**, and `zpkg upgrade` became a command that
"shows what will change before running". zpkg goes **0.1.0 → 0.2.0**.

- [x] **Tree structure** — `zignos-recipes/{stable,testing,unstable}/{core,main,desktop}`.
  Initially the three channels are identical (162 recipes/channel, 486 total). Changes are
  promoted in the order unstable → testing → stable. Always bump the revision when contents change
- [x] **Channel selection** — `CHANNEL=` in `/etc/zpkg/make.conf` (default stable),
  `ZPKG_CHANNEL`, `--channel`. `zpkg channel` displays and persistently switches.
  Auto-discovers `$ZPKG_ROOT/usr/share/zignos/recipes/<channel>/{core,main,desktop}`,
  and accepts the pre-M39 flat tree as stable
- [x] **sync** — supports channel tree validation, statistics display and archive prefix detection.
  `Recipe tree: 486 recipes (stable 76/86, testing 76/86, unstable 76/86)`.
  stage3 bundles only stable; testing/unstable are added by sync
- [x] **Upgrade planning** — `internal/upgrade`. Displays upgrade / rebuild / downgrade /
  new dependency, added/removed/constraint-changed dependencies and makedepends, orphan packages,
  `upgrade_warning`, major version changes of key packages, new conflicts, slot changes and
  channel changes
- [x] **Confirmation and downgrade** — normally `Proceed? [Y/n]`. Downgrades require
  `--allow-downgrade`; without it there is a dedicated `[y/N]` confirmation, with it the prompt is
  skipped. `--yes` skips the normal confirmation. Non-interactive use requires `--yes`
- [x] **Build all → install** — build/pack all planned packages first;
  if any fails, the system is unchanged. Installation is per-package
  transactional, and on failure only that package is rolled back. Re-running resumes;
  crashes are handled by `zpkg recover`
- [x] **Integrity check** — after updating, re-resolve world/targets and verify the closure's
  DB and manifest (paths, types, symlink targets, versions). `--verify` also checks the
  sha256 of all files. Records the successful channel in `$ZPKG_DB/.channel`
- [x] **Orphan packages** — targets only slot 0 packages that were in the previous dependency
  closure and are no longer needed in the new closure; the default is to list them. `--prune`
  removes only those not depended on, and shows depended-on ones as kept. Unrelated packages
  outside world are not touched
- [x] **zbuild side** — `bootstrap.sh` / `stage2.sh` / `build-system.sh` /
  `make-stage3.sh` / `make-image.sh` support `CHANNEL` (default stable).
  stage3/images bundle only the selected channel in
  `/usr/share/zignos/recipes/<channel>` and write CHANNEL to `make.conf`
- [x] **zpkg 0.2.0** — recipe version changed to 0.2.0 (revision 0). usage and
  provenance fallbacks are also 0.2.0. Verified upgrade from 0.1.0-r11 in a live run
- [x] **Tests** — config (default/make.conf/env/legacy/TreeRoot), sync (channel
  tree/legacy/mixed/archive prefix), upgrade plan (actions/deps/warnings/orphans),
  integrity (missing/type/hash), channel command. `go test ./...` / `go vet ./...` pass
- [x] **Live run** — on a VM's synthetic channel tree, confirmed stable 1.0 → testing 2.0 diff
  display, update and integrity OK, dependency add/remove, orphan `--prune`, downgrade
  confirmation and `--allow-downgrade`, no change on build failure, `--verify` hash detection,
  and flat-tree legacy fallback
- [x] **zpkg 0.2.0 / stage3 r12** — 54 packages / 977 MiB. Bundles stable only;
  `/etc/zpkg/make.conf` is `CHANNEL=stable`
- [ ] **Whole-set rollback** — currently installs after all builds succeed and
  rolls back per package on failure. Rolling back all packages in one transaction
  is future work
- [ ] **Per-channel sync** — currently replaces the whole tree. A command to add or update
  only one channel is future work
- [x] **Switching channels at the same version** — M47 added binpkg channel matching and
  recipe digest comparison. If the recipe contents differ even at the same version, it is
  rebuilt as `KindRebuild`

## M39: reproducible builds (2026-11-19 verification)

To aim for identical artifacts from the same recipe, source and build environment, inputs and
outputs are recorded, binpkg timestamps are fixed, and manifest comparison between two
builds is implemented.

- [x] **SOURCE_DATE_EPOCH** — default `946684800` (2000-01-01T00:00:00Z).
  Order: `ZPKG_SOURCE_DATE_EPOCH` → `SOURCE_DATE_EPOCH` → `/etc/zpkg/build.conf`.
  Also passes `KBUILD_BUILD_TIMESTAMP` / `KBUILD_BUILD_USER=zignos` /
  `KBUILD_BUILD_HOST=zignos-build` / `PYTHONHASHSEED=0` to the build environment
- [x] **umask 022** — recipes run via a wrapper in both sandboxed and direct builds
- [x] **binpkg normalization** — the gzip header and all tar `ModTime` values are fixed to
  SOURCE_DATE_EPOCH. Owner, mode, contents and order remain as built
- [x] **work dir** — `build/<name>-<version>[-rN][-opts]`. `--clean` removes the whole work
  dir, and `--repro-check` cleans automatically before the second build
- [x] **Build log** — by default `$ZPKG_CACHE/logs/<base>.log`. The header records package /
  recipe digest / epoch / sandbox / network / started / build script, and
  stdout/stderr are teed. Kept on failure. Disabled with `BUILD_LOG=0`
- [x] **provenance** — records package / recipe digest /
  sources / build / toolchain / dependencies / full build environment / artifact hash /
  log hash in `provenance.json` (schema 1). Stored in the DB and as a binpkg sidecar
- [x] **SPDX 2.3 SBOM** — per-package and system. Artifact SHA-256, purl,
  `DEPENDS_ON` / `BUILD_DEPENDENCY_OF` / `BUILD_TOOL_OF`; the system one has
  `CONTAINS` pointing to `SPDXRef-System-zignos`. Stored in the DB's `sbom.json` and the
  binpkg's `.spdx.json`
- [x] **CLI** — added `zpkg provenance` / `sbom` / `sbom --system` / `log`.
  `zpkg info` shows recipe digest, epoch, log and SBOM
- [x] **Reproducibility check** — `zpkg build --repro-check` builds twice and compares the
  destroot manifests. Differences are shown per path and fail the check; on a match it
  prints `Reproducible: <pkg> (manifest matches, artifact <sha256>)`
- [x] **Recipe fixes** — `core/zpkg` builds with `go build -trimpath -buildvcs=false`;
  initramfs is generated deterministically with `find | sort`, normalized mtime and `gzip -n`
- [x] **Tests** — unit tests for provenance / SPDX / tar mtime / build.conf / diff,
  and real package builds (zlib / zpkg) in a VM chroot.
  `go test ./...` / `go vet ./...` pass
- [x] **zpkg r11 / stage3 r11** — 54 packages / 977 MiB. Includes provenance and
  SBOM in the DB
- [ ] **Fully pinned build root** — a root that only sees makedepends is the next stage
- [ ] **Byte-identical guarantee for all recipes** — manifest comparison only goes as far as
  content matching
- [ ] **License information** — recipes have no license metadata, so SBOMs say
  `NOASSERTION`

## M38: build environment isolation (2026-11-19 verification)

Recipe build scripts now run inside a bubblewrap sandbox. root is read-only, only the
package's work directory is writable, and processes and network are isolated with
namespaces.

- [x] **bubblewrap 0.13.1** — added `core/bubblewrap` and bundled it in base.list.
  Disabled SELinux/man/tests/completion in meson. Depends on libcap
- [x] **Kernel namespaces** — added `CONFIG_NAMESPACES` / `UTS_NS` / `IPC_NS` / `PID_NS` / `NET_NS` / `USER_NS`
  to `x86_64-generic.config` and to the linux build's required symbol check
- [x] **`internal/sandbox`** — builds bwrap arguments, environment allowlist, auto/require/off.
  root is `--ro-bind / /`, only work is `--bind`, `/tmp` etc. are tmpfs,
  `/etc/ssh` / `/etc/zpkg` / WiFi configuration etc. are masked, `/etc/shadow` etc. are `/dev/null`.
  PID/IPC/UTS namespaces, hostname `zignos-build`
- [x] **capability restriction** — only `CAP_CHOWN` / `CAP_FOWNER` / `CAP_DAC_OVERRIDE` /
  `CAP_FSETID` / `CAP_SYS_CHROOT`. No `CAP_SYS_ADMIN`
- [x] **Environment variables** — does not inherit `os.Environ()`; allowlist. `HOME` / `GOCACHE` /
  `GOPATH` are under work. Only proxy-related variables are passed through
- [x] **Network** — allowed by default (`BUILD_NET=1`). `ZPKG_BUILD_NET=0` adds
  `--unshare-net`. A recipe's `build_network` (`1`/`0`) overrides the global.
  `age` / `fzf` / `restic` are `1`
- [x] **auto/require/off** — `auto` warns and builds directly when bwrap is absent/unusable,
  `require` fails, `off` disables. `--no-sandbox` was also added. bwrap's pre-start check
  (`sandbox.Check`) detects environments such as chroot where pivot_root is impossible
- [x] **chroot support** — `zignos-enter.sh` now creates a private mount namespace and
  bind-mounts root before chrooting. The sandbox works even in a stage3 directory
  chroot. Plain `chroot` falls back to direct build under auto
- [x] **Recipe fix** — changed `core/shadow`'s `touch /usr/bin/passwd` to be inside destroot
  (the only recipe that failed with a read-only `/usr`)
- [x] **Build environment recording** — records the sha256 and count of installed
  `name@slot-version` packages in `meta.json` / the binpkg sidecar, and shows
  `build: bwrap, network on, env N packages` in `zpkg info`
- [x] **bootstrap** — stage2 precedes bubblewrap, so `ZPKG_SANDBOX=off`.
  After the base is built, the base's bubblewrap is used
- [x] **Tests** — unit tests for sandbox arguments/environment/modes and recipe
  `build_network`. In a VM ZIGNOS chroot, confirmed attack scripts
  (`/usr` write denied, `/etc/shadow` masked, `/proc` / `/dev` / chroot / work usable),
  network denial and recipe override, and real builds of `shadow` / `iputils` (setuid) / `doas` (chown) /
  `eudev` (destroot binary execution) / `openssl` / `linux` (kernel + initramfs).
  `go test ./...` / `go vet ./...` pass
- [x] **zpkg r10 / stage3 r10** — 54 packages / 977 MiB. bubblewrap bundled
- [ ] **Minimal-dependency build root** — inside the sandbox is the whole installed system
  (read-only). A root with only makedepends is the next stage
- [ ] **resource limit / hook isolation** — CPU/memory/disk limits and
  sandboxing of `post_install` / `post_remove` are future work

## M37: package signing and verification (2026-11-19 verification)

Added Ed25519 signatures to the binpkg repository index and the recipe tree, with
verification via trusted keys / rollback / expiry. Does not depend on external GPG or crypto
libraries.

- [x] **Key management** — `zpkg key generate/import/list/remove`. PKCS#8 PEM private keys
  (requires 0600) and PKIX PEM public keys. The key ID is the SHA-256 of the public key (64 hex).
  Trusted keys are in `/etc/zpkg/trusted.d/*.pub`. No TOFU
- [x] **detached signature** — a JSON envelope with schema / algorithm / keyid /
  signature in `<file>.sig`. The signed data is the file's actual bytes
- [x] **binrepo index** — `index.json` is now schema 2, adding `generation` / `expires` /
  `keyid` / `manifest_sha256` per entry. Signed with `mkindex --key`, which also outputs
  `keys/<keyid>.pub`. Supports `packages/` layout too
- [x] **Verification** — verifies signature, expiry, generation, package sha256 and manifest sha256.
  Tampering, expiry, rollback and mismatches are hard errors (no silent
  fallback to a source build). index/signature are fetched fresh every time
- [x] **Recipe tree** — `sign-recipes` lists path / sha256 / size /
  mode of all regular files in `recipes.manifest` and signs it. `sync` verifies the staging
  tree's signature, all files and extra files before replacing
- [x] **Rollback and expiry** — stores the last accepted
  generation / SHA-256 / keyid in `$ZPKG_DB/.security.json`. Rejects generation rollback and
  substitution within the same generation. Default `expires` is +90 days.
  `ZPKG_ALLOW_UNSIGNED` only allows missing signatures, `ZPKG_ALLOW_EXPIRED` only allows expiry
- [x] **Origin tracking** — records `origin` / `origin_repo` / `origin_keyid` /
  `origin_generation` / `origin_index_sha256` / `origin_pkg_sha256` in `meta.json` and
  shows them in `zpkg info`. Source builds also record the recipe tree signer
- [x] **Tests** — verified in unit/integration tests: key generation, signing, tampering, different
  keys, rollback, expiry, recipe add/delete/tamper, `--allow-unsigned` boundaries (broken signatures are not
  allowed), fresh fetch, and signed binrepo install. `go test ./...` /
  `go vet ./...` pass
- [x] **Live run** — on a VM, confirmed binrepo install with a temporary key, rejection of index
  tampering / generation rollback / expiry / package sha mismatch, and sync of a signed recipe tree
  plus tamper rejection
- [x] **zpkg r9 / stage3 regenerated** — 53 packages / 977 MiB. The official key is not generated
  yet, and current artifacts are unsigned, so docs state that `zpkg sync --allow-unsigned` is required
- [ ] **Operating an official signing key** — generating and storing the private key, distributing the public key, publishing the binpkg repository
- [ ] **GPG/OpenPGP support** — extend the envelope's `algorithm` and add it in the future

## M36: zpkg dependency resolution — atoms and backtracking (2026-11-19 verification)

The previous DFS by name only was replaced with package atoms and deterministic
backtracking. Constraints, virtual packages and conflicts can be handled even as the
package count grows.

- [x] **Atom parser `internal/depspec`** — parses version constraints (`>=`, `<=`, `>`, `<`, `=`,
  `!=`), conditional dependencies (`flag?pkg` / `!flag?pkg`), USE constraints (`foo[ssl]` / `foo[-ssl]` /
  `foo[ssl?]`) and provides' `virtual/foo[-ver]`. With unit tests
- [x] **Resolver `internal/resolve`** — deterministic backtracking over direct recipes + provides
  candidates in the order "installed → direct name → name order". Checks version / USE constraints and conflicts
  (selected + installed), and backtracks to another candidate on failure. Results are in dependency-first
  topological order; cycles are an error
- [x] **provides made practical** — installing `virtual/foo` picks a provider and records the
  provider in world. Saves `provides` / `conflicts` in `meta.json`
- [x] **conflicts made practical** — detects conflicts both before install and during resolution
- [x] **Reverse dependencies** — `zpkg depends -r <pkg>` checks the installed DB's `depends` /
  `builddepends` including provides. `zpkg remove` stops when reverse dependencies exist and
  can be forced with `-f`
- [x] **optional dependencies / USE integration** — evaluates conditional dependencies in the resolver,
  and reflects the dependency's USE constraints in candidate selection
- [x] **search** — provides are also searchable
- [x] **Tests** — unit (parsing / version ordering / provides / backtracking / USE constraints /
  conditions / installed conflict) and CLI integration (reverse dependencies and remove guard / virtual target
  install and world recording). `go test ./...` / `go vet ./...` pass
- [x] **Real recipe check** — confirmed `zpkg depends networkmanager`, `zpkg depends -r glib`
  (networkmanager / sshfs) and rejection of `zpkg remove glib` in a chroot
- [x] **zpkg r8 / stage3 regenerated** — installed the new zpkg into the build environment and regenerated stage3
  at 53 packages / 976 MiB. Confirmed bundled zpkg 0.1.0-r8 and recipes r8
- [x] **SAT solver** — M52 (2026-11-27, zpkg 0.4.0) implemented CDCL SAT and
  simultaneous resolution of multiple versions and slots

## M35: zpkg sync — recipe tree synchronization (2026-11-19 verification)

The recipe tree bundled in stage3 is a snapshot, and recipes for new packages were sometimes
missing (`recipe not found`). Added `zpkg sync` to update the recipe tree itself.

- [x] **`zpkg sync [--from <src>] [--dest <dir>] [-n]`** — accepts a stage3 tarball,
  recipe tarball, unpacked directory or HTTP(S) URL as input. For a stage3
  tarball, selectively extracts only `usr/share/zignos/recipes` and does not unpack the whole rootfs
- [x] **Atomic replacement** — validates the new tree (against `core` / `main` and recipe counts)
  in a temporary area on the same filesystem as the target, then swaps it in with rename. Keeps the old
  tree on failure
- [x] **Default source** — when `--from` is omitted, uses `ZPKG_RECIPE_URL`, then
  `RECIPEURL=` in `/etc/zpkg/sync.conf`
- [x] **Tests** — directory / stage3-format tarball / URL / dry-run / old tree preserved on
  incomplete tree, and executable bit preservation
- [x] **Live run** — installed the new zpkg into a chroot and confirmed `zpkg sync` from a
  recipe tarball → `zpkg search networkmanager` returns 1.58.1-r3
- [x] **zpkg recipe r7** — bundles the new zpkg binary in stage3
- Remaining: operating the distribution URL (signed recipe tarball handled in M37)

## M34: add NetworkManager 1.58.1 to main (2026-11-19 verification)

Added network management for desktops/laptops to main/. Because ZIGNOS uses
OpenRC and not systemd, all systemd integration is disabled.

- [x] **`main/networkmanager 1.58.1`** — `session_tracking=no`, `systemd_journal=false`,
  no systemd unit/generator installation. Disabled polkit / SELinux / audit / ModemManager /
  PPP / oFono / OpenVSwitch / teamd / firewalld / concheck / CLAT.
  crypto is null, bundles `nmcli` / `nmtui`
- [x] **OpenRC service** — bundles `/etc/init.d/networkmanager`.
  `need localmount dbus`, `after udev`, `supervise-daemon` + `--no-daemon`.
  Enable with `rc-update add networkmanager default`
- [x] **`main/libndp 1.9`** — IPv6 Neighbor Discovery library (required dependency of NetworkManager)
- [x] **`main/newt 0.52.25` / `main/slang 2.3.3`** — TUI libraries for nmtui.
  newt disables Python/Tcl bindings and GPM, slang disables X11
- [x] **Dependencies** — glib / dbus / eudev / libndp / util-linux / readline / newt.
  To use WiFi, install `wpa_supplicant` (main) separately
- [x] **Verification (2026-11-19)** — built and installed libndp / dbus / NetworkManager on the
  dev root. Started dbus-daemon and NetworkManager in a chroot and confirmed
  `nmcli general status` / `nmcli device status` respond.
  Also confirmed `nmtui` links (newt/slang) and startup
- [x] **Recipe count** — core 75 + main 86 = 161
- Remaining: Ethernet/WiFi connection testing on real hardware/images

## M33: add boot utilities to the base (2026-11-18 completed)

In M32's stage3 boot test, OpenRC's hostname / loopback / sysctl services were
failing because `hostname` / `ifconfig` / `sysctl` were missing. Filling the holes in the minimal base.

- [x] **`inetutils 2.8-r1` into base** — `hostname` (hostname service) and
  `ifconfig` (loopback service). ping/ping6/ftp/telnet/tftp/traceroute are disabled;
  ping is still provided by `main/iputils` (avoiding file conflicts)
- [x] **`procps 4.0.7` into base** — `sysctl` (sysctl service), ps/top/free etc.
- [x] **Build environment fix** — inetutils' configure defines `PATH_PROCNET_DEV` based on the
  presence of `/proc/net/dev`, so `/proc` must be mounted during chroot builds. The M32 build
  failed because it was not mounted → mounted `/mnt/proc` and rebuilt
- [x] **stage3 regenerated** — **53 packages / 976 MiB**. Includes inetutils and procps
- [x] **BIOS image boot test** — **BOOT CHECK PASSED**. The prompt becomes
  `root@zignos`, and the hostname/loopback/sysctl errors are resolved
- Remaining: verification on the UEFI image, booting on real hardware

## M32: mdev → eudev (2026-11-18 completed)

Migrated from busybox mdev to **eudev 3.3.0** in preparation for GUI and automatic
peripheral detection.

- [x] **`core/eudev 3.3.0`** — standalone version of systemd-udev. `--with-net-ifnames-default=no`
  keeps kernel-assigned `eth0` / `wlan0` (consistent with docs and dhcpcd). SELinux / SMACK /
  TPM2 / man pages disabled; blkid and libkmod enabled. `hwdb.bin` is generated at build time
- [x] **`core/gperf 3.3`** — required for eudev's keyword/hwdb generation (makedepends)
- [x] **initscripts r14** — added `/etc/init.d/udev`, replacing the sysinit mdev link with udev.
  The mdev script is still bundled for emergencies but disabled. udev runs after devfs with
  `udevd --daemon` → `udevadm trigger` → `udevadm settle` for coldplug. The `after` of
  dhcpcd/dbus/chronyd/wpa_supplicant/nftables is updated to udev
- [x] **eudev in base.list** — 34 top-level / 57 with dependencies (kmod/libblkid already present).
  Works with the existing devtmpfs / proc / sysfs / netlink configuration; no kernel changes needed
- [x] **stage3 regenerated** — **51 packages / 974 MiB** (added eudev, kmod and gperf).
  Includes `/etc/udev/hwdb.bin`, `/usr/lib/udev/rules.d` and `/etc/runlevels/sysinit/udev`
- [x] **BIOS image boot test** — **BOOT CHECK PASSED**. Proceeds devfs → udev startup → boot/default
  in order, and confirmed root login and `uname` (the TCG IO-APIC panic is a known retry case)
- Remaining: verification on the UEFI image, verification of uevent/firmware loading on real hardware

## M31: add 20 practical system tools (2026-11-18 completed)

Filled the base's gaps (timezone / signing / firewall / logs / cron) and added the
maintenance and diagnostic tools needed for real operation. tzdata goes into base.list so
every system can set a timezone, and the other 19 go into main/.

- [x] **Time** — `tzdata 2026f` (tzcode + tzdata; `/etc/localtime` is UTC, provides `/usr/share/zoneinfo`).
  Removes conflicts with glibc's tzselect/zdump/zic and owns only the data
- [x] **GnuPG** — `gnupg 2.5.24` + `libgpg-error 1.61` / `libgcrypt 1.12.4` /
  `libassuan 3.0.2` / `libksba 1.9.0` / `npth 1.8` / `pinentry 1.3.3` (curses/tty).
  SQLite enabled for keyboxd/TOFU. Smartcard, TPM and dirmngr disabled
  (no keyserver access because no TLS library is installed; signing/verification/encryption work)
- [x] **cron / logs** — `cronie 1.7.2` (PAM/SELinux/audit/anacron disabled, crontab 4755),
  `logrotate 3.22.0` + `popt 1.19` (weekly, dateext, compress defaults)
- [x] **firewall** — `nftables 1.1.7` + `libnftnl 1.3.2` (readline CLI, JSON/xtables disabled).
  Bundles `/etc/nftables.conf` and an OpenRC service
- [x] **Maintenance / diagnostics** — `cpio 2.15`, `lm-sensors 3.6.2`, `screen 5.0.2`,
  `gdb 18.1` (Python/NLS disabled, gdbserver bundled), `sshfs 3.7.7` + `fuse3 3.18.3` + `glib 2.88.4`
- [x] **initscripts r12** — added `crond` / `nftables` services (both opt-in)
- [x] **Build fixes** — cronie/cpio, broken by GCC 16's C23 default, use `-std=gnu17`;
  nftables selects readline instead of libedit; cpio's rmt and gdb's bfd/locale are
  excluded because they duplicate tar/binutils; fuse3 does not create `/dev/fuse` and sets fusermount3 to 4755
- [x] **Live run (2026-11-18)** — built and installed all 19 packages in a chroot.
  Confirmed gpg key generation/signing/verification, logrotate rotation, nft ruleset loading,
  and startup of cpio/screen/sensors/sshfs
- [x] **stage3 regenerated** — base 33 / 55 with dependencies, **stage3 48 packages / 967 MiB**.
  Includes `/usr/share/zoneinfo/Asia/Tokyo`, `/etc/localtime` and crond/nftables services

## M30: add 26 CLI tools (2026-11-18 completed)

Kept the base minimal and added practical CLI tools together in main/ (all via `zpkg install`).

- [x] **Network diagnostics** — `iputils 20250605` (ping/arping/tracepath, ping is setuid),
  `ethtool 7.2` (libmnl), `mtr 0.96` (ncurses), `nmap 7.993` (bundled pcap/pcre/zlib,
  zenmap/ndiff/nping disabled), `whois 5.6.6` (perl / libxcrypt), `iperf 3.22`
- [x] **Build and development support** — `automake 1.20` (perl/autoconf), `libtool 2.6.2`,
  `ccache 4.14.3` (xxhash; redis/http backends disabled), `sqlite 3.54.1`
  (FTS5/readline), `fzf 0.75.0` (Go), `lua 5.4.9` (readline)
- [x] **Compression and file operations** — `7zip 26.06` (7zz and 7z symlink), `lz4 1.11.1`,
  `brotli 1.2.1`, `pigz 2.8`, `pv 1.12.7`, `nnn 5.3`, `entr 5.9`
- [x] **Monitoring and security** — `btop 1.4.8`, `wireguard-tools 1.0.20260223` (libmnl),
  `age 1.3.2`, `restic 0.19.1` (all built from Go source), `zsh 5.9.2`,
  `moreutils 0.70` (man pages omitted because they need xsltproc)
- [x] **Dependency added** — `xxhash 0.8.3` (used by ccache)
- [x] **Live run (2026-11-18)** — installed 26 packages in a chroot and confirmed
  ping/ethtool/mtr/nmap/whois/iperf3, automake/libtool/ccache/sqlite3/fzf/lua,
  7zz/lz4/brotli/pigz/pv/nnn/entr, btop/wg/age/restic/zsh/sponge
- Base unchanged (base.list 32 / 54 with dependencies)


## M0: repository skeleton (completion criteria)

- [x] 4 repositories created under `studio-nosa-tech` (`zignos` / `zpkg` / `zignos-recipes` / `zignos-build`)
- [x] Each repository has its skeleton files and design documents in the first commit
- [x] zpkg builds with `go build` as a Go module

## M1: zpkg v0 (completion criteria)

v0 commands: `zpkg build|install|remove|list|search|depends`

- [x] Dependency topological sort (including cycle detection)
- [x] Source fetching (with cache) + sha256 checksum verification (real download and tamper detection also confirmed)
- [x] Build into destroot (implements the `build` script execution contract)
- [x] Manifest recording + conflict detection + install / remove (conflicts demonstrated with the hello-conflict fixture)
- [x] Test recipes (hello / hello2 / dl-test) install → remove pass (2026-11-15, Windows Git Bash e2e. Same procedure on a VM — quick start in zpkg/README.md)
- [x] `go vet` / `shellcheck` (all 15 scripts) clean

## M2: base system fully recipe-based (completion criteria)

The foundation is LFS 13.1-systemd (GCC 16.2.0 / Glibc 2.44 / Binutils 2.47 / Linux 7.1.8). The temporary system (cross build) is handled by zignos-build's stage scripts, and **the final system is assembled from zpkg recipes**.

- [x] `stage0.sh`: implements LFS ch4/ch5/ch6 (cross toolchain + temporary tools) faithfully to the book
- [x] `stage1.sh`: ch7 (chroot, essential files, additional temporary tools + ninja/meson + Go bootstrap)
- [x] `stage2.sh`: with zpkg, glibc → compression libraries → binutils/gcc → userland → go → zpkg self-host (core 25 recipes)
- [x] Confirmed the sha256 of 48 source files by real download and reflected them in the recipes' checksums
- [x] zpkg: exposes `ZPKG_CACHE` to build scripts (pkgconf references the meson tarball)
- [x] `bootstrap.sh` runs to the end on the build VM — **completed 2026-11-15** (26 packages registered in the zpkg DB, zpkg 0.1.0 self-hosted, go 1.27.4 built from source, `/etc/zignos-release` generated)
- [ ] Adding the remaining recipes (e2fsprogs, final util-linux, shadow etc. continue in M4)

### Fixes from the live run (2026-11-15, build VM)

- **bootstrap/stage side**: preflight `makeinfo` check, `$ZIGNOS_ROOT/tmp` creation, `set -e` hardening, idempotent symlinks (`ln -sfnv`), adding standard groups such as `tty` to essential files, providing `resolv.conf` to the chroot and seeding busybox's cache, stage resume mode (`all|stage1|stage2`) and a vfs remount guard
- **zpkg core**: patch/diff sources are placed in `$ZPKG_SRC` without unpacking, `usr/share/info/dir` excluded from ownership, **file replacement made atomic with rename** (avoids ETXTBSY for running binaries — essential for self-hosting)
- **Recipes**: glibc install with `-j1` (parallel install race), gcc uses mawk for option generation (avoids a gawk 5.4.1 regression), coreutils creates `usr/sbin` in destroot, busybox updated to 1.37.0 + TC applets disabled (CBQ UAPI removed in kernel 6.8+) + install binaries only (conflicts with coreutils over `[` etc.), go gets `GOROOT_FINAL` (GOROOT detection for trimmed binaries)

## M3: boot image (completion criteria)

- [x] Linux kernel recipe + minimal configuration (allnoconfig + qemu-x86_64 fragment: virtio / ext4 / serial / BINFMT_SCRIPT / BLK_DEV)
- [x] init system decision — **OpenRC is the main plan (M4) / busybox init (M3) / mdev** (see design-system.md)
- [x] rootfs image generation + QEMU boot — **2026-11-15 `BOOT CHECK PASSED`** (rc.init banner shown + guest shell responds to `uname -r`, serial console)
- [x] Additional recipes: `bc` / `bison` (for kernel kconfig) / `elfutils` (libelf — for objtool)

### Fixes from the M3 live run (2026-11-15)

- zpkg: exposes `ZPKG_RECIPE_DIR` to build scripts (recipes can carry assets such as kernel config fragments)
- kernel fragment: `BLOCK`/`BLK_DEV` (with allnoconfig the Block devices menu disappears and virtio_blk silently drops out), `BINFMT_SCRIPT` (without it a `#!/bin/sh` init does not start, failing with ENOEXEC)
- added: busybox 1.37.0 (TC applets disabled — CBQ UAPI removed in kernel 6.8+) + install binaries only (because it conflicts with coreutils over `[` etc.)
- go: `GOROOT_FINAL=/usr/local/go` (GOROOT detection for trimmed binaries)
- make-image / qemu-test: the `./` matching problem in tar exclude, inability to pass functions to `timeout`, passing environment variables to the child bash, executable permission for bootfiles

## M4b: practical use (ongoing)

- [x] **GRUB 2.14 recipe + partitioned bootable image** — make-image.sh does MBR partition + system copy + manual GRUB core.img installation (prefix `(hd0,msdos1)/boot/grub` specified explicitly with grub-mkimage) + serial grub.cfg
- [x] **QEMU GRUB boot — 2026-11-15 `BOOT CHECK PASSED`** (BIOS → GRUB → kernel → OpenRC → agetty)
- [x] **zpkg binary cache** (binpkg): on a successful build, packs destroot into `$ZPKG_CACHE/binpkgs/<name>-<version>.pkg.tar.gz`; install reuses a matching binpkg (`ZPKG_NO_BINPKG=1` forces a source build). Verified in a live run with grub
- [x] **installer (real disk version)** — `zignos-install [--yes] /dev/sdX`: MBR single partition + copy of the running system + GRUB installation + PARTUUID-based fstab/grub.cfg. **2026-11-16 live run passed**: inside the guest, installed to an empty 8G disk → booted that disk alone with GRUB and got `TARGET-BOOT-OK 7.1.8` (including login). Bundled in the image as `/usr/sbin/zignos-install`
- [x] initscripts matured — **shadow installed (2026-11-16)**: login/passwd/su/chpasswd work on the serial console (auto-login test with root/zignos passed), auto-login removed. ca-certificates and openssh are done (M5)
- [x] stock OpenRC service dependency cleanup — **2026-11-15 completed: 15 of 16 boot runlevel services are [ ok]** (remaining 1: hwclock RTC recognition — kernel configuration applied, needs investigation)
- [x] Additional recipes: `procps 4.0.7` (sysctl/ps), `kbd 2.10.0` (keymaps), `inetutils 2.8` (ifconfig/loopback), `autoconf 2.73` (for the kbd testsuite), `libcap`
- [x] kernel fragment: `BINFMT_MISC` (binfmt service), `RTC_CLASS`/`RTC_DRV_CMOS`/`RTC_HCTOSYS` (hwclock)
- [x] e2fsprogs: provides fsck.ext2/3/4 links (--disable-fsck disables only the frontend); openrc builds with `-Duucp_group=root` to silence the cachepath warning
- [x] Removed network/netmount services from the runlevel (not ready yet)
- [x] Removed the stray symlink `/usr/libexec/rc/console → /proc/self/mounts` (the cause of save-keymaps failing to create a directory)
- [x] Additional recipes (2026-11-16): `shadow 4.20.2` (yescrypt) + `libxcrypt 4.5.2` (shadow dependency)
- [x] ca-certificates (Mozilla bundle via curl.se) — confirmed zpkg https fetch inside the chroot succeeds with TLS verification
- [x] openssh direction (remote operation) — completed in M5 (sshd + SSH login verification from the host)
- [x] Device management: decided to **stay with mdev** (comparison table and rationale in design-system.md. eudev when USB hotplug and persistent naming are needed)
- [ ] Repository publication method (decide Private → Public at that time)

### Fixes from the M4b-3 live run (2026-11-15)

- **OpenRC service scripts must have `#!/sbin/openrc-run` as their shebang** — OpenRC silently skips services with `#!/bin/sh` (no error). Fixing the console/mdev services made agetty start — the true cause of the "shell does not appear" problem
- **M4b (added 2026-11-16)**: the console service must use **`command_args_foreground`**, not `command_args` (with normal args, supervise-daemon connects stdio to /dev/null, so agetty starts but nothing appears on the console). agetty's argument order is "port → baud rate" (util-linux). The boot check matches **only resolved output** (to avoid false positives from input echo) + supports the login flow (root/zignos), with timing adjusted for TCG's slow boot
- https fetch inside the chroot failed TLS without a CA → for now operate with a cache seed (also reconfirmed that vfs must be remounted on every manual chroot)
- An orphaned qemu holding the image write lock → pkill before running (`[q]emu-system` bracket notation — a bare pattern matches itself and commits suicide)
- The 40G tree's ext4 was corrupted twice, losing `/bin` symlinks etc. → established the procedure of offline e2fsck + root symlink reconstruction (the root cause was a chain of abnormal terminations of killed make-image/chroot)

### Fixes from the M4b live run (2026-11-15)

- **make-image: exclude was deleting the mount points themselves** — excluding `dev/proc/sys/run` meant `/dev` etc. did not exist in the image and both devtmpfs and OpenRC failed entirely (a cascade of `/dev/null: No such file or directory` at user startup). Fixed to recreate mount points (dev/proc/sys/run/tmp/opt/var/tmp/var/lib/seedrng) after copying
- make-image: leftover vfs mounts mixing into the tar (exclude proc/sys/dev/run + unmount beforehand), handling ext4 corruption of the 40G image (e2fsck), multiple loop attachments to the same backing file causing page cache inconsistency (all detach + drop_caches built into make-image itself)
- GRUB boot fs: e2fsprogs 1.47+ defaults `orphan_file`/`metadata_csum_seed` are unsupported by GRUB 2.14 (restrict features in mkfs)
- grub-install's loop probing embeds wrong UUIDs in a chroot environment → changed to **manual core.img with grub-mkimage + dd installation**
- qemu-test: GRUB boot when KERNEL is unspecified (direct kernel boot remains available with `KERNEL=`)
- make-image: `$ZIGNOS_ROOT/dev` is a bind of the host `/dev`, so `umount $ZIGNOS_ROOT/dev/pts` can unmount the host's devpts ("sudo: unable to allocate pty") → added a self-healing guard (mountpoint check + devpts remount)
- **hwclock resolved (2026-11-16)**: `CONFIG_RTC_CLASS` alone only creates the sysfs entry and there is no `/dev/rtc0` → added **`CONFIG_RTC_INTF_DEV`** to the fragment and confirmed `Setting system clock ... [ ok ]`
- **Fixes from the installer live run**: `partprobe` is not in the base system (parted not installed) → changed to `partx -u`; target disk size insufficient (4G→8G); **the minimal kernel cannot resolve `root=UUID=`** → changed to PARTUUID (disk-id + partition number is robust against vda/sda changes)
- network service is unconfigured and removed

## M24: initramfs + UEFI + generic kernel (2026-11-17)

- [x] **`core/initramfs`** — `zignos-mkinitramfs` (busybox + /init in cpio+gzip) and
  `/usr/lib/zignos/initramfs/init`. Resolves `root=UUID=`/`LABEL=`/`/dev/*` with busybox blkid,
  then `mount -o ro` → `switch_root`. Rescue shell on failure. `-m` bundles modules
- [x] **Generic kernel** — `x86_64_defconfig` + `core/linux/x86_64-generic.config`:
  boot-related (ACPI/APIC, SATA AHCI, NVMe, USB/XHCI/storage/HID, VT/VGA/simpledrm/fbcon,
  ext4/vfat, virtio, main NICs) are **=y**; GPU/WiFi/additional NICs/FS are **=m**.
  `make modules_install` + `kmod depmod`, generating `/boot/initramfs.img` at build time
- [x] **`core/kmod 34.3`** — modprobe/depmod/insmod/lsmod (libkmod). initscripts r8:
  registers mdev as a hotplug helper, auto-loads via the MODALIAS rule in `/etc/mdev.conf`,
  adds `console-vga` to the default runlevel
- [x] **GRUB BIOS + UEFI builds** — builds `i386-pc` and `x86_64-efi` (601 modules) in
  separate build trees and bundles them (grub r1)
- [x] **Images** — unified on root=UUID + initramfs. `UEFI=1` generates GPT (100MiB ESP +
  ext4 root) + `grub-mkstandalone`'s `BOOTX64.EFI`. The BIOS version keeps the previous MBR + core.img
- [x] **Installer** — detects the boot firmware; UEFI uses GPT+ESP
  (`/EFI/BOOT/BOOTX64.EFI`, no NVRAM registration), BIOS uses MBR. grub.cfg uses UUID + initrd
- [x] **QEMU test** — `UEFI=1` supports OVMF (edk2) pflash boot
- [x] **Live run verification (2026-11-17)**:
  - BIOS image: `BOOT CHECK PASSED`, `/proc/cmdline` is `root=UUID=...` (resolved by initramfs),
    `console`/`console-vga`/`mdev`/`dbus`/`sshd`/`chronyd` started, `mdev -s` auto-loads
    `cfg80211`, `modprobe iwlwifi` / `modinfo i915` work
  - UEFI image (OVMF): `BOOT CHECK PASSED`, `/sys/firmware/efi` present,
    VGA console enabled with `simpledrm` + `fbcon`, GPT `/dev/vda2` mounted by UUID
  - **UEFI installer e2e**: installed to a 12G empty disk with GPT+ESP →
    `ZIGNOS-INSTALL-COMPLETE` → booted that disk alone with OVMF → `TARGET-BOOT-OK 7.1.8`
  - **BIOS installer e2e**: installed to MBR → booted alone → `TARGET-BOOT-OK 7.1.8`
- [x] **Pitfalls hit during the live run**:
  - busybox was **dynamically linked** and could not run in the initramfs (`/init` gave ENOENT) →
    changed to a static build with `CONFIG_STATIC=y` (busybox r1)
  - `busybox --install -s` linked to the **temporary build path** → ran
    `chroot "$TMP" /bin/busybox --install -s /bin` inside the unpacked tree so links point to `/bin/busybox`
  - `mke2fs`'s size argument is in **1KiB units** unless `-b` is given (created a 1/4-size FS and populate failed)
    → specify `-b 4096`
  - Extending ext4 to the **last 34 sectors of GPT's backup table** gave
    "bad geometry ... exceeds size of device" → align the root partition and FS
    34 sectors before the end
  - make-image's `unmount_vfs` unmounted the **host's devpts** via `$ZIGNOS_ROOT/dev` (a bind of host /dev)
    and broke the build VM's sshd → removed the unmount (tar exclude is enough)
  - TCG's known `IO-APIC + timer doesn't work!` panic rarely occurs even with OVMF boot
    → retrying gets through (as before)

## M23: real hardware installation preparation (2026-11-17)

- [x] **Installation guide** — recommends SystemRescue 13.03 as the Live ISO and covers
  acquisition/verification/USB writing, method A (ZIGNOS USB → `zignos-install`), method B
  (write the image directly + expand), method C (rescue/chroot), first-time configuration,
  WiFi and troubleshooting. Also introduces general thinking about kernel configuration
- [x] **`zignos-install` real hardware support** — supports NVMe/eMMC partition names (`nvme0n1p1`).
  grub.cfg uses `console=tty0 console=ttyS0` (timeout 5 seconds)
- [x] **Image root=PARTUUID** — `make-image.sh` derives PARTUUID from the MBR disk id and
  writes it to grub.cfg. The image can boot wherever it is `dd`'d to USB/SATA/NVMe
  (previously QEMU-only `/dev/vda1`). **Pitfall in the live run**: writing GRUB's `boot.img` as 446 bytes
  zeroed the MBR disk id (offset 440) and broke PARTUUID → changed to **440 bytes**
  and assert that the disk id and PARTUUID match after writing. `BOOT CHECK PASSED`
- [x] **initscripts r6** — bundles `console-vga` (agetty tty1) for VGA login.
  However the current kernel lacks `CONFIG_VT`, so it is **not registered in the runlevel**
  (`rc-update add console-vga default` after adding VT). Added tty1/tty2 to securetty and
  fixed `wpa_supplicant` to read `/etc/conf.d/wpa_supplicant` (`WPA_IFACE`)
- [ ] **Kernel profile for real hardware** — ACPI/APIC/SATA/NVMe/USB/VT/wired and wireless drivers.
  The current `qemu-x86_64.config` has only virtio + serial (next task for real hardware boot)

## M22: WiFi stack + D-Bus + HW information tools (2026-11-17 completed)

- [x] **D-Bus 1.16.4 (core, meson build)** — system bus only (session bus when the GUI is introduced).
  The `messagebus` account (uid/gid 25) comes from initscripts; machine-id via `dbus-uuidgen --ensure`
  (the service's `start_pre`). selinux/apparmor/libaudit/systemd/x11_autolaunch disabled
- [x] **WiFi userland (main/)** — `libnl 3.12.0` (foundation for nl80211) / `wpa_supplicant 2.12`
  (WPA2/WPA3, nl80211 + OpenSSL + D-Bus control IF) / `iw 6.17` (scan/link). rfkill is
  **not a separate package** because util-linux provides `/usr/sbin/rfkill` (discovered during the build as
  "already owned by util-linux" → recipe deleted)
- [x] **HW information tools (main/)** — `lshw B.02.20` / `dmidecode 3.7` / `smartmontools 7.5` (smartctl).
  For checking model numbers, memory slots and disk health when taking real hardware
- [x] **linux-firmware 20261019 (main/)** — the firmware set the kernel loads (2.0 GiB installed,
  7794 files). The tarball is 1.0 GiB and a 12G image has only ~3.9 GiB free, so it is
  **outside base.list**. On real hardware install with `zpkg install linux-firmware`. `make dedup` is
  unused because rdfind is not installed. Verification: install → resolve a path containing spaces with `zpkg owner` →
  confirm `/lib` remains after removal
- [x] **Manifest support for paths with spaces** — linux-firmware has file names with spaces
  such as `...Intel Corp.-VALLEYVIEW C0 PLATFORM.txt`, and the old parser (`strings.Fields`)
  stopped with `malformed file entry`. **Paths containing spaces, quotes and backslashes are now written in Go's
  quoted form**, while keeping backward compatibility so old-format lines still read (unit test added).
  Install destination is `/usr/lib/firmware` to match usr-merge (the kernel resolves via `/lib/firmware`)
- [x] **usr-merge removal bug (serious)** — removing linux-firmware `os.Remove`d the manifest's
  `dir lib` as an empty directory, which **deleted the `/lib` symlink** and made every dynamically linked
  binary fail to start with `required file not found`. Directory cleanup is fixed to **only those confirmed as
  real directories with Lstat**, and a regression test that `/lib` remains was added. The chroot was recovered with `ln -s usr/lib /lib`
- [x] **initscripts r4** — messagebus account + `init.d/dbus` (boot runlevel,
  `start_pre` generates the uuid and `/run/dbus`) / `init.d/wpa_supplicant` (`WPA_IFACE` specifies the IF,
  ctrl_interface is `/run/wpa_supplicant` with group wheel). **r5 fixed the boot test**:
  dbus gets `--nofork` (when it forks, the supervisor misreads it as a crash and starts multiple copies), sshd uses
  supervise-daemon + `-D` (there was no pidfile so it showed "crashed"), wpa_supplicant is
  removed from the default runlevel (it fails on machines without wlan; on WiFi machines
  `rc-update add wpa_supplicant default`)
- [x] **zpkg: remove unneeded files on upgrade** — files in the old manifest but not the new manifest
  are deleted when their contents match (sha256/link target). Edited files are kept.
  Deletion goes through backup so it can roll back on failure (confirmed with unit tests + the `prunepkg`
  v1→v2 e2e: only drop is removed, keep remains)
- [x] **zpkg recipe pitfall** — `cp -a /sources/zignos-zpkg "$ZPKG_WORKDIR/zpkg-src"` **nested into
  the existing old copy** in the workdir and silently rebuilt the old v0 binary (found in the live run).
  Fixed to `rm -rf` before copying and bumped to revision 1. Also, bootstrap's Go is a trimmed build that only takes
  `GOROOT` from the environment, so the recipe now defaults `GOROOT=/usr/local/go` (r2)
- [x] **base.list 85 packages** — added dbus + libnl/wpa_supplicant/iw.
  On the kernel side, CFG80211/MAC80211 + drivers + firmware are separately required on real hardware (noted in comments)
- [x] **dbus build knowledge** — 1.16 has removed autotools (meson only). `--runstatedir` does not exist
  in meson, and there is no `tests` option (`modular_tests`/`asserts`). `modular_tests` is
  a combo so it must be **`disabled`** (`false` is not allowed)
- [x] Live run verification (2026-11-17): built and installed dbus 1.16.4 + 7 WiFi/HW packages,
  `dbus-uuidgen --ensure` generated `/var/lib/dbus/machine-id`, `wpa_supplicant v2.12` /
  `iw 6.17` / `lshw B.02.20` / `dmidecode 3.7` / `smartctl 7.5`, `zpkg list` **101**
- [x] **Image regeneration + guest boot check (2026-11-17)**: `BOOT CHECK` (including login) +
  `rc-service dbus status` = started (processes are two lines: supervise-daemon + dbus-daemon),
  `dbus-send ... ListNames` succeeds, `ss -ltn` shows :22 (sshd started),
  wpa_supplicant is not in the default runlevel (as designed)
- [ ] Next: real hardware WiFi verification (add kernel CFG80211/MAC80211 + drivers + firmware to the fragment)

## M21: add 13 CLI tools (2026-11-17 completed)

- [x] **13 recipes in main/** — `tree 2.2.1` `jq 1.8.2` `zip 3.0` / `unzip 6.0` (Info-ZIP) / `ncdu 1.22` `socat 1.8.1.3` `lsof 4.99.7` `strace 6.19` `libpcap 1.11.0` / `tcpdump 4.99.7` `dosfstools 4.2` (mkfs.vfat — EFI preparation) / `pciutils 3.15.0` (bundles pci.ids as a recipe asset) / `sysstat 12.7.7`. base.list unchanged (81)
- [x] Fixes from the live run (mostly modern-environment countermeasures for old packages):
  - **tree**: the man page in the tag archive is `doc/tree.1`
  - **zip 3.0**: `unix/configure`'s probe misdetects modern environments and injects `-DZMEM` (conflicts with glibc) → **create the flags file in advance** (with an mtime newer than unix/configure so make does not regenerate it)
  - **unzip 6.0**: patch the old-style `gmtime()/localtime()` declarations in `unxcfg.h` + **`linux_noasm`** (the linux target assembles 32-bit CRC asm on x86_64)
  - **socat**: OpenSSL 4 makes `ASN1_OCTET_STRING` opaque → `--disable-openssl` (not needed for relay functionality)
  - **strace**: kernel 7.1 changed the reserved field names in io_uring structures → not a patch but **`--enable-bundled=yes`** (uses strace's bundled headers; the error message itself said so)
  - pciutils: every pci.ids mirror was unreachable from the VM, so a public snapshot is **bundled as a recipe asset** (update with `update-pciids` on real hardware)
- [x] Live run verification: all 13 packages built and installed (`zpkg list` 94). tree/jq/zip/unzip/ncdu/socat/lsof/strace/tcpdump+libpcap/mkfs.vfat/**lspci (decoded display with pci.ids)**/iostat all work
- [ ] Next: real hardware boot verification, GUI investigation, binpkg repository signing (when distribution starts)

## M20: slot coexistence (2026-11-17 completed)

- [x] **DB records keyed by `<name>@<slot>`** — slot "0" (default) stays in the plain name directory (no migration of existing records); non-0 slots coexist as `name@slot`
- [x] **Conflict rules** — same name+slot is an upgrade; **file collisions with a different slot or another package are an error**
- [x] **remove deletes all slots** (journal per slot); `upgrade` updates only the recipe's slot (other slots preserved)
- [x] **Record Slot in install's rec** — if it is not recorded, the slot collapses to the plain name (found and fixed in the live run)
- [x] Unit tests: slot key / coexistence / cross-slot conflict / all-slot removal. Real machine e2e: slot 0 (v1.0) and slot 1 (v2.0) coexist; upgrading slot 0 to 1.5 preserves slot 1; slot 1 requiring slot 0's files is rejected as a conflict
- [ ] Next: real hardware boot verification, GUI investigation, binpkg repository signing (when distribution starts)

## M19: binpkg repository support (2026-11-17 completed)

- [x] **`zpkg mkindex [dir]`** — generates `index.json` from a binpkg directory
  (schema 1: name/version/revision/usehash/arch/sha256/size/filename/deps).
  Since PackBinpkg now writes a `.meta.json` sidecar, an index can be built **without a recipe tree**
- [x] **Installing from a repository** — `ZPKG_BINREPO` (env) or
  `BINREPO=` in `/etc/zpkg/binrepo.conf`. Tries the repository after the local binpkg cache misses.
  Match conditions: name/arch/version+revision/**effective USE hash**,
  and the tarball is checked against the index's sha256. On mismatch, silently falls back to a source build
- [x] **Distribution is out of scope** — a static file server is enough (user policy: with the current
  development capacity, do not distribute yet, only support it. When a community forms, extend to signing index.json etc.)
- [x] Unit tests: index generation + repository restore + hash-mismatch fallback +
  disabling when unset/NO_BINPKG. Real machine verification: pack → mkindex → `installed from binpkg` in another root
  (no source build) → changing flags falls back to a source build
- [ ] Next: slot coexistence, real hardware boot verification, GUI investigation, observing chrony drift operation

## M18: chrony (2026-11-17 completed)

- [x] **`core/chrony 4.9` recipe** — pool synchronization + `rtcsync` (sync the RTC to the kernel) +
  `makestep` (skip large offsets instead of slewing). The chrony account (uid/gid 45) comes from
  initscripts; chown of the drift directory is a `post_install` hook
- [x] **initscripts r2** — chrony account + `chronyd` service (supervise-daemon,
  `after dhcpcd`) + default runlevel
- [x] base.list 81 packages (core 68 + main 14)
- [x] Live run verification (2026-11-17): `Starting chronyd [ ok ]` on guest boot,
  **`chronyc sources` shows `^* ntp-jp.vulp.ca` (synchronized mark, Stratum 3)** —
  actually syncing NTP through QEMU slirp. Expected to also resolve the VM's clock drift problem

## M17: meson recipe + `upgrade --newuse` (2026-11-17 completed)

- [x] **`core/meson` recipe** — standalone installation without pip: `mesonbuild/` into the
  interpreter's site-packages, `meson.py` to `/usr/bin/meson`, man pages bundled
- [x] **openrc r1** — dropped the previous approach of unpacking the meson tarball from the cache at build time,
  and moved to the system's `meson setup` + `ninja` (`makedepends: meson ninja`).
  Rebuilt with `zpkg upgrade openrc` → `BOOT CHECK PASSED` (boots normally with the meson-built openrc)
- [x] **`zpkg upgrade --newuse`** — rebuilds packages whose effective USE flags (including package.use)
  differ from `meta.useflags` at install time. Real machine verification: changing a flag → `rebuilding`
  and the artifact marker changes; without `--newuse` it stays up to date
- [x] base.list 80 packages (core 67 + main 14, desktop 0)
- Note: the build VM has no `/dev/kvm` (no nested virtualization) → KVM verification is a task for real hardware
- [ ] Next: userland work such as chrony (NTP — countermeasure for VM clock drift), slot coexistence, binpkg repository distribution

## M16: man page environment (2026-11-17 completed)

- [x] **5 recipes for the man chain** — core/: `groff 1.25.0` (troff formatter) `gdbm 1.26` (man-db cache DB) `libpipeline 1.5.8` `man-db 2.13.2` (`--enable-cache-owner=bin`, `--with-groff`) / `man-pages 6.20-r1` (sections 2/3 etc.)
- [x] **Add the bin account to initscripts** (uid/gid 1, man-db cache owner) + **update to revision r1**
- [x] **Dogfooding `zpkg upgrade initscripts`** — rolling updates via revision worked on real hardware for the first time (r0→r1 rebuild and reinstall, transactional replacement of passwd/group)
- [x] **man-pages crypt(3) conflict** — libxcrypt owns crypt.3 → `rm man3/crypt*` as in LFS. Because an old binpkg (containing crypt.3) was reused, **bumped to revision 1** to invalidate the binpkg key — a demonstration of the "recipe content change → bump revision" practice
- [x] base.list 79 packages. Live run verification: `man ls` / `man 2 open` / `man 3 printf` render formatted output in chroot + guest boot
- [ ] Next: meson recipe (lack of pip is the obstacle), automatic rebuild on USE change, slot coexistence, binpkg repository distribution

## M15: linux-headers recipe (2026-11-17 completed)

- [x] **`core/linux-headers` recipe** — `make headers` + `headers_install` from the same tarball as linux. Adopts the kernel headers that stage0 copied directly to `$ZIGNOS_ROOT/usr` at the same version (7.1.8)
- [x] **Add `linux-headers` to glibc's depends** — `zpkg depends glibc` returns linux-headers first (the order for a new bootstrap is decided by dependency resolution)
- [x] Live run verification (2026-11-17): adopted 1086 files, `zpkg owner /usr/include/linux/version.h` → linux-headers, `zpkg list` 74, image regenerated + `BOOT CHECK PASSED`
- **With this, every file under /usr is managed by zpkg. The only remaining LFS dependency is the cross toolchain "build procedure" (the stage0/1 scripts)**
- [ ] Remaining: `meson` recipe (lack of pip is the obstacle), man-db/man-pages, slot coexistence, binpkg distribution

## M14: recipe expansion + stage2 on base.list (2026-11-17 completed)

- [x] **18 recipes added** — core/: `m4 1.4.21` `texinfo 7.3` `diffutils 3.12` `patch 2.8` `findutils 4.11.0` `gawk 5.4.1` (mpfr+readline) `gettext 1.0` `perl 5.44.0` `mpdecimal 4.0.1` `libffi 3.5.2` `python3 3.14.10` `ninja 1.13.2` `libevent 2.1.12` / main/: `wget 1.25.0` `tmux 3.5a` `htop 3.4.0` `rsync 3.5.2` `which 2.25`
- [x] **Adopt stage1's ad-hoc installs** — stage1 had installed perl/python3/gettext/texinfo/mpdecimal/ninja directly outside zpkg. Now `zpkg owner` answers for all of them with same-version recipes, and they can be updated
- [x] **stage2 on base.list** — phase 1 = bootstrap core (through zpkg self-hosting, still hard-coded) + phase 2 = apply the full `/sources/base.list` (the scaffold distributes base.list to /sources). Idempotent with skip-installed
- [x] **OpenSSL 4 patches** — `python3` (`TLSv1_method` and other fixed-version methods removed in OpenSSL 4, and the `OPENSSL_NO_*_METHOD` macros are gone → OPENSSL_VERSION_NUMBER guards) and `wget` (`SSLv3_client_method` likewise). Both recipes apply their own patches with `makedepends: patch` (dogfooding the patch package)
- [x] Other live-run fixes: depends must be **one package per line** (zpkg reads line by line); `rsync 3.5` aborts on missing optional libraries, so `--disable-xxhash --disable-lz4 --disable-idn`
- [x] Live run verification (2026-11-17):
  - `bootstrap.sh stage2` completed: built and installed 18 packages (`zpkg list` 55 → **73**)
  - `zpkg owner /usr/bin/perl /usr/bin/python3 /usr/bin/ninja /usr/bin/msgfmt /usr/bin/makeinfo /usr/bin/find /usr/bin/awk /usr/bin/wget /usr/bin/tmux /usr/bin/rsync` all answer
  - `python3 -c "import ssl, ctypes, xml..."` → works on OpenSSL 4.0.1; tmux/wget/rsync work on image boot too
  - `build-system.sh /mnt` → all 73 skipping (exact match with base.list)
- [ ] Remaining: `linux-headers` recipe (kernel headers still installed directly by stage0), meson recipe (openrc unpacks the meson tarball from the cache directly), man-db/man-pages

## M13: unified base.list + rolling release policy (2026-11-17)

- [x] **`zignos-build/base.list`** — the single definition of the base system (55 packages, with category comments). sudo is intentionally excluded (main/ only)
- [x] **`zignos-build/build-system.sh <root>`** — applies base.list to a root. Recipes prefer the root's `/sources/zignos-recipes` → bundled `/usr/share/zignos/recipes`. Supports `-p`; for the running system (`build-system.sh /`) it runs zpkg directly without chroot
- [x] **Real machine verification** — ran pretend + apply on the bootstrap tree (`/mnt`): **all 55 packages skipping** = the tree exactly matches base.list
- [x] **Rolling release policy documented** — in README and the bootstrap design:
  - The recipe tree HEAD is always the current release (no fixed versions)
  - Update paths: systems use `zpkg upgrade`, build hosts/seeds use `build-system.sh` (idempotent)
  - A snapshot = a git tag of the recipe tree; the seed tarball is its binary distribution
- [ ] Next: move stage2's final system construction to base.list / `linux-headers` recipe (kernel headers still installed directly by stage0) / where to distribute seeds

## M12: zpkg transactions (2026-11-17 completed)

- [x] **install/remove with a journal** — `$ZPKG_DB/.txn` (journal.json + backup/). Replace targets are moved to backup before placement
- [x] **In-place rollback on Apply failure** — restore from backup and delete created files. On upgrade failure, the old record is kept (`hadrecord`)
- [x] **Crash recovery** — at the start of the next zpkg operation or via `zpkg recover`. An interrupted install rolls back; an interrupted remove completes. A corrupt journal is moved aside to `.txn.corrupt`
- [x] **fsync** — DB version/meta.json/manifest written with tmp+rename + fsync (file + directory)
- [x] Unit tests: commit / rollback / upgrade failure keeps the old record / remove crash completion / no pending transaction
- [x] Real machine verification (2026-11-17):
  - `zpkg recover` → `no interrupted transaction`
  - install + post_install hook work
  - Reproduced a crash in the middle of remove (manually removed the marker and placed a journal) → `zpkg recover` reports `completed the interrupted removal of hookpkg 1.0`, the record and `.txn` disappear, and a second `recover` reports none
  - `zpkg recover` works on image boot
- [ ] Next: slot coexistence, parallel build --jobs, automatic rebuild on USE change, binpkg repository index + signing

## M11: per-package USE + hooks (2026-11-17 completed)

- [x] **package.use** — `/etc/zpkg/package.use` (`<pkg> flag -flag ...`). Effective flags = global + package tokens. The binpkg option hash is also computed from per-package effective values
- [x] **IUSE validation** — using a flag not in the recipe's `iuse` in `flag?pkg` is an error (typo detection)
- [x] **CLI** — `zpkg use --package <pkg> [flag|-flag]...` (display and edit)
- [x] **Recipe hooks** — runs `post_install` / `post_remove`. `ZPKG_ROOT=/` runs directly, a root with bash runs via chroot, an empty root runs on the host + `ZPKG_ROOT` environment
- [x] **ldconfig trigger** — best-effort run of `<root>/usr/sbin/ldconfig` after install/remove
- [x] Real machine verification (2026-11-17):
  - `use --package usetest demo` → `usetest: demo`, global stays empty
  - In that state `depends usetest` → `usetest-dep usetest-make usetest`, and `-demo` removes the dependency
  - `bogus?` not in `iuse` → `conditional dependency uses flag "bogus", which is not in iuse`
  - `post_install` records `post_install usetest 1.0 root=... use=demo`, and `post_remove` also runs
  - `zpkg use` / `use --package vim` work on image boot
- [ ] Next: transactions (journal/rollback), slot coexistence, parallel builds, automatic rebuild on USE change

## M10: zpkg USE flags (2026-11-17 completed)

- [x] **options package** — `$ZPKG_ROOT/etc/zpkg/use.conf` + `make.conf`, overrides for `ZPKG_USE`/`ZPKG_CFLAGS`/`ZPKG_MAKEOPTS` (specifying even an empty string overrides), `flag?pkg` expansion, option hash
- [x] **build** — passes `ZPKG_USE` / `ZPKG_CFLAGS` / `ZPKG_MAKEOPTS` to recipes and appends the option hash to the binpkg cache name
- [x] **CLI** — `zpkg use [flag|-flag]...`, conditional dependency expansion during resolution, `useflags` in `meta.json` and `zpkg info` display
- [x] Real machine verification (2026-11-17):
  - `zpkg use` empty → `zpkg use demo` → `demo`, cleared with `zpkg use -demo`
  - `depends usetest`: without USE → only `usetest` / `ZPKG_USE=demo` → `usetest-dep usetest-make usetest`
  - binpkg names: `usetest-1.0.pkg.tar.gz` (no options) / `usetest-1.0-c906b4fc.pkg.tar.gz` (USE=demo)
  - The build artifact marker has `demo`, and `zpkg info usetest` after install shows `useflags: demo`
  - `zpkg use` works on image boot
- [ ] Next: per-package USE (`package.use`), default value/disabled flag validation via `IUSE`, hooks/triggers, slot coexistence

## M9: zpkg v0.9 (DB schema 2, world/upgrade) (2026-11-16 completed)

- [x] **pkgdb schema 2** — `meta.json` (slot/repo/arch/installed/useflags/depends/builddepends), atomic tmp+rename writes. **v1 records are readable as-is** (meta is attached on the next install)
- [x] **Optional recipe metadata** — `revision` / `slot` / `provides` / `conflicts` / `makedepends`. Recipes without them behave as before (revision 0, slot "0")
- [x] **Version comparison** `internal/version` — pkgver segment comparison + `-rN` (`1.0_rc1 < 1.0 < 1.0_p1`, `1.0 == 1.0.0`)
- [x] **world** — records explicit installs in `$ZPKG_DB/world`. `install` adds only the specified targets (not dependencies), `--asdeps` suppresses it, `remove` removes it
- [x] **New commands** — `upgrade [-p] [pkg...]` / `info` / `owner` / `world`, `install/build -p` (pretend)
- [x] Added `-rN` to binpkg cache names
- [x] Real machine verification (2026-11-16):
  - `zpkg info vim` (v1 record) → installed 9.2.1355 / available 9.2.1355 (slot 0, repo main) / depends ncurses
  - `zpkg owner /usr/bin/vim /usr/sbin/ip /etc/passwd` → vim / iproute2 / initscripts
  - `zpkg install -f doas` → recorded with meta; `zpkg info doas` shows slot/repo/installed, and `zpkg world` shows doas
  - `zpkg upgrade -p` → up to date; with a fake recipe (99.0) `doas: 6.8.2 -> 99.0 / would install`
  - `zpkg info` works on image boot
- [ ] Next: USE flags + conditional dependencies + USE hash in binpkg keys, hooks/triggers, slot coexistence (design in /en/docs/design-pkg/)

## M8: expanding common tools + seed method (removing the LFS dependency) (2026-11-16)

- [x] **Added tools to main**: `libmnl 1.0.5` / `iproute2 6.19.0` (ip/ss/tc) / `less 710` / `nano 9.3` / `vim 9.2.1355` (console version, with a vi link) / `curl 8.23.0` / `git 2.56.1`
- [x] Dependencies: iproute2→libmnl, less/nano/vim→ncurses, curl→openssl+zlib, git→curl+zlib. git's https goes through curl (OpenSSL)
- [x] **Introduction of the seed method (first step away from the LFS dependency)**: `make-seed.sh` (current system → tar.gz) and `zignos-enter.sh` (mount + chroot into the unpacked destination). **Cross bootstrap is positioned as a maintainer-only path for creating seeds**; users and developers enter from a seed and extend with zpkg. Design in the bootstrap design document (private)
- [x] Live run verification (2026-11-16):
  - chroot: built and installed all tools, confirmed `ip -V` / `less` / `nano` / `vim` / `curl` / `git --version`, `curl -sI https://example.com` (200), `git ls-remote https://github.com/git/git`
  - Image boot (copy): `iproute2-6.19.0` / `less 710` / `VIM 9.2` / `curl 8.23.0 (OpenSSL 4.0.1, zlib 1.3.2)` / `git 2.56.1`
  - seed: `make-seed.sh` → unpack to `/var/tmp` → confirmed **zpkg 55 packages**, `git`, `ip` and `vim` with `zignos-enter.sh`; no vfs mounts remained after exit
  - Note: the build VM's `/tmp` is tmpfs (7.9GB). Images/seeds use `/var/tmp` (unpacking breaks when it fills up)
- [ ] Unify `base.list` / world rebuild from a seed / fully independent cross bootstrap (remaining work in the bootstrap design document (private))

## M7: privilege escalation (doas default + sudo in main) (2026-11-16 completed)

- [x] **doas 6.8.2 (core, default)** — OpenDoas. `--without-pam` (shadow authentication) + `--with-timestamp` (persist uses `/run/doas`). 4755 root:root, `/etc/doas.conf` is `permit persist :wheel`
- [x] **sudo 1.9.17p2 (main, repository only)** — configure's default shadow authentication. `--disable-log-client --disable-log-server` so **OpenSSL is not used**: 1.9.17p2's `hostcheck.c` touches the internal structure of `ASN1_STRING` and cannot compile with OpenSSL 4.0. Logs/TLS are not used, so sudo's built-in SHA-2 is enough. Bundles a sudoers for wheel
- [x] **zpkg preserving setuid** — `open(2)` ignores setuid/setgid, so install explicitly chmods; binpkgs preserve the mode with `tar.FileInfoHeader`. Without this, doas/sudo are just ordinary executables
- [x] **Recipe tree bundled** — recipes are included in the image's `/usr/share/zignos/recipes/{core,main,desktop}`, and zpkg searches automatically when `ZPKG_REPOS` is unset (equivalent to the usual package tree layout). In the guest confirmed `zpkg search sudo` → `main sudo 1.9.17p2` and that `zpkg install sudo` resolves from the bundled recipes alone
- [x] Live run verification (2026-11-16): doas on the console as zuser (wheel) → `doas id` → `uid=0(root)`; sudo inside the chroot `sudo -S id` → `uid=0(root)` (sudo was then removed from the image). For the clean image, booted a copy and confirmed doas 4755 and no test user. A full build of sudo inside the guest timed out under TCG (the build itself is proven in the chroot)
- [ ] The base system's package list is split across `stage2.sh` + manual installs → consolidate into `base.list` (reproducibility issue)

## M6: user management and SSH hardening (completion criteria — 2026-11-16 completed)

- [x] **zignos-install creates a regular user** — interactively asks for a username (default `zignos`) and password (entered twice). `--yes` uses `ZIGNOS_USER` / `ZIGNOS_PASSWORD`. `useradd -m -G wheel -s /bin/bash` + `chpasswd`; the wheel group is provided by initscripts
- [x] **SSH public key distribution** — if `/root/.ssh/authorized_keys` exists in the running root, copies it to the new user (interactive mode can also paste a key). `~/.ssh` 700 / `authorized_keys` 600, owned by the new user
- [x] **Disable root SSH login** — starts sshd with `-o PermitRootLogin=no`. Console root is kept for recovery
- [x] **Skip boot-time fsck of the root fs** — without an initramfs, an ro-mounted `/` cannot be fsck'd (`/dev/vda is in use`). Set the image and installer fstab to pass 0 and run fsck manually from the rescue environment
- [x] Live run verification (2026-11-16): from the image, `zignos-install --yes /dev/vdb` to an empty 8G disk → `INSTALL_RC=0` → boot that disk alone → `ssh zignos@127.0.0.1` gives **USER_SSH_OK** (uid=1000, wheel), `ssh root@...` gives **Permission denied**

## M5: networking and SSH (completion criteria — 2026-11-16 completed)

- [x] **dhcpcd 10.5.2 recipe + custom OpenRC service `dhcpcd`** — net-scripts is not installed, so the stock `network` service (modules=dhcpcd) cannot be used. `supervise-daemon` + `command_args_foreground="-q -B"`, `provide net` satisfies dependencies such as netmount
- [x] **openssl 4.0.1 / openssh 10.6p2 recipes** (openssh depends on openssl)
- [x] **sshd service** — generates an ed25519 host key on first start, creates `/run/sshd` with checkpath. At this stage `PermitRootLogin=yes` (until user management is added)
- [x] **Consolidate base account ownership in initscripts** — `/etc/passwd` (root/sshd/nobody) and `/etc/group` (tty/sshd/utmp/nogroup etc.) are provided by the initscripts recipe, and openssh does not touch them
- [x] **Kernel: `SECCOMP` + `SECCOMP_FILTER`** — without them, OpenSSH 10.6's privsep sandbox gets EINVAL from `prctl(PR_SET_SECCOMP)`, and sshd stays at "started [ ok ]" but dies immediately after connection (the client only sees `Connection closed`)
- [x] **zpkg: `build -f` / `install -f`** — force rebuild/reinstall of explicit targets even at the same version (dependencies skipped)
- [x] Live run verification (2026-11-16): with QEMU user-mode NIC + port forwarding, `ssh -p 2222 root@127.0.0.1` from the host → **`RESULT=SSH_OK`**, dhcpcd writes 10.0.2.3 to `/etc/resolv.conf` (eth0 is 10.0.2.15)
- [x] Image regenerated + `qemu-test.sh check` (including login) passed

### Fixes from the M5 live run (2026-11-16)

- Follow the order: update the recipe → then reinstall. Reinstalling first with an old recipe re-registers the old file ownership, and the new package cannot install with `already owned by ...` (the openssh passwd problem)
- **`git pull` as root fails with dubious ownership**, and scripts without `set -e` keep building with the old recipe → run pull as the repository owner and make build scripts use `set -e`
- `KCONFIG_ALLCONFIG` is evaluated in line order. Put symbols after their dependencies (`PROC_FS` etc.), and the recipe's `build` greps the merged `.config` to detect missing required symbols
- TCG rarely produces `Kernel panic - not syncing: IO-APIC + timer doesn't work!` (not reproduced on reboot of the same image). Operate boot tests assuming retries
- A `${stage:?}` (lowercase) typo in make-image broke the usr-merge branch / the EXIT trap swallowed the exit code → fixed both

## M4a: OpenRC introduction (completion criteria — 2026-11-15 completed)

- [x] `openrc 0.64.1` recipe (meson build, -Dpam=false; 0.64 requires libcap → added the `libcap` recipe)
- [x] `initscripts` recipe: mdev/console services, `/sbin/init → openrc-init`, runlevel links (standard links are provided by the openrc package)
- [x] `util-linux 2.42.2` (systemd-less configuration) + `e2fsprogs 1.47.4` recipes
- [x] zpkg: cache name specified via the `#filename` fragment in the source URL (GitHub tag tarball support)
- [x] QEMU boot — **`BOOT CHECK PASSED`**: `OpenRC 0.64.1 is starting up` → sysinit (mdev) → boot (root/hostname) → default (console) → agetty login
- [x] Completed the migration from M3's inittab/respawn method

### Fixes from the M4a live run

- openrc 0.64 had moved to a meson build (fixed the make script), requires libcap (recipe added), pam boolean defaults to true (`-Dpam=false`)
- The openrc package now bundles the standard runlevel links → initscripts shrinks to custom services only
- GitHub tag tarball basename problem → URL fragment feature in zpkg
- On a cache miss, https fetch inside the chroot fails without a CA → ca-certificates recipe planned for M4b

## After that: zpkg v1 direction

Staged expansion on the same Go codebase. USE flags, world, upgrade and transactions are
already implemented as v0.9 (M9–M12):

- slots (multiple versions of the same name coexisting) — implemented in M20. M52 can now solve multiple versions and slots simultaneously with SAT
- SAT solver — CDCL SAT implemented in M52 (zpkg 0.4.0). It handles multiple versions/slots, provides, conflicts and replacement of installed packages together
- Publishing signed repositories and key distribution (the mechanism is implemented in M37)
- world rebuild — implemented as `upgrade --newuse` in M17
- Minimal-dependency build root — M38 covers filesystem/process/network isolation.
  An overlay/manifest-based root that only sees makedepends is future work
- resource limit / hook isolation — CPU/memory/disk limits and
  sandboxing of `post_install` / `post_remove`
