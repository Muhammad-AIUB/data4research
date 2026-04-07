"use client";

import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useMemo } from "react";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import type { FavouriteField } from "@/lib/favourites";

const RT = "diseaseHistory";

const DH_SECTION_ORDER = [
  "Physical Measurements",
  "Vital Signs",
  "Clinical Findings",
] as const;

type Props = {
  sections: Record<string, FavouriteField[]>;
  fieldValues: Record<string, string>;
  setFieldValues: Dispatch<SetStateAction<Record<string, string>>>;
  onRemoveSection: (
    reportType: string,
    sectionTitle: string,
    fields: FavouriteField[],
  ) => void;
  sectionHeading: (
    sectionTitle: string,
    fields: FavouriteField[],
  ) => string;
};

function k(fieldName: string) {
  return `${RT}:${fieldName}`;
}

export function DiseaseHistoryFavouritesBundle({
  sections,
  fieldValues,
  setFieldValues,
  onRemoveSection,
  sectionHeading,
}: Props) {
  const allNames = useMemo(() => {
    const s = new Set<string>();
    for (const list of Object.values(sections)) {
      for (const f of list) s.add(f.fieldName);
    }
    return s;
  }, [sections]);

  const get = useCallback(
    (fn: string) => fieldValues[k(fn)] ?? "",
    [fieldValues],
  );

  const setOne = useCallback(
    (fn: string, value: string) => {
      if (!allNames.has(fn)) return;
      setFieldValues((prev) => ({ ...prev, [k(fn)]: value }));
    },
    [allNames, setFieldValues],
  );

  const setManyFiltered = useCallback(
    (updates: Record<string, string>) => {
      const next: Record<string, string> = {};
      for (const [fn, val] of Object.entries(updates)) {
        if (allNames.has(fn)) next[fn] = val;
      }
      if (Object.keys(next).length === 0) return;
      setFieldValues((prev) => {
        const merged = { ...prev };
        for (const [fn, val] of Object.entries(next)) {
          merged[k(fn)] = val;
        }
        return merged;
      });
    },
    [allNames, setFieldValues],
  );

  const handleCmChange = useCallback(
    (value: string) => {
      if (value === "") {
        setManyFiltered({ heightCm: "", heightFeet: "", heightInch: "" });
        return;
      }
      const cmNum = parseFloat(value) || 0;
      const totalInches = cmNum / 2.54;
      const feetNum = totalInches / 12;
      setManyFiltered({
        heightCm: value,
        heightFeet: feetNum.toFixed(2),
        heightInch: totalInches.toFixed(2),
      });
    },
    [setManyFiltered],
  );

  const handleFeetChange = useCallback(
    (value: string) => {
      if (value === "") {
        setManyFiltered({ heightFeet: "", heightInch: "", heightCm: "" });
        return;
      }
      const feetNum = parseFloat(value) || 0;
      const totalInches = feetNum * 12;
      const cmValue = totalInches * 2.54;
      setManyFiltered({
        heightFeet: value,
        heightInch: totalInches.toFixed(2),
        heightCm: cmValue.toFixed(2),
      });
    },
    [setManyFiltered],
  );

  const handleInchChange = useCallback(
    (value: string) => {
      if (value === "") {
        setManyFiltered({ heightInch: "", heightFeet: "", heightCm: "" });
        return;
      }
      const inchNum = parseFloat(value) || 0;
      const feetNum = inchNum / 12;
      const cmValue = inchNum * 2.54;
      setManyFiltered({
        heightInch: value,
        heightFeet: feetNum.toFixed(2),
        heightCm: cmValue.toFixed(2),
      });
    },
    [setManyFiltered],
  );

  /** lb → kg in one update (no useEffect — avoids ping-pong with kg → lb). */
  const handleWeightLbChange = useCallback(
    (value: string) => {
      setFieldValues((prev) => {
        const next: Record<string, string> = { ...prev, [k("weightLb")]: value };
        if (allNames.has("weightKg")) {
          const lb = parseFloat(value);
          if (lb > 0) {
            next[k("weightKg")] = (lb * 0.453592).toFixed(2);
          } else if (value === "") {
            next[k("weightKg")] = "";
          }
        }
        return next;
      });
    },
    [allNames, setFieldValues],
  );

  const handleWeightKgChange = useCallback(
    (value: string) => {
      setFieldValues((prev) => {
        const next: Record<string, string> = { ...prev, [k("weightKg")]: value };
        if (allNames.has("weightLb")) {
          const kg = parseFloat(value);
          if (kg > 0) {
            next[k("weightLb")] = (kg / 0.453592).toFixed(2);
          } else if (value === "") {
            next[k("weightLb")] = "";
          }
        }
        return next;
      });
    },
    [allNames, setFieldValues],
  );

  const sbpStr = fieldValues[k("sbp")] ?? "";
  const dbpStr = fieldValues[k("dbp")] ?? "";
  const heightCmStr = fieldValues[k("heightCm")] ?? "";
  const weightKgStr = fieldValues[k("weightKg")] ?? "";

  useEffect(() => {
    if (
      !allNames.has("sbp") ||
      !allNames.has("dbp") ||
      !allNames.has("map")
    ) {
      return;
    }
    const s = parseFloat(sbpStr);
    const d = parseFloat(dbpStr);
    const nextMap =
      s > 0 && d > 0 ? ((s + 2 * d) / 3).toFixed(1) : "";
    setFieldValues((prev) => {
      if ((prev[k("map")] ?? "") === nextMap) return prev;
      return { ...prev, [k("map")]: nextMap };
    });
  }, [sbpStr, dbpStr, allNames, setFieldValues]);

  useEffect(() => {
    if (
      !allNames.has("bmi") ||
      !allNames.has("weightKg") ||
      !allNames.has("heightCm")
    ) {
      return;
    }
    const kg = parseFloat(weightKgStr);
    const cm = parseFloat(heightCmStr);
    const nextBmi =
      kg > 0 && cm > 0 ? (kg / (cm / 100) ** 2).toFixed(2) : "";
    setFieldValues((prev) => {
      if ((prev[k("bmi")] ?? "") === nextBmi) return prev;
      return { ...prev, [k("bmi")]: nextBmi };
    });
  }, [weightKgStr, heightCmStr, allNames, setFieldValues]);

  useEffect(() => {
    if (!allNames.has("idealWeightKg") || !allNames.has("heightCm")) return;
    const cm = parseFloat(heightCmStr);
    let nextIdeal = "";
    if (cm > 0) {
      const m2 = (cm / 100) ** 2;
      const min = (19.5 * m2).toFixed(1);
      const max = (25 * m2).toFixed(1);
      nextIdeal = `${min} – ${max}`;
    }
    setFieldValues((prev) => {
      if ((prev[k("idealWeightKg")] ?? "") === nextIdeal) return prev;
      return { ...prev, [k("idealWeightKg")]: nextIdeal };
    });
  }, [heightCmStr, allNames, setFieldValues]);

  const renderPhysical = (names: Set<string>) => {
    const showAge = names.has("age");
    const showHeight =
      names.has("heightCm") ||
      names.has("heightFeet") ||
      names.has("heightInch");
    const showWeight = names.has("weightLb") || names.has("weightKg");
    if (!showAge && !showHeight && !showWeight) return null;

    return (
      <div className="space-y-4">
        {showAge ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="mb-1">
              <Label>Age</Label>
            </div>
            <Input
              value={get("age")}
              onChange={(e) => setOne("age", e.target.value)}
              placeholder="35"
              className="bg-white"
            />
          </div>
        ) : null}

        {showHeight ? (
          <div className="rounded-lg border-2 border-yellow-300 bg-yellow-50 p-4">
            <Label className="mb-2 block font-bold">
              Height (delete any = clear all)
            </Label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="mb-1">
                  <Label>cm</Label>
                </div>
                <Input
                  value={get("heightCm")}
                  onChange={(e) => handleCmChange(e.target.value)}
                  placeholder="170"
                />
              </div>
              <div>
                <div className="mb-1">
                  <Label>feet</Label>
                </div>
                <Input
                  value={get("heightFeet")}
                  onChange={(e) => handleFeetChange(e.target.value)}
                  placeholder="5"
                />
              </div>
              <div>
                <div className="mb-1">
                  <Label>inch</Label>
                </div>
                <Input
                  value={get("heightInch")}
                  onChange={(e) => handleInchChange(e.target.value)}
                  placeholder="7"
                  step="0.1"
                />
              </div>
            </div>
          </div>
        ) : null}

        {showWeight ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-purple-300 bg-purple-50 p-4">
              <div className="mb-1">
                <Label>pound (lb)</Label>
              </div>
              <Input
                value={get("weightLb")}
                onChange={(e) => handleWeightLbChange(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="rounded-lg border border-purple-300 bg-purple-50 p-4">
              <div className="mb-1">
                <Label>KG</Label>
              </div>
              <Input
                value={get("weightKg")}
                onChange={(e) => handleWeightKgChange(e.target.value)}
                className="bg-white"
              />
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const renderVital = (names: Set<string>) => {
    const showBp =
      names.has("dbp") || names.has("map") || names.has("sbp");
    const showBmiIdeal = names.has("bmi") || names.has("idealWeightKg");
    const showPulseBlock =
      names.has("pulse") ||
      names.has("pulseNote") ||
      names.has("spO2") ||
      names.has("respiratoryRate");
    if (!showBp && !showBmiIdeal && !showPulseBlock) return null;

    return (
      <div className="space-y-4">
        {showBp ? (
          <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="mb-1">
                  <Label>Diastolic (DBP)</Label>
                </div>
                <Input
                  value={get("dbp")}
                  onChange={(e) => setOne("dbp", e.target.value)}
                  className="bg-white"
                />
              </div>
              <div>
                <div className="mb-1">
                  <Label>Mean Arterial Pressure (auto)</Label>
                </div>
                <Input value={get("map")} readOnly className="bg-gray-100" />
              </div>
              <div>
                <div className="mb-1">
                  <Label>Systolic (SBP)</Label>
                </div>
                <Input
                  value={get("sbp")}
                  onChange={(e) => setOne("sbp", e.target.value)}
                  className="bg-white"
                />
              </div>
            </div>
          </div>
        ) : null}

        {showBmiIdeal ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="mb-1">
                <Label>BMI (auto)</Label>
              </div>
              <Input value={get("bmi")} readOnly className="bg-gray-100" />
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="mb-1">
                <Label>Ideal Body Weight (kg)</Label>
              </div>
              <Input
                value={get("idealWeightKg")}
                readOnly
                className="bg-gray-100"
              />
            </div>
          </div>
        ) : null}

        {showPulseBlock ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="mb-1">
                  <Label>Pulse (b/m)</Label>
                </div>
                <Input
                  value={get("pulse")}
                  onChange={(e) => setOne("pulse", e.target.value)}
                  className="bg-white"
                />
              </div>
              <div>
                <div className="mb-1">
                  <Label>Note</Label>
                </div>
                <Input
                  value={get("pulseNote")}
                  onChange={(e) => setOne("pulseNote", e.target.value)}
                  className="bg-white"
                />
              </div>
              <div>
                <div className="mb-1">
                  <Label>Oxygen Saturation (SpO2)</Label>
                </div>
                <Input
                  value={get("spO2")}
                  onChange={(e) => setOne("spO2", e.target.value)}
                  className="bg-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="mb-1">
                  <Label>Respiratory Rate</Label>
                </div>
                <Input
                  value={get("respiratoryRate")}
                  onChange={(e) => setOne("respiratoryRate", e.target.value)}
                  className="bg-white"
                />
              </div>
              <div />
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const renderClinical = (names: Set<string>) => {
    const showTriplet =
      names.has("anaemia") ||
      names.has("jaundice") ||
      names.has("ascites");
    const showAusc = names.has("heart") || names.has("lung");
    const showNotes =
      names.has("specialNote") ||
      names.has("diseaseHistory") ||
      names.has("surgicalHistory");
    if (!showTriplet && !showAusc && !showNotes) return null;

    return (
      <div className="space-y-4">
        {showTriplet ? (
          <div className="grid grid-cols-3 gap-4 rounded-lg border border-pink-200 bg-pink-50 p-4">
            <div>
              <div className="mb-1">
                <Label>Anaemia</Label>
              </div>
              <Select
                value={get("anaemia")}
                onValueChange={(v) => setOne("anaemia", v)}
              >
                <SelectValue placeholder="Select" />
                <SelectContent>
                  <SelectItem value="">Select</SelectItem>
                  <SelectItem value="+">+</SelectItem>
                  <SelectItem value="++">++</SelectItem>
                  <SelectItem value="+++">+++</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="mb-1">
                <Label>Jaundice</Label>
              </div>
              <Select
                value={get("jaundice")}
                onValueChange={(v) => setOne("jaundice", v)}
              >
                <SelectValue placeholder="Select" />
                <SelectContent>
                  <SelectItem value="">Select</SelectItem>
                  <SelectItem value="+">+</SelectItem>
                  <SelectItem value="++">++</SelectItem>
                  <SelectItem value="+++">+++</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="mb-1">
                <Label>Ascites</Label>
              </div>
              <Select
                value={get("ascites")}
                onValueChange={(v) => setOne("ascites", v)}
              >
                <SelectValue placeholder="Select" />
                <SelectContent>
                  <SelectItem value="">Select</SelectItem>
                  <SelectItem value="absent">absent</SelectItem>
                  <SelectItem value="Mild">Mild</SelectItem>
                  <SelectItem value="Moderate">Moderate</SelectItem>
                  <SelectItem value="Huge">Huge</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : null}

        {showAusc ? (
          <div className="grid grid-cols-2 gap-4 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
            <div>
              <div className="mb-1">
                <Label>Auscultation Heart</Label>
              </div>
              <Input
                value={get("heart")}
                onChange={(e) => setOne("heart", e.target.value)}
                className="bg-white"
              />
            </div>
            <div>
              <div className="mb-1">
                <Label>Auscultation Lung</Label>
              </div>
              <Input
                value={get("lung")}
                onChange={(e) => setOne("lung", e.target.value)}
                className="bg-white"
              />
            </div>
          </div>
        ) : null}

        {showNotes ? (
          <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div>
              <div className="mb-1">
                <Label>Special note or other findings of O/E</Label>
              </div>
              <Input
                value={get("specialNote")}
                onChange={(e) => setOne("specialNote", e.target.value)}
                className="bg-white"
              />
            </div>
            <div>
              <div className="mb-1">
                <Label>
                  Disease History (e.g. first known, disease event etc.)
                </Label>
              </div>
              <Input
                value={get("diseaseHistory")}
                onChange={(e) => setOne("diseaseHistory", e.target.value)}
                className="bg-white"
              />
            </div>
            <div>
              <div className="mb-1">
                <Label>Surgical or Intervention History</Label>
              </div>
              <Input
                value={get("surgicalHistory")}
                onChange={(e) => setOne("surgicalHistory", e.target.value)}
                className="bg-white"
              />
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const renderSectionBody = (
    sectionTitle: (typeof DH_SECTION_ORDER)[number],
    fields: FavouriteField[],
  ) => {
    const names = new Set(fields.map((f) => f.fieldName));
    if (sectionTitle === "Physical Measurements") {
      return renderPhysical(names);
    }
    if (sectionTitle === "Vital Signs") {
      return renderVital(names);
    }
    return renderClinical(names);
  };

  return (
    <>
      {DH_SECTION_ORDER.map((sectionTitle) => {
        const fields = sections[sectionTitle];
        if (!fields?.length) return null;
        const body = renderSectionBody(sectionTitle, fields);
        if (!body) return null;
        return (
          <div
            key={sectionTitle}
            className="space-y-3"
          >
            <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50/90 px-3 py-2.5 border border-slate-100/90">
              <h4 className="font-semibold text-sm sm:text-base text-slate-900 leading-snug">
                {sectionHeading(sectionTitle, fields)}
              </h4>
              <button
                type="button"
                onClick={() => onRemoveSection(RT, sectionTitle, fields)}
                className="inline-flex items-center gap-1.5 shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-white hover:bg-rose-50 border border-rose-200/70 shadow-sm transition-colors"
                title={`Remove all fields from ${sectionTitle}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove section
              </button>
            </div>
            {body}
          </div>
        );
      })}
    </>
  );
}
