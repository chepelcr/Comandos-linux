> Historical research: the user replaced this browser-WASM approach with temporary EC2 labs. Current design: [temporary-ec2-labs.md](temporary-ec2-labs.md).

# Preloaded browser Linux lab

Confirmed scope: students execute real Linux commands inside a WebAssembly guest.
All exercise dependencies are bundled; the guest needs no public internet access.
This replaces the earlier conditional hosted-lab direction. This is an implementation
specification, not a claim that an emulator/image has already been validated.

The main application taller now uses React + Vite + Node.js/Express, specified in
`docs/modern-workshop.md`. Preserve the original stack as a separate legacy track.
Original counts are baseline preservation minimums; modern checkpoints add new IDs.

## Runtime boundary

- GitHub Pages serves the React app, emulator, kernel, image and exercise assets.
  Once the required lab assets are downloaded/cached, guest execution is local.
- Disable external guest network adapters, Fetch proxies, public relays and Tailscale.
  Permit loopback/private virtual networking entirely inside the learner's browser.
- Cognito and cloud progress synchronization remain separate online app features.
  Guest terminal execution must continue when those services are unavailable.
- Evaluate container2wasm first for a 64-bit guest capable of supported Node/Vite,
  alongside v86 for comparison. Favor apt/dpkg compatibility and verify architecture,
  offline native build dependencies, init and kernel features before selecting an image.
- No EC2 sessions, terminal API, WSS gateway or external networking service is required.

## Reproducible image and exercise packs

Use a versioned base image plus course packs where size warrants it. Fully download
and verify each required pack before enabling its exercises; do not silently stream
missing dependencies while commands execute. Build images/packs in CI with pinned
packages, dependency lock manifests, hashes and redistribution notices.

Bundle Bash, sudo, user/group tools, coreutils, find/grep/sed/awk, manual/help pages,
VI/Vim/nano, compression tools, SSH client/server, Git, apt/dpkg/local repository tools,
supported Node.js/npm packages, React/Vite/Express and all locked npm dependencies,
target-platform build binaries, the starter repository and service fixtures,
Apache, PHP and required extensions, MariaDB client/server, PHPMyAdmin, Nextcloud,
firewall tooling/modules, fail2ban and TLS tools. Include the selected init/service
manager and required cgroup/kernel support. Verify all runtime/transitive dependencies,
not just executable presence. Package install exercises start with the target package
absent and its archives/dependencies available locally.

Keep immutable base assets separate from writable learner state. Each exercise can
load/reset a known fixture without destroying unrelated course progress. Export/import
workspace files and save state where supported; detect storage quota/eviction. VM
snapshots and disks remain device-local unless explicitly exported. Account completion
sync does not imply disk sync. Check image/pack delivery against Pages limits.

## Exercise adaptation map

These are proposed offline variants. Preserve the original instructions and record
every changed endpoint, path, version and assumption in the migration manifest.

| Existing example IDs | Preloaded exercise environment | Completion evidence |
| --- | --- | --- |
| `modern-*` checkpoints | Installable Node/npm, pinned starter/lockfile and complete offline npm cache, API/frontend/service/TLS fixtures | Real clean installation, API requests, React interaction, production build and systemd service; see `modern-workshop.md` |
| `cli`, `gestion_archivos`, `crear_usuario`, `permisos`, `vi`, `compresion` | Seed files, additional users/groups and permissions, editor buffers, archive fixtures | Actual guest files, owners/modes, users/groups and archive contents |
| `paquetes`, `apache`, `php`, `mysql`, `phpmyadmin` | Local package repository/cache with all dependencies; service-specific clean starting states | Real installation/removal, installed versions, running services, PHP output and SQL results |
| `obtener`, `descargar` | Local HTTP fixture server serving the complete sample-site/Nextcloud archive | Actual wget/curl transfer, correct archive hash and extracted files |
| `configurar` | Full application files and database prerequisites, local hostnames and credentials | Working configuration, database connectivity, HTTP responses; browser-local preview |
| `ssh`, `ingreso` | Guest-local SSH server with seeded lab-only keys/users and a second port/instance where needed | Actual SSH login and failed prohibited login after configuration changes |
| `firewall` | Kernel netfilter support plus isolated test listeners/traffic entirely inside the guest | Real accepted/blocked traffic and inspectable rules; no host firewall changes |
| `fuerza` | Local authentication log fixtures and controlled failed-login attempts | Real fail2ban jail/configuration and detected/banned fixture source; verify backend behavior |
| `ssl` | Lab hostname, local certificate authority and TLS client trust; local ACME test service if retaining the Certbot flow | Real TLS handshake/certificate verification and renewal workflow where implemented; clearly marked lab certificates |
| `git_instalacion`, `git_configuracion`, `git_basicos`, `git_ramas`, `git_utiles`, `git_errores`, `git_opcionales` | Git package archives, fixture worktrees, conflict histories, keys and local verification configuration | Actual Git configuration, repository state, commits, branches, fixes and signatures |
| `git_ssh`, `git_remotos` | Guest-local SSH Git server with seeded lab keys and bare remote repositories | Actual key authentication, clone/push/pull and matching remote commit history |

Live GitHub account actions and publicly trusted certificate issuance remain production
reference instructions. Their browser exercises use local Git remotes and lab certificates;
do not claim they contacted GitHub or obtained a public certificate. Git installation on
macOS/Windows remains reference material with Linux package installation as the executable
browser exercise. All nine Git and eleven Linux workshop steps retain their content.

Local service previews need a proven browser-to-guest bridge. A terminal-side curl
response can validate service behavior, but it does not replace the planned visual
application preview. Prototype this before accepting the server/application workshop.

## Acceptance gates

1. Boot a real Linux kernel, run actual commands, and inspect guest state through the
   runtime adapter. Do not implement success by matching a typed command string.
2. For each of the original 28 example mappings and 20 workshop steps, plus every new
   modern-track checkpoint, define required tools,
   initial fixture, execution instructions, expected effects, reset and validation.
3. Prove systemd/init, netfilter, fail2ban, SSH, package installs and web/database services
   on the selected image. If an engine/image cannot cover them, evaluate the other
   browser runtime or revise the image; do not replace those exercises with pretend output.
4. With required assets loaded, block external guest connectivity and complete every
   browser-local exercise. Use two fresh sessions to prove repeatability and isolation.
5. Measure image/pack size, cold/cached boot, typing latency, memory, browser/device
   support, persistence, reset and export/import. Publish measured results and limits.
6. Check that browser-local certificates/remotes are identified honestly, original
   production content is preserved, and completion/XP remains idempotent.
7. Verify a clean offline Node/npm installation and dependency installation, React/Vite
   development/build, Express API, application preview and unprivileged service startup.

The implementation cannot be declared complete until all browser exercise variants
pass. Unsupported-device messaging and an optional local lab are useful additions,
but are not substitutes for meeting this agreed browser-lab scope.
