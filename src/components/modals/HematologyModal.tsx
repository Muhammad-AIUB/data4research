'use client'

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { FavouriteFieldIcon } from "@/components/FavouriteFieldIcon"
import {
  addFavouriteField,
  isFieldFavourite,
  removeFavouriteField,
} from "@/lib/favourites";
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import ModalDatePicker from "@/components/ModalDatePicker"
import ReportFormContainer from "@/components/ReportFormContainer"
import { useFavouritesSync } from "@/hooks/useFavouritesSync"

type DualValue = { value1: string; value2: string };

interface Props {
  onClose: () => void
  defaultDate: Date
  onDataChange?: (data: Record<string, string | DualValue>, date: Date) => void
  patientId?: string | null
  onSaveSuccess?: (savedTest?: unknown) => void
  savedData?: Array<{ sampleDate: Date | string; hematology?: Record<string, unknown> | null }>
  embedded?: boolean
  hideDatePicker?: boolean
  hideFormActions?: boolean
}

/** Section-level favourite: singles or dual (_value1/_value2) — labels must match per-field hearts. */
type HemSectionFav =
  | { kind: "single"; field: string; label: string }
  | { kind: "dual"; field: string; label: string; unit1: string; unit2: string };

const REPORT_TYPE = "hematology" as const;
const REPORT_NAME = "Hematology";

const HEM_CBC_FAVS: HemSectionFav[] = [
  { kind: "single", field: "rbc", label: "RBC" },
  { kind: "single", field: "hemoglobin", label: "Hb / Hgb" },
  { kind: "single", field: "hct", label: "Hct" },
  { kind: "single", field: "mcv", label: "MCV" },
  { kind: "single", field: "mch", label: "MCH" },
  { kind: "single", field: "mchc", label: "MCHC" },
  { kind: "single", field: "rdw", label: "RDW" },
  { kind: "single", field: "wbc", label: "WBC" },
  { kind: "dual", field: "neutrophils", label: "Neutrophils", unit1: "%", unit2: "cells/µL" },
  { kind: "dual", field: "lymphocytes", label: "Lymphocytes", unit1: "%", unit2: "cells/µL" },
  { kind: "dual", field: "monocytes", label: "Monocytes", unit1: "%", unit2: "cells/µL" },
  { kind: "dual", field: "eosinophils", label: "Eosinophils", unit1: "%", unit2: "cells/µL" },
  { kind: "dual", field: "basophils", label: "Basophils", unit1: "%", unit2: "cells/µL" },
  { kind: "single", field: "immatureGranulocytes", label: "Immature Granulocytes" },
  { kind: "single", field: "nrbc", label: "nRBC" },
  { kind: "single", field: "plt", label: "PLT" },
  { kind: "single", field: "mpv", label: "MPV" },
  { kind: "single", field: "pdw", label: "PDW" },
  { kind: "single", field: "pct", label: "PCT" },
  { kind: "single", field: "esr", label: "ESR" },
];

const HEM_COAG_FAVS: HemSectionFav[] = [
  { kind: "single", field: "ptPatient", label: "Prothrombin Time Patient" },
  { kind: "single", field: "ptTest", label: "Prothrombin Time Test" },
  { kind: "single", field: "inr", label: "INR" },
  { kind: "single", field: "aptt", label: "APTT" },
  { kind: "dual", field: "fibrinogen", label: "Fibrinogen", unit1: "g/L", unit2: "mg/dL" },
  { kind: "single", field: "dDimer", label: "D-dimer" },
  { kind: "single", field: "bleedingTime", label: "Bleeding Time" },
  { kind: "single", field: "clottingTime", label: "Clotting Time" },
  { kind: "single", field: "reticulocyteCount", label: "Reticulocyte count" },
];

