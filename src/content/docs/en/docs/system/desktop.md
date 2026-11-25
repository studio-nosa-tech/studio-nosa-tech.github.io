---
title: Desktop (KDE)
description: Installing KDE Plasma 6 (Wayland) on ZIGNOS and configuring SDDM / Plasma Login Manager.
---

The ZIGNOS desktop is optional. stage3 is CLI only, and KDE Plasma 6 is added
from the recipes in `desktop/`.

## GPU drivers (VIDEO_CARDS)

Choose Mesa's Gallium driver with `VIDEO_CARDS`. Set it before installing
`plasma-meta`.

```sh
# Intel Gen8 and later
zpkg video-cards iris

# QEMU / virtio-gpu
zpkg video-cards virgl
```

For the GPU-to-value table and AMD / NVIDIA examples, see "10. Desktop and
VIDEO_CARDS" in the [installation guide](/en/docs/install/). If you change the
setting afterwards, rebuild Mesa with `zpkg install -f mesa`.

## Installing

```sh
zpkg install plasma-meta kde-applications
```

- `plasma-meta` — the Plasma session itself (KWin / plasma-workspace /
  systemsettings / NetworkManager / PipeWire / UDisks2 and so on)
- `kde-applications` — applications such as Konsole / Dolphin / Kate / Ark /
  Gwenview / Okular / Spectacle / kio-extras

## Login

```sh
# SDDM (all channels)
rc-update add sddm default

# Or Plasma Login Manager (Testing / Unstable)
# rc-update add plasmalogin default
```

Do not enable SDDM and PLM at the same time. If the console getty holds tty1
and SDDM cannot start, free tty1 with `rc-update del console default`.

## Desktop services

```sh
rc-update add dbus default
rc-update add elogind default
rc-update add polkit default
rc-update add upower default
rc-update add networkmanager default
```

PipeWire / WirePlumber start from Plasma's XDG autostart.

## Channels

| Channel | Qt | KF6 | Plasma | Gear |
|---|---|---|---|---|
| stable | 6.8.5 LTS | 6.18 | 6.4.5 | 25.04.3 |
| testing | 6.11.3 | 6.32 | 6.8.3 | 26.08.3 |
| unstable | 6.11.3 | 6.32 | 6.8.3 | 26.11.80 beta |

## Notes

- Visual verification of Plasma / SDDM / PLM on real GPUs is ongoing
- With QEMU's Mesa softpipe there is a known issue where KWin crashes on the
  greeter's transparency compositing
- Japanese display is supported with IPAex fonts, but the UI's Japanese
  translation is not available
- No image with a desktop is distributed. Add it yourself from stage3

See [Desktop environment](/en/docs/desktop/) for the layout and implementation
status.
