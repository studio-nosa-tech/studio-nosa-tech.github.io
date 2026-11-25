---
title: Build sandbox
description: ZIGNOS build sandbox with bubblewrap, covering a read-only root, tmpfs, capability limits and network isolation.
---

ZIGNOS recipes build with shell scripts. That is flexible, but a build script
can run arbitrary commands, so a malicious or buggy recipe can modify system
files and user data.

On Linux, `zpkg` uses **bubblewrap (`bwrap`)** to run build scripts inside a
sandbox. bubblewrap is included in the base.

## What is isolated

| Area | Details |
|---|---|
| File system | `/` is read-only. Only `$ZPKG_CACHE/build/<pkg>` is writable |
| Scratch space | `/tmp` / `/run` / `/var/tmp` / `/var/lib` / `/var/log` / `/var/spool` are empty tmpfs |
| User data | `/root` / `/home` / `/mnt` / `/media` / `/srv` are empty tmpfs |
| Sensitive configuration | `/etc/ssh` / `/etc/ssl/private` / `/etc/zpkg` and WiFi connection settings are masked. `/etc/shadow` and similar are `/dev/null` |
| Processes | PID / IPC / UTS namespaces. The hostname is `zignos-build` |
| Capabilities | Only `CAP_CHOWN` / `CAP_FOWNER` / `CAP_DAC_OVERRIDE` / `CAP_FSETID` / `CAP_SYS_CHROOT`. No `CAP_SYS_ADMIN` |
| Environment variables | An allowlist. Host secrets and compiler settings are not inherited (proxy variables are the only exception) |
| Network | Allowed by default. `BUILD_NET=0` isolates it in a network namespace |

`doas` / `sudo` chown, setuid bits and the chroot in `zignos-mkinitramfs`
still work inside the sandbox.

## Modes

```sh
ZPKG_SANDBOX=auto      # default: isolate when bwrap is available, otherwise warn and build directly
ZPKG_SANDBOX=require   # fail when bwrap is missing or unusable
ZPKG_SANDBOX=off       # no sandbox
```

These can also go in `/etc/zpkg/sandbox.conf`.

```ini
SANDBOX=auto
BUILD_NET=1
#BWRAP=/usr/bin/bwrap
```

To disable it temporarily:

```sh
zpkg build --no-sandbox <pkg>
zpkg install --no-sandbox <pkg>
```

With `auto`, if bwrap is not found or a sandbox cannot be created in this
environment, zpkg warns and builds directly as before. `require` makes it
fail.

## Network

Network access during builds is **allowed by default**. If reproducibility and
safety matter more, it can be denied globally.

```sh
ZPKG_BUILD_NET=0 zpkg install <pkg>
```

Or `BUILD_NET=0` in `/etc/zpkg/sandbox.conf`.

Recipes that need the network allow it individually with a `build_network`
file.

```text
# recipes/main/age/build_network
1
```

Conversely, even when the global setting allows the network, `build_network 0`
denies it for that recipe alone. `age` / `fzf` / `restic` fetch Go modules and
therefore set `1` explicitly.

## chroot and stage3

bubblewrap's `pivot_root` requires the chroot target to be a mount point. If
you enter a directory that is merely an unpacked stage3 with a plain `chroot`,
bwrap cannot create a sandbox.

`zignos-enter.sh` creates a private mount namespace and bind mounts the root
before chrooting, so the sandbox works even with a stage3 directory chroot.

```sh
./zignos-enter.sh /mnt/zignos
```

With a plain `chroot`, `auto` warns and falls back to a direct build. `require`
makes it an error.

## Recording the build environment

For source builds, zpkg records the set of packages installed at that moment
(the sorted sha256 of `name@slot-version` entries plus the count).

```sh
zpkg info <pkg>
# build: bwrap, network on, env 69 packages (....)
```

What the sandbox sees is the entire installed system (read-only), not a
minimal root containing only makedepends. A minimal dependency root is future
work.

## bootstrap

bootstrap stage2 runs with `ZPKG_SANDBOX=off`, because bubblewrap is not
installed yet. Once the base is built, bubblewrap is present and subsequent
`zpkg install` runs use the sandbox.

## Limitations

- `post_install` / `post_remove` hooks are outside the sandbox
  (a domain trusted through recipe signatures)
- Unpacking source tarballs happens before the build and is outside the
  sandbox
- CPU / memory / disk resource limits are not implemented
- The sandbox is bubblewrap only (no custom unshare/chroot implementation)
