---
title: Contributing
description: The ZIGNOS repository layout, the recipe change flow, and how to report bugs and fix documentation.
---

ZIGNOS is developed by [Studio NØSa.](https://studio-nosa.live/).
The published recipes and the official site can be reviewed and improved on GitHub.

## Repositories

| Repository | Contents | Public |
|---|---|---|
| [zignos-recipes](https://github.com/studio-nosa-tech/zignos-recipes) | Recipes for stable / testing / unstable | Public |
| [studio-nosa-tech.github.io](https://github.com/studio-nosa-tech/studio-nosa-tech.github.io) | This official site | Public |
| `zignos` | Design documents and roadmap | Public |
| `zpkg` | The package manager itself | Public |
| `zignos-build` | bootstrap, stage3 / image creation | Public |

## Changing a recipe

Recipes are in `zignos-recipes/<channel>/{core,main,desktop}/<package>/`.

1. Copy a similar existing recipe and prepare `version` / `sources` / `checksums` / `build`
2. Declare dependencies explicitly in `depends` / `makedepends`
3. Raise `revision` when you change the contents
4. Validate changes in the order **unstable → testing → stable**
5. Attach the build log and, if possible, the results of checks on QEMU / real hardware

For details on builds and dependency resolution, see [zpkg design](/en/docs/design-pkg/);
for syncing the recipe tree, see [zpkg configuration](/en/docs/zpkg-config/).

## Reporting a bug

Use a GitHub Issue and include the following information.

- The output of `zpkg info <package>`
- The channel in use (`stable` / `testing` / `unstable`)
- Information equivalent to `uname -r` and `zpkg --version`
- The command that failed and the build log (`/var/cache/zpkg/logs/...`)
- For QEMU, the boot method and the GPU / firmware

For security issues, contact the developers directly rather than opening a public Issue.

## Fixing documentation

The Markdown for this site is in
[studio-nosa-tech.github.io](https://github.com/studio-nosa-tech/studio-nosa-tech.github.io).
Fixes for typos, stale versions, and broken links are welcome. Release information
references `src/data/release.json`, so update the manifest instead of rewriting the
numbers directly.

## Community

The current public contact point is GitHub. Ask questions in the
[forum](/en/docs/community/forum/) and report bugs in Issues. There is no chat.
For details, see [Community](/en/docs/faq/community/).
