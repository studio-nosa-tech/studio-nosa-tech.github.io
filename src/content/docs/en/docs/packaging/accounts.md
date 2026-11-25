---
title: System accounts
description: How to add base accounts, groups and service users in ZIGNOS.
---

## Base accounts

`/etc/passwd` and `/etc/group` belong to the administrator. If a package
replaces the files wholesale, users added later disappear.

In ZIGNOS, **initscripts** owns the base accounts.

- Templates: `/usr/share/zignos/base-accounts/passwd`, `group`
- `post_install` appends only the missing entries
- Existing users and groups are not modified

The base includes root, sshd, nobody, messagebus, tty, utmp, wheel, video,
render, input, audio, shadow and others.

## Groups

| Group | Purpose |
|---|---|
| `wheel` | Administrative users (`doas` / `sudo`) |
| `video` | GPU / DRM |
| `render` | GPU rendering |
| `input` | Input devices |
| `audio` | Audio |
| `shadow` | Limited read access to `/etc/shadow` |

Add desktop users to `video` / `render`.

## Service users

When a service needs a dedicated user, create it in the package's
`post_install`. If it already exists, it is not modified.

```sh
getent group foo >/dev/null || groupadd -r foo
getent passwd foo >/dev/null || \
  useradd -r -g foo -d /dev/null -s /usr/bin/false -c "Foo Daemon" foo
install -d -m700 -o foo -g foo "$ZPKG_ROOT/var/lib/foo"
```

Typical examples:

| User | Purpose |
|---|---|
| `messagebus` | D-Bus |
| `polkitd` | polkit |
| `chrony` | Time synchronization |
| `sddm` | SDDM greeter |
| `plasmalogin` | Plasma Login Manager |

## Notes

- `useradd` / `groupadd` edit the account files of the target root. For cross
  installs, check how `ZPKG_ROOT` and chroot are handled
- Do not bundle `/etc/passwd` in a package
- zpkg does not preserve ownership, so `chown` in `post_install`
- Do not delete or rename existing users

See [System design](/en/docs/design-system/) for design details.
