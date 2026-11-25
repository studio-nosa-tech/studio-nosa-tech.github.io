---
title: Philosophy
description: The source-based, minimal-base, independent, transparent, rolling-release ideas that ZIGNOS values.
---

ZIGNOS is a foundation for "building your own OS", not for "choosing an OS
handed to you". Rather than making its internals invisible for convenience, it
aims for a state where you can explain what you installed and what you changed
yourself.

## Building from scratch

We keep the build procedures for the toolchain, libc, base system, and package
manager as repositories. It is not a derivative of an existing distribution; the
final system is assembled with its own recipe tree and **zpkg**.

## Minimal base

stage3 is a minimal, chrootable base that does not include a kernel or GRUB.
Editors, SSH, DHCP, WiFi, and man are not included from the start. Add what you
need, only as much as you need, with `zpkg install`. The desktop follows the same
idea: install it optionally from `desktop/`.

## The recipe is the single source of truth

Package versions, dependencies, build flags, and patches are written in the
recipe. Built binaries are cached to make rebuilds faster. Recipes are shell
scripts, and we value being readable without learning a special DSL.

## Independent package management

zpkg has USE flags, slots, world, binpkgs, transactions, Ed25519 signatures,
build sandboxing with bubblewrap, and provenance / SPDX SBOM. We value recording
package provenance so that it can be verified later.

## OpenRC

init is OpenRC. Services are opt-in, and you choose what to start. Even on the
desktop, we do not migrate to systemd; we combine elogind / PAM / polkit to
support Wayland sessions.

## Rolling release and three channels

The HEAD of each channel is the current release. We provide `stable` with a focus
on stability, `testing` with the latest stable versions, and `unstable` including
RC / beta, and validate changes in the order
**Unstable → Testing → Stable**.

## Transparency and reproducibility

We record build logs, recipe digests, the dependency environment, and
SOURCE_DATE_EPOCH, aiming for the same artifacts from the same inputs. Release
information is consolidated in `release.json`, and the site, downloads, and
installation guide reference the same data.

## Next

- [ZIGNOS overview](/en/docs/overview/)
- [System design](/en/docs/design-system/)
- [zpkg design](/en/docs/design-pkg/)
- [Reproducible builds](/en/docs/reproducibility/)
- [Release channels](/en/docs/channels/)
