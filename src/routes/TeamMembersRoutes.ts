import { Router } from "express";

import { TeamMembersController } from "@/controllers/TeamMembersControllers";

import { ensureAuthenticated } from "@/middlewares/EnsureAuthenticated";
import { verifyUserAuthorization } from "@/middlewares/VerifyUserAuthorization";

const teamMembersRoutes = Router();
const teamMembersController = new TeamMembersController();

teamMembersRoutes.use(ensureAuthenticated);

teamMembersRoutes.get("/:id", teamMembersController.index);
teamMembersRoutes.use(verifyUserAuthorization(["admin"]));
teamMembersRoutes.post("/", teamMembersController.create);
teamMembersRoutes.delete("/:id", teamMembersController.remove);

export { teamMembersRoutes };
