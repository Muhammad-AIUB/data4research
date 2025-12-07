'use client'

import { useState, useEffect } from "react"
import { X, Star, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import ModalDatePicker from "@/components/ModalDatePicker"
import { addFavouriteField, removeFavouriteField, isFieldFavourite } from "@/lib/favourites"

interface Props {
  onClose: () => void
  defaultDate: Date
  onDataChange?: (data: Record<string, string | DualValue>, date: Date) => void
  patientId?: string | null
  onSaveSuccess?: () => void
  savedData?: Array<{ sampleDate: Date | string; hematology?: Record<string, unknown> | null }>
}

type DualValue = { value1: string; value2: string }

export default function HematologyModal({ onClose, defaultDate, onDataChange, patientId, onSaveSuccess, savedData = [] }: Props) {
  const [formData, setFormData] = useState<Record<string, string | DualValue>>({})
  const [reportDate, setReportDate] = useState(defaultDate)
  const [saving, setSaving] = useState(false)
  const reportType = "hematology"
  const reportName = "Hematology"

  // Load saved data when modal opens
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
        setFormData(testToLoad.hematology as Record<string, string | DualValue>)
        const testDate = testToLoad.sampleDate instanceof Date 
          ? testToLoad.sampleDate 
          : new Date(testToLoad.sampleDate)
        setReportDate(testDate)
      }
    }
  }, [savedData, reportDate])

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
    const isFav = isFieldFavourite(reportType, name)
    const fullLabel = `${label}${unit ? ` (${unit})` : ''}`
    
    return (
      <div className={`p-2 rounded ${color}`}>
        <div className="grid grid-cols-3 gap-2 items-end">
          <div className="col-span-2">
            <Label className="text-sm font-medium">{label} {unit && <span className="text-gray-500">({unit})</span>}</Label>
            <Input
              value={getFieldValue(name)}
              onChange={(e) => updateField(name, e.target.value)}
              placeholder={unit || "Enter value"}
              className="bg-white"
            />
          </div>
          <div className="flex justify-end">
            {isFav ? (
              <button
                type="button"
                onClick={() => {
                  removeFavouriteField(reportType, name)
                  alert(`${fullLabel} removed from favourites!`)
                }}
                className="flex items-center gap-1 px-2 py-1.5 bg-red-500 hover:bg-red-600 rounded text-xs text-white transition-colors"
                title="Remove from favourites"
              >
                <Trash2 className="w-3 h-3" />
                Remove
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  addFavouriteField(reportType, reportName, name, fullLabel)
                  alert(`${fullLabel} added to favourites!`)
                }}
                className="flex items-center gap-1 px-2 py-1.5 bg-yellow-500 hover:bg-yellow-600 rounded text-xs text-white transition-colors"
                title="Add to favourites"
              >
                <Star className="w-3 h-3" />
                Add Fav
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderDualField = (name: string, label: string, index: number, unit1: string, unit2: string, convert: (dir: "to2" | "to1", val: number) => number) => {
    const color = fieldColors[index % fieldColors.length]
    const isFav = isFieldFavourite(reportType, name)
    
    return (
      <div className={`p-2 rounded ${color}`}>
        <div className="grid grid-cols-4 gap-2 items-end">
          <div className="col-span-1">
            <Label className="text-sm font-medium">{label}</Label>
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
          <div className="flex justify-end">
            {isFav ? (
              <button
                type="button"
                onClick={() => {
                  removeFavouriteField(reportType, name)
                  alert(`${label} removed from favourites!`)
                }}
                className="flex items-center gap-1 px-2 py-1.5 bg-red-500 hover:bg-red-600 rounded text-xs text-white transition-colors"
                title="Remove from favourites"
              >
                <Trash2 className="w-3 h-3" />
                Remove
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  addFavouriteField(reportType, reportName, name, label)
                  alert(`${label} added to favourites!`)
                }}
                className="flex items-center gap-1 px-2 py-1.5 bg-yellow-500 hover:bg-yellow-600 rounded text-xs text-white transition-colors"
                title="Add to favourites"
              >
                <Star className="w-3 h-3" />
                Add Fav
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const computeTsat = (serumIronUgdl: string, tibcUgl: string) => {
    const feUgdl = parseFloat(serumIronUgdl)
    const tibc = parseFloat(tibcUgl)
    if (!isNaN(feUgdl) && !isNaN(tibc) && tibc !== 0) {
      const feUgl = feUgdl * 10 // convert µg/dL -> µg/L
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

      if (response.ok) {
        if (onSaveSuccess) onSaveSuccess()
        if (onDataChange) onDataChange(formData, reportDate)
        alert("Hematology data saved successfully!")
        onClose()
      } else {
        const error = await response.json()
        alert(error.message || "Failed to save data. Please try again.")
      }
    } catch (error) {
      console.error("Error saving Hematology data:", error)
      alert("Failed to save data. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  let i = 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-t-lg shadow-md shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">Hematology</h2>
            <ModalDatePicker
              selectedDate={reportDate}
              onDateChange={setReportDate}
              defaultDate={defaultDate}
            />
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-6 flex-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="mb-6 pb-4 border-b">
              <h3 className="font-semibold text-lg mb-3 text-blue-700">CBC</h3>
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
              <h3 className="font-semibold text-lg mb-3 text-blue-700">Coagulation</h3>
              <div className="space-y-2">
                <div className={`p-2 rounded ${fieldColors[i % fieldColors.length]}`}>
                  <Label className="text-sm font-medium mb-2 block">Prothrombin Time</Label>
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
              <h3 className="font-semibold text-lg mb-3 text-blue-700">Chemistry</h3>
              <div className="grid grid-cols-2 gap-2">
                {renderField("pbf", "PBF", i++)}
                {renderField("ldh", "LDH", i++, "U/L")}
                <div className={`p-2 rounded ${fieldColors[i % fieldColors.length]}`}>
                  <div className="grid grid-cols-3 gap-2 items-end">
                    <div className="col-span-1">
                      <Label className="text-sm font-medium">S. Iron / S. Fe</Label>
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

            <div className="flex gap-2 justify-end pt-4 border-t mt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

