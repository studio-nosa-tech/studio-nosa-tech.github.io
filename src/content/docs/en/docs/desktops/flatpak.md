---
title: Flatpak
description: Running Flatpak apps on ZIGNOS. Installation, adding Flathub, and desktop integration through xdg-desktop-portal.
---

ZIGNOS officially supports **Flatpak**. Flathub apps can run sandboxed in a
KDE Plasma 6 Wayland session. File selection and screen sharing integrate with
the host Plasma through **xdg-desktop-portal** and the KDE backend.

## How it works

Flatpak installs apps into a sandbox together with their own runtime. On ZIGNOS
it works with the following components.

- **flatpak** — the main program. Uses bubblewrap, xdg-dbus-proxy and fusermount3
- **ostree / appstream / gpgme** — repository fetching, metadata and signature verification
- **xdg-desktop-portal** — the frontend connecting apps and the desktop
- **xdg-desktop-portal-kde** — the Plasma-side backend (file selection, screen sharing, printing and so on)
- **Flatpak system helper** — the D-Bus service handling system-wide installs

ZIGNOS does not use systemd. Portals start through **D-Bus activation**, not
systemd user units. Also, `fuse` is built into the kernel (`CONFIG_FUSE_FS=y`),
so `/dev/fuse` exists from boot.

## Installing the packages

```sh
zpkg install flatpak xdg-desktop-portal xdg-desktop-portal-kde
```

The system helper runs as root and performs auxiliary work such as revokefs as
the `flatpak` user (UID/GID 622). This account is created by `initscripts`, so
update it first on older systems.

```sh
zpkg install -f initscripts
```

## Adding Flathub

```sh
flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
```

With `--user` the remote is registered per user; without it, system-wide.
System-wide registration and installation go through polkit, and local users in
the `wheel` group can do it without additional authentication.

```sh
flatpak remotes
```

## Installing and running apps

```sh
flatpak install flathub org.mozilla.firefox
flatpak run org.mozilla.firefox
```

To list installed apps and update them:

```sh
flatpak list
flatpak update
flatpak uninstall org.mozilla.firefox
```

From the desktop environment, apps can also be launched from the entries added
to the app list.

## Portals and desktop integration

Flatpak apps do not access host files or the screen directly; they request them
through portals. In a Plasma session, `xdg-desktop-portal-kde` handles this.

| Feature | Backend |
|---|---|
| File selection and saving | xdg-desktop-portal-kde (KIO) |
| Screen sharing and screencasting | xdg-desktop-portal-kde + KWin ScreenCast + PipeWire |
| Printing | xdg-desktop-portal-kde + CUPS |
| Notifications, settings, opening URLs | xdg-desktop-portal |

Screen sharing uses KWin's ScreenCast feature and PipeWire. ZIGNOS's KWin is
built with PipeWire support, so windows and monitors can be streamed to Flatpak
apps.

Portal state can be checked with `flatpak permissions`.

```sh
flatpak permissions
```

## Storage locations

| Location | Content |
|---|---|
| `/var/lib/flatpak` | System-wide apps and runtimes |
| `/var/cache/flatpak` | System-wide cache |
| `~/.local/share/flatpak` | Per-user apps and runtimes |

The system directories are owned by root. `flatpak repair` can check for
inconsistencies.

## Troubleshooting

### Apps do not start

If sandbox creation is failing, check bubblewrap and user namespaces.

```sh
bwrap --ro-bind / / --dev /dev --proc /proc --unshare-user true && echo ok
```

If `ok` is printed, sandboxes can be created in an unprivileged user namespace.

### File selection or screen sharing does not work

Check that the portal can be started from D-Bus. Run this in a terminal in the
Plasma session. If `(1,)` or `(2,)` is returned, the service is registered and
started.

```sh
gdbus call --session \
  --dest org.freedesktop.DBus \
  --object-path /org/freedesktop/DBus \
  --method org.freedesktop.DBus.StartServiceByName \
  org.freedesktop.portal.Desktop 0
```

The KDE backend can be checked the same way.

```sh
gdbus call --session \
  --dest org.freedesktop.DBus \
  --object-path /org/freedesktop/DBus \
  --method org.freedesktop.DBus.StartServiceByName \
  org.freedesktop.impl.portal.desktop.kde 0
```

Check that `xdg-desktop-portal` and `xdg-desktop-portal-kde` are installed and
that the `dbus` service is running.

### System-wide installation is refused

Outside a local session, such as over SSH, polkit authentication is required.
Run it from a Plasma terminal as a user in the `wheel` group, or install as
root.

```sh
doas flatpak install flathub org.mozilla.firefox
```
