"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_connection_1 = __importDefault(require("../../scripts/db_connection"));
const crypto_1 = __importDefault(require("crypto"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongodb_1 = require("mongodb");
dotenv_1.default.config();
const UserRoute = (0, express_1.Router)();
const key = "secret";
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/";
const db = new db_connection_1.default(new mongodb_1.MongoClient(mongoUri));
UserRoute.get("/create", (req, res, next) => {
    const body = req.body;
    const name = body.name;
    const surname = body.surname;
    const email = body.email;
    const password = body.password;
    const hashedPassword = crypto_1.default
        .createHmac("sha256", key)
        .update(password)
        .digest("hex");
    if (!name || !surname || !email || !password)
        return res.status(418).json({ error: "ERR_PARAMS_MISSING" });
    // return res.status(200).json({ name, surname, email, hashedPassword });
    try {
        db.connectDB().then(() => {
            try {
                db.insertOne("users", {
                    name,
                    surname,
                    email,
                    password: hashedPassword,
                });
                res.sendStatus(200);
            }
            catch (err) {
                res.status(500).json({ error: err });
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: "ERR_INTERNAL_SERVER_ERROR" });
    }
});
UserRoute.get("/test", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(yield db.find("users", {}));
}));
exports.default = UserRoute;
