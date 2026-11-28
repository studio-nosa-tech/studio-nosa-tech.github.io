---
title: ZIGNOS MENU (overlays)
description: Adding, updating and removing extra recipe repositories with ZIGNOS MENU and zpkg overlay — priority, channels and signing.
---

The official ZIGNOS tree ships the base system and common applications only.
**ZIGNOS MENU** is the official overlay for additional packages that do not
belong in that tree. It works like a Gentoo overlay, and `zpkg overlay` lets
anyone layer their own repository on top.

## Adding ZIGNOS MENU

```sh
sudo zpkg overlay add zignos-menu
zpkg overlay list
```

The official URL is built into `zpkg`, so the name is enough. ZIGNOS MENU is
currently unsigned, so `ALLOW_UNSIGNED=1` is recorded in its configuration.

```
NAME             PRIORITY ACTIVE   CHANNELS   STATUS   PACKAGES URL
zignos-menu (ZIGNOS MENU) 10       yes      all        synced   0        unsigned https://github.com/studio-nosa-tech/zignos-menu.git
```

Search and install work exactly as with the official tree. `zpkg search` and
`zpkg info` label the repository as `zignos-menu/apps`.

```sh
zpkg search <term>
sudo zpkg install <pkg>
```

Updating and removing:

```sh
sudo zpkg overlay sync                  # update every overlay
sudo zpkg overlay sync zignos-menu      # update one
sudo zpkg overlay remove zignos-menu    # drop the configuration and tree
```

`overlay remove` does not remove installed packages. A package whose recipe
disappears stays installed and still participates in dependency resolution as
an installed-only candidate; `zpkg upgrade` warns that the overlay is not
active and does not rebuild it. To rebuild, add the overlay again or remove
the package with `sudo zpkg remove <pkg>`.

## How it works

The configuration lives in `/etc/zpkg/overlays.d/<name>.conf` and the synced
tree in `$ZPKG_ROOT/var/lib/zpkg/overlays/<name>`.

```ini
# /etc/zpkg/overlays.d/zignos-menu.conf
URL=https://github.com/studio-nosa-tech/zignos-menu.git
BRANCH=main
PRIORITY=10
ALLOW_UNSIGNED=1
ENABLED=1
```

- Active overlays are searched **before the official tree**. For a package key
  (`name@slot`) the first repository wins and all of its versions become
  candidates, so an overlay can override an official recipe.
- A **larger** `PRIORITY` wins (default 10). When several overlays provide the
  same package, only the highest-priority one is used.
- The tree's `overlay.conf` declares the category directories with
  `CATEGORIES=`. ZIGNOS MENU uses `apps`, `games` and `tools`. Without
  `CATEGORIES=` the tree root itself is the recipe repository.
- `CHANNELS=` limits the overlay to some release channels
  (for example `CHANNELS=testing unstable`). Empty means every channel.
- Installed packages record the overlay in `meta.json` and provenance, so the
  origin keeps displaying as `zignos-menu/apps` after the overlay is removed.

## Adding your own overlay

A git repository, a tarball URL or a local directory all work.

```sh
sudo zpkg overlay add myoverlay https://github.com/<user>/<repo>.git
sudo zpkg overlay add local-overlay /path/to/tree --allow-unsigned
sudo zpkg overlay add experimental https://example.com/overlay.tar.xz \
  --branch main --priority 20 --allow-unsigned
```

| Option | Meaning |
|---|---|
| `--branch <name>` | git branch (default `main`) |
| `--priority <n>` | priority (default 10; larger wins) |
| `--allow-unsigned` | accept a tree without a signature (development) |
| `--no-sync` | write the configuration without fetching the tree |

`zpkg overlay remove <name> --keep-tree` removes only the configuration and
keeps the synced tree. `zpkg overlay sync` compares the remote git commit and
does nothing when the tree is already current.

## Signing

Overlays use the same `recipes.manifest` / `recipes.manifest.sig` verification
as the official tree. Signatures are checked against trusted keys in
`/etc/zpkg/trusted.d`, and generation rollbacks are rejected per overlay through
`overlay:<name>` in `$ZPKG_DB/.security.json`.

```sh
# overlay author
zpkg sign-recipes --key ~/overlay-signing.key --generation 1 /path/to/overlay
git add recipes.manifest recipes.manifest.sig
```

A present but invalid signature is rejected even with `--allow-unsigned`.
The official ZIGNOS MENU stays unsigned until its key is in operation, and
`overlay add zignos-menu` records `ALLOW_UNSIGNED=1`; once it is signed, normal
verification applies. See [Signing and verification](/en/docs/signing/).

## Adding packages to ZIGNOS MENU

Put a normal recipe under `apps/`, `games/` or `tools/` in
[zignos-menu](https://github.com/studio-nosa-tech/zignos-menu) and open a pull
request.

```
zignos-menu/
├── overlay.conf      # NAME / CATEGORIES / CHANNELS
├── apps/<pkg>/{version, sources, checksums, depends, build}
├── games/<pkg>/...
└── tools/<pkg>/...
```

See [Recipes](/en/docs/packaging/recipes/) and
[Build patterns](/en/docs/packaging/patterns/) for the format. Recipes that
work on stable, testing and unstable are welcome. Use `CHANNELS=` in
`overlay.conf` to provide a package on specific channels only.

## Limitations

- When several overlays provide the same package key, priority picks one. Use
  different slots to keep both.
- A package stays installed after its overlay is removed but cannot be rebuilt
  until the recipe is available again.
- The official ZIGNOS MENU is currently unsigned.
