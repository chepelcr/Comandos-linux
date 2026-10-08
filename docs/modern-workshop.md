# Modern Linux application workshop

Status: agreed curriculum direction for implementation; starter app, package pack,
runtime compatibility and exercises are not implemented yet.

The main taller becomes **Deploy a React + Node.js application on Linux**. The original
Apache/PHP/MariaDB/PHPMyAdmin/Nextcloud taller remains an accessible, separately labeled
legacy stack track with all original examples and eleven workshop steps preserved.
The Git workshop retains all nine steps. New content adds to the migration baseline;
the original 28 examples and 20 workshop steps are a preservation minimum, not a total
for the expanded curriculum.

## Student project

Build and operate a small **Linux Lab Notes** application:

- React + TypeScript frontend using Vite, with components for listing, adding and
  completing notes/tasks, plus loading and API error states.
- Node.js + Express JSON API with health check, validated create/update requests,
  and a simple file-backed lab data store. Explain that this small single-process
  store is a teaching fixture; database administration remains in the preserved SQL track.
- In development, Vite proxies `/api` to the Node service inside the guest.
- For the deployment exercise, Node serves the built frontend and `/api` from one
  origin; use a real HTTP server, not `vite preview` as the production service.
- Run as an unprivileged Linux user with explicit working/data directories, environment
  configuration, logs and service restart. Keep package/runtime versions pinned.

The exercise app is distinct from the course platform. It has no real Cognito/AWS
connection and runs entirely inside the browser guest. The course platform frontend
still deploys to GitHub Pages with its separately authenticated progression API.

## Main path: eleven checkpoints

| Step / stable ID | Student work | Actual completion evidence |
| --- | --- | --- |
| 1 — `modern-linux-user` | Create a learner/deployment user and project directory; set ownership | User exists, correct ownership and non-root command execution |
| 2 — `modern-linux-access` | Configure lab SSH/key access and root-login restrictions | Real local SSH success for allowed user and rejected prohibited access |
| 3 — `modern-linux-firewall` | Allow the application port and restrict other lab traffic | Real netfilter rules and accepted/blocked guest-local traffic |
| 4 — `modern-linux-protection` | Configure local SSH/fail2ban protection and inspect logs | Actual jail configuration and fixture detection/ban |
| 5 — `modern-node-install` | Install the pinned supported Node.js/npm from local packages | Runtime initially absent; successful installation and version checks |
| 6 — `modern-project-setup` | Clone the bundled starter from a local Git remote; inspect scripts and install dependencies offline | Commit identity, expected files and successful clean dependency installation |
| 7 — `modern-node-api` | Complete Express routes, validation, environment/port config and data persistence | Real health/API requests, invalid-input rejection and persisted data after restart |
| 8 — `modern-react-ui` | Complete React components/state and connect to the API through Vite | User-visible add/complete behavior, loading/error states and real API integration |
| 9 — `modern-production-build` | Type-check/test, build React, and serve build assets from Node | Fresh build artifacts, successful checks, HTML/assets/API served through one origin |
| 10 — `modern-linux-service` | Install a service unit, run as deployment user, inspect logs, restart/recover | Running systemd service, correct user, working directory, environment and restart behavior |
| 11 — `modern-local-tls` (optional) | Configure a local reverse proxy and trusted lab TLS certificate; inspect a broken configuration | Actual local TLS handshake and diagnosis; labeled lab certificate, no public certificate claim |

Keep checks tied to guest files, real process/service state, network responses and
observable application behavior. Completion never depends only on typing a command
or dismissing instructions. Provide Spanish/English hints, resettable fixtures and XP
rules for the new IDs. Optional TLS does not block required main-path completion.

## Offline installations and builds

Preload **installable artifacts**, rather than a fully installed `node_modules` tree
as the only path. Include:

1. Pinned supported Node.js/npm installation packages and OS dependencies, with the
   runtime absent in the installation exercise's initial snapshot.
2. Starter source, `package.json`, exact lockfile, local Git remotes and history,
   npm metadata/cache entries and all transitive production/dev dependencies.
3. Guest-architecture/OS/libc-specific native tooling used by the selected Vite build
   chain (for example bundler/transformer binaries); prepare inside the target guest
   platform or equivalent image build, not the developer's macOS installation.
4. Packages needed by lifecycle scripts and any local build tools, with scripts
   reviewed to ensure they do not fetch external files. npm offline mode alone does
   not prevent a child script from making its own network request.
5. Local manuals, API examples, error fixtures, environment samples, Linux service
   unit and optional reverse-proxy/TLS packages. No CDN fonts/scripts in the starter.

Planned dependency command, to verify against the selected pinned npm version:

```bash
npm ci --offline --no-audit --no-fund --cache /opt/course/npm-cache
```

Do not use `npm create vite@latest`, unpinned `npx`, external registry requests or
GitHub downloads during student execution. Include a pinned scaffold/template for
the creation exercise. Missing packages are an incomplete lab pack, not an instruction
for the learner to reconnect to the internet. Keep dependencies installed by the
learner writable while preserving the immutable pack for resets.

## Browser-runtime decision and release gates

Prioritize a 64-bit, kernel-capable browser runtime such as container2wasm for the
modern track. v86 remains a comparison for Linux basics, but its 32-bit guest limit
must not force obsolete Node/Vite versions. Do not select a runtime until the current
supported toolchain, real systemd service and offline production build pass.

Required proof, with external guest connectivity disabled and a clean fixture:

- Install Node/npm, then recreate dependencies from the bundled cache and lockfile.
- Run the Vite development server, API, type checks/tests and production build.
- Verify browser-to-guest preview, `/api` proxying and production same-origin requests.
  Prove HMR/WebSocket behavior if advertised; page reload remains a valid explicit fallback.
- Run Node under systemd as an unprivileged user; inspect logs and test restart.
- Complete all eleven checkpoints, including the optional TLS lab when selected.
- Reset and repeat without hidden packages from a previous run; preserve original
  Linux, Git and legacy stack content, translations and existing progress IDs.
- Measure image/pack sizes, cold/cached boot, memory and build time on student devices.

## Sources informing the plan

React documents Vite as an option for building a React application from scratch.
[React guidance](https://react.dev/learn/build-a-react-app-from-scratch)

Node recommends supported LTS releases for production applications.
[Node release policy](https://nodejs.org/en/about/previous-releases)

npm documents lockfile-based `ci` installs and offline configuration; verify the exact
CLI version used by the lab. [npm ci](https://docs.npmjs.com/cli/commands/npm-ci/),
[npm offline configuration](https://docs.npmjs.com/cli/v9/using-npm/config/)

Vite distinguishes build preview from a production server.
[Vite deployment guidance](https://vite.dev/guide/static-deploy.html)
