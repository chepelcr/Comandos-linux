> Historical research: the user replaced this browser-WASM approach with temporary EC2 labs. Current design: [temporary-ec2-labs.md](temporary-ec2-labs.md).

# Linux in the browser: research and revised recommendation

October 7, 2026. Documentation review only: no runtime has been embedded or benchmarked
in this repository yet. Recommendations and course-fit assessments below are engineering
judgments; documented runtime capabilities are linked separately.

**Scope update:** the user confirmed that the guest requires no internet access and
all exercise dependencies should be preloaded. `docs/offline-linux-lab.md` is now the
controlling lab specification. Network/service notes below describe research context;
hosted terminals, relays and live external integrations are not implementation scope.
The main taller subsequently moved to React/Node (`docs/modern-workshop.md`), making
a supported 64-bit Node/Vite guest a priority over v86's 32-bit integration convenience.

## Finding

A hosted VM per student is not a prerequisite for a real Linux terminal. A WebAssembly
CPU emulator can run a Linux kernel on the learner's device while Pages serves static
runtime/image assets. We should evaluate this before building a lab backend.

Distinguish three requirements: Linux execution, external internet connectivity, and
publicly reachable services. Solving the first in a browser does not automatically solve
the other two. A separate account/progress backend is still part of the original scope.

## Candidates

