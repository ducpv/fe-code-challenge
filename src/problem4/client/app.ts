type Resource = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

type ResourcePage = {
  data: Resource[];
  total: number;
  limit: number;
  offset: number;
};

const pageSize = 10;

const statusMessage = requiredElement("status", HTMLParagraphElement);
const createForm = requiredElement("create-form", HTMLFormElement);
const createName = requiredElement("create-name", HTMLInputElement);
const createDescription = requiredElement("create-description", HTMLTextAreaElement);
const filterForm = requiredElement("filter-form", HTMLFormElement);
const filterName = requiredElement("filter-name", HTMLInputElement);
const filterQuery = requiredElement("filter-q", HTMLInputElement);
const clearFilters = requiredElement("clear-filters", HTMLButtonElement);
const resultCount = requiredElement("result-count", HTMLParagraphElement);
const emptyMessage = requiredElement("empty-message", HTMLParagraphElement);
const resourceList = requiredElement("resource-list", HTMLUListElement);
const prevPage = requiredElement("prev-page", HTMLButtonElement);
const nextPage = requiredElement("next-page", HTMLButtonElement);
const pageLabel = requiredElement("page-label", HTMLSpanElement);
const detailSection = document.querySelector("[aria-labelledby='detail-heading']");
const detailPlaceholder = requiredElement("detail-placeholder", HTMLParagraphElement);
const detailForm = requiredElement("detail-form", HTMLFormElement);
const detailId = requiredElement("detail-id", HTMLElement);
const detailCreated = requiredElement("detail-created", HTMLElement);
const detailUpdated = requiredElement("detail-updated", HTMLElement);
const detailName = requiredElement("detail-name", HTMLInputElement);
const detailDescription = requiredElement("detail-description", HTMLTextAreaElement);
const deleteButton = requiredElement("delete-button", HTMLButtonElement);
const deleteConfirm = requiredElement("delete-confirm", HTMLDivElement);
const confirmDelete = requiredElement("confirm-delete", HTMLButtonElement);
const cancelDelete = requiredElement("cancel-delete", HTMLButtonElement);

let offset = 0;
let selectedId: string | null = null;
let lastPage: ResourcePage | null = null;
let busy = false;

createForm.addEventListener("submit", (event) => {
  event.preventDefault();
  void run(async () => {
    const created = await send("/resources", "POST", {
      name: createName.value,
      description: createDescription.value,
    });
    if (!isResource(created)) throw new Error("Unexpected resource details");
    createForm.reset();
    offset = 0;
    setStatus("Resource created.");
    await loadList();
    await showDetails(created.id);
  });
});

filterForm.addEventListener("submit", (event) => {
  event.preventDefault();
  void run(async () => {
    offset = 0;
    await loadList();
    setStatus("");
  });
});

clearFilters.addEventListener("click", () => {
  void run(async () => {
    filterName.value = "";
    filterQuery.value = "";
    offset = 0;
    await loadList();
    setStatus("");
  });
});

prevPage.addEventListener("click", () => {
  void run(async () => {
    offset = Math.max(0, offset - pageSize);
    await loadList();
  });
});

nextPage.addEventListener("click", () => {
  void run(async () => {
    offset += pageSize;
    await loadList();
  });
});

detailForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (selectedId === null) return;
  const id = selectedId;
  void run(async () => {
    const updated = await send(`/resources/${encodeURIComponent(id)}`, "PATCH", {
      name: detailName.value,
      description: detailDescription.value,
    });
    if (!isResource(updated)) throw new Error("Unexpected resource details");
    setStatus("Resource details saved.");
    renderDetails(updated);
    await loadList();
  });
});

deleteButton.addEventListener("click", () => {
  deleteConfirm.hidden = false;
  deleteButton.hidden = true;
});

cancelDelete.addEventListener("click", () => {
  deleteConfirm.hidden = true;
  deleteButton.hidden = false;
});

confirmDelete.addEventListener("click", () => {
  if (selectedId === null) return;
  const id = selectedId;
  void run(async () => {
    await send(`/resources/${encodeURIComponent(id)}`, "DELETE");
    clearDetails();
    setStatus("Resource deleted.");
    await loadList();
  });
});

void run(loadList);

async function loadList(): Promise<void> {
  const params = new URLSearchParams();
  const name = filterName.value.trim();
  const query = filterQuery.value.trim();
  if (name !== "") params.set("name", name);
  if (query !== "") params.set("q", query);
  params.set("limit", String(pageSize));
  params.set("offset", String(offset));

  const payload = await request(`/resources?${params.toString()}`);
  if (!isPage(payload)) throw new Error("Unexpected resource list");
  if (payload.data.length === 0 && payload.offset > 0 && payload.total > 0) {
    const lastPageOffset = Math.floor((payload.total - 1) / pageSize) * pageSize;
    if (lastPageOffset !== offset) {
      offset = lastPageOffset;
      await loadList();
      return;
    }
  }
  offset = payload.offset;
  lastPage = payload;
  renderList(payload);
}

