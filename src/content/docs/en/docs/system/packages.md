---
title: Package management
description: Searching, installing, removing and inspecting packages with zpkg, and how world and binpkg work.
---

## Search and information

```sh
zpkg search networkmanager
zpkg info networkmanager
zpkg owner /usr/bin/nmcli
zpkg depends networkmanager
```

`zpkg depends` lists dependencies in build order. `-r` shows reverse
dependencies.

## Installing

```sh
zpkg install vim
zpkg install --asdeps some-library
zpkg install -p vim            # Check what will be installed
```

`--asdeps` records the package as a dependency without adding it to world. A
normal `install` adds it to world.

## Removing

```sh
zpkg remove vim
```

The removal stops if reverse dependencies exist. To force removal, add `-f`,
but this can break dependencies. `zpkg upgrade --prune` shows dependencies
that are no longer needed.

## Listing and world

```sh
zpkg list
zpkg world
```

`world` is the list of packages you explicitly installed. `zpkg upgrade`
builds its update plan starting from world.

## Updating

```sh
zpkg upgrade -p
zpkg upgrade
```

`zpkg install` installs or reinstalls a package; `zpkg upgrade` applies the
channel differences. See [Channels and upgrades](/en/docs/system/channels/)
for details.

## binpkg

Built packages are cached in `/var/cache/zpkg/binpkgs/`. A binpkg with the
same version and USE flags is reused. `ZPKG_NO_BINPKG=1` disables the cache.

## Recipes

Recipes are in `/usr/share/zignos/recipes/<channel>/{core,main,desktop}/`.
`zpkg sync` updates them to the latest tree. See
[zpkg design](/en/docs/design-pkg/) for how to write recipes.

## Overlays (ZIGNOS MENU)

Packages that are not in the official tree are available from the official
**ZIGNOS MENU** overlay.

```sh
sudo zpkg overlay add zignos-menu
zpkg overlay list
zpkg search <term>
```

Overlays are searched before the official tree, and `zpkg search` labels them
as `zignos-menu/apps`. See [ZIGNOS MENU (overlays)](/en/docs/system/overlays/)
for updating and removing, adding your own overlay, priority and signing.
