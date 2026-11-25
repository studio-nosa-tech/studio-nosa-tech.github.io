---
title: Japanese input (fcitx5 + Mozc)
description: Steps for installing fcitx5 and Mozc on ZIGNOS and typing Japanese in KDE Plasma 6 (Wayland).
---

Japanese input on ZIGNOS is the **fcitx5 + Mozc** combination. It works from
Qt / GTK / Xwayland apps in a Plasma 6 Wayland session too.

## Installing the packages

```sh
zpkg install fonts-noto-cjk fonts-noto-emoji
zpkg install fcitx5 fcitx5-qt fcitx5-gtk fcitx5-configtool
```

- `fcitx5` — the input method itself
- `fcitx5-qt` — input context plugin for Qt 6 apps
- `fcitx5-gtk` — the GLib client and the IM module for GTK 3
- `fcitx5-configtool` — GUI for configuring input methods
- `fonts-noto-cjk` — font for Japanese display (`ipaex-fonts` also works)

Mozc **requires the `fcitx5` USE flag**. Add it to `package.use` before
installing. Without the flag, the Mozc build intentionally fails.

```sh
echo 'mozc fcitx5' >> /etc/zpkg/package.use
zpkg install mozc
```

Because Mozc builds the fcitx/mozc fork with Bazel, the first build takes time
and disk space. When it finishes, the fcitx5 addon (`fcitx5-mozc.so`),
`mozc_server` and `mozc_tool` are installed.

## Environment variables

To make sure the input method module is loaded, add the following 3 lines to
`/etc/environment`. `/etc/environment` is not a shell script, so do not add
`export` or quotes.

```sh
cat >> /etc/environment <<'EOF'
GTK_IM_MODULE=fcitx5
QT_IM_MODULE=fcitx5
XMODIFIERS=@im=fcitx5
EOF
```

| Variable | Target |
|---|---|
| `GTK_IM_MODULE=fcitx5` | GTK 3 apps |
| `QT_IM_MODULE=fcitx5` | Qt 6 apps |
| `XMODIFIERS=@im=fcitx5` | X11 / Xwayland apps |

PAM's `pam_env` reads these values at login. **Log out → log in** (or a reboot)
is required for them to take effect.

> **On older installations**: if `pam_env` is not in the PAM stack,
> `/etc/environment` is not read. linux-pam r4 and later support it, so update
> first with `zpkg install -f linux-pam` on earlier systems.

To try it only in the current session, set them directly in the terminal and
restart fcitx5.

```sh
export GTK_IM_MODULE=fcitx5
export QT_IM_MODULE=fcitx5
export XMODIFIERS=@im=fcitx5
fcitx5 -d --replace
```

## Configuring the input method

1. After setting the environment variables, log in again
2. Start `fcitx5-configtool`
3. Add **Mozc** on the "Input Method" tab
4. By default, `Ctrl+Space` toggles Japanese input on/off

fcitx5 starts together with Plasma via XDG autostart. If it is not running, add
`fcitx5 -d` under System Settings → Autostart.

Wayland-native apps use the compositor's input method protocol, so they work
without the environment variables above. Electron apps (Chromium-based),
however, must specify `--enable-wayland-ime`. ZIGNOS's Discord (r1 and later)
passes this flag in the launcher. Selecting Fcitx5 under "System Settings →
Input Devices → Virtual Keyboard" in KDE Plasma enables the Wayland input
method protocol.

## Checking it works

```sh
echo "GTK=$GTK_IM_MODULE QT=$QT_IM_MODULE X=$XMODIFIERS"
pgrep -a fcitx5
fcitx5-diagnose
```

Type Japanese in Konsole or Kate, and if `Ctrl+Space` switches to Mozc you are
done. The same check works in GTK 3 apps (e.g. `gtk3-demo`).

## Troubleshooting

- **Mozc does not appear in the input method list** — check that `mozc` was
  built with the `fcitx5` USE flag. If `/usr/lib/fcitx5/fcitx5-mozc.so` is
  missing, reinstall
- **The environment variables are empty** — check that you logged in again after
  editing `/etc/environment`. PAM reads it only at login
- **Only GTK apps cannot convert** — reinstall `fcitx5-gtk` and check that
  `/usr/lib/gtk-3.0/3.0.0/immodules/im-fcitx5.so` exists
- **Only Xwayland apps cannot convert** — `XMODIFIERS` is not in effect. Check
  the 3 lines in `/etc/environment` and log in again
- **Input does not work in Discord** — Discord (r1 and later) starts with
  `--enable-wayland-ime` on Wayland. For older packages, update with
  `zpkg install -f discord`. Also check that Fcitx5 is selected under KDE's
  "Virtual Keyboard"
- **Japanese is not displayed** — install `fonts-noto-cjk` (or `ipaex-fonts`)

Related: [Desktop](/en/docs/desktops/) /
[KDE Plasma 6](/en/docs/system/desktop/) /
[Wayland and Xwayland](/en/docs/desktops/wayland/)
