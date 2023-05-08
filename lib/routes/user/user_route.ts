"use strict";

import express, { Router } from "express";
import DatabaseClient from "../../scripts/db_connection";
import crypto from "crypto";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { MongoClient, ObjectId } from "mongodb";
import isEmailValid from "../../scripts/email_validator";
import mailer from "../../scripts/nodemailer";
import path from "path";
//Config
dotenv.config();
const domain = "127.0.0.1:1881";

const UserRoute = Router();
const key = process.env.SECRET_KEY || "totallysecretkey";
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/";

const db = new DatabaseClient(new MongoClient(mongoUri));

UserRoute.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../templates/hello.html"));
});

UserRoute.get("/tr", (req, res) => {
  res.status(201).json({ code: "101" });
});

UserRoute.post(
  "/create",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const body = req.body;
    //Getting body items seperated. only getting needed params
    const username: string = body.username;
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
        .setHeader("error", "ERR_PARAMS_MISSING")
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
      .insertOne({
        username: username.toLowerCase().trim(),
        name: name.trim(),
        surname: surname.trim(),
        password: hashedPassword,
        email: email.trim(),
        created_at: new Date().valueOf(),
        email_verified: false,
      })
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
        const token = jwt.sign(
          { email, username: username.toLowerCase().trim(), name, surname },
          key,
          {
            expiresIn: "1d",
          }
        );
        const refreshToken = jwt.sign(
          { username: username.toLowerCase().trim() },
          key,
          {
            expiresIn: "7d",
          }
        );

        res.cookie("auth-token", token, {
          httpOnly: true,
          maxAge: 1000 * 60 * 60 * 1,
        });
        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          maxAge: 1000 * 60 * 60 * 7,
        });
        //Send token to setHeader
        res.setHeader("auth-token", token).sendStatus(200);
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
          const refreshToken = jwt.sign({ username: user.username }, key, {
            expiresIn: "7d",
          });
          //Inserting tokens to cookies
          res.cookie("auth-token", token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 7,
          });
          res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 7,
          });

          //end of response
          res.setHeader("auth-token", token);

          //End of response
          res.setHeader("ref-token", refreshToken).json({ success: "yes" });
        });
    } else if (username) {
      //Check if username is exists
      db.db
        .collection("users")
        .findOne({ username: username.toLowerCase().trim() })
        .then((user) => {
          if (!user)
            return res.status(404).json({ error: "ERR_USER_NOT_FOUND" });
          //Checking password
          if (user.password !== hashedPassword)
            return res.status(401).json({ error: "ERR_WRONG_PASSWORD" });
          //!Not sending password for obvious security reasons
          user.password = undefined;
          //Signing token and refreshToken
          const token = jwt.sign(user, key, {
            expiresIn: "1d",
          });
          const refreshToken = jwt.sign({ username: user.username }, key, {
            expiresIn: "7d",
          });
          //Inserting tokens to cookies
          res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 7,
          });
          res.cookie("auth-token", token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 7,
          });
          res.setHeader("auth-token", token);

          //End of response
          res.setHeader("ref-token", refreshToken).json({ success: "yes" });
        });
    }
  }
);

UserRoute.get("/reAuth", authenticateToken, (req, res) => {
  res.json(req.body.user);
});

//Exchange expired auth-token with refreshToken
UserRoute.post(
  "/refresh",
  async (req: express.Request, res: express.Response) => {
    const refreshToken = req.body.refreshToken;
    console.log("refresh");
    jwt.verify(refreshToken, key, (err: any, id: any) => {
      if (err) return res.sendStatus(403);
      console.log("verified");
      db.db
        .collection("users")
        .findOne({ username: id.username })
        .then((user) => {
          if (user != null) {
            user.password = undefined;
            const token = jwt.sign({ user }, key, {
              expiresIn: "1d",
            });
            const renewedRefreshToken = jwt.sign(
              { username: user.username },
              key,
              {
                expiresIn: "7d",
              }
            );
            res
              .cookie("auth-token", token)
              .cookie("refreshToken", renewedRefreshToken)
              .status(200)
              .send({
                refreshed: "refreshed",
              });
          } else {
            return res.status(400).send("not found");
          }
        })
        .catch((err) => {
          console.error(err);
        });
    });
  }
);

//Mail verification
UserRoute.get(
  "/verifyViaEmail",
  (req: express.Request, res: express.Response) => {
    const query = req.query;

    //Seperating query

    const verificationToken: any = query.token;
    let _id;
    jwt.verify(verificationToken, key, (err: any, user: any) => {
      /*  console.log(err);
       */
      if (err) return res.sendStatus(403);
      const coll = db.db
        .collection("users")
        .findOneAndUpdate(
          { username: user.username },
          { $set: { email_verified: true } }
        )
        .then((user) => {
          if (!user.value) return;
          return res.status(200).send(user.value.username);
        });
    });
  }
);

UserRoute.get("/sendVerifier", (req, res) => {
  const authToken = req.cookies["auth-token"];
  jwt.verify(authToken, key, (err: any, user: any) => {
    const verificationKey = jwt.sign(
      { userID: user._id, username: user.username },
      key
    );
    mailer(
      user.username,
      createVerification(verificationKey),
      user.email,
      "Hatırlatsana'ya Hoşgeldin"
    );
    res.status(200).send("SENT");
  });
});

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
export function authenticateToken(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): express.Response<any, Record<string, any>> | undefined {
  const authsetHeader = req.headers["authorization"];
  const token = authsetHeader && authsetHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, key, (err: any, user: any) => {
    /*   console.log(err);/*  */
    req.body.user = user;
    if (err) return res.status(403).json(err);

    next();
  });
}
function createVerification(token: string) {
  return `${domain}/user/verifyViaEmail?token=${token}`;
}
export default UserRoute;