| Candidate | Documented behavior | Course-fit assessment |
| --- | --- | --- |
| v86 | Real x86 hardware emulation; Linux kernels; no 64-bit extensions; official bundler integration and save/restore example; BSD engine licensing. [Project](https://github.com/copy/v86), [save/restore](https://github.com/copy/v86/blob/master/examples/save_restore.html) | First prototype for an embedded Linux kernel, terminal, local files, users/permissions, editors and Git. Use a maintained 32-bit guest; do not pick obsolete Ubuntu merely to preserve apt syntax. Modern Ubuntu course parity is a limitation. |
| container2wasm | Converts container filesystems into browser/WASI artifacts running with an emulated CPU and Linux kernel; supports Ubuntu examples and multiple architectures; explicitly experimental. Browser HTTP networking uses Fetch with CORS constraints; full forwarding uses an external WebSocket helper. [Project and examples](https://github.com/container2wasm/container2wasm) | Second prototype, especially for a Debian/Ubuntu-based course image. Test actual apt/dpkg, services and kernel features. Conversion alone does not establish systemd support or usable performance. Docker is a build-time prerequisite, not necessarily a student install. |
| WebVM / CheerpX | Debian-compatible userland through x86 execution and Linux syscall emulation; root by default; Pages deployment guidance. Public internet access uses Tailscale plus an exit node. [Project](https://github.com/leaningtech/webvm) | Useful developer shell candidate, but syscall emulation is not a full guest kernel. Do not assume firewall/kernel/systemd parity. Adds vendor runtime and network dependencies. |
| JSLinux / TinyEMU | Browser OS demos include x86_64 Alpine and RISC-V guests. Hosted networking is capped at 40 kB/s and two connections per public IP. File upload/export is documented. [Systems](https://bellard.org/jslinux/), [FAQ](https://bellard.org/jslinux/faq.html) | Useful proof that client-side Linux is practical. Shared demo networking is unsuitable as a classroom dependency. Distribution/init system and custom-image integration need separate evaluation. |
| WebContainers | Browser Node.js runtime; native addons cannot execute unless compiled to WebAssembly. [Introduction](https://webcontainers.io/guides/introduction), [limitations](https://webcontainers.io/guides/troubleshooting) | Appropriate for JavaScript/Vite tutorials; does not meet this Linux administration course's kernel/services requirement. |

## Networking is the principal boundary

v86 documents a serverless internal Ethernet backend between browser guests and a
Fetch backend for restricted HTTP/HTTPS. Arbitrary TCP/UDP uses a relay. Fetch cannot
bypass browser CORS; it does not make normal SSH or unrestricted apt downloads work.
Guest-facing TCP terminal access is also documented. [v86 networking](https://raw.githubusercontent.com/copy/v86/master/docs/networking.md)

Inference for this course: start with preloaded tools, sample repositories, files,
and cached package archives. Teach actual offline installation where supported,
explicitly distinguishing it from updating repositories on the public internet.
Run web/database services inside the guest; prototype an in-browser HTTP preview bridge
before promising a rendered Apache/Nextcloud page. Browser-local access does not expose
a public server. Live GitHub SSH, arbitrary downloads and public ACME certificates
remain integration gaps until demonstrated with a suitable network path.

## Licensing, hosting, and persistence

CheerpX's current licensing documentation allows credited use by individuals (including
public educational apps) and FOSS projects through the vendor-hosted community runtime.
Self-hosting the runtime requires commercial licensing. The WebVM repository README
has narrower organizational-use wording; verify the applicable full license before
selecting it for an institution. This is not an unrestricted self-hosted engine simply
because the surrounding WebVM app is Apache licensed. [CheerpX licensing](https://cheerpx.io/docs/licensing)

CheerpX requires cross-origin isolation for SharedArrayBuffer. Its author describes a
service-worker workaround for Pages headers; verify this under the real deployment
path, updates, browser matrix and Cognito redirect flow. [CheerpX requirements](https://cheerpx.io/docs/faq),
[author's Pages deployment explanation](https://labs.leaningtech.com/blog/mini-webvm-your-linux-box-from-dockerfile-via-wasm)

Published Pages sites are limited to 1 GB, with a 100 GB/month soft bandwidth limit.
Runtime images count toward delivery size; avoid treating a multi-gigabyte disk as an
ordinary app asset. [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)

Project design: version images and hashes, cache immutable assets, and keep writable
state in browser storage where the chosen adapter supports it. Offer reset and explicit
export/import. Test storage quota/eviction and private browsing; a saved VM is separate
from Cognito course progress and does not automatically follow the learner to another
device. Ship guest-package notices/source obligations alongside engine notices.

## Course coverage to prove, not assume

| Course area | Browser-first approach | Required validation |
| --- | --- | --- |
| CLI, files, permissions, users, VI, compression | Real preinstalled tools in a guest image | Shell quoting, redirection/pipes, sudo, ownership, archive tools and reset |
| Git | Preinstalled Git and fixture repositories, including local bare remotes | Commit/branch/merge/stash exercises; external GitHub authentication is separate |
| Packages | Preloaded package cache/local repository | Actual installation/removal, dependencies, available disk; label offline workflows |
| Apache, PHP, MariaDB, PHPMyAdmin | Preinstalled dependencies and offline fixtures | Processes start, PHP executes, SQL works, HTTP preview and resource usage |
| systemd, fail2ban, firewall | Kernel-capable image configured for the exercise | Init/PID 1, cgroups, netfilter/modules, test traffic and service lifecycle |
| SSH | Guest-local or two-guest experiment | Browser networking and actual client/server communication; real GitHub remains external |
| Nextcloud and public HTTPS | Preserve complete lessons; benchmark full image separately | Image/download size, memory, working database/PHP, preview; public DNS/ACME needs external reachability |

An unavailable capability changes the exercise's execution mode, never silently
removes its original content. A client-side checker is educational feedback, not
tamper-proof proof of achievement.

## Recommended implementation change

1. Remove EC2/session-gateway infrastructure and guest internet networking from the
   implementation scope. Build a preloaded, browser-local Linux lab.
2. Prototype v86 and container2wasm behind a common `LinuxRuntimeAdapter` before
   writing a bespoke simulated shell. With the React/Node curriculum, prioritize a
   64-bit container2wasm prototype for supported Node/Vite and apt-based lessons;
   compare v86 for fundamentals without downgrading the modern toolchain.
3. Build a small reproducible image in CI with pinned packages and course fixtures.
   Measure download size, cold/cached boot, input responsiveness, memory, persistence,
   and services on representative student devices and Chrome/Firefox/Safari.
4. Publish a capability report against all 28 mapped examples and 20 workshop steps.
   Verify systemd/firewall/server preview specifically, rather than inferring them
   from a successful shell prompt. Every exercise needs a browser-local variant;
   an optional local Linux lab is supplementary.
5. Keep Cognito/SSM/Pages and progress sync. Do not require lab API/WSS parameters
   for a browser-only production build. Use local fixtures for exercises that originally
   contacted the internet; preserve their production instructions as reference material.

Success for the first prototype: Pages serves static assets; the learner boots a real
Linux kernel without creating an AWS compute session; commands change actual guest
files; reset and export work; the old SSH service and public demo relays are unnecessary.
Full course parity remains a separate acceptance gate. No performance or compatibility
numbers are claimed without running these prototypes.
