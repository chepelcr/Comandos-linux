# Generated deployment

Inspect the exact boundary inventory in `deployment-map.json` before deployment.

```bash
bash deploys/deploy-all.sh prod <aws-profile> --plan
bash deploys/deploy-all.sh prod <aws-profile>
bash deploys/deploy-sam-stacks.sh prod <aws-profile>
```

The full command deploys Lambda first, separate event stacks second, and API
Gateway last. The SAM-stacks command deploys the Lambda boundary or boundaries
only. Delete CloudFormation stacks manually in reverse order. The only stack the
scripts delete is a Lambda stack left empty in ROLLBACK_COMPLETE by a failed first
create, which CloudFormation cannot update.

The Express application is bundled as lambda-package.zip; no Dockerfile or ECR repository is required.

Express event resources share the Lambda stack and cannot be deployed separately.

No hosted CI/CD provider was selected. Add deployment.ci_cd.providers to generate GitHub Actions, CodePipeline, or both.

Database migration generation was not enabled in this manifest.

API settings resolve from COGNITO_POOL_ID, API_DOMAIN and HOSTED_ZONE_ID, then the manifest defaults, then SSM: /linux-lab/<env>/linux-lab-progress/api/cognito-pool-id (Cognito pool id), /linux-lab/<env>/linux-lab-progress/api/domain and /linux-lab/<env>/linux-lab-progress/api/hosted-zone-id; a missing hosted zone is looked up in Route 53. The API deploy creates the SAM artifact bucket when missing, always publishes the stage, and ends with a 401/CORS smoke test.

Cognito, Route 53 hosted zones, and database/config secrets are environment
prerequisites and are not created by these scripts.
