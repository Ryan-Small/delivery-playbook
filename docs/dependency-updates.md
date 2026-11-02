# Dependency updates

Dependencies are externally provided products under ISO 9001 clause 8.4. The organisation needs criteria for accepting them, and a record that the criteria were applied. This document explains how `.github/dependabot.yml` and `.github/workflows/tiered-automerge.yml` do that.

## What Dependabot does and does not do

- Version updates run on the schedule in `dependabot.yml` and open pull requests against `main`.
- Security updates open pull requests as soon as an alert matches a fixed version. They always target the default branch. No configuration changes that.
- The `cooldown` setting delays version updates after a release is published. It never applies to security updates.
- Dependabot rebases its own pull requests when `main` moves, so lockfile conflicts resolve themselves.
- The comment commands such as `@dependabot merge` were removed in January 2026. Merging is done with the platform's own auto-merge.

## Grouping

| Group | Contents | Why |
|---|---|---|
| `production-minor-patch` | Minor and patch updates of production dependencies | One pull request per week for the low-risk bulk |
| `development` | All updates of development dependencies | Noise control; these never ship |
| `actions` | All GitHub Actions updates | One pull request keeps workflows current |
| none | Major updates | One pull request each, so a human reviews each migration |
| none | Security updates | One failing fix must never block another from meeting the timeline |

## Cooldown

Freshly published versions are where supply-chain attacks live. A package published an hour ago has had no time to be noticed as malicious. The cooldown keeps version updates at arm's length: three days for patch, seven for minor, fourteen for major. Security updates bypass cooldown by design, so a fix is never delayed.

## Tiers and the auto-merge workflow

The workflow runs on every Dependabot pull request, reads the update type from Dependabot's metadata, and decides a tier.

| Tier | Condition | What the workflow does |
|---|---|---|
| A | Patch or minor, and no dependency on the critical list | Approves with a body that cites the procedure, then enables auto-merge |
| B | Major, or any dependency on the critical list | Nothing. The ruleset's one-approval requirement waits for a human |
| C | Security update | Same as A or B by update type; the alert is the extra record |

The ruleset still blocks the merge until every required check passes, so a Tier A approval is an authorization, not a bypass. The approval body is what an auditor reads to see why an automated approval was permitted.

The critical list lives in the workflow's `CRITICAL_LIST` variable. In this repository it names `react-markdown`, because it renders content into the page and a change in its sanitising is security-relevant. In a service, the list names authentication, cryptography, payment, and database driver libraries.

## What to expect

With weekly grouped updates, a small repository sees two to four pull requests per week, most of them Tier A and merged within an hour of the run. Majors arrive a few times a month and wait for a person. If the pull request count or the time-to-merge grows, that is the signal to revisit the grouping or the cooldown, not to turn automation off.

## Blocked updates

Sometimes Dependabot cannot resolve an update because a peer dependency does not support it yet. The job then reports a failure for that one dependency, the other dependencies are still checked, and nothing is opened for the blocked one. Left alone, the job fails every week, and the failure hides anything new.

Record the block instead: add an `ignore` entry for that update type, with a comment stating the date, the reason, and the condition for removing it. The entry is a dated exception in a reviewed file, which is the controlled form of "we know". Review open exceptions whenever the procedure is reviewed.

The first run of this repository hit exactly this. TypeScript 7 was published while typescript-eslint still declared a peer range below 6.1. The exception is in `.github/dependabot.yml`.

## Measuring

Baseline before enabling: open alerts by severity and their median age. After enabling, track mean time to remediate by severity as the investment metric and the change failure rate of Tier A merges as the guardrail. Tier A stays automated only while its failure rate is no worse than human-reviewed merges.
