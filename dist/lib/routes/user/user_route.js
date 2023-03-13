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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongodb_1 = require("mongodb");
const email_validator_1 = __importDefault(require("../../scripts/email_validator"));
dotenv_1.default.config();
const UserRoute = (0, express_1.Router)();
const key = process.env.SECRET_KEY || "";
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/";
const db = new db_connection_1.default(new mongodb_1.MongoClient(mongoUri));
UserRoute.get("/create", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    const username = body.username;
    const name = body.name;
    const surname = body.surname;
    const email = body.email;
    const password = body.password;
    //Hash password
    const hashedPassword = crypto_1.default
        .createHmac("sha256", key)
        .update(password)
        .digest("hex");
    //Check if all params are present
    if (!name || !surname || !email || !password || !username)
        return res.status(418).json({ error: "ERR_PARAMS_MISSING" });
    //Email Validation
    if (!(0, email_validator_1.default)(email))
        return res.status(422).json({ error: "ERR_EMAIL_INVALID" });
    //Check if username and email are unique
    yield db.db
        .collection("users")
        .createIndex({ email: 1 }, { unique: true })
        .catch((err) => {
        return res.status(500).json({ error: err });
    });
    yield db.db
        .collection("users")
        .createIndex({ username: 1 }, { unique: true })
        .catch((err) => {
        return res.status(500).json({ error: err });
    });
    //Insert user
    yield db.db
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
        const token = jsonwebtoken_1.default.sign({ email, password, username }, key, {
            expiresIn: "1h",
        });
        //Send token
        res.header("auth-token", token).json(token);
        /*         return res.status(201).json({ success: "success" }); */
    });
}));
UserRoute.get("/test", authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send(yield db.find("users", {}));
}));
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    console.log(token);
    if (token == null)
        return res.sendStatus(401);
    jsonwebtoken_1.default.verify(token, process.env.TOKEN_SECRET, (err, user) => {
        console.log(err);
        if (err)
            return res.sendStatus(403);
        req.user = user; //TODO: Check if user exists ;)
        next();
    });
}
exports.default = UserRoute;
