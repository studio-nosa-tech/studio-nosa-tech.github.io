---
title: System administration
description: ZIGNOS configuration files, package management, release channels, OpenRC services and desktop management.
---

System administration on ZIGNOS is based on **editing configuration files
directly and managing state with OpenRC and zpkg**. There is no control panel
or automatic configuration tool.

## Key locations

| Item | Location |
|---|---|
| zpkg configuration | `/etc/zpkg/` |
| System configuration | `/etc/` |
| Services | `/etc/init.d/`, `/etc/conf.d/`, `/etc/rc.conf` |
| Package database | `/var/lib/zpkg/` |
| Build cache | `/var/cache/zpkg/` |

## Common operations

```sh
rc-status                     # Service status
rc-service <name> start       # Start
rc-update add <name> default  # Enable at boot
zpkg install <pkg>            # Install a package
zpkg upgrade -p               # Review pending updates
zpkg upgrade                  # Update
```

## Pages

- [Configuration file locations](/en/docs/system/config/)
- [Package management](/en/docs/system/packages/)
- [ZIGNOS MENU (overlays)](/en/docs/system/overlays/)
- [Channels and upgrades](/en/docs/system/channels/)
- [Services (OpenRC)](/en/docs/system/services/)
- [Desktop (KDE)](/en/docs/system/desktop/)

For design background see [System design](/en/docs/design-system/); for zpkg
internals see [zpkg design](/en/docs/design-pkg/).
