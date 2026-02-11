"use client";

import { useState, useEffect } from "react";
import { X, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectItem, SelectValue } from "@/components/ui/select";
import ModalDatePicker from "@/components/ModalDatePicker";
import {
  addFavouriteField,
  isFieldFavourite,
  removeFavouriteField,
} from "@/lib/favourites";

interface Props {
  onClose: () => void;
  defaultDate: Date;
  onDataChange?: (data: unknown, date: Date) => void;
  patientId?: string | null;
  onSaveSuccess?: () => void;
  savedData?: Array<{ sampleDate: Date | string; cardiology?: unknown }>;
}

export default function CardiologyModal({
  onClose,
  defaultDate,
  onDataChange,
  patientId,
  onSaveSuccess,
  savedData = [],
}: Props) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [reportDate, setReportDate] = useState(defaultDate);
  const [saving, setSaving] = useState(false);
  const [, setFavoritesUpdated] = useState(0);

  const formatDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  
  useEffect(() => {
    if (savedData && savedData.length > 0) {
      const dateStr = formatDateString(reportDate);
      const matchingTest = savedData.find((test) => {
        if (!test.cardiology) return false;
        const testDateObj =
          test.sampleDate instanceof Date
            ? test.sampleDate
            : new Date(test.sampleDate);
        const testDate = formatDateString(testDateObj);
        return testDate === dateStr;
      });

      const testToLoad =
        matchingTest ||
        savedData
          .filter((test) => test.cardiology)
          .sort((a, b) => {
            const dateA =
              a.sampleDate instanceof Date
                ? a.sampleDate
                : new Date(a.sampleDate);
            const dateB =
              b.sampleDate instanceof Date
                ? b.sampleDate
                : new Date(b.sampleDate);
            return dateB.getTime() - dateA.getTime();
          })[0];

      if (testToLoad?.cardiology) {
        const rawData = testToLoad.cardiology as Record<string, unknown>;
        const flattened: Record<string, string> = {};
        Object.entries(rawData).forEach(([key, val]) => {
          if (typeof val === "string") {
            flattened[key] = val;
          } else if (
            val &&
            typeof val === "object" &&
            "value" in (val as Record<string, unknown>)
          ) {
            const v = (val as Record<string, unknown>).value;
            if (typeof v === "string") flattened[key] = v;
          }
        });
        setFormData(flattened);
        const testDate =
          testToLoad.sampleDate instanceof Date
            ? testToLoad.sampleDate
            : new Date(testToLoad.sampleDate);
        setReportDate(testDate);
      }
    }
    
    
  }, [savedData]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateField = (fieldName: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const getFieldValue = (fieldName: string) => formData[fieldName] || "";

  const fieldColors = [
    "bg-blue-50 border-blue-200",
    "bg-green-50 border-green-200",
    "bg-purple-50 border-purple-200",
    "bg-yellow-50 border-yellow-200",
    "bg-pink-50 border-pink-200",
    "bg-indigo-50 border-indigo-200",
    "bg-orange-50 border-orange-200",
    "bg-cyan-50 border-cyan-200",
  ];

  const renderField = (
    fieldName: string,
    label: string,
    index: number,
    unit?: string,
    inputClass?: string,
  ) => {
    const colorClass = fieldColors[index % fieldColors.length];

    return (
      <div className={`p-2 rounded ${colorClass}`}>
        <div className="grid grid-cols-4 gap-2 items-end">
          <div className="col-span-1">
            <div className="flex items-center justify-between mb-1">
              <Label className="text-sm">
                {label} {unit && <span className="text-gray-500">({unit})</span>}
              </Label>
              <button
                type="button"
                onClick={() => toggleFieldFavourite(fieldName, label)}
                className="p-1 rounded hover:bg-gray-100"
                title={isFieldFavourite("cardiology", fieldName) ? "Remove from Favorites" : "Add to Favorites"}
              >
                <Heart className={`h-5 w-5 ${isFieldFavourite("cardiology", fieldName) ? "text-red-500 fill-red-500" : "text-gray-400 hover:text-red-500"}`} />
              </button>
            </div>
            <Input
              value={getFieldValue(fieldName)}
              onChange={(e) => updateField(fieldName, e.target.value)}
              placeholder="Enter value"
              className={`bg-white h-16 text-xl px-4 ${inputClass ?? ""}`}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderSelectField = (
    fieldName: string,
    label: string,
    index: number,
    options: string[],
    selectClass?: string,
  ) => {
    const colorClass = fieldColors[index % fieldColors.length];

    return (
      <div className={`p-2 rounded ${colorClass}`}>
        <div className="grid grid-cols-4 gap-2 items-end">
          <div className="col-span-3">
            <div className="flex items-center justify-between mb-1">
              <Label className="text-sm">{label}</Label>
              <button
                type="button"
                onClick={() => toggleFieldFavourite(fieldName, label)}
                className="p-1 rounded hover:bg-gray-100"
                title={isFieldFavourite("cardiology", fieldName) ? "Remove from Favorites" : "Add to Favorites"}
              >
                <Heart className={`h-5 w-5 ${isFieldFavourite("cardiology", fieldName) ? "text-red-500 fill-red-500" : "text-gray-400 hover:text-red-500"}`} />
              </button>
            </div>
            <Select
              value={getFieldValue(fieldName)}
              onValueChange={(v) => updateField(fieldName, v)}
              className={`bg-white h-16 text-xl px-4 ${selectClass ?? ""}`}
            >
              <SelectValue placeholder="Select" />
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </Select>
          </div>
        </div>
      </div>
    );
  };

  const renderTextAreaField = (
    fieldName: string,
    label: string,
    index: number,
  ) => {
    const colorClass = fieldColors[index % fieldColors.length];

    return (
      <div className={`p-2 rounded ${colorClass}`}>
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <Label className="text-sm">{label}</Label>
              <button
                type="button"
                onClick={() => toggleFieldFavourite(fieldName, label)}
                className="p-1 rounded hover:bg-gray-100"
                title={isFieldFavourite("cardiology", fieldName) ? "Remove from Favorites" : "Add to Favorites"}
              >
                <Heart className={`h-5 w-5 ${isFieldFavourite("cardiology", fieldName) ? "text-red-500 fill-red-500" : "text-gray-400 hover:text-red-500"}`} />
              </button>
            </div>
            <textarea
              value={getFieldValue(fieldName)}
              onChange={(e) => updateField(fieldName, e.target.value)}
              className="w-full px-4 py-4 border rounded-md min-h-32 bg-white text-xl"
              placeholder="Enter report"
            />
          </div>
        </div>
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasData =
      Object.keys(formData).length > 0 &&
      Object.values(formData).some((v) => v && v.trim().length > 0);

    if (!hasData) {
      alert("Please enter at least one field value before saving.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/patient-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patientId || null,
          sampleDate: `${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, "0")}-${String(reportDate.getDate()).padStart(2, "0")}`,
          cardiology: formData,
        }),
      });

      if (response.ok) {
        if (onSaveSuccess) onSaveSuccess();
        if (onDataChange) onDataChange(formData, reportDate);
        alert("Cardiology data saved successfully!");
        onClose();
      } else {
        const error = await response.json();
        alert(error.message || "Failed to save data. Please try again.");
      }
    } catch (error) {
      console.error("Error saving Cardiology data:", error);
      alert("Failed to save data. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleFieldFavourite = (
    fieldName: string,
    fieldLabel: string,
    sectionTitle?: string,
    hasDualValues: boolean = false,
  ) => {
    const reportType = "cardiology";
    const reportName = "Cardiology";

    if (hasDualValues) {
      const isFav = isFieldFavourite(reportType, `${fieldName}_value1`);
      if (isFav) {
        removeFavouriteField(reportType, `${fieldName}_value1`);
        removeFavouriteField(reportType, `${fieldName}_value2`);
      } else {
        addFavouriteField(
          reportType,
          reportName,
          `${fieldName}_value1`,
          `${fieldLabel} - Value 1`,
          sectionTitle,
        );
        addFavouriteField(
          reportType,
          reportName,
          `${fieldName}_value2`,
          `${fieldLabel} - Value 2`,
          sectionTitle,
        );
      }
    } else {
      const isFav = isFieldFavourite(reportType, fieldName);
      if (isFav) removeFavouriteField(reportType, fieldName);
      else addFavouriteField(reportType, reportName, fieldName, fieldLabel, sectionTitle);
    }

    setFavoritesUpdated((prev) => prev + 1);
  };

  const renderSectionHeader = (
    title: string,
  ) => {
    return (
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg text-blue-700">{title}</h3>
      </div>
    );
  };

  let fieldIndex = 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center bg-linear-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-t-lg shadow-md shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">Cardiology</h2>
            <ModalDatePicker
              selectedDate={reportDate}
              onDateChange={setReportDate}
              defaultDate={defaultDate}
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex gap-2 mr-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={saving}
                className="bg-white/10 hover:bg-white/20 text-white border-white/40"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const form = document.getElementById("cardiology-form");
                  form?.dispatchEvent(
                    new Event("submit", { cancelable: true, bubbles: true }),
                  );
                }}
                disabled={saving}
                className="bg-amber-400 hover:bg-amber-500 text-blue-900"
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto p-6 flex-1">
          <form
            id="cardiology-form"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* Cardiovascular Tests */}
            <div className="mb-6 pb-4 border-b">
              {renderSectionHeader("Cardiovascular Tests")}
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-4">
                  {renderField("ecgReport", "ECG", fieldIndex++)}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    {renderSelectField(
                      "echocardiogramType",
                      "Echocardiogram - Type",
                      fieldIndex++,
                      ["2D", "3D", "4D"],
                    )}
                  </div>
                  <div className="col-span-2">
                    {renderField(
                      "echocardiogramReport",
                      "Echocardiogram",
                      fieldIndex++,
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {renderField("ettReport", "ETT", fieldIndex++)}
                </div>
              </div>
            </div>

            {/* Lipid Profile */}
            <div className="mb-6 pb-4 border-b">
              {renderSectionHeader("Lipid Profile")}
              <div className="space-y-2">
                {(() => {
                  const lipidTests = [
                    {
                      name: "totalCholesterol",
                      label: "Total Cholesterol",
                      hasMmol: true,
                    },
                    {
                      name: "triglycerides",
                      label: "Triglycerides",
                      hasMmol: true,
                    },
                    {
                      name: "ldl",
                      label: "Low-Density Lipoprotein (LDL) Cholesterol",
                      hasMmol: true,
                    },
                    {
                      name: "hdl",
                      label: "High-Density Lipoprotein (HDL) Cholesterol",
                      hasMmol: true,
                    },
                    {
                      name: "vldl",
                      label: "Very Low-Density Lipoprotein (VLDL) Cholesterol",
                      hasMmol: true,
                    },
                    {
                      name: "tcHdlRatio",
                      label: "Total Cholesterol / HDL Ratio (TC/HDL)",
                      hasMmol: false,
                    },
                  ];
                  return lipidTests.map((test) => {
                    const currentIndex = fieldIndex++;
                    const colorClass =
                      fieldColors[currentIndex % fieldColors.length];
                    return (
                      <div
                        key={test.name}
                        className={`p-2 rounded ${colorClass}`}
                      >
                        <div className="grid grid-cols-3 gap-2 items-end">
                          <div className="col-span-1">
                            <div className="flex items-center justify-between mb-1">
                              <Label className="text-sm">{test.label}</Label>
                              <button
                                type="button"
                                onClick={() => toggleFieldFavourite(test.name, test.label, "Lipid Profile")}
                                className="p-1 rounded hover:bg-gray-100"
                                title={isFieldFavourite("cardiology", test.name) ? "Remove from Favorites" : "Add to Favorites"}
                              >
                                <Heart className={`h-5 w-5 ${isFieldFavourite("cardiology", test.name) ? "text-red-500 fill-red-500" : "text-gray-400 hover:text-red-500"}`} />
                              </button>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm">Value (mg/dL)</Label>
                            <Input
                              value={getFieldValue(test.name)}
                              onChange={(e) =>
                                updateField(test.name, e.target.value)
                              }
                              placeholder="mg/dL"
                              className="bg-white h-12 text-base"
                            />
                          </div>
                          {test.hasMmol && (
                            <div>
                              <Label className="text-sm">Value (mmol/L)</Label>
                              <Input
                                value={getFieldValue(`${test.name}Mmol`)}
                                onChange={(e) =>
                                  updateField(
                                    `${test.name}Mmol`,
                                    e.target.value,
                                  )
                                }
                                placeholder="mmol/L"
                                className="bg-white h-12 text-base"
                              />
                            </div>
                          )}
                          {!test.hasMmol && <div></div>}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Cardiac Markers */}
            <div className="mb-6 pb-4 border-b">
              {renderSectionHeader("Cardiac Markers")}
              <div className="space-y-2">
                {renderField("lpPla2", "Lp-PLA2", fieldIndex++, "nmol/min/mL")}
                {renderField("tropI", "Trop I", fieldIndex++)}
                {renderField(
                  "highSensitiveTropI",
                  "High Sensitive Trop I",
                  fieldIndex++,
                )}
                {renderField("ckMb", "CK MB", fieldIndex++)}
              </div>
            </div>

            {/* Diagnostic Procedures */}
            <div className="mb-6 pb-4 border-b">
              {renderSectionHeader("Diagnostic Procedures")}
              <div className="space-y-2">
                {renderTextAreaField("angiogram", "Angiogram", fieldIndex++)}
                {renderTextAreaField(
                  "tiltTableTest",
                  "Tilt Table Test",
                  fieldIndex++,
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
