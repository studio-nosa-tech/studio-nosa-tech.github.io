---
title: System design
description: init, the console, services, privilege escalation, and kernel policy.
---

Status: a consolidation of decisions. For details and history, see the
per-milestone sections in roadmap.md and the bootstrap design (seed method,
rolling).

## Toolchain policy

- **The recipe is the single source of truth**: ZIGNOS decides package versions, flags, and patches. The LFS 13.1 book is only a reference when building the cross bootstrap (stage0/1) (decided 2026-11-17)
- Start with **glibc** as libc (aiming for a practical distribution; reusing the LFS procedures is easiest). Migration to musl is a future consideration
- Everything under /usr is fully managed by zpkg (decided 2026-11-17 by making linux-headers a recipe). The LFS dependency is only the "build procedure" of the cross toolchain

## Init system (decision: OpenRC primary / busybox init for M3 boot validation)

**Decided 2026-11-15** (user policy: do not use systemd — because it is heavy):

- **Primary: OpenRC** (installed 0.64.1). Dependency-ordered service management is practical, it works well with the existing init script assets, and future combined use with s6 (supervision) is also in view
- **Device management: eudev** (2026-11-18, migrated from mdev in M32). Comparison results:

  | Aspect | mdev (busybox) | eudev |
  |---|---|---|
  | Additional packages | Zero (existing busybox) | eudev + gperf (makedep). kmod/libblkid already present |
  | Device creation at boot | `mdev -s` is sufficient | devtmpfs + coldplug (equivalent) |
  | Hotplug (USB insert/remove) | Not possible on modern kernels (`/proc/sys/kernel/hotplug` removed) | Standard support via netlink uevent |
  | Persistent device names (by-id/by-path) | None | Yes |
  | GUI / peripherals | Manual modprobe required | Automatic recognition of hwdb, rules, input/GPU |

  Decision: mdev was enough while the base was minimal, but eudev is needed for USB insert/remove, persistent naming, and GUI preparation.
  M32 puts eudev 3.3.0 in the base and runs the `udev` service at sysinit. mdev is
  bundled as a fallback but not registered in any runlevel. Network names keep the
  kernel names (eth0/wlan0) with `--with-net-ifnames-default=no`.
- M3 validated booting with busybox init (now migrated to openrc-init, `/sbin/init → /usr/sbin/openrc-init`)
- We do not follow the systemd-only procedures in LFS 13.x (use the procedures up to building the temporary system in ch5/ch6/ch7, and apply our own policy on the final system side)

## Console and login (settled in M4b)

- agetty on the serial console ttyS0 → shadow's login (auto-login removed)
- Requirements for OpenRC service scripts:
  - The shebang must be **`#!/sbin/openrc-run`** (with `#!/bin/sh`, OpenRC silently skips it)
  - When running agetty with supervise-daemon, use **`command_args_foreground`** (with the normal `command_args`, stdio is connected to /dev/null and nothing appears on screen)
- Allow ttyS0 in `/etc/securetty`, set PATH/PS1/umask in `/etc/profile`, and set the banner in `/etc/motd`
- **`/etc/os-release`** is provided by the initscripts recipe (`NAME=ZIGNOS`,
  `PRETTY_NAME="ZIGNOS {{release}}"`, `LOGO=zignos`). It is referenced by fastfetch's os module and
  tools that look at `ID=zignos`. It is separate from `/etc/zignos-release` (for tree detection) written by stage2
- The root password is set with `chpasswd` during bootstrap (always change it on first boot of distributed images)
- Base accounts are **owned by the initscripts recipe** (root/sshd/nobody in `/etc/passwd`, tty/sshd/utmp/nogroup etc. in `/etc/group`). Recipes for individual packages do not emit account files — placing a partial file in the destroot would replace the entire existing `/etc/passwd` at install time

## Network and SSH (settled in M5)

