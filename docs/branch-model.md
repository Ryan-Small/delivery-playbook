# Branch model

## The one rule

Every change to production is a pull request into `main` that passes the same gate. A release is a tag on `main`, not a branch. Environments receive artifacts, not branches.

## Why one branch

| Fact about the organisation | Consequence for the model |
|---|---|
| Production is SaaS on one version | No old release needs patching, so no long-lived release branches |
| Dependabot security updates always use the default branch | Any branch that is not the default never gets them. Environment branches would need every fix merged onward by hand |
| ISO 9001 says nothing about branches | It requires reviewed, authorised, verified, recorded changes. One gate on one branch is the simplest way to show that |
| CI is trusted | Verification can be automated for low-risk changes if the criteria are written once |

Environment branches (`dev`, `staging`, `prod`) were considered and rejected: a dependency bump becomes three pull requests, security fixes land on only one branch, and the promotion merges between branches become the real change with no review attached.

## Environments

| Environment | What it holds | What puts it there | How many builds at a time |
|---|---|---|---|
| `dev` | The head of `main` | Every merge, automatically | Always the latest |
| `staging` | One candidate build, release candidate or hotfix | A tag push, then a required reviewer | One |
| `production` | One released build | Approval of the digest staging just validated | One |

Only `dev` follows a branch. `staging` and `production` receive one specific digest, promoted by a person. With a single staging environment, a hotfix candidate replaces whatever release candidate was being checked; the candidate is an immutable artifact, so its checks resume rather than restart. If hotfixes become frequent, add a second staging environment.

## One cycle, drawn three ways

Version 1.0 is in production. Three issues make up release 1.1. Routine dependency updates and one security fix arrive while 1.1 is being built.

### Where commits and tags land

```mermaid
%%{init: {'gitGraph': {'rotateCommitLabel': false, 'mainBranchName': 'main'}}}%%
gitGraph LR:
    commit id: "1.0" tag: "v1.0.0"
    branch feat-101
    commit id: "feat A"
    checkout main
    merge feat-101 id: "PR 201"
    branch deps-weekly
    commit id: "minor+patch"
    checkout main
    merge deps-weekly id: "PR 202 tier C"
    branch deps-cve
    commit id: "CVE fix"
    checkout main
    merge deps-cve id: "PR 204 tier A" tag: "v1.0.1"
    branch feat-102
    commit id: "feat B"
    checkout main
    merge feat-102 id: "PR 205"
    branch feat-103
    commit id: "feat C"
    checkout main
    merge feat-103 id: "PR 206"
    branch deps-major
    commit id: "major"
    checkout main
    merge deps-major id: "PR 203 tier B" tag: "v1.1.0-rc1"
    branch deps-weekly-2
    commit id: "next weekly"
    checkout main
    merge deps-weekly-2 id: "PR 207, ships in 1.2"
```

`main` is the top line. Each lower line is one pull request, from the commit it branched at to its merge. `v1.1.0` is a second tag on the same commit as `v1.1.0-rc1`. The weekly run that merges after the candidate is simply in the next release; that is correct, not a problem.

### The security fix, step by step

```mermaid
sequenceDiagram
    autonumber
    participant AL as Dependabot alert
    participant PR as Security PR
    participant WF as Tier workflow
    participant CI as Required checks
    participant M as main
    participant ENV as dev, staging, production
    participant REC as Record

    AL->>REC: Alert created, severity recorded
    Note over AL,REC: Remediation clock starts
    AL->>PR: Open PR against the default branch
    PR->>CI: Run tests, build, dependency review
    PR->>WF: pull_request event
    WF->>WF: Read group name and update type, check critical list
    alt security group, patch or minor, not on critical list (Tier A)
        WF->>PR: Add security label, approve citing the procedure, enable auto-merge
    else security major or critical list (Tier B)
        WF-->>PR: No action
        Note over PR,WF: Named reviewer approves
    end
    CI-->>PR: All required checks green
    PR->>M: Squash merge
    M->>ENV: dev: build once, promote
    M->>ENV: tag v1.0.1-rc1: promote the same digest to staging
    M->>ENV: tag v1.0.1: promote the same digest to production
    ENV->>REC: Deployment approvals recorded
    Note over ENV,REC: Remediation clock stops
```

### The gate every pull request passes

```mermaid
flowchart LR
    subgraph IN[Three sources of change]
        I[Issue in milestone 1.1] --> FP[Feature PR]
        W[Weekly Dependabot run] --> VP[Routine update PR]
        A[Security alert] --> SP[Security PR]
    end
    subgraph AP[Who approves]
        T{Security update type}
        BA[Bot approval, cites procedure]
        HR[Named reviewer]
    end
    SP --> T
    T -- patch or minor, not critical --> BA
    T -- major or critical list --> HR
    VP --> HR
    FP --> HR
    subgraph GT[One gate for every PR]
        G{{"Ruleset on main: 1 approval, CI, dependency review"}}
    end
    BA --> G
    HR --> G
    G --> M([main])
    M --> D[dev: build once, promote]
    M --> C{Cut a build?}
    C -- security fix merged --> B1[Tag v1.0.1-rc1, then v1.0.1]
    C -- milestone complete --> B2[Tag v1.1.0-rc1, then v1.1.0]
    subgraph PM[Promote one digest]
        B1 --> S[staging, required reviewer]
        B2 --> S
        S --> P[production, same digest]
        P --> R[Release notes and SBOM]
    end
```
