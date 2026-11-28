---
title: ZIGNOS overview
description: What ZIGNOS is, the current release, the three channels, the desktop, and the repository layout.
---

ZIGNOS is a **source-based Linux distribution** built from scratch.
Rather than shipping a finished system, it keeps everything from the toolchain
to the base system and the desktop reproducible with recipes and the **zpkg**
package manager.

**ZIGNOS is not based on Gentoo.** It does not use Portage or ebuild; the
toolchain and the minimal base are built with its own bootstrap procedure.
Packages are managed with zpkg and its own recipe tree.

> In this documentation, "ZIGNOS" is short for **ZIGNOS GNU/Linux**.

- init is **OpenRC**. systemd is not used.
- Packages are managed by **zpkg**, with USE flags, slots, binpkgs, signatures and rollback.
- The base is a **minimal CLI system**; desktops are added from `desktop/` as needed.
- Boots on both BIOS and UEFI.
- Developed by [Studio NØSa.](https://studio-nosa.live/)

## Current release

Values from the published manifest. stage3 is available from
[Download](/en/download/) (GitHub Releases).

| Item | Value |
|---|---|
| Release | **{{release}}** |
| stage3 | **{{stage3.revision}}** / {{stage3.package_count}} packages / about {{stage3.size_mib}} MiB |
| zpkg | {{zpkg.version}} |
| Linux kernel | {{kernel.full}} |
| base.list | {{base.top_level}} top-level / {{base.closure}} with dependencies |
| Recipes | {{recipes.total}} (stable + testing + unstable) |

stage3 is a minimal, chrootable base without a kernel or GRUB. After unpacking,
install the kernel and bootloader with `zpkg install linux grub`.

## Three channels

ZIGNOS is a rolling release. Choose one of three channels.

| Channel | Purpose | Main components |
|---|---|---|
| `stable` | Stable, the default | Linux 6.18.65 LTS / Qt 6.8.5 LTS / KF6 6.18 / Plasma 6.4.6 |
| `testing` | Validation for the next stable | Linux 7.3.6 / Qt 6.11.3 / KF6 6.32 / Plasma 6.8.3 |
| `unstable` | Latest development versions | Linux 7.4-rc3 / Gear 26.11.80 beta |

Changes are validated in the order **Unstable → Testing → Stable** and never
flow backwards. Check the differences with `zpkg upgrade -p` before switching.

## Desktop

**KDE Plasma 6 (Wayland)** is available as the first desktop environment.
`plasma-meta` and `kde-applications` are separate, so you can install only what
you need. SDDM is available on all channels; Plasma Login Manager on Testing
and Unstable.

stage3 and the default images remain a minimal CLI base. Add a desktop with the
steps in [Desktop environment](/en/docs/desktop/).

## Repositories

| Repository | Role | Public |
|---|---|---|
| `zignos` | Project documents and roadmap | Yes |
| `zpkg` | The package manager | Yes |
| `zignos-build` | bootstrap, stage3 and image builds | Yes |
| `zignos-recipes` | Recipe trees for stable / testing / unstable | Yes |
| `zignos-menu` | Official ZIGNOS MENU overlay (additional packages) | Yes |
| `studio-nosa-tech.github.io` | This official site | Yes |

## Next

- First time: [Installation](/en/docs/install/)
- Design: [Philosophy](/en/docs/philosophy/) / [System design](/en/docs/design-system/)
- Package management: [zpkg design](/en/docs/design-pkg/) / [zpkg configuration](/en/docs/zpkg-config/)
- Questions: [FAQ](/en/docs/faq/)
