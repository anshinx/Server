"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dbRoute = (0, express_1.Router)();
dbRoute.get("/", (request, response) => {
    response.send("Reached");
});
exports.default = dbRoute;
