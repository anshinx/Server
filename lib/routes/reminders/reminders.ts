import { Router } from "express";
import { MongoClient } from "mongodb";
import DatabaseClient from "../../scripts/db_connection";
import { authenticateToken } from "../user/user_route";

const ReminderRoute = Router();

const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/";

const db = new DatabaseClient(new MongoClient(mongoUri));

ReminderRoute.post("/setReminder", authenticateToken, (req, res) => {
  const body = req.body;
  const REMINDER_NAME = body.REMINDER_NAME;
  const REMINDER_VALUE = body.REMINDER_VALUE;
  const REMINDER_CHECK = false;
  const REMINDER_TYPE = body.REMINDER_TYPE;
  const REMINDER_CREATED_AT = new Date().valueOf();
  db.db
    .collection("reminder")
    .insertOne({
      user_id: req.body.user._id,
      _name: req.body.user.username,
      REMINDER_CHECK,
      REMINDER_NAME,
      REMINDER_TYPE,
      REMINDER_VALUE,
      REMINDER_CREATED_AT,
    })
    .then((val) => {
      res.json(val);
    });
});

ReminderRoute.get("/", authenticateToken, (req, res) => {
  res.send("OK");
});

export default ReminderRoute;
