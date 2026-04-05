/** Favourite report fields: one list per logged-in user (DB via /api/user-favourites). */

export const FAVOURITES_CHANGED_EVENT = "data4research-favourites-changed";

export interface FavouriteField {
  reportType: string;
  reportName?: string;
  fieldName: string;
  fieldLabel: string;
  sectionTitle?: string;
  createdAt: string;
}

type Cache = {
  favourites: FavouriteField[];
  values: Record<string, string>;
};

let cache: Cache = { favourites: [], values: {} };
/** True after first successful load from API (or failed load — then empty). */
let cacheReady = false;

function valueKey(reportType: string, fieldName: string) {
  return `${reportType}:${fieldName}`;
}

function notifyFavouritesChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(FAVOURITES_CHANGED_EVENT));
}

function snapshotCache(): Cache {
  return JSON.parse(JSON.stringify(cache)) as Cache;
}

function applyServerPayload(data: {
  favourites: FavouriteField[];
  values: Record<string, string>;
}) {
  cache = {
    favourites: data.favourites,
    values: { ...data.values },
  };
}

export function isFavouritesCacheReady(): boolean {
  return cacheReady;
}

/** Load favourites for the current session user (call from dashboard when session is known). */
export async function hydrateFavouritesFromApi(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const res = await fetch("/api/user-favourites", {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (res.status === 401) {
      clearFavouritesCache();
      return;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as Cache;
    if (!Array.isArray(data.favourites) || typeof data.values !== "object") {
      throw new Error("Invalid payload");
    }
    applyServerPayload(data);
  } catch {
    cache = { favourites: [], values: {} };
  } finally {
    cacheReady = true;
    notifyFavouritesChanged();
  }
}

export function clearFavouritesCache(): void {
  cache = { favourites: [], values: {} };
  cacheReady = false;
  notifyFavouritesChanged();
}

async function postUpsert(body: {
  reportType: string;
  reportName?: string;
  fieldName: string;
  fieldLabel: string;
  sectionTitle?: string;
}): Promise<boolean> {
  const res = await fetch("/api/user-favourites", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.ok;
}

async function deleteRemote(
  reportType: string,
  fieldName: string,
): Promise<boolean> {
  const q = new URLSearchParams({ reportType, fieldName });
  const res = await fetch(`/api/user-favourites?${q}`, {
    method: "DELETE",
    credentials: "same-origin",
  });
  return res.ok;
}

async function patchValue(
  reportType: string,
  fieldName: string,
  value: string,
): Promise<boolean> {
  const res = await fetch("/api/user-favourites", {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reportType, fieldName, value }),
  });
  return res.ok;
}

export function getFavourites(): FavouriteField[] {
  if (typeof window === "undefined") return [];
  return cache.favourites;
}

export function addFavouriteField(
  reportType: string,
  reportName: string,
  fieldName: string,
  fieldLabel: string,
  sectionTitle?: string,
): void {
  if (typeof window === "undefined") return;

  const exists = cache.favourites.find(
    (f) => f.reportType === reportType && f.fieldName === fieldName,
  );

  if (!exists) {
    const prev = snapshotCache();
    const newFavourite: FavouriteField = {
      reportType,
      reportName,
      fieldName,
      fieldLabel,
      sectionTitle,
      createdAt: new Date().toISOString(),
    };
    cache.favourites = [...cache.favourites, newFavourite];
    notifyFavouritesChanged();
    void (async () => {
      const ok = await postUpsert({
        reportType,
        reportName,
        fieldName,
        fieldLabel,
        sectionTitle,
      });
      if (!ok) {
        cache = prev;
        notifyFavouritesChanged();
      }
    })();
  } else if (sectionTitle) {
    const prev = snapshotCache();
    const index = cache.favourites.findIndex(
      (f) => f.reportType === reportType && f.fieldName === fieldName,
    );
    if (index !== -1) {
      const next = [...cache.favourites];
      next[index] = { ...next[index], sectionTitle };
      cache.favourites = next;
      notifyFavouritesChanged();
      void (async () => {
        const row = next[index];
        const ok = await postUpsert({
          reportType,
          reportName: row.reportName ?? reportName,
          fieldName,
          fieldLabel: row.fieldLabel,
          sectionTitle,
        });
        if (!ok) {
          cache = prev;
          notifyFavouritesChanged();
        }
      })();
    }
  }
}

function applyRemoveToCache(reportType: string, fieldName: string) {
  cache.favourites = cache.favourites.filter(
    (f) => !(f.reportType === reportType && f.fieldName === fieldName),
  );
  const k = valueKey(reportType, fieldName);
  const nextValues = { ...cache.values };
  delete nextValues[k];
  cache.values = nextValues;
}

export function removeFavouriteField(reportType: string, fieldName: string): void {
  if (typeof window === "undefined") return;
  const prev = snapshotCache();
  applyRemoveToCache(reportType, fieldName);
  notifyFavouritesChanged();
  void (async () => {
    const ok = await deleteRemote(reportType, fieldName);
    if (!ok) {
      cache = prev;
      notifyFavouritesChanged();
    }
  })();
}

/** Remove many fields with one optimistic cache update and sequential API deletes (rollback on first failure). */
export async function removeFavouriteFieldsBatch(
  items: Array<{ reportType: string; fieldName: string }>,
): Promise<boolean> {
  if (typeof window === "undefined" || items.length === 0) return true;
  const dedup = new Map<string, { reportType: string; fieldName: string }>();
  for (const it of items) {
    dedup.set(`${it.reportType}\n${it.fieldName}`, it);
  }
  const unique = [...dedup.values()];
  const prev = snapshotCache();
  for (const { reportType, fieldName } of unique) {
    applyRemoveToCache(reportType, fieldName);
  }
  notifyFavouritesChanged();
  for (const { reportType, fieldName } of unique) {
    const ok = await deleteRemote(reportType, fieldName);
    if (!ok) {
      cache = prev;
      notifyFavouritesChanged();
      return false;
    }
  }
  return true;
}

export function isFieldFavourite(reportType: string, fieldName: string): boolean {
  if (typeof window === "undefined") return false;
  return cache.favourites.some(
    (f) => f.reportType === reportType && f.fieldName === fieldName,
  );
}

export function getFavouritesByReport(reportType: string): FavouriteField[] {
  if (typeof window === "undefined") return [];
  return cache.favourites.filter((f) => f.reportType === reportType);
}

export function getAllFavouritesGrouped(): Record<string, FavouriteField[]> {
  if (typeof window === "undefined") return {};
  return cache.favourites.reduce(
    (acc, fav) => {
      if (!acc[fav.reportType]) acc[fav.reportType] = [];
      acc[fav.reportType].push(fav);
      return acc;
    },
    {} as Record<string, FavouriteField[]>,
  );
}

export function addSectionFieldsToFavourites(
  reportType: string,
  reportName: string,
  fields: Array<[string, string]>,
  sectionTitle?: string,
): void {
  if (typeof window === "undefined") return;
  fields.forEach(([fieldName, fieldLabel]) => {
    addFavouriteField(reportType, reportName, fieldName, fieldLabel, sectionTitle);
  });
}

export function removeSectionFieldsFromFavourites(
  reportType: string,
  fields: Array<[string, string]>,
): void {
  if (typeof window === "undefined") return;
  fields.forEach(([fieldName]) => {
    removeFavouriteField(reportType, fieldName);
  });
}

export function areAllSectionFieldsFavourite(
  reportType: string,
  fields: Array<[string, string]>,
): boolean {
  if (typeof window === "undefined") return false;
  if (fields.length === 0) return false;
  return fields.every(([fieldName]) => isFieldFavourite(reportType, fieldName));
}

export function areAnySectionFieldsFavourite(
  reportType: string,
  fields: Array<[string, string]>,
): boolean {
  if (typeof window === "undefined") return false;
  return fields.some(([fieldName]) => isFieldFavourite(reportType, fieldName));
}

export function setFavouriteFieldValue(
  reportType: string,
  fieldName: string,
  value: string,
): void {
  if (typeof window === "undefined") return;
  const prev = snapshotCache();
  const k = valueKey(reportType, fieldName);
  cache.values = { ...cache.values, [k]: value };
  notifyFavouritesChanged();
  void (async () => {
    const ok = await patchValue(reportType, fieldName, value);
    if (!ok) {
      cache = prev;
      notifyFavouritesChanged();
    }
  })();
}

export function getFavouriteFieldValue(reportType: string, fieldName: string): string {
  if (typeof window === "undefined") return "";
  return cache.values[valueKey(reportType, fieldName)] || "";
}

export function getFavouriteFieldValues(): Record<string, string> {
  if (typeof window === "undefined") return {};
  return { ...cache.values };
}

export function removeFavouriteFieldValue(reportType: string, fieldName: string): void {
  if (typeof window === "undefined") return;
  const prev = snapshotCache();
  const k = valueKey(reportType, fieldName);
  const next = { ...cache.values };
  delete next[k];
  cache.values = next;
  notifyFavouritesChanged();
  void (async () => {
    const ok = await patchValue(reportType, fieldName, "");
    if (!ok) {
      cache = prev;
      notifyFavouritesChanged();
    }
  })();
}
