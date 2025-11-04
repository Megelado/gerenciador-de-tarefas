import { Router } from "express";

import { TasksController } from "@/controllers/TasksControllers";

import { ensureAuthenticated } from "@/middlewares/EnsureAuthenticated";
import { verifyUserAuthorization } from "@/middlewares/VerifyUserAuthorization";

const tasksRoutes = Router();
const tasksController = new TasksController();


tasksRoutes.use(ensureAuthenticated);

tasksRoutes.get("/status/:status", tasksController.filterByStatus);
tasksRoutes.get("/priority/:priority", tasksController.filterByPriority);
tasksRoutes.patch("/member/:task_id", tasksController.updateMember);
tasksRoutes.delete("/:id", tasksController.remove);
tasksRoutes.use(verifyUserAuthorization(["admin"]));
tasksRoutes.post("/", tasksController.create);
tasksRoutes.get("/", tasksController.index);
tasksRoutes.patch("/admin/:task_id", tasksController.updateAdmin);


export { tasksRoutes };