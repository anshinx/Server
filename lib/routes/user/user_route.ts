import express, { Router } from "express";
import DatabaseClient from "../../scripts/db_connection";
import crypto from "crypto";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { MongoClient } from "mongodb";
import isEmailValid from "../../scripts/email_validator";

dotenv.config();

const UserRoute = Router();
const key = process.env.SECRET_KEY || "";
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/";

const db = new DatabaseClient(new MongoClient(mongoUri));

UserRoute.get(
  "/create",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const body = req.body;

    const username = body.username;
    const name = body.name;
    const surname = body.surname;
    const email = body.email;
    const password = body.password;
    //Hash password
    const hashedPassword = crypto
      .createHmac("sha256", key)
      .update(password)
      .digest("hex");

    //Check if all params are present
    if (!name || !surname || !email || !password || !username)
      return res.status(418).json({ error: "ERR_PARAMS_MISSING" });

    //Email Validation
    if (!isEmailValid(email))
      return res.status(422).json({ error: "ERR_EMAIL_INVALID" });

    //Check if username and email are unique
    await db.db
      .collection("users")
      .createIndex({ email: 1 }, { unique: true })
      .catch((err) => {
        return res.status(500).json({ error: err });
      });
    await db.db
      .collection("users")
      .createIndex({ username: 1 }, { unique: true })
      .catch((err) => {
        return res.status(500).json({ error: err });
      });
    //Insert user
    await db.db
      .collection("users")
      .insertOne({ username, name, surname, password: hashedPassword, email })
      .catch((err) => {
        if (Object.keys(err.keyValue)[0] === "email")
          return res.status(406).json({ error: "ERR_EMAIL_ALREADY_EXIST" });

        if (Object.keys(err.keyValue)[0] === "username")
          return res.status(406).json({ error: "ERR_USERNAME_ALREADY_EXIST" });

        return res.status(500).json({ error: err });
      })
      .then(() => {
        //Generate token
        const token = jwt.sign({ email, password, username }, key, {
          expiresIn: "1h",
        });
        //Send token
        res.header("auth-token", token).json(token);

        /*         return res.status(201).json({ success: "success" }); */
      });
  }
);

UserRoute.get(
  "/test",
  authenticateToken,
  async (req: express.Request, res: express.Response) => {
    res.send(await db.find("users", {}));
  }
);

function authenticateToken(
  req: any,
  res: express.Response,
  next: express.NextFunction
) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  console.log(token);
  if (token == null) return res.sendStatus(401);

  jwt.verify(
    token,
    process.env.TOKEN_SECRET as string,

    (err: any, user: any) => {
      console.log(err);
      if (err) return res.sendStatus(403);

      req.user = user; //TODO: Check if user exists ;)

      next();
    }
  );
}

export default UserRoute;
