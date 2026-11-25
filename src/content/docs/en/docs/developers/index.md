---
title: Developer overview
description: ZIGNOS architecture, repositories, build chain, and entry points to the developer documentation.
---

ZIGNOS assembles the final system with zpkg and recipes on top of the
foundation created by bootstrap. During development, it helps to keep track of
which layer you are changing.

## Layers

```
stage0/1  cross toolchain        zignos-build
stage2    bootstrap core         zignos-build
base      base.list closure      zignos-recipes
desktop   plasma-meta / apps     zignos-recipes
release   stage3 / manifest      zignos-build
```

- **bootstrap** — a temporary system and the cross toolchain
- **base** — glibc / gcc / binutils / OpenRC / zpkg / git and so on
- **desktop** — KDE Plasma 6 and KDE applications
- **release** — stage3, `release.json`, the site

## Repositories

| Repository | Contents |
|---|---|
| `zignos` | Design documents, roadmap |
| `zpkg` | The package manager itself |
| `zignos-build` | bootstrap, stage3 / images, QEMU tests |
| `zignos-recipes` | Recipe tree (public) |
| `studio-nosa-tech.github.io` | Official site (public) |

## Reading order

1. [zpkg design](/en/docs/design-pkg/) — recipes, DB schema, dependency resolution, USE, transactions
2. [Recipes](/en/docs/packaging/recipes/) — recipe file layout and contracts
3. [Packaging workflow](/en/docs/packaging/workflow/) — adding, updating, PRs
4. [System design](/en/docs/design-system/) — init, services, privilege escalation, kernel
5. [Signing and verification](/en/docs/signing/) — Ed25519 and the trust chain
6. [Build sandbox](/en/docs/build-sandbox/) — bubblewrap
7. [Reproducible builds](/en/docs/reproducibility/) — provenance / SBOM
8. [Release manifest](/en/docs/release-manifest/) — release.json

## Release flow

1. Build and verify in recipes unstable
2. Promote to testing and check with QEMU / hardware
3. Promote to stable
4. Generate stage3 and `release.json` with `make-stage3.sh`
5. Publish the manifest with `publish-release.sh`
6. Update the site's `src/data/release.json` and deploy

## Notes for development

- Follow the channel order (unstable → testing → stable) for changes
- Do not change contents while keeping the same version+revision
- Declare dependencies in the recipe (do not leave implicit build environment
  dependencies)
- Keep build logs and QEMU / hardware check results
- Do not replace administrator-owned files such as `/etc/passwd` from packages

For anything unclear, see [Contributing](/en/docs/contributing/) and
[Community](/en/docs/faq/community/).
