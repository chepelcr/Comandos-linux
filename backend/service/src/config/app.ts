export const APP_CONFIG = {
  PORT: Number.parseInt(process.env.PORT ?? "5000", 10),
  NODE_ENV: process.env.NODE_ENV ?? "development",
  AWS_REGION: process.env.AWS_REGION ?? "us-east-1",
  ALLOWED_ORIGINS: ["https://linux.jcampos.dev", "http://localhost:5173", "http://127.0.0.1:5173"] as string[],
} as const;