const HEM_CHEM_FAVS: HemSectionFav[] = [
  { kind: "single", field: "pbf", label: "PBF" },
  { kind: "single", field: "ldh", label: "LDH" },
  { kind: "dual", field: "serumIron", label: "S. Iron / S. Fe", unit1: "µmol/L", unit2: "µg/dL" },
  { kind: "single", field: "tibc", label: "TIBC" },
  { kind: "single", field: "ferritin", label: "S. Ferritin" },
  { kind: "single", field: "tsat", label: "TSAT" },
  { kind: "single", field: "boneMarrowStudy", label: "Bone Marrow Study" },
  { kind: "single", field: "b12", label: "S. B12 level" },
  { kind: "dual", field: "folate", label: "S. Folate", unit1: "µg/L", unit2: "ng/mL" },
];

function addHemSectionFavourites(entries: HemSectionFav[], sectionTitle: string) {
  for (const e of entries) {
    if (e.kind === "single") {
      addFavouriteField(REPORT_TYPE, REPORT_NAME, e.field, e.label, sectionTitle);
    } else {
      addFavouriteField(
        REPORT_TYPE,
        REPORT_NAME,
        `${e.field}_value1`,
        `${e.label} - Value (${e.unit1})`,
        sectionTitle,
      );
      addFavouriteField(
        REPORT_TYPE,
        REPORT_NAME,
        `${e.field}_value2`,
        `${e.label} - Value (${e.unit2})`,
        sectionTitle,
      );
    }
  }
}

function removeHemSectionFavourites(entries: HemSectionFav[]) {
  for (const e of entries) {
    if (e.kind === "single") {
      removeFavouriteField(REPORT_TYPE, e.field);
    } else {
      removeFavouriteField(REPORT_TYPE, `${e.field}_value1`);
      removeFavouriteField(REPORT_TYPE, `${e.field}_value2`);
    }
  }
}

function isHemSectionAllFavourited(entries: HemSectionFav[]): boolean {
  return entries.every((e) => {
    if (e.kind === "single") return isFieldFavourite(REPORT_TYPE, e.field);
    return isFieldFavourite(REPORT_TYPE, `${e.field}_value1`);
  });
}

