import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

export type Resource = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type ResourcePatch = {
  name?: string;
  description?: string;
};

type ResourceRow = {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export type ListQuery = {
  name?: string;
  q?: string;
  limit: number;
  offset: number;
};

export type ResourcePage = {
  data: Resource[];
  total: number;
  limit: number;
  offset: number;
};

const schema = `
  CREATE TABLE IF NOT EXISTS resources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`;

export function openDatabase(filename: string): DatabaseSync {
  if (filename !== ":memory:") {
    fs.mkdirSync(path.dirname(path.resolve(filename)), { recursive: true });
  }
  const database = new DatabaseSync(filename);
  database.exec(schema);
  return database;
}

export function createResource(
  database: DatabaseSync,
  input: { name: string; description: string },
): Resource {
  const timestamp = new Date().toISOString();
  const resource: Resource = {
    id: randomUUID(),
    name: input.name,
    description: input.description,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  database
    .prepare(
      `INSERT INTO resources (id, name, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(
      resource.id,
      resource.name,
      resource.description,
      resource.createdAt,
      resource.updatedAt,
    );
  return resource;
}

export function getResource(database: DatabaseSync, id: string): Resource | undefined {
  const row = database
    .prepare(
      `SELECT id, name, description, created_at, updated_at
       FROM resources
       WHERE id = ?`,
    )
    .get(id);
  return row === undefined ? undefined : toResource(row);
}

export function listResources(database: DatabaseSync, query: ListQuery): ResourcePage {
  const filter = buildFilter(query);
  const totalRow = database
    .prepare(`SELECT COUNT(*) AS total FROM resources ${filter.whereSql}`)
    .get(...filter.params);
  const rows = database
    .prepare(
      `SELECT id, name, description, created_at, updated_at
       FROM resources
       ${filter.whereSql}
       ORDER BY created_at DESC, id DESC
       LIMIT ? OFFSET ?`,
    )
    .all(...filter.params, query.limit, query.offset);

  return {
    data: rows.map((row) => toResource(row)),
    total: readTotal(totalRow),
    limit: query.limit,
    offset: query.offset,
  };
}

export function updateResource(
  database: DatabaseSync,
  id: string,
  patch: ResourcePatch,
): Resource | undefined {
  const current = getResource(database, id);
  if (current === undefined) return undefined;

  const updated: Resource = {
    ...current,
    name: patch.name ?? current.name,
    description: patch.description ?? current.description,
    updatedAt: new Date().toISOString(),
  };
  database
    .prepare(
      `UPDATE resources
       SET name = ?, description = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(updated.name, updated.description, updated.updatedAt, id);
  return updated;
}

export function deleteResource(database: DatabaseSync, id: string): boolean {
  const result = database.prepare("DELETE FROM resources WHERE id = ?").run(id);
  return Number(result.changes) > 0;
}

function buildFilter(query: ListQuery): { whereSql: string; params: string[] } {
  const clauses: string[] = [];
  const params: string[] = [];

  if (query.name !== undefined) {
    clauses.push("lower(name) LIKE ? ESCAPE '\\'");
    params.push(likeContains(query.name));
  }
  if (query.q !== undefined) {
    clauses.push(
      "(lower(name) LIKE ? ESCAPE '\\' OR lower(description) LIKE ? ESCAPE '\\')",
    );
    const pattern = likeContains(query.q);
    params.push(pattern, pattern);
  }

  return {
    whereSql: clauses.length === 0 ? "" : `WHERE ${clauses.join(" AND ")}`,
    params,
  };
}

function likeContains(value: string): string {
  const escaped = value.toLowerCase().replace(/[\\%_]/g, (character) => `\\${character}`);
  return `%${escaped}%`;
}

function toResource(row: unknown): Resource {
  if (typeof row !== "object" || row === null) {
    throw new Error("Unexpected database row");
  }
  const record = row as ResourceRow;
  return {
    id: String(record.id),
    name: String(record.name),
    description: String(record.description),
    createdAt: String(record.created_at),
    updatedAt: String(record.updated_at),
  };
}

function readTotal(row: unknown): number {
  if (typeof row !== "object" || row === null || !("total" in row)) {
    throw new Error("Unexpected count row");
  }
  return Number(row.total);
}
