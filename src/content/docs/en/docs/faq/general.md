---
title: General FAQ
description: How ZIGNOS came about, supported hardware, updates, package repositories and licensing.
---

## Is ZIGNOS a derivative of an existing distribution?

No. It builds everything from the toolchain to the final system with its own
package manager **zpkg** and its own recipe tree. It does not use the
mechanisms of any particular existing distribution as-is.

## Is it Gentoo-based?

No. ZIGNOS is not a Gentoo derivative and does not use Portage, ebuild or
Gentoo recipes. It builds everything from the toolchain to the minimal base
with its own bootstrap procedure, and manages packages with zpkg and its own
recipes. It uses OpenRC as well, but the package management and build systems
are independent.

## Which architectures are supported?

x86_64 only. It boots on both BIOS and UEFI. Other architectures such as ARM
are out of scope at present.

## Can it be used on a server?

Because it is a minimal CLI base, a server-oriented configuration is possible.
However, SSH / DHCP / firewall and so on are not included from the start, so
you must `zpkg install` and enable them yourself.

## Is a desktop required?

No. stage3 and the default images are CLI only. KDE Plasma 6 is added
optionally from `desktop/`. If you use only the CLI, Qt and Mesa are not
installed.

## How are updates delivered?

It is a rolling release. Update the recipes with `zpkg sync`, review the
differences with `zpkg upgrade -p`, then run `zpkg upgrade`. Switching channels
can include downgrades, so always review the differences.

## Is a binpkg repository public?

No public binpkg repository is operated at present. The recipe tree is public,
and you build from source in your own environment. Local binpkgs are not
created by default, but `BUILD_BINPKG=1` keeps them as a build cache
([zpkg configuration](/en/docs/zpkg-config/)).

## What is the license?

The text and logo on this site belong to Studio NØSa. ZIGNOS software follows
the license of each repository and package. License information for individual
recipes is currently being prepared.

## Can I contribute?

Yes. The public `zignos-recipes` and this official site can be improved on
GitHub. See [Contributing](/en/docs/contributing/) for details.
