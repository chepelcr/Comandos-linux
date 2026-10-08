# Repository boundaries

- Frontend/course: https://github.com/chepelcr/Comandos-linux
- Private API/lab backend: https://github.com/chepelcr/linux-lab-backend
- Private Cognito messages: https://github.com/chepelcr/linux-lab-cognito-templates

Backend and emails are independent Git repositories, not submodules or vendored
sources. Both directories are ignored by the frontend. Local setup:

```sh
gh repo clone chepelcr/linux-lab-backend backend
gh repo clone chepelcr/linux-lab-cognito-templates emails
npm ci --prefix backend/service
npm ci --prefix emails
```

The Pages workflow installs/tests/builds only the frontend, loading public SSM
settings before Vite. Backend CI pins the public course JSON to one immutable
frontend commit, tests it and updates the exact progress/lab Lambdas. When adding
lesson IDs or changing XP rules, run backend content sync/deployment before the
frontend release; COURSE_REF can pin a reviewed frontend commit. No personal GitHub
token or cross-repository secret is required. Existing curriculum JSON stays public.

The backend owns Cognito, S3, API, isolated-network and lifecycle CloudFormation.
The email repository owns its resolver, eight SES templates and template deployment.
SES production access is approved. AWS manages sender identities and delivery.
CustomMessage renders the ES/EN templates; Cognito verifies student email ownership.
There is no application recipient allowlist or SES identity registration for students.

The root backend:bundle and lab:deploy commands delegate to the ignored local
backend checkout. Infrastructure deployment uses PACIFIC-PROD / us-east-1 locally;
CI uses separate main-only GitHub environments and narrow OIDC roles.

New private GitHub repositories use immutable OIDC subject prefixes. Trust policies
match the prefix returned by GitHub's OIDC customization API, including owner/repo
IDs, rather than assuming the older repository-name-only subject.

Verification: frontend and backend tests plus email resolver suites cover all eight
template variants. Live verification invokes the resolver with synthetic recipients
and checks Cognito CustomMessage/SES configuration without sending mail. Inbox
delivery requires an explicitly chosen test recipient.

The frontend uses native Amplify Auth forms with SRP; hosted Cognito redirects are
not part of the student flow. Backend Cognito and API templates own SRP client
settings and anonymous OPTIONS preflight routes, while all data/lab methods require JWT.
