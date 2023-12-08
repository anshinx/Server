import { Router } from "express";
import { MongoClient } from "mongodb";
import DatabaseClient from "../../scripts/db_connection";
import { authenticateToken } from "../user/user_route";
import { v4 as uuidv4 } from "uuid";

const ReminderRoute = Router();

const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/";

const db = new DatabaseClient(new MongoClient(mongoUri));

interface Reminder {
  _id: string;
  title: string;
  description?: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  location: string;
  isRecurring: boolean;
  recurringDays?: string[];
  isPrivate: boolean;
  isImportant: boolean;
  isCompleted: boolean;
  isDeleted: boolean;
  isShared: boolean;
  sharedWith?: string[];
  sharedBy?: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
  banner?: string;
  reminderType: string;
  attendees: string[];
  qrLink: string;
  isOnline: boolean;
  onlineLink?: string;
  onlinePassword?: string;
  onlineMeetingId?: string;
  platform?: string;
  sponsor?: string;
  sponsorLink?: string;
}

ReminderRoute.post("/createReminder", authenticateToken, async (req, res) => {
  //Todo: Create Reminder

  const { body } = req;
  await db.db.collection("reminders").insertOne({
    title: body.title,
    desc: body.desc,
    date: Date.now,
    startTime: body.startTime,
    endTime: body.endTime,
    location: body.location,
    isReccuring: body.isReccuring,
    reccuringDays: body.reccuringDays,
    isPrivate: body.isPrivate,
    isImportant: body.isImportant,
    isCompleted: false,
    isDeleted: false,
    isShared: false,
    sharedBy: [],
    createdBy: body.user?.id,
    banner: body.banner,
    reminderType: body.reminderType,
    onlineLink: body.onlineLink,
    onlinePassword: body.onlinePassword,
    onlineMeetingId: body.onlineMeetingId,
    platform: body.platform,
    sponsor: body.sponsor,
    sponsorLink: body.sponsorLink,
    qrLink: body.qrLink,
  });
});

ReminderRoute.get("/", authenticateToken, (req, res) => {
  res.send("OK");
});

export default ReminderRoute;