- **DHCP is dhcpcd run directly as a service** (`initscripts/init.d/dhcpcd`). It is **not enabled automatically in the base**
  (the minimal configuration since M28. `zpkg install dhcpcd && rc-update add dhcpcd boot`). The stock `network` service is unusable because net-scripts is not installed. `supervise-daemon` + `command_args_foreground="-q -B"`, `after udev`, `provide net`
- **sshd** (`initscripts/init.d/sshd`, opt-in): `after dhcpcd`, `use net dns logger`. `start_pre` creates `/run/sshd`, and if there is no ed25519 host key it generates one with `ssh-keygen` (keys are not bundled in images, so each installation gets its own key)
- **root SSH login is disabled** (sshd is started with `-o PermitRootLogin=no`; sshd itself exists only when openssh is installed). Log in as the regular user (in the wheel group) created by `zignos-install`. Root on the console remains for recovery
- Creating users is the installer's responsibility: interactive username/password, or non-interactive via `ZIGNOS_USER`/`ZIGNOS_PASSWORD`. SSH keys are inherited from the running root's `authorized_keys` (effective when openssh is installed; pasting is also possible in interactive mode)
- dhcpcd 10 leases are stored in **binary format** at `/var/lib/dhcpcd/eth0.lease` (not text). Check operation via `/etc/resolv.conf` and an actual connection

## D-Bus and WiFi (settled in M22)

- **The base starts only the system bus** (core/dbus 1.16.4). The session bus is started by the desktop session (dbus-run-session / Plasma). The `messagebus` account (uid/gid 25) is owned by initscripts, and machine-id is generated on first boot by `dbus-uuidgen --ensure` (`start_pre` in initscripts' `init.d/dbus`). **dbus-daemon forks by default, so `--nofork` is mandatory** (without it, supervise-daemon sees the parent's exit as a crash and the number of daemons grows on each restart — it reached 11 in the M22 boot test)
- **Service composition principle**: daemons get an OpenRC script in initscripts, and the package side ships only the binary and configuration. initscripts also decides the runlevels.
  **From M32 on, the only runlevel links are udev and console/console-vga**. The
  services below are enabled with `rc-update add <service> <runlevel>` after
  `zpkg install <pkg>`.

  | Service | Runlevel | Notes |
  |---|---|---|
  | udev | sysinit | eudev device management (after devfs, coldplug) |
  | dhcpcd | optional (boot) | `provide net` |
  | dbus | optional (boot) | `--system --nopidfile`, `after udev` |
  | console | default | agetty ttyS0 |
  | console-vga | default | agetty tty1 (VT/VGA/simpledrm enabled in the generic kernel) |
  | sshd | optional (default) | `after dhcpcd`, ed25519 key generated on first start |
  | chronyd | optional (default) | `after dhcpcd`, rtcsync + makestep |
  | wpa_supplicant | optional (default) | `WPA_IFACE` (default wlan0). On WiFi machines, enable with `rc-update add wpa_supplicant default` |
- **udev starts `udevd --daemon` at boot and re-sends uevents for existing devices with `udevadm trigger` to coldplug**.
  Subsequent insert/remove events are received by udevd via the kernel's netlink uevent and
  processed; rules in `/usr/lib/udev/rules.d` and hwdb are applied, and modules
  are loaded with libkmod when needed. `/etc/udev/hwdb.bin` is generated at build time.


## Privilege escalation (settled in M7)

- **The base has only `su`** (since the M28 minimization). doas (core/doas, OpenDoas 6.8.2) is
  an optional package added with `zpkg install doas`. `/etc/doas.conf` is `permit persist :wheel`. doas does not use PAM and authenticates via shadow (`--without-pam`); persist uses a timestamp in `/run/doas`
- **sudo lives in main/sudo** (1.9.17p2, installation optional). It is for users who want it, and not included in images. sudoers is `%wheel ALL=(ALL:ALL) ALL`, `env_reset` + `secure_path` + a 5-minute timestamp
- sudo is built **without OpenSSL** (`--disable-log-client --disable-log-server`), because hostcheck.c in 1.9.17p2 does not support OpenSSL 4's opaque `ASN1_STRING`. In configurations that do not use TLS/logsrvd, sudo's built-in SHA-2 is fine
- **zpkg preserves setuid/setgid/sticky** (explicit chmod at install time + tar mode in binpkgs). `open(2)` ignores setuid, so without this, escalation tools do not work

