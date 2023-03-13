"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbRoute = exports.UserRoute = void 0;
const user_route_1 = __importDefault(require("./user/user_route"));
exports.UserRoute = user_route_1.default;
const index_1 = __importDefault(require("./storage/index"));
exports.dbRoute = index_1.default;
///
