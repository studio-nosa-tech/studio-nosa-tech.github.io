---
title: Wayland and Xwayland
description: The relationship between the ZIGNOS Plasma session, KWin, Xwayland and PAM / elogind.
---

## Session layout

The ZIGNOS Plasma is a **Wayland session**. PAM and elogind support it from
login to screen locking.

```
dbus → elogind → polkit → upower → display-manager
                                      ↓
                              startplasma-wayland
                                      ↓
                              KWin (DRM / Wayland)
                                      ↓
                              Xwayland (for X11 apps)
```

KWin 6 depends on the logind API and does not use seatd / libseat. **elogind is
required** on OpenRC. PAM is needed for login and screen locking, and since M44
`linux-pam` is in `core`.

## Xwayland

X11-only apps run through Xwayland. ZIGNOS enables Xwayland GLX and has
confirmed GLX 1.4. Xwayland uses `xkbcomp` to generate keymaps, so that is
included in the dependencies.

## Graphics

- Mesa is stable 26.2.7 / testing / unstable 26.3.1
- On QEMU, the Plasma panel / desktop were confirmed with `virtio-gpu` + `kms_swrast`
- Visual confirmation of Plasma / SDDM / PLM on real GPUs is ongoing
- There is a known issue where KWin crashes on transparent greeter compositing with QEMU's Mesa softpipe

## Login

- SDDM 0.21 — all channels
- Plasma Login Manager 6.8.3 — Testing / Unstable

Do not enable both at the same time. See [KDE Plasma 6](/en/docs/system/desktop/)
for VT handling and the tty1 getty.

Design details are in [Desktop environment](/en/docs/desktop/).
