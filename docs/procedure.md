# Third-party component updates and controlled release

**Document:** delivery-playbook procedure · **Owner:** engineering lead · **Review:** every six months or after any incident caused by a release or a dependency.

## 1. Purpose and scope

This procedure controls how software changes, including updates to third-party components, reach production. It applies to every repository that adopts the controls in this playbook. It satisfies ISO 9001 clauses 8.4 (control of externally provided products), 8.5.6 (control of changes), and 7.5.3 (retained documented information), and ISO 27001:2022 Annex A 8.8 (technical vulnerabilities) and A 8.32 (change management). The record mapping is in `records.md`.

## 2. Definitions

| Term | Meaning |
|---|---|
| Change | Any commit that reaches `main` or a release branch. Features, fixes, and dependency updates are all changes. |
| Gate | The branch ruleset: pull request required, one approval, required checks passing, linear history. |
| Artifact | The container image built once for a commit and identified by its digest. |
| Promotion | Pointing an environment at an existing artifact digest. Never a rebuild. |
| Tier | The risk class of a dependency update, which decides who approves it. |
| Critical list | Dependencies that always need a human reviewer, kept in the auto-merge workflow. |
| Release branch | A short-lived branch cut from the production tag, only when a fix must ship without unreleased work. |

## 3. Branch and environment model

1. `main` is the only long-lived branch and the only branch Dependabot targets.
2. Every change enters `main` through a pull request that passes the gate.
3. `dev` tracks `main`: every merge builds the artifact once and points `dev` at it.
4. A release-candidate tag (`vX.Y.Z-rcN`) promotes that commit's artifact to `staging` after a required reviewer approves.
5. A version tag (`vX.Y.Z`) on the same commit promotes the same digest to `production` after a required reviewer approves. The workflow refuses if `staging` is not currently running that digest.
6. A hotfix that must not carry unreleased work uses a release branch cut from the production tag. See section 6.

## 4. Dependency updates

### 4.1 Tiers

| Tier | Applies to | Verification | Authorization | Record |
|---|---|---|---|---|
| A | Patch and minor version updates of dependencies not on the critical list | Required CI checks | Automated approval by the tier workflow, citing this procedure | The pull request, its checks, and the approval |
| B | Major version updates, and any dependency on the critical list | Required CI checks plus reviewer judgment | A named reviewer | The pull request and its review |
| C | Security updates raised from a Dependabot alert | As A or B by update type | As A or B by update type | The pull request plus the alert, which starts the remediation clock |

### 4.2 Rules

1. Version updates run weekly and are grouped: production minor and patch together, development dependencies together, GitHub Actions together. Majors and security updates are never grouped.
2. Version updates wait a cooldown after publication: three days for patch, seven for minor, fourteen for major. Security updates are never delayed by cooldown.
3. The critical list names dependencies whose every update is Tier B. It is reviewed when this procedure is reviewed.
4. Dependency review runs on every pull request and fails on known vulnerabilities of high severity or above being introduced.

## 5. Remediation timeline

The clock starts when the Dependabot alert is created and stops when the fixed artifact is running in production.

| Severity | Fix merged within | Running in production within |
|---|---|---|
| Critical | 7 days | 14 days |
| High | 30 days | 30 days |
| Medium | 90 days | next regular release |
| Low | next regular release | next regular release |

Alerts that affect only development dependencies and cannot reach production may be dismissed with a reason. The dismissal is the record.

## 6. Hotfix

1. Open an issue with severity. This is the nonconformity record.
2. Fix on `main` first through a normal pull request.
3. Cut `release/X.Y` from the production tag. The gate applies to it.
4. Open a pull request into the release branch that cherry-picks the fix. The reviewer confirms it matches the original.
5. Tag the merge commit `vX.Y.Z` and let the release workflow promote it. Because the release branch has no release candidate, the production workflow's staging gate is satisfied by first tagging an `-rc` on the same commit.
6. Delete the release branch once the next version is in production. The tag keeps the commit.

## 7. Records

| Record | Where it lives |
|---|---|
| Request or defect | GitHub issue, from a template that captures severity |
| Change, review, verification, authorization | The pull request: diff, review, required checks, approval |
| Release content | Auto-generated release notes grouped by label, on the GitHub Release |
| Software bill of materials | Attached to each GitHub Release |
| Deployment authorization | The environment approval on the promotion job |
| Vulnerability and remediation | The Dependabot alert and its linked pull request |

## 8. Monitoring and review

Monthly: open alerts by severity against the timeline in section 5, time to remediate by severity, and the change failure rate of automated Tier A merges. Tier A stays automated only while its failure rate is no worse than human-reviewed merges.
