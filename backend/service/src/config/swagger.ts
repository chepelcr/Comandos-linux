import { readFileSync } from "node:fs";
import path from "node:path";
import type { Express } from "express";
import swaggerJsdoc from "swagger-jsdoc";
import { openApiDefinition } from "./openapiDefinition";

function loadSpec(): Record<string, unknown> {
  if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return swaggerJsdoc({
      definition: openApiDefinition,
      apis: [path.join(process.cwd(), "src/controllers/*.ts")],
    }) as Record<string, unknown>;
  }
  try {
    return JSON.parse(readFileSync(path.join(process.cwd(), "swagger-spec.json"), "utf8"));
  } catch (error) {
    console.error("Failed to load swagger-spec.json", error);
    return { ...openApiDefinition, paths: {} };
  }
}

export function setupSwagger(app: Express): void {
  const spec = loadSpec();
  app.get("/api-docs/swagger.json", (_req, res) => res.json(spec));
  app.get("/api-docs", (_req, res) => res.redirect(301, "/api-docs/"));
  app.get("/api-docs/", (_req, res) => res.type("html").send(`<!doctype html>
<html><head><title>API documentation</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css"></head>
<body><div id="swagger-ui"></div>
<script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
<script>SwaggerUIBundle({url:'/api-docs/swagger.json',dom_id:'#swagger-ui',deepLinking:true});</script>
</body></html>`));
}
