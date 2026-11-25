---
title: Community
description: ZIGNOS public channels, GitHub, bug reports and how to contribute.
---

## Where are the public channels?

The official channels are currently on GitHub.

- [Forum (GitHub Discussions)](https://github.com/studio-nosa-tech/zignos/discussions)
- [Studio NØSa. GitHub](https://github.com/studio-nosa-tech)
- [zignos-recipes](https://github.com/studio-nosa-tech/zignos-recipes)
- [Official site repository](https://github.com/studio-nosa-tech/studio-nosa-tech.github.io)

The forum is for questions, advice, requests and sharing work; Issues are for
bug reports. Usage and categories are described in
[Forum](/en/docs/community/forum/). There is no chat or mailing list.

## Where should I report bugs?

Use GitHub Issues. Including the following speeds up investigation.

- The channel in use and the `zpkg` version
- `uname -r`
- The commands you ran and the full error text
- Build logs (`/var/cache/zpkg/logs/...`)
- For QEMU, how it was started, the GPU and the firmware

## Can I add or modify recipes?

Yes. Propose changes to `zignos-recipes` via an Issue or Pull Request. Include
build verification and, if possible, a check on QEMU or real hardware.

## I found an error in the documentation

Send an Issue or Pull Request to the official site repository. Release
information references `src/data/release.json`, so an update to the manifest is
needed rather than editing the numbers directly.

## Is support available?

This is an individual project, so free individual support is not guaranteed.
Treat public Issues and the documentation as the primary sources.
