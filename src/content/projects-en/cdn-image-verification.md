---
title: Item-Image CDN Three-Stage Diagnosis
role: Full-Stack Engineer
period: "2026.02"
tags: [Laravel, Akamai CDN, Diagnostics Tooling]
metrics: "Troubleshooting time from 1+ hour → instant lookup on entering an itemId"
order: 8
---

## Background

When an item image "wouldn't show," troubleshooting used to be a manual stage-by-stage process: check the back office to confirm the image was uploaded, SSH into the origin to confirm the CDN JSON was updated, verify the image the client actually sees on the external network, and decide whether an Akamai purge cache needed to be pushed — the symptom was always "the image doesn't show," but the root cause could be one of three completely different failures: a failed upload, a stale JSON, or an unpurged cache. A single investigation often took over 1 hour and required pulling in a back-end engineer.

## Scope

Added a verification feature to the item-settings back office: entering an itemId reports the three stages in order (back-office upload / origin JSON / Akamai CDN) and directly shows the image the client actually sees.

## Challenges

Akamai edge nodes have no fixed purge propagation time, and the three checks depend on one another — if the JSON is not yet updated, the CDN path itself is wrong, yet a 200 response from the CDN is easily misread as fine. The verification logic therefore had to compare the external-domain path (what the client sees) against the internal-domain path (the origin) to judge whether they were in sync, rather than relying on HTTP status alone.

## Contributions

Implemented the `verifyImage()` three-stage diagnosis logic: comparing external-domain paths against internal-domain paths to judge whether the CDN reflects the latest image, and gating the feature by environment to RL and production only (the local environment has no CDN architecture, making verification meaningless).

## Impact

Troubleshooting dropped from 1+ hour to instant lookup on entering an itemId, with the three failure points reported separately. Customer service and operations can now self-serve without pulling in an engineer, and pointless operations — like pushing a purge on a hunch that "it's probably a cache issue" when the JSON was never updated in the first place — are avoided.
