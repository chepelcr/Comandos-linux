# Workspace instructions

Read AGENTS.md and docs/implementation-plan.md. This is a React 19 / Vite / TypeScript
course migration. Use Node 24, npm run dev, npm test, npm run lint and npm run build.
Build output is build/, never dist/. Course content and translations are JSON.

Use .agents/skills/ui-ux-pro-max/SKILL.md for UI work and the tailored design system
in design-system/comandos-linux/MASTER.md. Support Spanish/English, light/dark/system,
reduced motion and accessible keyboard controls. Use components/Select.tsx for menus.
Persistent navigation/footer stay outside route and language transition wrappers.

Amplify manages Cognito public-client authentication. Guest progression stays local;
authenticated progression uses the Express JWT API and private S3 JSON snapshots.
Never expose credentials, accept caller-provided account IDs, or overwrite competing
local/cloud progression before the learner chooses. No SQL database is used.

Keep the eight Cognito email templates prepared but custom delivery disabled.
The user deferred SES production access. Do not request it or enable sending.

All 28 original examples and 18 source documents are mapped to JSON. Exact original
files live on codex/legacy-static-course; see docs/legacy-source.json. The Resources
page contains curated resources instead of a dump of the old HTML files.

The user replaced the browser-WASM plan with temporary EC2 labs. See
AGENTS.md and docs/temporary-ec2-labs.md. One account-wide S3 lock covers the entire
learning path and all tabs/devices. Lessons in that path share a VM; another path
requires End first. Logout awaits EC2 termination before clearing Cognito credentials.
Student VPC has no internet/NAT/peering/public IP; SG has no ingress and permits only
private management endpoints. Enforce idle 30 minutes and absolute 90 minutes on
AWS independently of the browser. Preload all dependencies and verify real execution.
The lesson article scrolls independently of the fixed sidebar/lab; mobile uses a drawer.
Do not publish the abandoned WebAssembly runtime.

Frontend deploys through GitHub Actions Pages artifacts with public settings read
from SSM before build. Preserve linux.jcampos.dev and clean path routes.
AWS profile PACIFIC-PROD, region us-east-1. Public outputs: docs/deployment-state.json.
