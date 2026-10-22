import path from "node:path";
import { createApp } from "./app.js";
import { openDatabase } from "./db.js";

const port = readPort(process.env.PORT);
const host = process.env.HOST?.trim() || "127.0.0.1";
const databasePath =
  process.env.DATABASE_PATH === undefined || process.env.DATABASE_PATH.trim() === ""
    ? path.join(import.meta.dirname, "..", "data", "resources.db")
    : path.resolve(process.env.DATABASE_PATH);

const database = openDatabase(databasePath);
const app = createApp(database);

const server = app.listen(port, host, () => {
  console.log(`Crude server listening on http://${host}:${port}`);
  console.log(`Database: ${databasePath}`);
});

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `${host}:${port} is already in use. Stop the other process, or set PORT to a free port and start again.`,
    );
  } else {
    console.error(error);
  }
  database.close();
  process.exit(1);
});

function shutdown(): void {
  server.close(() => {
    database.close();
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function readPort(value: string | undefined): number {
  if (value === undefined || value.trim() === "") return 3001;
  if (!/^\d+$/.test(value)) {
    throw new Error("PORT must be an integer from 1 to 65535");
  }
  const port = Number(value);
  if (port < 1 || port > 65535) {
    throw new Error("PORT must be an integer from 1 to 65535");
  }
  return port;
}
