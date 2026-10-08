import "dotenv/config";
import { ExpressAppConfig } from "./config/ExpressAppConfig";
import { APP_CONFIG } from "./config/app";

const app = new ExpressAppConfig().getApp();
app.listen(APP_CONFIG.PORT, "127.0.0.1", () => {
  console.log(`linux-lab-progress listening at http://127.0.0.1:${APP_CONFIG.PORT}`);
  console.log(`OpenAPI UI: http://127.0.0.1:${APP_CONFIG.PORT}/api-docs/`);
});
