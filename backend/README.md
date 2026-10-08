# Course progress backend

Scaffolded using the user-space BE Builder Express standalone generator from
`manifest.json`. The generated controller/service/repository and explicit dependency
injection boundaries are used by the running app. Domain adaptations are deliberate:

- Private S3 JSON objects replace the generated PostgreSQL repository; this course
  does not require a database. Unused generated SQL entities, credentials and migration scripts were removed
  so the service and its dependencies have no database requirement.
- `/me` derives ownership solely from API Gateway's verified Cognito access token.
  There is no caller-controlled learner ID or user-header bypass, including locally.
- S3 ETag conditional writes retry races without losing concurrent completions. Arrays of known lesson IDs are deduplicated; XP
  comes from versioned course rules, never request points. Reading and browser
  exercise reports remain distinct. Reports are not certification or leaderboard proof.
- Reset retains an empty tombstone with a new epoch so stale offline devices cannot
  restore erased progress. Account deletion revokes the Cognito user and removes data.
- The live contract is `service/openapi.json`. Packaging runs the generated build
  script with this contract and bundles `service/lambda.cts` to one Lambda.
- `../infra/progress-api.yml` is the active combined Lambda/HTTP API/private S3 stack.
  Generated SQL/API scaffolding deploy scripts are reference only; use the root
  deployment script, which owns accounts → artifact bucket → API → SSM → OIDC.

Run `npm ci --prefix backend/service`, `npm run check --prefix backend/service`,
`npm test`, and `npm run backend:bundle`. No live SQL migrations are needed.

The bucket blocks all public access, requires HTTPS, and encrypts objects. Only the
API role can read/write `progress/*`; browsers never receive S3 credentials or URLs.
Each Cognito subject owns one JSON snapshot. The bucket intentionally has no object
versioning so account deletion removes the retained progression object completely.
The earlier DynamoDB table was confirmed empty and removed after the S3 live
checks passed. The application does not use a database.

Cloud verification includes an actual temporary Cognito account (email suppressed),
Amplify SRP sign-in, API Gateway JWT validation, and S3 save/read/reset. The route
requires aws.cognito.signin.user.admin, available to both the managed OAuth login
and Amplify user-pool sign-in. The handler additionally requires token_use=access.
The smoke account and its object are deleted after the test; no emails are sent.

The temporary lab domain is separate from progress storage:
`service/src/labs/LabLifecycle.ts` owns the account-wide conditional lock, provisioning
race handling, idle expiry and teardown; `AwsLab.ts` adapts it to S3/EC2/SSM/Scheduler.
`infra/temporary-labs.yml` owns the isolated VPC and a separate lifecycle Lambda.
The same Cognito JWT HTTP API routes `/labs` to that Lambda. No new public frontend
configuration is needed; SSM's existing API URL serves both domains. The backend
workflow updates both exact function ARNs after the lab stack is deployed.
See `../docs/temporary-ec2-labs.md` for permissions, limits and the AMI pipeline.
