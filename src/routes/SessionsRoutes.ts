import { Router } from "express";

import { SessionsController } from "@/controllers/SessionsControllers";

const sessionsRoutes = Router();
const sessionsController = new SessionsController();

sessionsRoutes.post("/", sessionsController.create);

export { sessionsRoutes };