async function showDetails(id: string): Promise<void> {
  const payload = await request(`/resources/${encodeURIComponent(id)}`);
  if (!isResource(payload)) throw new Error("Unexpected resource details");
  selectedId = payload.id;
  renderDetails(payload);
  if (lastPage !== null) renderList(lastPage);
  if (detailSection instanceof HTMLElement) {
    detailSection.scrollIntoView({ block: "nearest" });
  }
}

function renderList(page: ResourcePage): void {
  const countLabel = page.total === 1 ? "1 resource" : `${page.total} resources`;
  resultCount.textContent = countLabel;
  resourceList.replaceChildren();
  const hasRows = page.data.length > 0;
  resourceList.hidden = !hasRows;
  emptyMessage.hidden = hasRows;
  if (!hasRows) {
    emptyMessage.textContent = filtersActive()
      ? "No resources match these filters."
      : "No resources yet. Create one above.";
  }

  for (const resource of page.data) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "resource";
    button.setAttribute("aria-pressed", resource.id === selectedId ? "true" : "false");
    button.addEventListener("click", () => {
      void run(() => showDetails(resource.id));
    });

    const name = document.createElement("span");
    name.className = "resource-name";
    name.textContent = resource.name;
    const description = document.createElement("span");
    description.className = "resource-description";
    description.textContent = resource.description === "" ? "No description" : resource.description;
    button.append(name, description);
    item.append(button);
    resourceList.append(item);
  }

  const start = page.total === 0 ? 0 : page.offset + 1;
  const end = page.offset + page.data.length;
  pageLabel.textContent = page.total === 0 ? "0 of 0" : `${start}–${end} of ${page.total}`;
  prevPage.disabled = page.offset === 0;
  nextPage.disabled = page.offset + page.data.length >= page.total;
}

function renderDetails(resource: Resource): void {
  detailPlaceholder.hidden = true;
  detailForm.hidden = false;
  detailId.textContent = resource.id;
  detailCreated.textContent = formatWhen(resource.createdAt);
  detailUpdated.textContent = formatWhen(resource.updatedAt);
  detailName.value = resource.name;
  detailDescription.value = resource.description;
  deleteConfirm.hidden = true;
  deleteButton.hidden = false;
}

function clearDetails(): void {
  selectedId = null;
  detailPlaceholder.hidden = false;
  detailForm.hidden = true;
  deleteConfirm.hidden = true;
  deleteButton.hidden = false;
  if (lastPage !== null) renderList(lastPage);
}

function filtersActive(): boolean {
  return filterName.value.trim() !== "" || filterQuery.value.trim() !== "";
}

function setStatus(message: string, isError = false): void {
  statusMessage.hidden = message === "";
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
}

async function run(action: () => Promise<void>): Promise<void> {
  if (busy) return;
  busy = true;
  try {
    await action();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Something went wrong", true);
  } finally {
    busy = false;
  }
}

async function send(path: string, method: string, body?: unknown): Promise<unknown> {
  const headers = new Headers();
  let payload: string | undefined;
  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
    payload = JSON.stringify(body);
  }
  return request(path, { method, headers, body: payload });
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(path, init);
  } catch {
    throw new Error("Cannot reach the server");
  }
  const text = await response.text();
  const payload = text === "" ? undefined : parseJson(text);
  if (!response.ok) {
    if (isErrorBody(payload)) throw new Error(payload.error);
    throw new Error(`Request failed (${response.status})`);
  }
  return payload;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error("The server returned an unreadable response");
  }
}

function isResource(value: unknown): value is Resource {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    typeof record.description === "string" &&
    typeof record.createdAt === "string" &&
    typeof record.updatedAt === "string"
  );
}

function isPage(value: unknown): value is ResourcePage {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    Array.isArray(record.data) &&
    record.data.every(isResource) &&
    typeof record.total === "number" &&
    typeof record.limit === "number" &&
    typeof record.offset === "number"
  );
}

function isErrorBody(value: unknown): value is { error: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  );
}

function formatWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function requiredElement<T extends HTMLElement>(
  id: string,
  constructor: new () => T,
): T {
  const element = document.getElementById(id);
  if (!(element instanceof constructor)) {
    throw new Error(`Missing #${id}`);
  }
  return element;
}
