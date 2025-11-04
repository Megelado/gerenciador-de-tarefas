import { Router } from "express";

import { TasksHistoryController } from "@/controllers/TasksHistoryController";

import { ensureAuthenticated } from "@/middlewares/EnsureAuthenticated";
import { verifyUserAuthorization } from "@/middlewares/VerifyUserAuthorization";

const tasksHistoryRoutes = Router();
const tasksHistoryController = new TasksHistoryController();

tasksHistoryRoutes.use(ensureAuthenticated);

tasksHistoryRoutes.use(verifyUserAuthorization(["admin"]));
tasksHistoryRoutes.get("/:task_id", tasksHistoryController.index);

tasksHistoryRoutes.use(ensureAuthenticated);

export { tasksHistoryRoutes };
