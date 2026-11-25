---
title: Filesystems
description: How ZIGNOS handles root, ESP, swap and fstab, and the current status of LUKS / LVM / XFS / Btrfs.
---

## Which filesystem is used for root?

The current installation guide assumes **ext4**. Because installation is
manual (unpack stage3 and chroot), another filesystem can technically be
chosen if the kernel and tools support it, but the official procedure and
testing cover ext4.

## Is an ESP required?

It is required for UEFI boot. Format it as **FAT32** and normally aim for
512 MiB (300 MiB minimum; about 1 GiB with multiple kernels). BIOS does not
need an ESP; GRUB is installed on an MBR disk.

## Is swap required?

It is not required. Provide swap when memory is low or you use hibernation.
The [installation guide](/en/docs/install/) describes layouts with and without
swap.

## How should fstab be written?

Use UUIDs. Check the UUIDs of root / ESP / swap with `blkid` and write them to
`/etc/fstab`. stage3 includes `zignos-fstab`, which generates a template from
the mounted root. A wrong UUID makes `/` boot read-only, so verify before the
first boot.

## Can I use LUKS or TPM?

**Not supported** at present. The official installation procedure assumes no
encryption. Automated LUKS / TPM setup is a future task.

## Can I use LVM / XFS / Btrfs?

The current official guide and testing cover ext4. LVM and XFS / Btrfs are
manual setups. Check whether the stage3 kernel configuration and required
tools are available, and configure them at your own risk. There is no
installer autodetection or conversion.

## Can I try it without erasing a disk?

Using a QEMU virtual disk is the safe option. Development testing also uses
QEMU BIOS / UEFI boot. Before writing to a real disk, always confirm the
target disk with `lsblk`.
