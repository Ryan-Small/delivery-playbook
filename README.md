# Delivery playbook

A reference implementation of controlled software delivery on GitHub for a team working under ISO 9001, with ISO 27001 or SOC 2 controls and customer patch obligations on top.

One rule explains everything in this repository. Every change to production, whoever or whatever authored it, is a pull request into `main` that passes the same gate. A release is a tag on `main`, never a branch. Dependabot's pull requests walk through the same door as a person's; the only difference is which risk tier they land in.

[![CI](https://github.com/Ryan-Small/delivery-playbook/actions/workflows/ci.yml/badge.svg)](https://github.com/Ryan-Small/delivery-playbook/actions/workflows/ci.yml)

## What is here

| Path | What it is |
|---|---|
| [`docs/procedure.md`](docs/procedure.md) | The one-page procedure a quality system can reference: tiers, SLA, release and hotfix rules, records |
| [`docs/`](docs/) | The rationale behind each rule, with diagrams and commands |
| [`.github/dependabot.yml`](.github/dependabot.yml) | Grouping, cooldown, and scheduling for dependency updates |
| [`.github/workflows/`](.github/workflows/) | The controls: CI gate, tiered auto-merge, build once, promote by digest, tag-driven release |
| [`.github/ISSUE_TEMPLATE/`](.github/ISSUE_TEMPLATE/), [`PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md), [`release.yml`](.github/release.yml) | Intake and release-notes records |
| [`app/`](app/) | A small status page. It exists so Dependabot has real manifests, CI has real tests, and promotion has something to show |
| [`Dockerfile`](Dockerfile), [`docker/`](docker/) | The artifact that is built once and promoted unchanged |

## Where to start

| Question | Read |
|---|---|
| What is the procedure, in one page? | [procedure](docs/procedure.md) |
| Why one branch, and how do environments work? | [branch model](docs/branch-model.md) |
| How are Dependabot pull requests triaged and merged? | [dependency updates](docs/dependency-updates.md) |
| How does a commit become a release, and why is nothing rebuilt? | [release and promotion](docs/release-and-promotion.md) |
| How do we fix production without shipping unfinished work? | [hotfix](docs/hotfix.md) |
| Which ISO 9001, ISO 27001, and SOC 2 requirements does each control satisfy? | [records](docs/records.md) |
| How do we apply this to another repository? | [adopting](docs/adopting.md) |

## The status page

The app shows four facts: environment, release, commit, and build time. The first two are read when the container starts. The last two are fixed when the image is built. The same image therefore reads "staging" and then "production" for the same commit, which is the whole point of artifact promotion.

```text
cd app && npm ci && npm run dev
```

## License

MIT. See [LICENSE](LICENSE).
