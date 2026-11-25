---
title: Services (OpenRC)
description: Checking, starting and enabling OpenRC services, and the services commonly used on ZIGNOS.
---

ZIGNOS uses OpenRC. Installing a package does not start its service. Enable
what you need with `rc-update`.

## Basic operations

```sh
rc-status                     # Current status
rc-service <name> start       # Start
rc-service <name> stop        # Stop
rc-service <name> restart     # Restart
rc-update add <name> default  # Enable at boot
rc-update del <name> default  # Disable at boot
```

## Enabled in the base

Three services are enabled in stage3.

| Service | Role |
|---|---|
| `udev` | Device management (eudev) |
| `console` | Login on ttyS0 |
| `console-vga` | Login on tty1 |

## Common services

| Service | Package | Purpose |
|---|---|---|
| `dbus` | `dbus` | System bus |
| `elogind` | `elogind` | Session / seat management |
| `polkit` | `polkit` | Privilege authorization |
| `upower` | `upower` | Power management |
| `networkmanager` | `networkmanager` | Networking |
| `sshd` | `openssh` | SSH |
| `sddm` | `plasma-meta` | Graphical login |
| `plasmalogin` | `plasma-meta` (Testing / Unstable) | Plasma Login Manager |

On the desktop, enable `dbus` / `elogind` / `polkit` in the default runlevel;
UPower runs as its own service. Enable **only one** of SDDM and PLM.

## Troubleshooting

```sh
rc-service <name> status
rc-service <name> start
```

If a service does not start, check that its dependencies are installed and
that the configuration file is correct. For kernel logs use `dmesg`; for
per-service logs, look in `/var/log/` or at the boot output.

See [System design](/en/docs/design-system/) for design details and
[Desktop (KDE)](/en/docs/system/desktop/) for the desktop service layout.
