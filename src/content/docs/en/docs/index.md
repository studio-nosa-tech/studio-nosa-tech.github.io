---
title: ZIGNOS documentation
description: Entry points to the ZIGNOS overview, installation, system administration, reference, and FAQ.
---

ZIGNOS is a source-based Linux distribution built from scratch.
It is developed by [Studio NØSa.](https://studio-nosa.live/).

> stage3 is available from [Download](/en/download/) (GitHub Releases).

## Getting started

- [ZIGNOS overview](/en/docs/overview/) — the current release, channels, desktop, and repositories
- [Philosophy](/en/docs/philosophy/) — why build from scratch
- [Installation](/en/docs/install/) — from checking requirements to adding a desktop, on one page
- [FAQ](/en/docs/faq/) — frequently asked questions

## Using

### Installation

- [Installation](/en/docs/install/) — requirements, SystemRescue, stage3, chroot, kernel, GRUB, VIDEO_CARDS, desktop

### System administration

- [System administration](/en/docs/system/) — entry points to configuration, services, and packages
- [Configuration file locations](/en/docs/system/config/)
- [Package management](/en/docs/system/packages/)
- [Channels and upgrades](/en/docs/system/channels/)
- [Services (OpenRC)](/en/docs/system/services/)

### Desktop

- [Desktop overview](/en/docs/desktops/)
- [KDE Plasma 6](/en/docs/system/desktop/)
- [Wayland and Xwayland](/en/docs/desktops/wayland/)
- [Flatpak](/en/docs/desktops/flatpak/)
- [Desktop environment (details)](/en/docs/desktop/)

## Packaging

- [Packaging overview](/en/docs/packaging/) — the structure of zignos-recipes
- [Workflow](/en/docs/packaging/workflow/) — adding, updating, building, and PRs
- [Recipes](/en/docs/packaging/recipes/) — file layout and the build contract
- [Build patterns](/en/docs/packaging/patterns/) — autotools / CMake / Meson / Cargo / Go, etc.
- [System accounts](/en/docs/packaging/accounts/) — groups and service users

## Development

- [Developer overview](/en/docs/developers/) — layers, repositories, and the release flow
- [zpkg design](/en/docs/design-pkg/) — recipes, DB, dependency resolution, USE, transactions
- [zpkg configuration](/en/docs/zpkg-config/) — make.conf, USE, binpkgs, recipe sync
- [Signing and verification](/en/docs/signing/) — Ed25519, trusted keys
- [Build sandbox](/en/docs/build-sandbox/) — bubblewrap
- [Reproducible builds](/en/docs/reproducibility/) — provenance, SPDX SBOM
- [Release manifest](/en/docs/release-manifest/)
- [Roadmap](/en/docs/roadmap/) — the M0–M51 record

## Reference

- [stage3 reference](/en/docs/stage3/) — contents, build, distribution
- [Release channels](/en/docs/channels/) — channel operation and upgrade details
- [System design](/en/docs/design-system/) — init, services, kernel policy

## Project

- [Current release](/en/releases/current/) — the {{release}} artifacts and package list
- [Contributing](/en/docs/contributing/)
- [Project overview](/en/about/)
- [Official site](/en/) / [News](/en/news/)
