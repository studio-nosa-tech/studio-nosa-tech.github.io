---
title: Desktop
description: The ZIGNOS desktop environment. The role and installation of KDE Plasma 6 (Wayland).
---

The standard ZIGNOS desktop is **KDE Plasma 6 (Wayland)**. The tiling
**Tessa** compositor (Zig + wlroots) is also available as an official package.
stage3 is a minimal CLI base, so the desktop is added optionally from recipes
in `desktop/`.

## Policy

- Separate Plasma itself and KDE apps into different metapackages
  - `plasma-meta` — the session itself
  - `kde-applications` — Konsole / Dolphin / Kate / Ark / Gwenview / Okular / Spectacle and so on
- Stay on OpenRC and create the session with PAM / elogind / polkit
- Login is SDDM (all channels), or Plasma Login Manager (Testing / Unstable)
- Japanese display uses Noto CJK / Noto Emoji and IPAex fonts; Japanese input uses fcitx5 + mozc
- Supports Flatpak and xdg-desktop-portal (KDE backend)
- The tiling **Tessa** compositor (Zig + wlroots + scenefx) is also official;
  install it with `zpkg install tessa`

## Installation

Set `VIDEO_CARDS` first to match the machine's GPU. For Intel Gen8 and later,
`zpkg video-cards iris`; for QEMU, `zpkg video-cards virgl`. The compatibility
table is in "10. Desktop and VIDEO_CARDS" in the
[installation guide](/en/docs/install/).

```sh
zpkg video-cards iris
zpkg install plasma-meta kde-applications
rc-update add sddm default
```

See [KDE Plasma 6](/en/docs/system/desktop/) for the required services and caveats.

## Japanese fonts and input

Fonts and input methods are installed separately.

```sh
zpkg install fonts-noto-cjk fonts-noto-emoji
zpkg install fcitx5 fcitx5-qt fcitx5-gtk fcitx5-configtool
```

`fcitx5-gtk` provides the GLib client (GClient) and the IM module for GTK 3.
It does not include modules for GTK 2 / GTK 4.

`fonts-noto` (the regular Noto family) and `fonts-noto-extra` (Condensed / Semi /
Extra weights) are also available. Both include all upstream Noto families, so
the installed size is large.

mozc requires the `fcitx5` USE flag. Set the flag before installing. Without
it, the mozc build intentionally fails.

```sh
echo 'mozc fcitx5' >> /etc/zpkg/package.use
zpkg install mozc
```

`mozc` builds the fcitx/mozc fork with Bazel and installs the fcitx5 addon
(`fcitx5-mozc.so`) and `/usr/lib/mozc/mozc_server`. The first build includes
fetching Bazel and the dependency modules, so it takes time and disk space.

After installing, start fcitx5 and add Mozc with `fcitx5-configtool`.

```sh
fcitx5 -d
fcitx5-configtool
```

Detailed steps including the environment variables (`/etc/environment`) are in
[Japanese input (fcitx5 + Mozc)](/en/docs/desktops/japanese/).

## Pages

- [KDE Plasma 6](/en/docs/system/desktop/) — installation, login, services
- [Wayland and Xwayland](/en/docs/desktops/wayland/) — session, X11 apps, GLX
- [Japanese input (fcitx5 + Mozc)](/en/docs/desktops/japanese/) — installation, environment variables, Mozc configuration
- [Flatpak](/en/docs/desktops/flatpak/) — Flathub, portal integration, troubleshooting
- [Tessa](/en/docs/desktops/tessa/) — installation, starting from SDDM, initial configuration and links to the Tessa website
- [Desktop environment (details)](/en/docs/desktop/) — channel layout and implementation status

KDE Plasma 6 is the standard, and the tiling Tessa compositor is also provided
as an official package.
