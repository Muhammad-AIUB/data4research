/** Favourite report fields: one list per logged-in user, shared by all patients (not per-patient). */

export const FAVOURITES_CHANGED_EVENT = "data4research-favourites-changed";

const LEGACY_FAVOURITES_KEY = "data4research_favourites";
const LEGACY_VALUES_KEY = "data4research_favourite_values";

export interface FavouriteField {
  reportType: string;
  reportName: string;
  fieldName: string;
  fieldLabel: string;
  sectionTitle?: string;
  createdAt: string;
}

/** Set by DashboardShell from session — scopes localStorage to this user id. */
let scopedUserId: string | null = null;

export function setFavouritesUserId(userId: string | null): void {
  scopedUserId = userId;
  if (typeof window !== "undefined" && userId) {
    migrateLegacyFavouritesIfNeeded(userId);
  }
}

function migrateLegacyFavouritesIfNeeded(userId: string): void {
  const favKey = favouritesStorageKeyForUser(userId);
  const valKey = valuesStorageKeyForUser(userId);
  const flagKey = `_data4research_fav_migrated_${userId}`;
  if (localStorage.getItem(flagKey)) return;
  if (localStorage.getItem(favKey)) {
    localStorage.setItem(flagKey, "1");
    return;
  }
  const legacyFav = localStorage.getItem(LEGACY_FAVOURITES_KEY);
  const legacyVal = localStorage.getItem(LEGACY_VALUES_KEY);
  if (legacyFav) localStorage.setItem(favKey, legacyFav);
  if (legacyVal) localStorage.setItem(valKey, legacyVal);
  localStorage.setItem(flagKey, "1");
}

function favouritesStorageKeyForUser(userId: string): string {
  return `data4research_favourites_${userId}`;
}

function valuesStorageKeyForUser(userId: string): string {
  return `data4research_favourite_values_${userId}`;
}

function favouritesStorageKey(): string {
  if (scopedUserId) return favouritesStorageKeyForUser(scopedUserId);
  return LEGACY_FAVOURITES_KEY;
}

function valuesStorageKey(): string {
  if (scopedUserId) return valuesStorageKeyForUser(scopedUserId);
  return LEGACY_VALUES_KEY;
}

function notifyFavouritesChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(FAVOURITES_CHANGED_EVENT));
}

export function getFavourites(): FavouriteField[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(favouritesStorageKey());
  return stored ? JSON.parse(stored) : [];
}

export function addFavouriteField(
  reportType: string,
  reportName: string,
  fieldName: string,
  fieldLabel: string,
  sectionTitle?: string,
): void {
  if (typeof window === "undefined") return;
  const favourites = getFavourites();

  const exists = favourites.find(
    (f) => f.reportType === reportType && f.fieldName === fieldName,
  );

  if (!exists) {
    const newFavourite: FavouriteField = {
      reportType,
      reportName,
      fieldName,
      fieldLabel,
      sectionTitle,
      createdAt: new Date().toISOString(),
    };
    favourites.push(newFavourite);
    localStorage.setItem(favouritesStorageKey(), JSON.stringify(favourites));
    notifyFavouritesChanged();
  } else if (sectionTitle) {
    const index = favourites.findIndex(
      (f) => f.reportType === reportType && f.fieldName === fieldName,
    );
    if (index !== -1) {
      favourites[index].sectionTitle = sectionTitle;
      localStorage.setItem(favouritesStorageKey(), JSON.stringify(favourites));
      notifyFavouritesChanged();
    }
  }
}

export function removeFavouriteField(reportType: string, fieldName: string): void {
  if (typeof window === "undefined") return;
  const favourites = getFavourites();
  const filtered = favourites.filter(
    (f) => !(f.reportType === reportType && f.fieldName === fieldName),
  );
  localStorage.setItem(favouritesStorageKey(), JSON.stringify(filtered));

  removeFavouriteFieldValue(reportType, fieldName);
  notifyFavouritesChanged();
}

export function isFieldFavourite(reportType: string, fieldName: string): boolean {
  if (typeof window === "undefined") return false;
  const favourites = getFavourites();
  return favourites.some(
    (f) => f.reportType === reportType && f.fieldName === fieldName,
  );
}

export function getFavouritesByReport(reportType: string): FavouriteField[] {
  if (typeof window === "undefined") return [];
  const favourites = getFavourites();
  return favourites.filter((f) => f.reportType === reportType);
}

export function getAllFavouritesGrouped(): Record<string, FavouriteField[]> {
  if (typeof window === "undefined") return {};
  const favourites = getFavourites();
  return favourites.reduce(
    (acc, fav) => {
      if (!acc[fav.reportType]) {
        acc[fav.reportType] = [];
      }
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
  const key = `${reportType}:${fieldName}`;
  const values = getFavouriteFieldValues();
  values[key] = value;
  localStorage.setItem(valuesStorageKey(), JSON.stringify(values));
  notifyFavouritesChanged();
}

export function getFavouriteFieldValue(reportType: string, fieldName: string): string {
  if (typeof window === "undefined") return "";
  const key = `${reportType}:${fieldName}`;
  const values = getFavouriteFieldValues();
  return values[key] || "";
}

export function getFavouriteFieldValues(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const stored = localStorage.getItem(valuesStorageKey());
  return stored ? JSON.parse(stored) : {};
}

export function removeFavouriteFieldValue(reportType: string, fieldName: string): void {
  if (typeof window === "undefined") return;
  const key = `${reportType}:${fieldName}`;
  const values = getFavouriteFieldValues();
  delete values[key];
  localStorage.setItem(valuesStorageKey(), JSON.stringify(values));
}
