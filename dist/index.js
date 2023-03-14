"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const routes_1 = require("./lib/routes");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT;
//json parser for post requests
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.get("/", (req, res) => {
    res.send("Express + TypeScript Server");
});
// User Router
app.use("/user", routes_1.UserRoute);
// Temporary DB Router
app.use("/db", routes_1.dbRoute);
process.on("uncaughtException", function (error) {
    console.log(error.stack);
});
app.listen(port, () => {
    console.log(`⚡️[Hatırlatsana]: Server is running at http://localhost:${port}`);
});
