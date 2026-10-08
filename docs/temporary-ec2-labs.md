# Temporary EC2 laboratories

The October 7 user request supersedes the earlier browser-WASM design. Student
terminals now use real Debian amd64 EC2 instances and AWS Session Manager.

## Account ownership and lifecycle

A single private S3 object keyed by the SHA-256 Cognito subject is the account-wide
lock. Conditional ETag writes enforce one active lab across routes, tabs and devices.
The caller cannot supply an owner, instance ID, IAM role or EC2 image. Start accepts
only mapped learning path IDs. One lab persists across the lessons in that path;
switching paths requires ending it. End marks the lock as ending before terminating AWS
sessions and the instance; it releases the lock only after AWS accepts termination.
Starting a different lab while the lock is starting/running/ending returns HTTP 409.

Logout always calls the authenticated End endpoint, even if this browser has no local
lab state. HTTP 202 means a launch is still being torn down: the client waits and
retries without clearing Cognito credentials. A failed termination leaves the user
signed in with a retry message. A launch that races with logout checks its lock after
RunInstances and immediately terminates the newly created instance.

Trusted user interaction in the learning workspace updates server-side activity.
Hidden tabs and automatic terminal protocol replies do not renew inactivity. The server reaper runs every minute
and terminates after 30 minutes of inactivity or 90 minutes from the original start.
A separate one-shot EventBridge Scheduler target terminates EC2 at the absolute
90-minute deadline; the AMI also has a local systemd safety timer. AWS scheduled
invocations have minute-level precision and can be delayed by service failures;
the local timer and reaper provide independent fallbacks. Reconnects and activity
never extend the absolute deadline. End/logout delete the EC2 root volume.

The initial service has four shared lab slots, t3.small instances, 24-GiB encrypted
gp3 root volumes and standard CPU credits. Four durable S3 slots acquired with conditional writes prevent concurrent launches
from exceeding the cap. Slots are released only after EC2 teardown is confirmed;
a three-minute grace period protects launches still in flight. The two private interface endpoints
have ongoing AWS charges even with zero active student instances.

## Isolation boundary

Student VPC: no internet gateway, NAT, peering, transit routes or public IPs. Instance
SG: no inbound rules and outbound TCP 443 only to the private management endpoint SG.
There is no student-to-student SG rule or other-account network connection. Separate
SSM and ssmmessages interface endpoints admit only the course instance role and its
five agent registration/channel actions. Student instances have no S3, Parameter
Store, Secrets Manager, EC2, Cognito, database or general account access permissions.
IMDSv2 is required. The instance role is restricted to requests through this VPC,
so copied instance credentials do not work from a public AWS endpoint. The minimal instance role is intentionally treated as visible to
a student with root in their own VM; its policy is the credential isolation boundary.
The backend's broader lifecycle permissions never reach the VM or browser.

The browser receives only a short-lived SSM session channel token, kept in memory,
and an allow-listed AWS WSS URL. It receives no AWS access keys or account IAM role.
SSM provides encrypted transport with no SSH port, public VM address or reverse proxy.

## Image pipeline

`prepare-ec2-pack.sh` reuses the course's Debian offline cache, starter lockfile,
Node 24 installable package, APT dependencies, validators and Nextcloud fixture.
`build-ec2-image.mjs` creates a temporary builder in a **different** network, with
outbound package access and no inbound ports. It verifies the immutable pack hash,
installs the base tools, prepares the local APT repository and runs actual offline
Node/npm install, tests and React builds before snapshotting. It removes builder
registration, user data and host keys. The temporary builder and its network are
removed in a finally block. Only the baked image enters the isolated student VPC;
student startup requires no downloads.

Preserve the original production instructions alongside the offline lab commands.
Do not deploy the abandoned WebAssembly runtime to GitHub Pages.

## Validation gates

Unit coverage includes competing starts, account isolation, explicit end, logout
during provisioning, failed teardown, idle expiry and absolute expiry despite input.
The browser data-channel codec checks frame lengths, SHA-256 digests and UTF-8.
Deployment is complete only after a real isolated instance boots, the terminal
handshake works, offline exercises pass, prohibited networking is unreachable and
End/logout remove the instance and root volume. See deployment-state.json and
verification.md for the latest executed checks; a valid template alone is not proof.
