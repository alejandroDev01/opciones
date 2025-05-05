import dotenv from "dotenv";
import { createServer } from "./main";

dotenv.config();

const server = createServer();

server.listen(3000, () => {
  console.log(`BACKEND Run in :  ${3000}`);
});
