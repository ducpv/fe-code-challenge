import path from "node:path";
import express, { type NextFunction, type Request, type Response } from "express";
import type { DatabaseSync } from "node:sqlite";
import {
  createResource,
  deleteResource,
  getResource,
  listResources,
  updateResource,
  type ResourcePatch,
} from "./db.js";

const maxNameLength = 200;
const maxDescriptionLength = 2000;
const defaultLimit = 20;
const maxLimit = 100;
const maxOffset = 1_000_000;

class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function createApp(database: DatabaseSync): express.Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "100kb" }));

  app.post("/resources", route((req, res) => {
    const body = readObjectBody(req.body);
    const name = readName(body.name);
    const description = readDescription(body.description) ?? "";
    const resource = createResource(database, { name, description });
    res.status(201).json(resource);
  }));

  app.get("/resources", route((req, res) => {
    const page = listResources(database, {
      name: readQueryString(req.query.name, "name"),
      q: readQueryString(req.query.q, "q"),
      limit: readBoundedInteger(req.query.limit, "limit", defaultLimit, 1, maxLimit),
      offset: readBoundedInteger(req.query.offset, "offset", 0, 0, maxOffset),
    });
    res.json(page);
  }));

  app.get("/resources/:id", route((req, res) => {
    const resource = getResource(database, readId(req.params.id));
    if (resource === undefined) throw new HttpError(404, "Resource not found");
    res.json(resource);
  }));

  app.put("/resources/:id", updateRoute(database));
  app.patch("/resources/:id", updateRoute(database));

  app.delete("/resources/:id", route((req, res) => {
    const deleted = deleteResource(database, readId(req.params.id));
    if (!deleted) throw new HttpError(404, "Resource not found");
    res.status(204).end();
  }));

  app.use(express.static(path.join(import.meta.dirname, "..", "public")));

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof HttpError) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    if (isJsonParseError(error)) {
      res.status(400).json({ error: "Request body must be valid JSON" });
      return;
    }
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}

function updateRoute(database: DatabaseSync) {
  return route((req, res) => {
    const body = readObjectBody(req.body);
    const patch: ResourcePatch = {};
    if ("name" in body) patch.name = readName(body.name);
    if ("description" in body) {
      const description = readDescription(body.description);
      if (description === undefined) {
        throw new HttpError(400, "description must be a string");
      }
      patch.description = description;
    }
    if (patch.name === undefined && patch.description === undefined) {
      throw new HttpError(400, "Provide name or description to update");
    }
    const resource = updateResource(database, readId(req.params.id), patch);
    if (resource === undefined) throw new HttpError(404, "Resource not found");
    res.json(resource);
  });
}

function route(handle: (req: Request, res: Response) => void) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      handle(req, res);
    } catch (error) {
      next(error);
    }
  };
}

function readObjectBody(body: unknown): Record<string, unknown> {
  if (body === undefined) return {};
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new HttpError(400, "Request body must be a JSON object");
  }
  return Object.fromEntries(Object.entries(body));
}

function readId(value: string | undefined): string {
  if (value === undefined || value.trim() === "") {
    throw new HttpError(400, "id is required");
  }
  return value;
}

function readName(value: unknown): string {
  if (value === undefined) throw new HttpError(400, "name is required");
  if (typeof value !== "string") throw new HttpError(400, "name must be a string");
  const name = value.trim();
  if (name.length === 0) throw new HttpError(400, "name must not be empty");
  if (name.length > maxNameLength) {
    throw new HttpError(400, `name must be at most ${maxNameLength} characters`);
  }
  return name;
}

function readDescription(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new HttpError(400, "description must be a string");
  const description = value.trim();
  if (description.length > maxDescriptionLength) {
    throw new HttpError(400, `description must be at most ${maxDescriptionLength} characters`);
  }
  return description;
}

function readQueryString(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new HttpError(400, `${field} must be a single string`);
  }
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function readBoundedInteger(
  value: unknown,
  field: string,
  fallback: number,
  min: number,
  max: number,
): number {
  if (value === undefined || value === "") return fallback;
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw new HttpError(400, `${field} must be an integer from ${min} to ${max}`);
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new HttpError(400, `${field} must be an integer from ${min} to ${max}`);
  }
  return parsed;
}

function isJsonParseError(error: unknown): boolean {
  return error instanceof SyntaxError && "body" in error;
}
