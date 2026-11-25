---
title: Packaging overview
description: Layout of zignos-recipes, channels, and the entry point for adding and updating recipes.
---

ZIGNOS packages are built from recipes in
[zignos-recipes](https://github.com/studio-nosa-tech/zignos-recipes). A recipe
is a per-package directory made of shell scripts and metadata files.

## Tree layout

```
zignos-recipes/
├── stable/{core,main,desktop}/
├── testing/{core,main,desktop}/
└── unstable/{core,main,desktop}/
```

| Category | Contents |
|---|---|
| `core` | Base system, toolchain, zpkg |
| `main` | CLI tools, networking, libraries, build tools |
| `desktop` | KDE Plasma 6 and KDE applications |

The three channels share the same structure, and changes are promoted
**unstable → testing → stable**. See
[Release channels](/en/docs/channels/) for versions and composition.

## Pages

- [Workflow](/en/docs/packaging/workflow/) — prerequisites, creating recipes, updating, building, PRs
- [Recipes](/en/docs/packaging/recipes/) — file layout, metadata, dependencies, hooks
- [Build patterns](/en/docs/packaging/patterns/) — autotools / CMake / Meson / Cargo / Go / Python / Perl / Qt
- [System accounts](/en/docs/packaging/accounts/) — groups and service users

## Basic commands

```sh
zpkg build <pkg>          # build up to destroot
zpkg install -p <pkg>     # see what would be installed
zpkg install <pkg>        # build and install
zpkg sync                 # update the recipe tree
```

For the recipe internals, see [zpkg design](/en/docs/design-pkg/).
