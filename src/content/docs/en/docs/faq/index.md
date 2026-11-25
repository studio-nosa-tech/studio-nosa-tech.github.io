---
title: FAQ
description: Frequently asked questions about ZIGNOS, covering installation, filesystems, features, community and limitations.
---

Frequently asked questions about ZIGNOS. Entry points by topic:

| Topic | Page |
|---|---|
| Installation problems | [Installation FAQ](/en/docs/faq/install/) |
| Disks and filesystems | [Filesystems](/en/docs/faq/filesystems/) |
| What it can do | [ZIGNOS features](/en/docs/faq/features/) |
| General questions | [General FAQ](/en/docs/faq/general/) |
| Public channels and how to join | [Community](/en/docs/faq/community/) |
| Current limitations | [Limitations](/en/docs/faq/limitations/) |

## Basics

### What is ZIGNOS?

It is a source-based Linux distribution built from scratch. It uses its own
package manager **zpkg** and OpenRC, and you complete the system yourself
starting from stage3.

### Can I use a GUI?

stage3 is CLI only. However, all channels have recipes for KDE Plasma 6
(Wayland), and you can add it with
`zpkg install plasma-meta kde-applications`.

### How do I update?

Update the recipes with `zpkg sync`, review the differences with
`zpkg upgrade -p`, then run `zpkg upgrade`. See
[Channels and upgrades](/en/docs/system/channels/) for details.

### Is Secure Boot supported?

No. GRUB and the kernel are unsigned, so disable Secure Boot before use.

### Which architectures are supported?

x86_64 only. It boots on both BIOS and UEFI.
