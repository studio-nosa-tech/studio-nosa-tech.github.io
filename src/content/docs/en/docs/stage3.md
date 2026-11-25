---
title: stage3 tarball
description: Contents, build, distribution, and caveats of the ZIGNOS stage3 tarball. For installation on real hardware, see the install guide.
---

The ZIGNOS **stage3 tarball** is a "minimal, chrootable base" without a kernel
or bootloader. It is the **default method** for installation on real hardware:
unpack it to a disk, chroot into it, and install the kernel and GRUB with `zpkg`
inside.

> **The actual installation steps are collected in [Installation on real hardware](/en/docs/install/).**
> This page is a reference for the contents, build, distribution, and caveats of the tarball.

## Contents

- **64 packages** — the **dependency closure** of `base.list` minus linux and grub
  (current build r21 / about 1.1 GiB):
  glibc / gcc / binutils / make / bash / coreutils / tar / gzip / xz / bzip2 /
  pkgconf / busybox / openrc / initscripts / eudev / kmod / gperf / util-linux /
  shadow / e2fsprogs / kbd / tzdata / inetutils / procps / dosfstools / zpkg /
  git / ca-certificates / bubblewrap, plus their dependencies and makedepends
- PAM-enabled `login` and `/etc/pam.d` (login / su / passwd / system-auth /
  system-login / system-local-login). The current manifest is **r21**
  ({{release}} / {{stage3.package_count}} packages / about {{stage3.size_mib}} MiB, SHA-256
  `{{stage3.sha256}}`)
- Includes what is needed for source builds, such as meson / ninja / python3 / go
- **Not included**: kernel, initramfs, kernel modules, GRUB, boot configuration,
  user data, caches, SSH host keys, machine-id, root password (locked)
- SSH / DHCP / WiFi / editors / man are not included (add them with
  `zpkg install` after chroot)
- Bundled: the recipe tree `/usr/share/zignos/recipes/stable/{core,main,desktop}`,
  `/etc/zpkg/make.conf` (`CHANNEL=stable`), `/etc/zignos-stage3` (build information),
  an empty `/boot`, and an fstab template (the root line is not written. Generate it
  with `/mnt/zignos/usr/sbin/zignos-fstab /mnt/zignos` or enter the UUID from
  `blkid`. Enabling a wrong UUID makes `/` boot read-only)
- Signed trees also bundle `recipes.manifest` / `recipes.manifest.sig`.
  The current build r21 is unsigned because the official signing key is not yet in
  operation. stage3's `/etc/zpkg/sync.conf` sets `RECIPEALLOWUNSIGNED=1`
  (see [Package signing and verification](/en/docs/signing/) for details). The zpkg
  in r21 is 0.3.4, and the DB also includes provenance and SPDX SBOM
- `/etc/zpkg/sync.conf` points to the GitHub recipe repository by default.
  `zpkg sync` compares the `.zpkg-git` commit with the remote HEAD and shallow-clones
  only when there are changes. There is no need to create a recipe tarball manually.
  The default repository is public, so it can be fetched unauthenticated. If it is private, a git credential helper or SSH key is required
- testing / unstable are not bundled. Fetch all channels with `zpkg sync`, then
  switch with `zpkg channel testing`
  (see [Release channels](/en/docs/channels/))

> The old layout (2026-11-17) was 2.1 GiB / 86 packages. After the move to a minimal
> base and the addition of eudev / tzdata / inetutils / procps, PAM, and git, the
> current manifest is r21 with 64 packages / about 1.1 GiB. The previous
> 2026.11.19-alpha / r12 was 54 packages / 977 MiB.

## Distribution

- stage3 is available from the [Download page](/en/download/) and GitHub Releases
- Developers can also generate it with `make-stage3.sh`. For the actual file names
  and SHA-256, see the release manifest (`/releases.json`,
  [specification](/en/docs/release-manifest/))
- Within GitHub Releases' 2 GiB per-file limit (currently 1.1 GiB)

## Build

On the build VM (with `$ZIGNOS_ROOT` mounted):

```sh
sudo OUT=/var/tmp/zignos-stage3.tar.xz ./make-stage3.sh
sha256sum /var/tmp/zignos-stage3.tar.xz > /var/tmp/zignos-stage3.tar.xz.sha256
```

`make-stage3.sh` copies `$ZIGNOS_ROOT`, removes with `zpkg remove` the packages
(the tools) that are not in the **dependency closure of base.list** (computed with
`zpkg depends` inside the chroot) as well as linux/grub, and then freezes it. The
DB and the contents end up matching.

## Quick start

For details (partitioning, chroot, UEFI GRUB/efibootmgr, initial setup), see
**[Installation on real hardware](/en/docs/install/)**. The essentials only:

```sh
# 1. Prepare the disk (UEFI: GPT + ESP / BIOS: MBR)
# 2. Unpack
tar -xpf zignos-stage3.tar.xz -C /mnt/zignos

# 3. chroot (on UEFI, rbind /sys to expose efivarfs)
mount --rbind /dev /mnt/zignos/dev
mount -t proc proc /mnt/zignos/proc
mount --rbind /sys /mnt/zignos/sys
chroot /mnt/zignos /bin/bash -l

# 4. root password (unlock)
passwd

# 5. Kernel and GRUB
#    UEFI: zpkg use --package grub uefi && zpkg install linux grub
#    BIOS: zpkg use --package grub bios && zpkg install linux grub

# 6. Register GRUB on UEFI (efibootmgr comes in as a dependency of the uefi USE flag)
grub-install --target=x86_64-efi --efi-directory=/boot/efi \
  --bootloader-id=ZIGNOS --recheck
grub-mkconfig -o /boot/grub/grub.cfg
efibootmgr -v
```

## Caveats

- root is **locked**. Set a password with `passwd` after chroot
- `/etc/resolv.conf` is the one from build time. Overwrite it to match your network environment
- stage3 is **usr-merged** (`/bin`, `/sbin`, `/lib` are symlinks to `/usr`)
- `zignos-enter.sh` is not included in the tarball. Get it from the developer repository,
  or mount manually and chroot as above
- **If you use the build sandbox, `zignos-enter.sh` is recommended.** Because it
  bind-mounts root inside a private mount namespace and then chroots, bubblewrap's
  `pivot_root` works. With a plain `chroot`, `zpkg` warns and disables the
  sandbox
- **On UEFI, rbind `/sys`.** If efivarfs is not visible from the chroot,
  `efibootmgr` cannot read or write NVRAM
- `zpkg install linux` downloads the source and builds it on the first run
  (a few to a dozen-plus minutes. If a binpkg repository is configured, it uses that)
- When installing on UEFI, create the ESP and mount it at
  `/mnt/zignos/boot/efi` before unpacking stage3

## Differences between stage3, seed, and images

| Form | Contents | Purpose |
|---|---|---|
| **stage3** (this document) | dependency closure of base.list − linux/grub (64 in current r21) | Default installation on real hardware. Unpack, chroot, and finish it yourself |
| **seed** (`make-seed.sh`) | A running full system | For developers to duplicate and extend an existing system |
| **image** (`make-image.sh`) | A bootable finished disk image (BIOS/UEFI) | dd it and boot immediately |
| **installer** (`zignos-install`) | Copies the running system to another disk | Boot from USB and install to the internal disk |
