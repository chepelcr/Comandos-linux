import { ProgressRepository } from "./repositories/ProgressRepository";
import { ProgressService } from "./services/ProgressService";
import { ProgressController } from "./controllers/ProgressController";

export const progressRepository = new ProgressRepository();
export const progressService = new ProgressService(progressRepository);
export const progressController = new ProgressController(progressService);
