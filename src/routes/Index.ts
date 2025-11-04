import { Router } from "express";

import { usersRoutes } from "./UsersRoutes";
import { sessionsRoutes } from "./SessionsRoutes";
import { teamsRoutes } from "./TeamsRoutes";
import { teamMembersRoutes } from "./TeamMembersRoutes";
import { tasksRoutes } from "./tasksRoutes";
import { tasksHistoryRoutes } from "./TasksHistoryRoutes";

const routes = Router();
routes.use("/users", usersRoutes);
routes.use("/sessions", sessionsRoutes);
routes.use("/teams", teamsRoutes);
routes.use("/team_members", teamMembersRoutes);
routes.use("/tasks", tasksRoutes);
routes.use("/tasks_history", tasksHistoryRoutes);

export { routes };
