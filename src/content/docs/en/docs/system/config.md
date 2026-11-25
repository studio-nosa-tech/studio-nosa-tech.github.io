---
title: Configuration file locations
description: List of ZIGNOS system and zpkg configuration files.
---

## zpkg configuration

Everything is in `/etc/zpkg/`.

| File | Purpose |
|---|---|
| `make.conf` | Build defaults such as `CHANNEL`, `CFLAGS`, `MAKEOPTS` |
| `use.conf` | Global USE flags |
| `package.use` | Per-package USE flags |
| `binrepo.conf` | binpkg repositories |
| `sync.conf` | Recipe tree sync source (git / tarball / URL) |
| `security.conf` | Trusted keys and signature settings |
| `sandbox.conf` | bubblewrap build sandbox mode |
| `build.conf` | Reproducible build, log and cache retention settings |

Trusted public keys go in `/etc/zpkg/trusted.d/`.

## System configuration

| File | Purpose |
|---|---|
| `/etc/fstab` | Mount configuration. Use UUIDs |
| `/etc/rc.conf` | Global OpenRC settings |
| `/etc/conf.d/<service>` | Per-service configuration |
| `/etc/os-release` | Distribution information |
| `/etc/passwd`, `/etc/shadow`, `/etc/group` | Accounts |
| `/etc/pam.d/` | PAM configuration |
| `/etc/NetworkManager/` | NetworkManager configuration |

## Data and cache

| Location | Contents |
|---|---|
| `/var/lib/zpkg/` | Installed database, world, manifest, provenance, SBOM |
| `/var/cache/zpkg/` | Sources, binpkgs, build logs |
| `/usr/share/zignos/recipes/` | Bundled recipe tree |

## Editing basics

- Back up before changing configuration
- Service configuration goes in `/etc/conf.d/`; boot settings use `rc-update`
- `CHANNEL` in `make.conf` can also be changed with `zpkg channel`
- After changing build flags, rebuild with `zpkg upgrade --newuse`

See [zpkg configuration](/en/docs/zpkg-config/) for the meaning of each
setting.
