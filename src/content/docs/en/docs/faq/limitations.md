---
title: Limitations
description: Known limitations of ZIGNOS as of 2026.11.24, covering distribution, Secure Boot, encryption, real GPUs and signing.
---

ZIGNOS published its first official release on 2026.11.24. The following are
the known limitations at present.

## Distribution

- stage3 is available from [Download](/en/download/) (GitHub Releases)
- There is no bootable ISO / UEFI image for distribution. The BIOS/MBR desktop
  image for testing is for the developers' QEMU verification
- No public binpkg repository is operated. Packages are built from source

## Security

- **No Secure Boot support**. GRUB and the kernel are unsigned
- The official signing key is not in use yet, and releases are unsigned
- **No LUKS / TPM support**. The official installation procedure uses no
  encryption

## Hardware

- The supported architecture is **x86_64 only**
- Visual verification of Plasma / SDDM / PLM on real GPUs is ongoing. With
  QEMU's Mesa softpipe there is a known issue where KWin crashes on the
  greeter's transparency compositing
- WiFi requires `linux-firmware` and `wpa_supplicant`. Real-hardware
  verification remains for chips other than a few verified ones
- Xwayland GLX is enabled, but verification on real GPUs remains

## Software

- stage3 is CLI only and does not include an editor / SSH / DHCP / WiFi / man
- Japanese UI translation for the desktop is not available (display with
  IPAex fonts is supported)
- systemd is not used. Software that depends on systemd may not work as is
- PipeWire's Bluetooth / RTKit integration is not installed
- SDDM and PLM cannot be enabled at the same time

## Operations

- There is no way to roll back the whole set in one transaction. Installation
  failures are reverted per package
- `zpkg sync` replaces the whole tree. There is no command to update just one
  channel
- Orphan detection is limited to slot 0 packages that were part of a previous
  dependency closure

See the [roadmap](/en/docs/roadmap/) and [news](/en/news/) for the latest
status.
