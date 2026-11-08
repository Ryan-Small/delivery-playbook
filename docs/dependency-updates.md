# Dependency updates

Dependencies are externally provided products under ISO 9001 clause 8.4. The organisation needs criteria for accepting them, and a record that the criteria were applied. This document explains how `.github/dependabot.yml` and `.github/workflows/tiered-automerge.yml` do that.

## The rule in one sentence

Automation merges security fixes that are patch or minor bumps and touch no high-risk dependency. Everything else is a person's decision.

## What Dependabot does and does not do

- Version updates run on the schedule in `dependabot.yml` and open pull requests against `main`.
- Security updates open pull requests as soon as an alert matches a fixed version. They always target the default branch. No configuration changes that.
- The `cooldown` setting delays version updates after a release is published. It never applies to security updates.
- Dependabot rebases its own pull requests when `main` moves, so lockfile conflicts resolve themselves.
- Dependabot applies no `security` label of its own. The tier workflow adds it to security pull requests so the release notes can group them.
- The comment commands such as `@dependabot merge` were removed in January 2026. Merging is done with the platform's own auto-merge.

## How a security update is recognised

`dependabot.yml` defines two groups per ecosystem that apply only to security updates: `security-minor-patch` and `security-major`. Dependabot puts every security fix it can make into one of them, and the pull request carries the group name. The workflow reads that name through Dependabot's metadata action. Dependabot writes it; a dependency cannot. A pull request with no security group is a routine update.

Grouping means that security fixes for one ecosystem that are open at the same time arrive in one pull request. New alerts join an open pull request rather than opening another. A failing fix therefore holds the others in its group until a person looks, which the weekly triage and the 24-hour check for Critical-severity alerts bound. The split into two groups keeps a major fix from holding patches.

The alternative, confirming the alert per pull request through the metadata action's alert lookup, needs a personal access token stored as a Dependabot secret. The group method was chosen because it adds no credential and fails safe.

## Grouping

| Group | Applies to | Contents | Why |
|---|---|---|---|
| `security-minor-patch` | Security updates | Patch and minor fixes | The only group automation may merge |
| `security-major` | Security updates | Major fixes | Always a person |
| `production-minor-patch` | Routine updates | Minor and patch updates of production dependencies | One pull request per week for the bulk |
| `development` | Routine updates | All updates of development dependencies | Noise control; these never ship |
| `actions` | Routine updates | All GitHub Actions updates | One pull request keeps workflows current |
| none | Routine updates | Majors | One pull request each, so a person reviews each migration |

## Cooldown

Freshly published versions are where supply-chain attacks live. A package published an hour ago has had no time to be noticed as malicious. The cooldown keeps routine updates at arm's length: three days for patch, seven for minor, fourteen for major. Security updates bypass cooldown by design, so a fix is never delayed. That is also why only security updates are merged by automation here: the routine updates a person reviews are the ones that have already waited.

## Tiers and the workflow

The workflow runs on every Dependabot pull request, reads the group name and the update type, and decides a tier.

| Tier | Condition | What the workflow does |
|---|---|---|
| A | Group is `security-minor-patch`, bump is patch or minor, no high-risk package | Adds the `security` label, approves with a body that cites the procedure, enables auto-merge |
| B | Group is `security-major`, or `security-minor-patch` with a high-risk package | Adds the `security` label. The ruleset's one-approval requirement waits for a person |
| C | No security group | Nothing. The pull request waits for the weekly triage |

The ruleset still blocks the merge until every required check passes, so a Tier A approval is an authorization, not a bypass. The approval body is what an auditor reads to see why an automated approval was permitted.

A high-risk dependency is one whose behaviour the repository's automated tests cannot exercise, usually because it talks to something outside the test: a database, an identity provider, a payment service, a message broker, a renderer of untrusted content. A defect or a compromise in it would reach security or data undetected, so a person reads every update. The list is chosen by what the tests cannot see, not by how likely a defect is, which is why a well-maintained authentication library belongs on it and comes off only when an integration test covers it. It lives in the workflow's `HIGH_RISK_LIST` variable. In this repository it names `react-markdown`, because it renders content into the page and a change in its sanitising is security-relevant. In a service, the list names authentication, cryptography, session, payment, and database driver libraries, and it stays short: if it grows to cover most of the tree, Tier A has become theatre and the policy should be rewritten.

## Triage of routine updates

Once a week, a person opens the Tier C pull requests and does one of three things: merge, defer, or close with a reason. A deferral is recorded as a dated `ignore` entry in `dependabot.yml` with the condition for removing it, the same way the TypeScript exception is recorded. Closing a pull request without an `ignore` entry means Dependabot proposes the next version when it appears.

An `ignore` entry has one cost that matters here: it also stops security pull requests for the range it covers, although the alert still appears. So entries are scoped by version level rather than by whole dependency, and the weekly review includes a check of open alerts against ignored ranges. An alert inside an ignored range is decided by hand, and the entry is narrowed if it is too wide.

## What to expect

With weekly grouped updates, a small repository sees two to four routine pull requests per week for the triage, and a security pull request a few times a quarter. If the routine backlog grows older than a month, that is the signal to change grouping or cadence, not to skip triage.

## Accepted risk

A security fix whose new version is itself compromised, for example after a maintainer account takeover, can be merged by automation and reach `dev`. Dependency review cannot catch it, because the malicious version is not yet in any advisory database, and cooldown does not apply to security updates. It cannot reach staging or production without the two deployment approvals. The high-risk list and the CI checks are the remaining controls. A fuller variant of the workflow that holds young versions for three days and routes maintainer changes to a person was designed and set aside as more than this repository needs; it can be revived if the risk assessment changes.

## Measuring

Baseline before enabling: open alerts by severity and their median age. After enabling, track mean time to remediate by severity as the investment metric, the change failure rate of Tier A merges as the guardrail, and the age of the oldest open routine pull request as the triage backlog.
