import { Router } from "express";

import { TeamsController } from "@/controllers/teamsControllers";

import { ensureAuthenticated } from "@/middlewares/EnsureAuthenticated";
import { verifyUserAuthorization } from "@/middlewares/VerifyUserAuthorization";

const teamsRoutes = Router();
const teamsController = new TeamsController();

teamsRoutes.use(ensureAuthenticated);

teamsRoutes.get("/:id", teamsController.tasksTeam);

teamsRoutes.use(verifyUserAuthorization(["admin"]));
teamsRoutes.post("/", teamsController.create);
teamsRoutes.get("/", teamsController.index);
teamsRoutes.patch("/update/:id", teamsController.update);
teamsRoutes.delete("/:id", teamsController.remove);

export { teamsRoutes };
