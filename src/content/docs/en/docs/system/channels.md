---
title: Channels and upgrades
description: Choosing stable / testing / unstable, reviewing differences, and running zpkg upgrade safely.
---

## Channels

| Channel | Purpose | Main components |
|---|---|---|
| `stable` | Stable, the default | Linux 6.18.64 LTS / Qt 6.8.5 LTS / Plasma 6.4.5 |
| `testing` | Validation for the next stable | Linux 7.3.5 / Qt 6.11.3 / Plasma 6.8.3 |
| `unstable` | Latest development versions | Linux 7.4-rc3 / Gear 26.11.80 beta |

Changes are validated in the order **Unstable → Testing → Stable** and never
flow backwards. Switching `stable ↔ unstable` is a large update.

## Current channel

```sh
zpkg channel
```

`CHANNEL=` in `/etc/zpkg/make.conf` is the effective value. For a temporary
override, use the `ZPKG_CHANNEL` environment variable or
`zpkg upgrade --channel <ch>`.

## Switching

```sh
zpkg channel testing
zpkg upgrade -p           # Review the differences
zpkg upgrade              # Run
```

If downgrades are involved, `--allow-downgrade` is required. Do not use
`--yes` to skip the confirmation prompt except for non-interactive runs.

## Upgrade safety

`zpkg upgrade` proceeds in this order.

1. Install newly required dependencies first
2. Build all upgrade targets
3. Install only after every build succeeds
4. Verify dependencies and the manifest after installation

If a build fails, existing packages are not replaced. Only new dependencies
may remain. Installation failures are rolled back per package, and rerunning
resumes from where it stopped.

> When migrating from `zpkg 0.3.1` or earlier, newly required dependencies are
> not installed first. If packages needed for the build are missing, install
> them first with `zpkg install`.

## Further details

- [Release channels (details)](/en/docs/channels/)
- [The upgrade section of the zpkg design](/en/docs/design-pkg/)
- [Release manifest](/en/docs/release-manifest/)
