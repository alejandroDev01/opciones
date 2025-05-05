"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv = __importStar(require("dotenv"));
const os_1 = __importDefault(require("os"));
const axios_1 = __importDefault(require("axios"));
dotenv.config();
const createServer = () => {
    const app = (0, express_1.default)();
    app
        .disable("x-powered-by")
        .use(express_1.default.urlencoded({ extended: true }))
        .use(express_1.default.json())
        .use((0, cors_1.default)());
    app.get("/", async (req, res) => {
        const networkInterfaces = os_1.default.networkInterfaces();
        let ipAddress = "Not found";
        console.log(networkInterfaces);
        for (const interfaceName in networkInterfaces) {
            const addresses = networkInterfaces[interfaceName];
            for (const address of addresses) {
                if (address.family === "IPv4" && !address.internal) {
                    ipAddress = address.address;
                    break;
                }
            }
        }
        // Fetch public IP address
        let publicIpAddress = "Not found";
        try {
            const response = await axios_1.default.get("https://api.ipify.org?format=json");
            publicIpAddress = response.data.ip;
        }
        catch (error) {
            console.error("Error fetching public IP:", error);
        }
        // Get client's IP address
        const clientIpAddress = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
        res.json({
            status: "success",
            message: "Service is running",
            data: {
                timestamp: new Date().toISOString(),
                localIpAddress: ipAddress,
                publicIpAddress: publicIpAddress,
                clientIpAddress: clientIpAddress, // Include the client's IP address in the response
            },
        });
    });
    return app;
};
exports.createServer = createServer;
