import express, { Request, Response } from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import os from "os";
import axios from "axios"; // Import axios for HTTP requests

dotenv.config();

export const createServer = () => {
  const app = express();

  app
    .disable("x-powered-by")
    .use(express.urlencoded({ extended: true }))
    .use(express.json())
    .use(cors());

  app.get("/", async (req: Request, res: Response) => {
    const networkInterfaces = os.networkInterfaces();
    let ipAddress = "Not found";
    console.log(networkInterfaces);
    for (const interfaceName in networkInterfaces) {
      const addresses = networkInterfaces[interfaceName];
      for (const address of addresses!) {
        if (address.family === "IPv4" && !address.internal) {
          ipAddress = address.address;
          break;
        }
      }
    }

    // Fetch public IP address
    let publicIpAddress = "Not found";
    try {
      const response = await axios.get("https://api.ipify.org?format=json");
      publicIpAddress = response.data.ip;
    } catch (error) {
      console.error("Error fetching public IP:", error);
    }

    res.json({
      status: "success",
      message: "Service is running",
      data: {
        timestamp: new Date().toISOString(),
        localIpAddress: ipAddress,
        publicIpAddress: publicIpAddress,
      },
    });
  });

  return app;
};