## Kernel policy

- vanilla kernel (kernel.org). Series are split by channel: stable uses 6.18.64 LTS,
  testing uses 7.3.5, and unstable uses 7.4-rc3 mainline
- **Based on x86_64_defconfig**, merge `core/linux/x86_64-generic.config` with
  `merge_config.sh` (policy: "basically boot on any machine, fine-tune the details yourself")
- **Drivers needed for boot are built in (=y)**: ACPI/APIC, SATA AHCI, NVMe, USB
  (XHCI/EHCI/OHCI/UHCI + storage + HID + AT keyboard), VT/VGA/simpledrm/fbcon,
  ext4/vfat, virtio, and the main wired NICs. The initramfs works with busybox alone
- **Additional hardware is modules (=m)**: GPUs (i915/amdgpu/nouveau/radeon), WiFi
  (iwlwifi/ath/rtw/mt76/brcmfmac), additional NICs, XFS/Btrfs/NTFS3, etc.
  eudev receives the uevent and loads modules via libkmod
- **The initramfs is busybox-based** (`zignos-mkinitramfs` in `core/initramfs` +
  `/usr/lib/zignos/initramfs/init`). The linux recipe generates
  `/boot/initramfs.img` at build time (always regenerated when the kernel is updated)
- **The root device is specified with `root=UUID=`**. The initramfs `/init` resolves the
  UUID/LABEL with busybox `blkid`, then does `mount -o ro` →
  `switch_root /root /sbin/init`. fstab also uses UUIDs. PARTUUID is not handled by the
  initramfs (a busybox blkid limitation)
- **Bootloader**: BIOS uses MBR + `grub-mkimage` core.img; UEFI uses GPT + ESP with
  `grub-mkstandalone`'s `BOOTX64.EFI` (embedded configuration, fallback path).
  GRUB's USE flags `bios` / `uefi` select the build target; if unspecified, both
  (for image generation). `uefi` pulls in efibootmgr via a conditional dependency
  (`uefi?efibootmgr`), and `zignos-install` registers the NVRAM entry (it boots via
  the fallback path even without it). Secure Boot is assumed disabled
- Symbols easily forgotten in fragments (found in actual runs): `BLOCK`/`BLK_DEV` (virtio_blk's parent menu),
  `BINFMT_SCRIPT` (script init), `BINFMT_MISC` (binfmt service),
  `RTC_CLASS` + **`RTC_INTF_DEV`** (/dev/rtc0), `SERIAL_8250_CONSOLE`, `DEVTMPFS_MOUNT`,
  `SYSFB_SIMPLEFB` + `DRM_SIMPLEDRM` + `FRAMEBUFFER_CONSOLE` for UEFI screens
- **`SECCOMP` + `SECCOMP_FILTER` are mandatory** (OpenSSH 10.6's privsep sandbox uses
  `prctl(PR_SET_SECCOMP)`). Without them, sshd shows the startup message and then dies
  immediately after a connection, and the client only sees `Connection closed`
- Because `merge_config.sh` silently drops symbols whose parent menu is disabled, the
  recipe's `build` greps the merged `.config` to detect the loss of mandatory symbols

## Release and channels (sketch)

- Because it is source-based, it assumes "snapshot"-type releases: a tag of the recipe tree = the state of the buildable world
- Consider continuous channels after introducing a binary cache (equivalent to buildpkg)

## Security and quality (ongoing)

- sha256 verification of sources is mandatory for all packages (official builds are prohibited while a recipe's checksums are empty)
- Shell scripts are kept shellcheck-clean
- Bootstrap reproducibility: `bootstrap.sh` surfaces failures idempotently (it does not hide caches or intermediate artifacts)
