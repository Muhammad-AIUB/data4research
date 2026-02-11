'use client'

import { useState, useEffect } from "react"
import { X, Heart } from "lucide-react"
import { 
  addFavouriteField,
  isFieldFavourite,
  removeFavouriteField
} from "@/lib/favourites"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import ModalDatePicker from "@/components/ModalDatePicker"

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
  const [, setFavoritesUpdated] = useState(0)
  
  
  const dualFields = new Set([
    'neutrophils', 'lymphocytes', 'monocytes', 'eosinophils', 'basophils',
    'serumIron' 
  ])

  const renderSectionHeader = (title: string) => {
    return (
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg text-blue-700">{title}</h3>
      </div>
    )
  }

  
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
            <div className="flex items-center justify-between mb-1">
              <Label className="text-sm font-medium">{label} {unit && <span className="text-gray-500">({unit})</span>}</Label>
              <button
                type="button"
                onClick={() => {
                  const reportType = 'hematology'
                  const reportName = 'Hematology'
                  if (dualFields.has(name)) {
                    const isFav = isFieldFavourite(reportType, `${name}_value1`)
                    if (isFav) {
                      removeFavouriteField(reportType, `${name}_value1`)
                      removeFavouriteField(reportType, `${name}_value2`)
                    } else {
                      addFavouriteField(reportType, reportName, `${name}_value1`, `${label} - Value (% )`)
                      addFavouriteField(reportType, reportName, `${name}_value2`, `${label} - Value (cells/µL)`)
                    }
                  } else {
                    const isFav = isFieldFavourite(reportType, name)
                    if (isFav) removeFavouriteField(reportType, name)
                    else addFavouriteField(reportType, reportName, name, label)
                  }
                  setFavoritesUpdated(prev => prev + 1)
                }}
                className="p-1 rounded hover:bg-gray-100"
                title={dualFields.has(name) ? (isFieldFavourite('hematology', `${name}_value1`) ? 'Remove from Favorites' : 'Add to Favorites') : (isFieldFavourite('hematology', name) ? 'Remove from Favorites' : 'Add to Favorites')}
              >
                <Heart className={`h-5 w-5 ${dualFields.has(name) ? (isFieldFavourite('hematology', `${name}_value1`) ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500') : (isFieldFavourite('hematology', name) ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500')}`} />
              </button>
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
            <div className="flex items-center justify-between mb-1">
              <Label className="text-sm font-medium">{label}</Label>
              <button
                type="button"
                onClick={() => {
                  const reportType = 'hematology'
                  const reportName = 'Hematology'
                  const isFav = isFieldFavourite(reportType, `${name}_value1`)
                  if (isFav) {
                    removeFavouriteField(reportType, `${name}_value1`)
                    removeFavouriteField(reportType, `${name}_value2`)
                  } else {
                    addFavouriteField(reportType, reportName, `${name}_value1`, `${label} - Value (${unit1})`)
                    addFavouriteField(reportType, reportName, `${name}_value2`, `${label} - Value (${unit2})`)
                  }
                  setFavoritesUpdated(prev => prev + 1)
                }}
                className="p-1 rounded hover:bg-gray-100"
                title={isFieldFavourite('hematology', `${name}_value1`) ? 'Remove from Favorites' : 'Add to Favorites'}
              >
                <Heart className={`h-5 w-5 ${isFieldFavourite('hematology', `${name}_value1`) ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} />
              </button>
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
        <div className="flex justify-between items-center bg-linear-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-t-lg shadow-md shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">Hematology</h2>
            <ModalDatePicker
              selectedDate={reportDate}
              onDateChange={setReportDate}
              defaultDate={defaultDate}
            />
          </div>
          <div className="flex items-center gap-2">
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
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto p-6 flex-1">
          <form id="hematology-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="mb-6 pb-4 border-b">
              {renderSectionHeader("CBC")}
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
              {renderSectionHeader("Coagulation")}
              <div className="space-y-2">
                <div className={`p-2 rounded ${fieldColors[i % fieldColors.length]}`}>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Prothrombin Time</Label>
                    <button
                      type="button"
                      onClick={() => {
                        const reportType = 'hematology'
                        const reportName = 'Hematology'
                        const isFav = isFieldFavourite(reportType, 'ptPatient')
                        if (isFav) {
                          removeFavouriteField(reportType, 'ptPatient')
                          removeFavouriteField(reportType, 'ptTest')
                          removeFavouriteField(reportType, 'inr')
                        } else {
                          addFavouriteField(reportType, reportName, 'ptPatient', 'Prothrombin Time Patient')
                          addFavouriteField(reportType, reportName, 'ptTest', 'Prothrombin Time Test')
                          addFavouriteField(reportType, reportName, 'inr', 'INR')
                        }
                        setFavoritesUpdated(prev => prev + 1)
                      }}
                      className="p-1 rounded hover:bg-gray-100"
                      title={isFieldFavourite('hematology', 'ptPatient') ? 'Remove from Favorites' : 'Add to Favorites'}
                    >
                      <Heart className={`h-5 w-5 ${isFieldFavourite('hematology', 'ptPatient') ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} />
                    </button>
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
              {renderSectionHeader("Chemistry")}
              <div className="grid grid-cols-2 gap-2">
                {renderField("pbf", "PBF", i++)}
                {renderField("ldh", "LDH", i++, "U/L")}
                <div className={`p-2 rounded ${fieldColors[i % fieldColors.length]}`}>
                  <div className="grid grid-cols-3 gap-2 items-end">
                    <div className="col-span-1">
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-sm font-medium">S. Iron / S. Fe</Label>
                        <button
                          type="button"
                          onClick={() => {
                            const reportType = 'hematology'
                            const reportName = 'Hematology'
                            const isFav = isFieldFavourite(reportType, 'serumIron_value1')
                            if (isFav) {
                              removeFavouriteField(reportType, 'serumIron_value1')
                              removeFavouriteField(reportType, 'serumIron_value2')
                            } else {
                              addFavouriteField(reportType, reportName, 'serumIron_value1', 'S. Iron / S. Fe - Value (µmol/L)')
                              addFavouriteField(reportType, reportName, 'serumIron_value2', 'S. Iron / S. Fe - Value (µg/dL)')
                            }
                            setFavoritesUpdated(prev => prev + 1)
                          }}
                          className="p-1 rounded hover:bg-gray-100"
                          title={isFieldFavourite('hematology', 'serumIron_value1') ? 'Remove from Favorites' : 'Add to Favorites'}
                        >
                          <Heart className={`h-5 w-5 ${isFieldFavourite('hematology', 'serumIron_value1') ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} />
                        </button>
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

