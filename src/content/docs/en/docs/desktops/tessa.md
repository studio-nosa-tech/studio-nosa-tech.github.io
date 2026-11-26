---
title: Tessa (tiling Wayland compositor)
description: Install Tessa on ZIGNOS and start it from SDDM. See the Tessa website for detailed configuration.
---

**Tessa** is a tiling Wayland compositor and desktop shell written in Zig on
top of wlroots. It is available as the `tessa` package in the official ZIGNOS
repository. It combines the panel, launcher, workspaces, tiling layouts and
window effects (rounded corners, blur and shadows via scenefx) in one
repository, so Waybar and Rofi are not required.

Both Tessa and ZIGNOS are developed by
[Studio NØSa.](https://studio-nosa.live/).

## Installation

```sh
zpkg install tessa
```

`tessa` uses `zig` / `wlroots` / `scenefx` / `libseat` at build time, and
needs `wayland` / `libinput` / `libxkbcommon` / `mesa` / `pango` / `cairo` /
`gdk-pixbuf` / `xcursor-themes` / `dbus` at runtime. Dependencies are
installed automatically.

- The first build fetches Zig's build dependency (`translate_c`), so it needs
  network access and a few minutes
- `zig` is only needed for the build, not to run Tessa
- Tessa is built with scenefx, so rounded corners, blur and shadows are
  available

## Starting

Select **Tessa** in the SDDM session menu
(`/usr/share/wayland-sessions/tessa.desktop`). To try it directly from a TTY:

```sh
tessa
```

ZIGNOS has no systemd user manager, so `tessa-session` starts a private D-Bus
session with `dbus-run-session` before running Tessa. The panel's
notifications, media and tray use that bus. To start from a TTY with D-Bus:

```sh
tessa-session
```

Quit with `Super+Shift+E`.

## Initial configuration

The compositor configuration is `~/.config/tessa/config`; the panel reads
`panel.conf` in the same directory. Copy the examples and edit them:

```sh
mkdir -p ~/.config/tessa
cp /usr/share/tessa/config.example ~/.config/tessa/config
cp /usr/share/tessa/panel.example ~/.config/tessa/panel.conf
```

Saving the file reloads it automatically. The main settings are:

| Key | Description |
|---|---|
| `terminal` | Terminal launched from the launcher and keybindings. The default is `kitty`; on ZIGNOS change it to an installed terminal such as `konsole` |
| `layout` | `master` / `mosaic` / `grid` / `columns` / `scrolling` / `monocle` / `stacking` |
| `gaps` / `outer_gaps` | Gaps between windows and at the screen edges |
| `border_width` | Window border width |
| `window-rule` | Per app-id / title / output rules for floating, workspace, opacity, corner radius, blur and more |

Validate the configuration with `tessa --check-config`. `Super+T` cycles the
layout.

## Detailed configuration

**For detailed configuration, see the Tessa website.** It covers keybindings,
window rules, layout details, IPC, themes and extensions.

- [Tessa website (English)](https://keychrom.github.io/)
- [Tessa website (Japanese)](https://keychrom.github.io/ja/)

## X11 applications and screen sharing

Tessa starts X11 applications through `xwayland-satellite`, available from the
official ZIGNOS repository.

```sh
zpkg install xwayland-satellite
```

Tessa finds `xwayland-satellite` in PATH automatically; `TESSA_XWAYLAND_BIN`
can point to an absolute path.

Screen sharing is provided by `xdg-desktop-portal-wlr`.

```sh
zpkg install xdg-desktop-portal-wlr
```

The Tessa session registers `WAYLAND_DISPLAY` in the D-Bus activation
environment after startup, so the portal can connect to Tessa. `tessa.portal`
is selected for `XDG_CURRENT_DESKTOP=Tessa`.

## Notes

- Without a terminal installed, Tessa's launcher cannot start terminal
  applications. Install `konsole` or another terminal and set `terminal`
