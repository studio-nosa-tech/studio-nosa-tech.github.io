---
title: Installation FAQ
description: Common questions about installing ZIGNOS, covering stage3, SystemRescue, Secure Boot, WiFi and the root password.
---

## Is there a ZIGNOS installer ISO?

Not currently. No ZIGNOS live ISO is distributed; the default method is to
**boot SystemRescue, unpack the stage3 tarball and chroot into it**. The steps
are in the [installation guide](/en/docs/install/).

## Where do I get the stage3 tarball?

It is currently available from [Download](/en/download/) (GitHub Releases).
Developers can also generate it with `zignos-build/make-stage3.sh`. The file
name, size and SHA-256 are recorded in [Current release](/en/releases/current/)
and `/releases.json`.

## Can I install with Secure Boot enabled?

No. GRUB and the kernel are unsigned, so disable Secure Boot in the firmware
settings.

## Can I install on either BIOS or UEFI?

Yes. UEFI uses GPT + ESP (FAT32), and BIOS uses MBR. See the tables in the
[installation guide](/en/docs/install/) for the disk layout.

## I do not know the root password

The stage3 root is locked. Enter the chroot and set a password with `passwd`.
If you cannot log in after installation, mount the root partition from
SystemRescue, `chroot` into it and run `passwd`.

## WiFi does not work

WiFi requires firmware and `wpa_supplicant`. With NetworkManager,
`zpkg install networkmanager-wifi` installs them together. For wired only,
`zpkg install networkmanager` alone is fine. See the WiFi section of the
[installation guide](/en/docs/install/) for details.

## The GRUB menu does not appear at boot

On UEFI, GRUB must be at `/EFI/BOOT/BOOTX64.EFI` on the ESP; on BIOS, in the
disk's MBR. Check the `grub-install` target and `/boot/vmlinuz-...` in
`grub.cfg`. If a UEFI NVRAM entry is needed, use `efibootmgr`.

## No network connection after installation

Check the NIC with `ip addr`, and if using DHCP, enable `dhcpcd`. With
NetworkManager, run `rc-update add networkmanager default` and connect with
`nmcli` or `nmtui`.
