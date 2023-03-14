import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { UserRoute, dbRoute } from "./lib/routes";
import cookieParser from "cookie-parser";
dotenv.config();

const app: Express = express();
const port = process.env.PORT;
//json parser for post requests
app.use(express.json());
app.use(cookieParser());
app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});
// User Router

app.use("/user", UserRoute);
// Temporary DB Router
app.use("/db", dbRoute);

process.on("uncaughtException", function (error) {
  console.log(error.stack);
});

app.listen(port, () => {
  console.log(
    `⚡️[Hatırlatsana]: Server is running at http://localhost:${port}`
  );
});
