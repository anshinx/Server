import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { UserRoute, dbRoute, ReminderRoute } from "./lib/routes";
import cookieParser from "cookie-parser";
import cors from "cors";
import https from "https";
dotenv.config();

const options: cors.CorsOptions = {
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "X-Access-Token",
    "Authorization",
  ],
  credentials: true,
  methods: "GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE",
  origin: "http://127.0.0.1:1881",
  preflightContinue: false,
};

const app: Express = express();
const port = process.env.PORT;
//json parser for post requests
app.use(express.json());
app.use(cookieParser());
app.use(cors(options));

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});
// User Router
app.use("/api/auth", UserRoute);
// Temporary DB Router
app.use("/api/db", dbRoute);
// Reminder Router
app.use("/api/reminder", ReminderRoute);

process.on("uncaughtException", function (error) {
  console.log(error.stack);
});

app.listen(port, () => {
  console.log(
    `⚡️[Hatırlatsana]: Server is running at http://127.0.0.1:${port}`
  );
  console.log(
    `⚡️[Hatırlatsana]: Users are running at http://127.0.0.1:${port}/user`
  );
  console.log(
    `⚡️[Hatırlatsana]: Reminders are running at http://127.0.0.1:${port}/reminder`
  );
});

/*
https
  .createServer(
    {
      key: fs.readFileSync("key.pem"),
      cert: fs.readFileSync("cert.pem"),
    },
    app
  )
  .listen(port, () => {
    console.log(
      `⚡️[Hatırlatsana]: Server is running at https://127.0.0.1:${port}`
    );
    console.log(
      `⚡️[Hatırlatsana]: Users are running at https://127.0.0.1:${port}/user`
    );
    console.log(
      `⚡️[Hatırlatsana]: Reminders are running at https://127.0.0.1:${port}/reminder`
    );
  });
*/
