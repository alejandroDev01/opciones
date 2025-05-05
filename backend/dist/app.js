"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const main_1 = require("./main");
dotenv_1.default.config();
const server = (0, main_1.createServer)();
server.listen(3000, () => {
    console.log(`BACKEND Run in :  ${3000}`);
});
