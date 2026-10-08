# Branded Cognito messages

Eight table-based, responsive HTML templates cover signup/resend, password reset,
email verification and admin invitations in Spanish and English. Adapted from the
user-space Cognito Custom Emails skill. SES templates are the design source; a thin
CustomMessage resolver preserves Cognito placeholders and falls back when missing.

PACIFIC-PROD us-east-1 currently has SES **sandbox** access and a verified
`jcampos.dev` identity. Returning `emailMessage` from CustomMessage with
COGNITO_DEFAULT fails with InvalidLambdaResponseException according to current
AWS documentation. The older sandbox workaround in the skill is not applied.

Templates and the trigger can be deployed now, but custom rendering stays disabled
until SES production access is approved. This keeps public registration available
through Cognito's default sender. Once approved, wire DEVELOPER sending with
`Linux Lab <linux-lab@jcampos.dev>`, enable the trigger and redeploy the account stack.
No messages are sent by uploading templates, previewing them, or invoking the
handler with a synthetic event. Real delivery must be verified after SES approval.

See https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-custom-message.html

The user chose to keep these templates prepared for later. Do not submit an SES
production-access request or enable branded delivery as part of this implementation.
