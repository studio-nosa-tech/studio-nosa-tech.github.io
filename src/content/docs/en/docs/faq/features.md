---
title: ZIGNOS features
description: Source-based builds, zpkg, OpenRC, three channels, KDE Plasma 6 and verification features in ZIGNOS.
---

## Source-based

Packages are built from shell script recipes. Binaries are cached and can be
rebuilt from the same recipe and the same inputs. Recipes are published in
[zignos-recipes](https://github.com/studio-nosa-tech/zignos-recipes).

## zpkg

A package manager written in Go.

- USE flags and slots
- world and dependency resolution (version constraints / provides /
  conflicts / reverse dependencies)
- binpkg cache and binpkg repositories
- Ed25519 signing, rollback and expiry protection
- build sandbox with bubblewrap
- transactions and `zpkg recover`
- build logs, provenance and SPDX SBOM
- git synchronization of the recipe tree with `zpkg sync`

## OpenRC

init is OpenRC. The base enables only udev and the console; DHCP, SSH,
NetworkManager, the desktop and so on are opt-in. Enable them yourself with
`rc-update add <service> <runlevel>`.

## Three release channels

Choose `stable`, `testing` or `unstable`. Changes are validated in the order
Unstable → Testing → Stable. See [Release channels](/en/docs/channels/) for
details.

## KDE Plasma 6 (Wayland)

The Plasma 6 stack and KDE applications are provided in `desktop/`.

- `plasma-meta` — KWin / plasma-workspace / systemsettings / NetworkManager /
  PipeWire / UDisks2 and so on
- `kde-applications` — Konsole / Dolphin / Kate / Ark / Gwenview / Okular /
  Spectacle / kio-extras and so on

SDDM is available on all channels; Plasma Login Manager on Testing / Unstable.

## Flatpak

Installing `flatpak`, `xdg-desktop-portal` and `xdg-desktop-portal-kde` lets
you run Flathub applications in a sandbox. The KDE portal handles file
selection, screen sharing and printing. systemd is not required; the portal
starts via D-Bus activation. See [Flatpak](/en/docs/desktops/flatpak/) for
details.

## Firmware and boot

Supports x86_64 BIOS / UEFI. It uses GRUB 2.14, and efibootmgr can also be
installed on UEFI. Secure Boot is not supported.

## Verification and reproducibility

Boot on BIOS / UEFI, PAM login and the Plasma session are verified in QEMU.
Builds fix SOURCE_DATE_EPOCH and record logs, provenance and an SBOM. Real
GPUs and some WiFi devices are still under verification.
