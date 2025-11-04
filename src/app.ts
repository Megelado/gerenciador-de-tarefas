import express from "express";
import "express-async-errors";

import { routes } from "./routes/Index";
import { errorHandling } from "./middlewares/ErrorHandling";

const app = express();

app.use(express.json());
app.use(routes);

app.use(errorHandling);

export { app };