export default function HematologyModal({ onClose, defaultDate, onDataChange, patientId, onSaveSuccess, savedData = [], embedded = false, hideDatePicker = false, hideFormActions = false }: Props) {
  const [formData, setFormData] = useState<Record<string, string | DualValue>>({})
  const [reportDate, setReportDate] = useState(defaultDate)
  const [saving, setSaving] = useState(false)
  const [, setFavoritesUpdated] = useState(0);
  useFavouritesSync();

  const renderSectionHeader = (
    title: string,
    sectionFavs?: { entries: HemSectionFav[]; sectionTitle: string },
  ) => {
    const allFav =
      sectionFavs !== undefined &&
      isHemSectionAllFavourited(sectionFavs.entries);
    return (
      <div className="flex items-center justify-between gap-3 mb-3 pb-2 border-b border-slate-200">
        <h3 className="font-semibold text-lg text-blue-700">{title}</h3>
        {sectionFavs ? (
          <button
            type="button"
            onClick={() => {
              if (allFav) {
                removeHemSectionFavourites(sectionFavs.entries);
              } else {
                addHemSectionFavourites(
                  sectionFavs.entries,
                  sectionFavs.sectionTitle,
                );
              }
              setFavoritesUpdated((p) => p + 1);
            }}
            className="flex items-center gap-1.5 shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-medium text-blue-800 bg-blue-50/90 hover:bg-blue-100 border border-blue-200/80"
            title={
              allFav
                ? `Remove all ${title} fields from favorites`
                : `Add all ${title} sub-fields to favorites`
            }
          >
            <FavouriteFieldIcon active={allFav} />
            <span>Bookmark section</span>
          </button>
        ) : null}
      </div>
    );
  };

  
  useEffect(() => {
    if (savedData && savedData.length > 0) {
      const dateStr = reportDate.toISOString().split('T')[0]
      const matchingTest = savedData.find(test => {
        if (!test.hematology) return false
        const testDate = test.sampleDate instanceof Date 
          ? test.sampleDate.toISOString().split('T')[0]
          : new Date(test.sampleDate).toISOString().split('T')[0]
        return testDate === dateStr
      })
      
      const testToLoad = matchingTest || savedData
        .filter(test => test.hematology)
        .sort((a, b) => {
          const dateA = a.sampleDate instanceof Date ? a.sampleDate : new Date(a.sampleDate)
          const dateB = b.sampleDate instanceof Date ? b.sampleDate : new Date(b.sampleDate)
          return dateB.getTime() - dateA.getTime()
        })[0]
      
      if (testToLoad?.hematology && typeof testToLoad.hematology === 'object' && testToLoad.hematology !== null) {
        
        
        const savedHematologyData = testToLoad.hematology as Record<string, string | DualValue>
        setFormData(savedHematologyData)
        const testDate = testToLoad.sampleDate instanceof Date 
          ? testToLoad.sampleDate 
          : new Date(testToLoad.sampleDate)
        setReportDate(testDate)
      }
    }
    
    
  }, [savedData]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateField = (field: string, value: string, key?: keyof DualValue) => {
    setFormData(prev => {
      if (key) {
        const current = (prev[field] as DualValue) || { value1: "", value2: "" }
        return { ...prev, [field]: { ...current, [key]: value } }
      }
      return { ...prev, [field]: value }
    })
  }

  const getFieldValue = (field: string, key?: keyof DualValue) => {
    if (key) return ((formData[field] as DualValue)?.[key]) || ""
    return (formData[field] as string) || ""
  }

  const fieldColors = [
    "bg-blue-50 border-blue-200",
    "bg-green-50 border-green-200",
    "bg-purple-50 border-purple-200",
    "bg-yellow-50 border-yellow-200",
    "bg-pink-50 border-pink-200",
    "bg-indigo-50 border-indigo-200",
    "bg-orange-50 border-orange-200",
    "bg-cyan-50 border-cyan-200",
  ]

  const renderField = (name: string, label: string, index: number, unit?: string) => {
    const color = fieldColors[index % fieldColors.length]

    return (
      <div className={`p-2 rounded ${color}`}>
        <div className="grid grid-cols-3 gap-2 items-end">
          <div className="col-span-2">
            <div className="mb-1">
              <Label className="text-sm font-medium">
                {label}{" "}
                {unit && <span className="text-gray-500">({unit})</span>}
              </Label>
            </div>
            <Input
              value={getFieldValue(name)}
              onChange={(e) => updateField(name, e.target.value)}
              placeholder={unit || "Enter value"}
              className="bg-white"
            />
          </div>
        </div>
      </div>
    )
  }

  const renderDualField = (name: string, label: string, index: number, unit1: string, unit2: string, convert: (dir: "to2" | "to1", val: number) => number) => {
    const color = fieldColors[index % fieldColors.length]

    return (
      <div className={`p-2 rounded ${color}`}>
        <div className="grid grid-cols-4 gap-2 items-end">
          <div className="col-span-1">
            <div className="mb-1">
              <Label className="text-sm font-medium">{label}</Label>
            </div>
          </div>
          <div>
            <Label className="text-sm">Value ({unit1})</Label>
            <Input
              value={getFieldValue(name, "value1")}
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                updateField(name, e.target.value, "value1")
                if (!isNaN(v)) updateField(name, convert("to2", v).toFixed(2), "value2")
                else updateField(name, "", "value2")
              }}
              placeholder={unit1}
              className="bg-white"
            />
          </div>
          <div>
            <Label className="text-sm">Value ({unit2})</Label>
            <Input
              value={getFieldValue(name, "value2")}
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                updateField(name, e.target.value, "value2")
                if (!isNaN(v)) updateField(name, convert("to1", v).toFixed(2), "value1")
                else updateField(name, "", "value1")
              }}
              placeholder={unit2}
              className="bg-white"
            />
          </div>
        </div>
      </div>
    )
  }

  const computeTsat = (serumIronUgdl: string, tibcUgl: string) => {
    const feUgdl = parseFloat(serumIronUgdl)
    const tibc = parseFloat(tibcUgl)
    if (!isNaN(feUgdl) && !isNaN(tibc) && tibc !== 0) {
      const feUgl = feUgdl * 10 
      return ((feUgl / tibc) * 100).toFixed(2)
    }
    return ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const hasData = Object.keys(formData).length > 0 && 
      Object.values(formData).some(f => {
        if (typeof f === 'string') return f.trim() !== ''
        if (f && typeof f === 'object') return f.value1 || f.value2
        return false
      })
    
    if (!hasData) {
      alert("Please enter at least one field value before saving.")
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/patient-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patientId || null,
          sampleDate: `${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, '0')}-${String(reportDate.getDate()).padStart(2, '0')}`,
          hematology: formData,
        })
      })

      const data = await response
        .json()
        .catch(() => ({} as { message?: string; test?: unknown }))

      if (response.ok) {
        onSaveSuccess?.(data.test)
        if (onDataChange) onDataChange(formData, reportDate)
        alert("Hematology data saved successfully!")
        onClose()
      } else {
        alert(
          (typeof data.message === "string" && data.message) ||
            "Failed to save data. Please try again.",
        )
      }
    } catch (error) {
      console.error("Error saving Hematology data:", error)
      alert("Failed to save data. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  let i = 0

  const shellClass = embedded
    ? "w-full flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm max-h-[min(85vh,900px)] min-h-0 overflow-hidden"
    : "bg-white rounded-lg max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden"

  return (
    <ReportFormContainer embedded={embedded}>
      <div className={shellClass}>
        <div className="flex justify-between items-center bg-linear-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-t-lg shadow-md shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">Hematology</h2>
            {!hideDatePicker && (
              <ModalDatePicker
                selectedDate={reportDate}
                onDateChange={setReportDate}
                defaultDate={defaultDate}
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            {!hideFormActions && (
            <div className="hidden sm:flex gap-2 mr-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving} className="bg-white/10 hover:bg-white/20 text-white border-white/40">
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const form = document.getElementById('hematology-form')
                  form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
                }}
                disabled={saving}
                className="bg-amber-400 hover:bg-amber-500 text-blue-900"
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
            )}
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto p-6 flex-1">
          <form id="hematology-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="mb-6 pb-4 border-b">
              {renderSectionHeader("CBC", {
                entries: HEM_CBC_FAVS,
                sectionTitle: "CBC",
              })}
              <div className="grid grid-cols-2 gap-2">
                {renderField("rbc", "RBC", i++, "million/µL")}
                {renderField("hemoglobin", "Hb / Hgb", i++, "g/dL")}
                {renderField("hct", "Hct", i++, "%")}
                {renderField("mcv", "MCV", i++, "fL")}
                {renderField("mch", "MCH", i++, "pg")}
                {renderField("mchc", "MCHC", i++, "g/dL")}
                {renderField("rdw", "RDW", i++, "%")}
                {renderField("wbc", "WBC", i++, "cells/µL")}
                {renderDualField("neutrophils", "Neutrophils", i++, "%", "cells/µL", (_dir, val) => val)}
                {renderDualField("lymphocytes", "Lymphocytes", i++, "%", "cells/µL", (_dir, val) => val)}
                {renderDualField("monocytes", "Monocytes", i++, "%", "cells/µL", (_dir, val) => val)}
                {renderDualField("eosinophils", "Eosinophils", i++, "%", "cells/µL", (_dir, val) => val)}
                {renderDualField("basophils", "Basophils", i++, "%", "cells/µL", (_dir, val) => val)}
                {renderField("immatureGranulocytes", "Immature Granulocytes", i++, "%")}
                {renderField("nrbc", "nRBC", i++, "cells/100 WBC")}
                {renderField("plt", "PLT", i++, "/µL")}
                {renderField("mpv", "MPV", i++, "fL")}
                {renderField("pdw", "PDW", i++, "fL")}
                {renderField("pct", "PCT", i++, "%")}
                {renderField("esr", "ESR", i++, "mm in 1st hour")}
              </div>
            </div>

            <div className="mb-6 pb-4 border-b">
              {renderSectionHeader("Coagulation", {
                entries: HEM_COAG_FAVS,
                sectionTitle: "Coagulation",
              })}
              <div className="space-y-2">
                <div className={`p-2 rounded ${fieldColors[i % fieldColors.length]}`}>
                  <div className="mb-2">
                    <Label className="text-sm font-medium">Prothrombin Time</Label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-sm">Patient (Sec)</Label>
                      <Input value={getFieldValue("ptPatient")} onChange={(e) => updateField("ptPatient", e.target.value)} className="bg-white" />
                    </div>
                    <div>
                      <Label className="text-sm">Test (Sec)</Label>
                      <Input value={getFieldValue("ptTest")} onChange={(e) => updateField("ptTest", e.target.value)} className="bg-white" />
                    </div>
                    <div>
                      <Label className="text-sm">INR</Label>
                      <Input value={getFieldValue("inr")} onChange={(e) => updateField("inr", e.target.value)} className="bg-white" />
                    </div>
                  </div>
                </div>
                {i++}
                <div className="grid grid-cols-2 gap-2">
                  {renderField("aptt", "APTT", i++, "Sec")}
                  {renderDualField("fibrinogen", "Fibrinogen", i++, "g/L", "mg/dL", (dir, val) => dir === "to2" ? val * 100 : val / 100)}
                  {renderField("dDimer", "D-dimer", i++, "ng/mL")}
                  {renderField("bleedingTime", "Bleeding Time", i++, "Sec")}
                  {renderField("clottingTime", "Clotting Time", i++, "Sec")}
                  {renderField("reticulocyteCount", "Reticulocyte count", i++, "%")}
                </div>
              </div>
            </div>

            <div className="mb-6 pb-4 border-b">
              {renderSectionHeader("Chemistry", {
                entries: HEM_CHEM_FAVS,
                sectionTitle: "Chemistry",
              })}
              <div className="grid grid-cols-2 gap-2">
                {renderField("pbf", "PBF", i++)}
                {renderField("ldh", "LDH", i++, "U/L")}
                <div className={`p-2 rounded ${fieldColors[i % fieldColors.length]}`}>
                  <div className="grid grid-cols-3 gap-2 items-end">
                    <div className="col-span-1">
                      <div className="mb-1">
                        <Label className="text-sm font-medium">S. Iron / S. Fe</Label>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm">Value (µmol/L)</Label>
                      <Input
                        value={getFieldValue("serumIron", "value1")}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value)
                          const val1 = e.target.value
                          const val2 = !isNaN(v) ? (v / 0.179).toFixed(2) : ""
                          setFormData(prev => {
                            const tibc = (prev.tibc as string) || ""
                            const nextTsat = computeTsat(val2, tibc)
                            return {
                              ...prev,
                              serumIron: { value1: val1, value2: val2 },
                              tsat: nextTsat
                            }
                          })
                        }}
                        placeholder="µmol/L"
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Value (µg/dL)</Label>
                      <Input
                        value={getFieldValue("serumIron", "value2")}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value)
                          const val2 = e.target.value
                          const val1 = !isNaN(v) ? (v * 0.179).toFixed(2) : ""
                          setFormData(prev => {
                            const tibc = (prev.tibc as string) || ""
                            const nextTsat = computeTsat(val2, tibc)
                            return {
                              ...prev,
                              serumIron: { value1: val1, value2: val2 },
                              tsat: nextTsat
                            }
                          })
                        }}
                        placeholder="µg/dL"
                        className="bg-white"
                      />
                    </div>
                  </div>
                </div>
                {i++}
                {renderField("tibc", "TIBC", i++, "µg/L")}
                {renderField("ferritin", "S. Ferritin", i++, "ng/mL")}
                {renderField("tsat", "TSAT", i++, "%")}
                {renderField("boneMarrowStudy", "Bone Marrow Study", i++)}
                {renderField("b12", "S. B12 level", i++, "µg/L")}
                {renderDualField("folate", "S. Folate", i++, "µg/L", "ng/mL", (_dir, val) => val)}
              </div>
            </div>

            {!hideFormActions && (
            <div className="flex gap-2 justify-end pt-4 border-t mt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
            )}
          </form>
        </div>
      </div>
    </ReportFormContainer>
  )
}

