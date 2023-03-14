"use strict";

import express, { Router } from "express";
import DatabaseClient from "../../scripts/db_connection";
import crypto from "crypto";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { MongoClient } from "mongodb";
import isEmailValid from "../../scripts/email_validator";
import mailer from "../../scripts/nodemailer";

dotenv.config();

const UserRoute = Router();
const key = process.env.SECRET_KEY || "";
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/";

const db = new DatabaseClient(new MongoClient(mongoUri));

UserRoute.post(
  "/create",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const body = req.body;
    //Getting body items seperated. only getting needed params
    const username = body.username.toString().toLowerCase;
    const name = body.name;
    const surname = body.surname;
    const email = body.email;
    const password = body.password;

    //Hashing password

    const hashedPassword = crypto
      .createHmac("sha256", key)
      .update(password)
      .digest("hex");

    //Check if all params are present
    if (!name || !surname || !email || !password || !username)
      return res
        .header("error", "ERR_PARAMS_MISSING")
        .status(418)
        .json({ error: "ERR_PARAMS_MISSING" });

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
        //Checking what is present
        if (Object.keys(err.keyValue)[0] === "email")
          return res.status(406).json({ error: "ERR_EMAIL_ALREADY_EXIST" });

        if (Object.keys(err.keyValue)[0] === "username")
          return res.status(406).json({ error: "ERR_USERNAME_ALREADY_EXIST" });
        //other internal server error
        return res.status(500).json({ error: err });
      })
      .then(() => {
        //Generate token
        const token = jwt.sign({ email, password, username }, key, {
          expiresIn: "1d",
        });
        //Send token to header
        res.header("auth-token", token);
      });
  }
);

UserRoute.post(
  "/login",
  async (req: express.Request, res: express.Response) => {
    const body = req.body;
    //Seperating body items . Only getting required items
    const username = body.username;
    const password = body.password;
    const email = body.email;

    //Hashing password for comparing
    const hashedPassword = crypto
      .createHmac("sha256", key)
      .update(password)
      .digest("hex");

    //Check if email is present. If not, check if username is present
    if (!email && !username)
      return res.status(418).json({ error: "ERR_PARAMS_MISSING" });
    if (email) {
      //Check if email is valid
      if (!isEmailValid(email))
        return res.status(422).json({ error: "ERR_EMAIL_INVALID" });
      db.db
        .collection("users")
        .findOne({ email })
        .then((user) => {
          if (!user)
            return res.status(404).json({ error: "ERR_USER_NOT_FOUND" });
          //Checking if password is true
          if (user.password !== hashedPassword)
            return res.status(401).json({ error: "ERR_WRONG_PASSWORD" });
          // ! Not Setting password hash for security
          user.password = undefined;
          //signing token with user creds
          const token = jwt.sign({ user }, key, {
            expiresIn: "1d",
          });
          //signing refreshToken for further use cases
          const refreshToken = jwt.sign({ _id: user._id }, key, {
            expiresIn: "7d",
          });
          //Inserting tokens to cookies
          res.cookie("authToken", token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 7,
          });
          res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 7,
          });

          //end of response
          res.header("auth-token", token).json({ success: "success" });
        });
    } else {
      //Check if username is exists
      db.db
        .collection("users")
        .findOne({ username })
        .then((user) => {
          if (!user)
            return res.status(404).json({ error: "ERR_USER_NOT_FOUND" });
          //Checking password
          if (user.password !== hashedPassword)
            return res.status(401).json({ error: "ERR_WRONG_PASSWORD" });
          //!Not sending password for security reasons
          user.password = undefined;
          //Signing token and refreshToken
          const token = jwt.sign(user, key, {
            expiresIn: "1d",
          });
          const refreshToken = jwt.sign(user.username, key, {
            expiresIn: "7d",
          });
          //Inserting tokens to cookies
          res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 7,
          });
          res.header("auth-token", token);
          //End of response 
          res.header("ref-token", refreshToken).json({ success: "success" });
        });
    }
  }
);
//Exchange expired auth-token with refreshToken
UserRoute.post(
  "/refresh",
  async (req: express.Request, res: express.Response) => {
    const refreshToken = req.cookies.refreshToken;
    console.log(req.cookies);
    jwt.verify(refreshToken, key, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      const token = jwt.sign({ user: user }, key, {
        expiresIn: "1d",
      });
      res.cookie("auth-token", token).json({ success: "success" });
    });
  }
);
//Temporary tests
UserRoute.get(
  "/test",
  authenticateToken,
  async (req: any, res: express.Response) => {
    db.db.collection("users").deleteMany({});
    res.status(200).json(req.body.user);
  }
);
//AuthenticateToken middleware
function authenticateToken(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, key, (err: any, user: any) => {
    console.log(err);
    req.body.user = user;
    if (err) return res.sendStatus(403);

    next();
  });
}

export default UserRoute;
