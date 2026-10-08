# Linux Lab

A bilingual Linux and Git course with a React + Vite frontend, a modern React/Node
workshop, account progression, and temporary isolated EC2 Linux laboratories.
Canonical domain: https://linux.jcampos.dev. A course by Pacific Code Labs.

## Local development

Use Node 24. Install with `npm ci`, then run `npm run dev` and open
http://127.0.0.1:5173. Copy `.env.example` to `.env.local` and fill the public Cognito
and API identifiers from the infrastructure outputs. Guest learning works without
AWS configuration. No AWS credentials or client secrets belong in frontend settings.

`npm test`, `npm run lint`, `npm run build`, and `npm run test:e2e` validate domain
logic, content preservation, the production build, and desktop/mobile flows.
Install Playwright Chromium before browser tests: `npx playwright install chromium`.
The production output directory is `build/`.

## Course and accounts

Course text, lessons, workshop membership, rewards and translations live in JSON.
There are 44 bilingual lessons, including all 28 original command examples. The
primary workshop teaches a React interface and Node/Express API, offline package
installation, a production build, Linux services, SSH, firewall rules and local TLS.
The original Apache/PHP/MariaDB/Nextcloud workshop is a separate track.

Visitors save progression on their device. Amplify connects accounts to Cognito;
only authenticated accounts sync online. If local and online progress both contain
different work, the learner chooses which copy to keep before any upload. Points
are deduplicated, and reading completion is separate from exercise verification.
The API uses private encrypted S3 JSON snapshots, ETag conditional writes and reset
epochs. No database, public bucket or direct browser S3 access is required.

## Backend, AWS and email repositories

Backend code and Cognito messages are independent **private repositories**:
[linux-lab-backend](https://github.com/chepelcr/linux-lab-backend) and
[linux-lab-cognito-templates](https://github.com/chepelcr/linux-lab-cognito-templates).
Their local `backend/` and `emails/` checkouts are ignored by this frontend;
[repository setup](docs/repositories.md) explains cloning and deployment boundaries.
The backend owns Cognito, private S3 progression, temporary EC2 lifecycle and the
CloudFormation templates. It has its own tests and GitHub deployment workflow.

`AWS_PROFILE=PACIFIC-PROD npm run config:ssm` loads ten public settings into the
ignored `.env.production.local`. Pages does this before Vite builds the artifact.
No AWS credentials or client secrets enter the frontend. Clean paths use the
Pages 404/session-storage fallback. Backend and email CI use their own narrow
OIDC roles and main-only deployment environments.

Eight responsive ES/EN templates cover verification, recovery and invitations.
Branded delivery is enabled only for explicitly verified SES **email identities**.
Cognito's signup and message hooks enforce that restriction even though SES has
production access. Unregistered or pending identities cannot register or receive
course messages. The app explains the current enrollment restriction.

## Temporary Linux laboratories

The latest user-approved design uses preloaded Debian amd64 EC2 instances in a
dedicated VPC without internet/NAT/peering or public IPs. Browser terminals connect
through AWS Session Manager with no open inbound ports. One lab per account is
shared across all lessons of a learning path; ending it is required before starting
another path. Logout awaits instance termination before clearing credentials.

The lesson workspace has fixed navigation and a fixed lab, with the lesson
article and sidebar scrolling independently. On mobile a prominent button opens the terminal in a modal drawer.
Accounts are required for cloud labs. Guest course progress still saves locally.

`npm run lab:pack` prepares the pinned Node/npm/course files. `npm run lab:build`
bakes and tests a private AMI using a temporary builder, then removes that builder.
`npm run lab:deploy` deploys the isolated student VPC, lifecycle API and independent
server deadlines. The service allows four concurrent t3.small labs, terminates after
30 minutes without user interaction and enforces a 90-minute absolute deadline.
The private management endpoints have ongoing AWS charges even without active labs.
Student startup never downloads packages; installations use the baked offline repo.

See [docs/temporary-ec2-labs.md](docs/temporary-ec2-labs.md) for the security boundary
and [docs/verification.md](docs/verification.md) for executed checks and remaining gates.
The abandoned WebAssembly runtime is excluded from the frontend build.

## Preservation and component map

Original HTML/JS/assets were preserved on branch `codex/legacy-static-course`,
commit recorded in [docs/legacy-source.json](docs/legacy-source.json). They are
removed from the active Resources page. `npm run content:migrate` reads that exact
Git snapshot without executing old scripts; `npm run content:check` verifies the
28 code hashes, 18 source documents and translation coverage.

[docs/implementation-plan.md](docs/implementation-plan.md) contains the source and
component mapping, full scope and release gates. The UI design system is
[design-system/comandos-linux/MASTER.md](design-system/comandos-linux/MASTER.md).
Shared layout keeps navigation and footer outside page transitions. Shared controls
provide keyboard access, themed menus and reduced-motion support.

The CI/CD path at `/courses/cicd` includes four bilingual lessons and a downloadable
React starter with its own GitHub Pages artifact workflow. See
[the CI/CD workshop](docs/cicd-workshop.md) and [student project](course-projects/pages-notes/README.md).
Use `npm run course:package` to refresh the downloadable starter and workflow;
production builds do this automatically. Students deploy from their own connected
computer and GitHub account; the isolated Linux lab keeps its no-internet policy.
