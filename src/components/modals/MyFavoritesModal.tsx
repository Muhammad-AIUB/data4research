"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Stethoscope, Bookmark, Trash2, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getFavourites,
  removeFavouriteFieldsBatch,
  persistFavouriteFieldValuesIfChanged,
  getFavouriteFieldValue,
  FAVOURITES_CHANGED_EVENT,
  hydrateFavouritesFromApi,
  isFavouritesCacheReady,
  type FavouriteField,
} from "@/lib/favourites";
import ReportFormContainer from "@/components/ReportFormContainer";
import { DiseaseHistoryFavouritesBundle } from "@/components/modals/favourites/DiseaseHistoryFavouritesBundle";

const DISEASE_HISTORY_LAYOUT_SECTIONS = new Set([
  "Physical Measurements",
  "Vital Signs",
  "Clinical Findings",
]);

type PatientTest = {
  id: string;
  sampleDate: Date | string;
  autoimmunoProfile?: unknown;
  cardiology?: unknown;
  rft?: unknown;
  lft?: unknown;
  diseaseHistory?: unknown;
  imaging?: unknown;
  hematology?: unknown;
};

interface Props {
  onClose: () => void;
  savedData?: PatientTest[];
  embedded?: boolean;
}

export default function MyFavoritesModal({ onClose, embedded = false }: Props) {
  const [favourites, setFavourites] = useState<FavouriteField[]>([]);
  const [favouritesLoading, setFavouritesLoading] = useState(
    () => !isFavouritesCacheReady(),
  );
  const [referenceDate, setReferenceDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [baselineValues, setBaselineValues] = useState<Record<string, string>>(
    {},
  );
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const groupedFavourites = useMemo(() => {
    const grouped: Record<string, Record<string, FavouriteField[]>> = {};
    favourites.forEach((fav) => {
      if (!fav || !fav.reportType || !fav.fieldName) return;

      if (!grouped[fav.reportType]) {
        grouped[fav.reportType] = {};
      }

      const sectionKey =
        fav.sectionTitle && fav.sectionTitle.trim() !== ""
          ? fav.sectionTitle
          : "Other";
      if (!grouped[fav.reportType][sectionKey]) {
        grouped[fav.reportType][sectionKey] = [];
      }
      if (Array.isArray(grouped[fav.reportType][sectionKey])) {
        grouped[fav.reportType][sectionKey].push(fav);
      }
    });
    return grouped;
  }, [favourites]);

  const initialFieldValues = useMemo(() => {
    const values: Record<string, string> = {};
    favourites.forEach((fav) => {
      const key = `${fav.reportType}:${fav.fieldName}`;
      values[key] = getFavouriteFieldValue(fav.reportType, fav.fieldName);
    });
    return values;
  }, [favourites]);

  const isDirty = useMemo(() => {
    const keys = new Set([
      ...Object.keys(fieldValues),
      ...Object.keys(baselineValues),
    ]);
    for (const k of keys) {
      if ((fieldValues[k] ?? "") !== (baselineValues[k] ?? "")) return true;
    }
    return false;
  }, [fieldValues, baselineValues]);

  /** Subtle left stripe per report block (aligned with Settings accents) */
  const reportTypeAccents: Record<string, string> = {
    autoimmunoProfile: "border-l-blue-500",
    cardiology: "border-l-emerald-500",
    rft: "border-l-violet-500",
    lft: "border-l-amber-500",
    diseaseHistory: "border-l-rose-500",
    imaging: "border-l-indigo-500",
    hematology: "border-l-orange-500",
  };

  const loadFavourites = () => {
    const favs = getFavourites();
    setFavourites(favs);
  };

  useEffect(() => {
    const sync = () => loadFavourites();
    const bootstrap = async () => {
      if (!isFavouritesCacheReady()) {
        await hydrateFavouritesFromApi();
      }
      loadFavourites();
      setFavouritesLoading(false);
    };
    void bootstrap();
    window.addEventListener(FAVOURITES_CHANGED_EVENT, sync);
    return () => {
      window.removeEventListener(FAVOURITES_CHANGED_EVENT, sync);
    };
  }, []);

  useEffect(() => {
    setFieldValues(initialFieldValues);
    setBaselineValues({ ...initialFieldValues });
  }, [initialFieldValues]);

  const handleValueChange = (
    reportType: string,
    fieldName: string,
    value: string,
  ) => {
    const key = `${reportType}:${fieldName}`;
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const ok = await persistFavouriteFieldValuesIfChanged(
        fieldValues,
        baselineValues,
      );
      if (ok) {
        setBaselineValues({ ...fieldValues });
        alert("Saved defaults have been updated.");
      } else {
        alert("Could not save. Check your connection and try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFieldValues({ ...baselineValues });
    if (!embedded) onClose();
  };

  const handleRemoveSection = (
    _reportType: string,
    _sectionTitle: string,
    fields: FavouriteField[],
  ) => {
    const toRemove: Array<{ reportType: string; fieldName: string }> = [];
    const valueKeysToDrop = new Set<string>();

    const queueRemove = (rt: string, fn: string) => {
      toRemove.push({ reportType: rt, fieldName: fn });
      valueKeysToDrop.add(`${rt}:${fn}`);
    };

    fields.forEach((fav) => {
      queueRemove(fav.reportType, fav.fieldName);

      if (
        fav.reportType === "autoimmunoProfile" &&
        !fav.fieldName.endsWith("_notes")
      ) {
        queueRemove(fav.reportType, `${fav.fieldName}_notes`);
      }

      if (
        (fav.reportType === "rft" || fav.reportType === "lft") &&
        fav.fieldName.endsWith("_value1")
      ) {
        queueRemove(
          fav.reportType,
          fav.fieldName.replace("_value1", "_value2"),
        );
      }

      if (
        (fav.reportType === "rft" || fav.reportType === "lft") &&
        fav.fieldName.endsWith("_value2")
      ) {
        queueRemove(
          fav.reportType,
          fav.fieldName.replace("_value2", "_value1"),
        );
      }
    });

    void (async () => {
      await removeFavouriteFieldsBatch(toRemove);
      setFieldValues((prev) => {
        const next = { ...prev };
        for (const k of valueKeysToDrop) delete next[k];
        return next;
      });
      loadFavourites();
    })();
  };

  const reportTypeLabels: Record<string, string> = {
    autoimmunoProfile: "Autoimmuno Profile",
    cardiology: "Cardiology",
    rft: "RFT",
    lft: "LFT",
    diseaseHistory: "On Examination & Disease History",
    imaging: "Imaging, Histopathology",
    hematology: "Hematology",
    basdai: "BASDAI",
  };

  const reportTitleForFavourite = (
    fav: FavouriteField,
    reportTypeKey: string,
  ) => {
    const n = fav.reportName?.trim();
    if (n) return n;
    return reportTypeLabels[reportTypeKey] ?? reportTypeKey;
  };

  const sectionPartForHeading = (
    groupedSectionKey: string,
    fav: FavouriteField,
  ) => {
    if (groupedSectionKey !== "Other") return groupedSectionKey;
    const st = fav.sectionTitle?.trim();
    if (st) return st;
    return "Other fields";
  };

  const fullContextHeading = (
    reportTypeKey: string,
    groupedSectionKey: string,
    sectionFields: FavouriteField[],
  ) => {
    const first = sectionFields[0];
    if (!first) return reportTypeLabels[reportTypeKey] ?? reportTypeKey;
    const report = reportTitleForFavourite(first, reportTypeKey);
    const section = sectionPartForHeading(groupedSectionKey, first);
    return `${report} ${section}`.trim();
  };

  const shellClass = embedded
    ? "w-full flex flex-col rounded-xl border border-slate-200/90 bg-white shadow-sm max-h-[min(85vh,900px)] min-h-0 overflow-hidden ring-1 ring-slate-100/80"
    : "bg-white rounded-2xl shadow-xl shadow-slate-200/60 ring-1 ring-slate-200/60 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col m-4";

  const headerBarClass = embedded
    ? "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between px-4 py-3 border-b border-sky-100/80 bg-gradient-to-r from-sky-50/90 via-white to-slate-50/30"
    : "flex flex-col gap-4 p-6 border-b border-slate-100 bg-gradient-to-br from-sky-50/80 via-white to-slate-50/40";

  return (
    <ReportFormContainer embedded={embedded}>
      <div className={shellClass}>
        {embedded ? (
          <div className={headerBarClass}>
            <div className="flex flex-wrap items-end gap-4 min-w-0">
              <div className="space-y-1">
                <Label
                  htmlFor="fav-reference-date"
                  className="text-xs font-medium text-slate-600 inline-flex items-center gap-1.5"
                >
                  <CalendarDays className="h-3.5 w-3.5 text-sky-600" aria-hidden />
                  Reference date
                </Label>
                <Input
                  id="fav-reference-date"
                  type="date"
                  value={referenceDate}
                  onChange={(e) => setReferenceDate(e.target.value)}
                  className="w-full sm:w-[11.5rem] bg-white text-sm"
                />
              </div>
              <p className="text-sm text-slate-600 leading-snug min-w-0 flex-1 sm:pb-0.5">
                Edit default values below, then press <strong>Save</strong> to
                store them for your account. <strong>Cancel</strong> discards
                unsaved changes.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 self-end sm:self-start p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-white/90 ring-1 ring-transparent hover:ring-slate-200/80 transition-all"
              aria-label="Close section"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className={headerBarClass}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between w-full">
              <div className="flex items-start gap-4 min-w-0">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-sky-200/60">
                  <Stethoscope
                    className="h-6 w-6 text-sky-600"
                    aria-hidden
                  />
                </div>
                <div className="min-w-0">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    Saved field defaults
                  </h2>
                  <p className="text-sm text-slate-600 mt-0.5">
                    Bookmarked fields and values for your clinical workflow
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-3 sm:justify-end">
                <div className="space-y-1">
                  <Label
                    htmlFor="fav-reference-date-dialog"
                    className="text-xs font-medium text-slate-600 inline-flex items-center gap-1.5"
                  >
                    <CalendarDays className="h-3.5 w-3.5 text-sky-600" aria-hidden />
                    Reference date
                  </Label>
                  <Input
                    id="fav-reference-date-dialog"
                    type="date"
                    value={referenceDate}
                    onChange={(e) => setReferenceDate(e.target.value)}
                    className="w-full sm:w-[11.5rem] bg-white text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 p-2.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-white/90 ring-1 ring-slate-200/50 hover:ring-slate-300/80 transition-all self-end"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/40">
          {favouritesLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 text-sm">
              <p>Loading saved fields…</p>
            </div>
          ) : favourites.length === 0 ? (
            <div className="mx-auto max-w-md text-center rounded-2xl border border-dashed border-sky-200/70 bg-gradient-to-b from-sky-50/50 to-white px-6 py-14 shadow-sm">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-sky-100">
                <Bookmark
                  className="h-8 w-8 text-sky-300 fill-transparent"
                  strokeWidth={1.25}
                  aria-hidden
                />
              </div>
              <p className="text-lg font-semibold text-slate-800">
                No bookmarked fields yet
              </p>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Use the bookmark control next to sections under Field preferences
                (Settings) or on test forms when adding a patient. The same list
                applies to every patient for your account.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {Object.entries(groupedFavourites).map(([reportType, sections]) => {
                if (
                  !sections ||
                  typeof sections !== "object" ||
                  Array.isArray(sections)
                ) {
                  return null;
                }

                const leftAccent =
                  reportTypeAccents[reportType] ?? "border-l-slate-400";

                return (
                  <div
                    key={reportType}
                    className={`rounded-xl border border-slate-200/90 bg-white shadow-sm overflow-hidden border-l-4 ${leftAccent}`}
                  >
                    <div className="p-4 space-y-5">
                      {reportType === "diseaseHistory" ? (
                        <DiseaseHistoryFavouritesBundle
                          sections={sections}
                          fieldValues={fieldValues}
                          setFieldValues={setFieldValues}
                          onRemoveSection={handleRemoveSection}
                          sectionHeading={(sectionTitle, sectionFields) =>
                            fullContextHeading(
                              reportType,
                              sectionTitle,
                              sectionFields,
                            )
                          }
                        />
                      ) : null}
                      {Object.entries(sections).map(([sectionTitle, fields]) => {
                        if (!Array.isArray(fields)) {
                          return null;
                        }

                        if (
                          reportType === "diseaseHistory" &&
                          DISEASE_HISTORY_LAYOUT_SECTIONS.has(sectionTitle)
                        ) {
                          return null;
                        }

                        const contextHeading = fullContextHeading(
                          reportType,
                          sectionTitle,
                          fields,
                        );

                        return (
                          <div
                            key={`${reportType}-${sectionTitle}`}
                            className="space-y-3"
                          >
                            <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50/90 px-3 py-2.5 border border-slate-100/90">
                              <h4 className="font-semibold text-sm sm:text-base text-slate-900 leading-snug">
                                {contextHeading}
                              </h4>
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveSection(
                                    reportType,
                                    sectionTitle,
                                    fields,
                                  )
                                }
                                className="inline-flex items-center gap-1.5 shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-white hover:bg-rose-50 border border-rose-200/70 shadow-sm transition-colors"
                                title={`Remove all fields from ${sectionTitle === "Other" ? "Other Fields" : sectionTitle}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Remove section
                              </button>
                            </div>
                            <div className="space-y-2.5">
                              {fields.map((fav) => {
                                const key = `${fav.reportType}:${fav.fieldName}`;
                                const savedValue = fieldValues[key] || "";

                                const isNotesField =
                                  fav.fieldName.endsWith("_notes");
                                const isValue2Field =
                                  fav.fieldName.endsWith("_value2");
                                const isValue1Field =
                                  fav.fieldName.endsWith("_value1");

                                if (isValue2Field) {
                                  const mainFieldName =
                                    fav.fieldName.replace("_value2", "");
                                  const value1FieldExists = fields.find(
                                    (f) =>
                                      f.fieldName ===
                                      `${mainFieldName}_value1`,
                                  );
                                  if (value1FieldExists) {
                                    return null;
                                  }
                                }

                                const mainFieldName = isNotesField
                                  ? fav.fieldName.replace("_notes", "")
                                  : isValue1Field
                                    ? fav.fieldName.replace("_value1", "")
                                    : isValue2Field
                                      ? fav.fieldName.replace("_value2", "")
                                      : fav.fieldName;

                                const notesKey = isNotesField
                                  ? key
                                  : `${fav.reportType}:${mainFieldName}_notes`;
                                const savedNotes =
                                  fieldValues[notesKey] || "";

                                const value2Key = isValue1Field
                                  ? `${fav.reportType}:${mainFieldName}_value2`
                                  : null;
                                const savedValue2 = value2Key
                                  ? fieldValues[value2Key] || ""
                                  : "";

                                const getUnitFromLabel = (label: string) => {
                                  const match = label.match(/\(([^)]+)\)/);
                                  return match ? match[1] : "";
                                };

                                if (
                                  fav.reportType === "autoimmunoProfile" &&
                                  isNotesField
                                ) {
                                  const mainFieldExists = fields.find(
                                    (f) => f.fieldName === mainFieldName,
                                  );
                                  if (mainFieldExists) {
                                    return null;
                                  }
                                }

                                const fieldDisplayTitle = isNotesField
                                  ? fav.fieldLabel.replace(" - Notes", "")
                                  : isValue1Field || isValue2Field
                                    ? (
                                        fav.fieldLabel.split(" - ")[0] ??
                                        fav.fieldLabel
                                      ).trim()
                                    : fav.fieldLabel;

                                const value2FieldForLabels = fields.find(
                                  (f) =>
                                    f.fieldName ===
                                    `${mainFieldName}_value2`,
                                );
                                const unit1Label =
                                  getUnitFromLabel(fav.fieldLabel) ||
                                  "Unit 1";
                                const unit2Label = value2FieldForLabels
                                  ? getUnitFromLabel(
                                      value2FieldForLabels.fieldLabel,
                                    ) || "Unit 2"
                                  : "Unit 2";

                                return (
                                  <div
                                    key={`${fav.reportType}-${fav.fieldName}`}
                                    className="rounded-lg border border-slate-200/85 bg-white p-3.5 shadow-sm ring-1 ring-slate-100/70 hover:border-sky-200/55 hover:shadow-md transition-all duration-200"
                                  >
                                    <div className="flex items-start gap-4">
                                      <div className="flex-1 min-w-0 space-y-3">
                                        <div>
                                          <p className="font-medium text-gray-900 text-sm">
                                            {fieldDisplayTitle}
                                          </p>
                                          <p className="text-[10px] sm:text-xs text-slate-400 mt-1 font-mono break-all">
                                            {fav.fieldName}
                                          </p>
                                        </div>

                                        {fav.reportType ===
                                          "autoimmunoProfile" &&
                                        !isNotesField &&
                                        !isValue1Field &&
                                        !isValue2Field ? (
                                          <div className="space-y-3">
                                            <div className="space-y-2">
                                              <Label
                                                htmlFor={`value-${key}`}
                                                className="text-xs font-medium text-gray-700"
                                              >
                                                Value (Select)
                                              </Label>
                                              <Input
                                                id={`value-${key}`}
                                                type="text"
                                                value={savedValue}
                                                onChange={(e) =>
                                                  handleValueChange(
                                                    fav.reportType,
                                                    fav.fieldName,
                                                    e.target.value,
                                                  )
                                                }
                                                placeholder="Positive / Negative..."
                                                className="bg-white text-sm"
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label
                                                htmlFor={`notes-${notesKey}`}
                                                className="text-xs font-medium text-gray-700"
                                              >
                                                Notes
                                              </Label>
                                              <Input
                                                id={`notes-${notesKey}`}
                                                type="text"
                                                value={savedNotes}
                                                onChange={(e) =>
                                                  handleValueChange(
                                                    fav.reportType,
                                                    `${mainFieldName}_notes`,
                                                    e.target.value,
                                                  )
                                                }
                                                placeholder="Enter notes..."
                                                className="bg-white text-sm"
                                              />
                                            </div>
                                          </div>
                                        ) : isValue1Field &&
                                          savedValue2 !== undefined ? (
                                          <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                              <div className="space-y-2">
                                                <Label
                                                  htmlFor={`value1-${key}`}
                                                  className="text-xs font-medium text-gray-700"
                                                >
                                                  {fieldDisplayTitle} (
                                                  {unit1Label})
                                                </Label>
                                                <Input
                                                  id={`value1-${key}`}
                                                  type="text"
                                                  value={savedValue}
                                                  onChange={(e) =>
                                                    handleValueChange(
                                                      fav.reportType,
                                                      fav.fieldName,
                                                      e.target.value,
                                                    )
                                                  }
                                                  placeholder="Enter value..."
                                                  className="bg-white text-sm"
                                                />
                                              </div>
                                              <div className="space-y-2">
                                                <Label
                                                  htmlFor={`value2-${value2Key}`}
                                                  className="text-xs font-medium text-gray-700"
                                                >
                                                  {fieldDisplayTitle} (
                                                  {unit2Label})
                                                </Label>
                                                <Input
                                                  id={`value2-${value2Key}`}
                                                  type="text"
                                                  value={savedValue2}
                                                  onChange={(e) =>
                                                    handleValueChange(
                                                      fav.reportType,
                                                      `${mainFieldName}_value2`,
                                                      e.target.value,
                                                    )
                                                  }
                                                  placeholder="Enter value..."
                                                  className="bg-white text-sm"
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="space-y-2">
                                            <Label
                                              htmlFor={`value-${key}`}
                                              className="text-xs font-medium text-gray-700"
                                            >
                                              {isNotesField
                                                ? "Notes"
                                                : "Value"}
                                            </Label>
                                            <Input
                                              id={`value-${key}`}
                                              type="text"
                                              value={savedValue}
                                              onChange={(e) =>
                                                handleValueChange(
                                                  fav.reportType,
                                                  fav.fieldName,
                                                  e.target.value,
                                                )
                                              }
                                              placeholder={
                                                isNotesField
                                                  ? "Enter notes..."
                                                  : "Enter value..."
                                              }
                                              className="bg-white text-sm"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 px-4 py-4 sm:px-6 border-t border-slate-100 bg-gradient-to-r from-slate-50/90 to-white">
          <Button
            type="button"
            variant="outline"
            className="min-w-[7rem]"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="min-w-[7rem] bg-sky-600 hover:bg-sky-700 text-white"
            onClick={() => void handleSave()}
            disabled={!isDirty || saving || favourites.length === 0}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </ReportFormContainer>
  );
}
