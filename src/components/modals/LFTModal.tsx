'use client'

import { useState, useEffect } from "react"
import { X, Star, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectItem, SelectValue } from "@/components/ui/select"
import ModalDatePicker from "@/components/ModalDatePicker"
import { addFavouriteField, removeFavouriteField, isFieldFavourite } from "@/lib/favourites"

interface Props {
  onClose: () => void
  defaultDate: Date
  onDataChange?: (data: any, date: Date) => void
  patientId?: string | null
  onSaveSuccess?: () => void
  savedData?: Array<{ sampleDate: Date | string; lft?: any }>
}

export default function LFTModal({ onClose, defaultDate, onDataChange, patientId, onSaveSuccess, savedData = [] }: Props) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [reportDate, setReportDate] = useState(defaultDate)
  const [saving, setSaving] = useState(false)
  const reportType = "lft"
  const reportName = "LFT (Liver Function Test)"

  // Load saved data when modal opens
  useEffect(() => {
    if (savedData && savedData.length > 0) {
      const dateStr = reportDate.toISOString().split('T')[0]
      const matchingTest = savedData.find(test => {
        if (!test.lft) return false
        const testDate = test.sampleDate instanceof Date 
          ? test.sampleDate.toISOString().split('T')[0]
          : new Date(test.sampleDate).toISOString().split('T')[0]
        return testDate === dateStr
      })
      
      const testToLoad = matchingTest || savedData
        .filter(test => test.lft)
        .sort((a, b) => {
          const dateA = a.sampleDate instanceof Date ? a.sampleDate : new Date(a.sampleDate)
          const dateB = b.sampleDate instanceof Date ? b.sampleDate : new Date(b.sampleDate)
          return dateB.getTime() - dateA.getTime()
        })[0]
      
      if (testToLoad?.lft) {
        setFormData(testToLoad.lft as Record<string, any>)
        const testDate = testToLoad.sampleDate instanceof Date 
          ? testToLoad.sampleDate 
          : new Date(testToLoad.sampleDate)
        setReportDate(testDate)
      }
    }
    // Only run when savedData changes, not on every reportDate change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedData])

  const updateField = (fieldName: string, value: string, type?: string) => {
    setFormData(prev => {
      if (type) {
        return {
          ...prev,
          [fieldName]: {
            ...prev[fieldName],
            [type]: value
          }
        }
      }
      return {
        ...prev,
        [fieldName]: value
      }
    })
  }

  const getFieldValue = (fieldName: string, type?: string) => {
    if (type && formData[fieldName]) {
      return formData[fieldName][type] || ""
    }
    return formData[fieldName] || ""
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

  const renderField = (fieldName: string, label: string, index: number, unit?: string) => {
    const colorClass = fieldColors[index % fieldColors.length]
    const isFav = isFieldFavourite(reportType, fieldName)
    const fullLabel = `${label}${unit ? ` (${unit})` : ''}`
    
    return (
      <div className={`p-2 rounded ${colorClass}`}>
        <div className="grid grid-cols-3 gap-2 items-end">
          <div className="col-span-2">
            <Label className="text-sm font-medium">{label} {unit && <span className="text-gray-500">({unit})</span>}</Label>
            <Input
              value={getFieldValue(fieldName)}
              onChange={(e) => updateField(fieldName, e.target.value)}
              placeholder={unit || "Enter value"}
              className="bg-white"
            />
          </div>
          <div className="flex justify-end">
            {isFav ? (
              <button
                type="button"
                onClick={() => {
                  removeFavouriteField(reportType, fieldName)
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
                  addFavouriteField(reportType, reportName, fieldName, fullLabel)
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

  const renderDualField = (fieldName: string, label: string, index: number, unit1: string, unit2: string, conversion: (val1: number, val2: number) => { val1: number; val2: number }) => {
    const colorClass = fieldColors[index % fieldColors.length]
    const isFav = isFieldFavourite(reportType, fieldName)
    
    return (
      <div className={`p-2 rounded ${colorClass}`}>
        <div className="grid grid-cols-4 gap-2 items-end">
          <div className="col-span-1">
            <Label className="text-sm font-medium">{label}</Label>
          </div>
          <div>
            <Label className="text-sm">Value ({unit1})</Label>
            <Input
              value={getFieldValue(fieldName, 'value1')}
              onChange={(e) => {
                const val1 = parseFloat(e.target.value) || 0
                const val2 = getFieldValue(fieldName, 'value2')
                const calculated = conversion(val1, parseFloat(val2) || 0)
                updateField(fieldName, e.target.value, 'value1')
                if (calculated.val2) {
                  updateField(fieldName, calculated.val2.toString(), 'value2')
                }
              }}
              placeholder={unit1}
              className="bg-white"
            />
          </div>
          <div>
            <Label className="text-sm">Value ({unit2})</Label>
            <Input
              value={getFieldValue(fieldName, 'value2')}
              onChange={(e) => {
                const val2 = parseFloat(e.target.value) || 0
                const val1 = getFieldValue(fieldName, 'value1')
                const calculated = conversion(parseFloat(val1) || 0, val2)
                updateField(fieldName, e.target.value, 'value2')
                if (calculated.val1) {
                  updateField(fieldName, calculated.val1.toString(), 'value1')
                }
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
                  removeFavouriteField(reportType, fieldName)
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
                  addFavouriteField(reportType, reportName, fieldName, label)
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

  const renderDropdown = (fieldName: string, label: string, index: number, options: string[]) => {
    const colorClass = fieldColors[index % fieldColors.length]
    const isFav = isFieldFavourite(reportType, fieldName)
    
    return (
      <div className={`p-2 rounded ${colorClass}`}>
        <div className="grid grid-cols-3 gap-2 items-end">
          <div className="col-span-2">
            <Label className="text-sm font-medium">{label}</Label>
            <Select
              value={getFieldValue(fieldName)}
              onValueChange={(v) => updateField(fieldName, v)}
              className="bg-white"
            >
              <SelectValue placeholder="Select" />
              {options.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </Select>
          </div>
          <div className="flex justify-end">
            {isFav ? (
              <button
                type="button"
                onClick={() => {
                  removeFavouriteField(reportType, fieldName)
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
                  addFavouriteField(reportType, reportName, fieldName, label)
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
          lft: formData,
        })
      })

      if (response.ok) {
        if (onSaveSuccess) onSaveSuccess()
        if (onDataChange) onDataChange(formData, reportDate)
        alert("LFT data saved successfully!")
        onClose()
      } else {
        const error = await response.json()
        alert(error.message || "Failed to save data. Please try again.")
      }
    } catch (error) {
      console.error("Error saving LFT data:", error)
      alert("Failed to save data. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  let fieldIndex = 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-t-lg shadow-md flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">LFT (Liver Function Test)</h2>
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
            {/* Liver Function Tests */}
            <div className="mb-6 pb-4 border-b">
              <h3 className="font-semibold text-lg mb-3 text-blue-700">Liver Function Tests and Coagulation Parameters</h3>
              <div className="space-y-2">
                {renderField("alt", "ALT/SGPT", fieldIndex++, "U/L")}
                {renderField("ast", "AST/SGOT", fieldIndex++, "U/L")}
                {renderField("alp", "ALP", fieldIndex++, "U/L")}
                {renderDualField("bilirubinTotal", "S. Bilirubin (Total)", fieldIndex++, "µmol/L", "mg/dL", (val1, val2) => {
                  if (val1) return { val1, val2: val1 / 17.1 }
                  if (val2) return { val1: val2 * 17.1, val2 }
                  return { val1: 0, val2: 0 }
                })}
                {renderDualField("bilirubinDirect", "S. Bilirubin (Direct)", fieldIndex++, "µmol/L", "mg/dL", (val1, val2) => {
                  if (val1) return { val1, val2: val1 / 17.1 }
                  if (val2) return { val1: val2 * 17.1, val2 }
                  return { val1: 0, val2: 0 }
                })}
                {renderDualField("bilirubinIndirect", "S. Bilirubin (Indirect)", fieldIndex++, "µmol/L", "mg/dL", (val1, val2) => {
                  if (val1) return { val1, val2: val1 / 17.1 }
                  if (val2) return { val1: val2 * 17.1, val2 }
                  return { val1: 0, val2: 0 }
                })}
                <div className={`p-2 rounded ${fieldColors[fieldIndex % fieldColors.length]}`}>
                  <Label className="text-sm font-medium mb-2 block">Prothrombin Time</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-sm">Patient (Sec)</Label>
                      <Input
                        value={getFieldValue("ptPatient")}
                        onChange={(e) => updateField("ptPatient", e.target.value)}
                        placeholder="Sec"
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Test (Sec)</Label>
                      <Input
                        value={getFieldValue("ptTest")}
                        onChange={(e) => updateField("ptTest", e.target.value)}
                        placeholder="Sec"
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">INR</Label>
                      <Input
                        value={getFieldValue("inr")}
                        onChange={(e) => updateField("inr", e.target.value)}
                        placeholder="INR"
                        className="bg-white"
                      />
                    </div>
                  </div>
                </div>
                {fieldIndex++}
                {renderDualField("albumin", "S. Albumin", fieldIndex++, "g/L", "g/dL", (val1, val2) => {
                  if (val1) return { val1, val2: val1 / 10 }
                  if (val2) return { val1: val2 * 10, val2 }
                  return { val1: 0, val2: 0 }
                })}
                {renderDualField("globulin", "S. Globulin", fieldIndex++, "g/L", "g/dL", (val1, val2) => {
                  if (val1) return { val1, val2: val1 / 10 }
                  if (val2) return { val1: val2 * 10, val2 }
                  return { val1: 0, val2: 0 }
                })}
                {renderField("agRatio", "A/G ratio", fieldIndex++)}
                {renderField("totalProtein", "S. Total Protein", fieldIndex++)}
              </div>
            </div>

            {/* Viral Markers */}
            <div className="mb-6 pb-4 border-b">
              <h3 className="font-semibold text-lg mb-3 text-blue-700">Viral Markers</h3>
              <div className="space-y-2">
                {renderDropdown("hbsag", "HBsAg", fieldIndex++, ["Positive", "Negative"])}
                {renderDropdown("antiHBe", "Anti HBe", fieldIndex++, ["Positive", "Negative"])}
                {renderDropdown("hbeag", "HBeAg", fieldIndex++, ["Positive", "Negative"])}
                {renderDropdown("antiHbcIgm", "Anti HBc IgM", fieldIndex++, ["Positive", "Negative"])}
                {renderDropdown("antiHbcTotal", "Anti HBc Total", fieldIndex++, ["Positive", "Negative"])}
                {renderDualField("hbvDna", "HBV DNA", fieldIndex++, "C/mL", "IU/mL", (val1, val2) => {
                  if (val1) return { val1, val2: val1 * 5.6 }
                  if (val2) return { val1: val2 / 5.6, val2 }
                  return { val1: 0, val2: 0 }
                })}
                {renderDropdown("antiHcv", "Anti HCV", fieldIndex++, ["Positive", "Negative"])}
                {renderDualField("hcvRna", "HCV RNA", fieldIndex++, "C/mL", "IU/mL", (val1, val2) => {
                  if (val1) return { val1, val2: val1 * 4.4 }
                  if (val2) return { val1: val2 / 4.4, val2 }
                  return { val1: 0, val2: 0 }
                })}
                {renderDropdown("antiHavIgm", "Anti HAV IgM", fieldIndex++, ["Positive", "Negative"])}
                {renderDropdown("antiHevIgm", "Anti HEV IgM", fieldIndex++, ["Positive", "Negative"])}
              </div>
            </div>

            {/* Clinical Assessment */}
            <div className="mb-6 pb-4 border-b">
              <h3 className="font-semibold text-lg mb-3 text-blue-700">Clinical Assessment and Scores</h3>
              <div className="space-y-2">
                {renderDropdown("ascites", "Ascites", fieldIndex++, ["absent", "Mild", "Moderate", "Huge"])}
                {renderDropdown("hepaticEncephalopathy", "Hepatic encephalopathy", fieldIndex++, ["No encephalopathy", "Grade 1", "Grade 2", "Grade 3", "Grade 4"])}
                {renderDropdown("dialysis", "Is Patient getting Dialysis", fieldIndex++, ["Yes", "No"])}
                {renderField("childPughScore", "Child Pugh score", fieldIndex++)}
                {renderField("meldScore", "MELD Score", fieldIndex++)}
                {renderField("meldNaScore", "MELD Na score", fieldIndex++)}
              </div>
            </div>

            {/* Ascites Fluid Study */}
            <div className="mb-6 pb-4 border-b">
              <h3 className="font-semibold text-lg mb-3 text-blue-700">Ascites Fluid Study</h3>
              <div className="space-y-2">
                {renderDropdown("appearance", "Appearance", fieldIndex++, ["Clear", "Cloudy", "Bloody"])}
                {renderDropdown("color", "Color", fieldIndex++, ["Straw", "Cloudy", "Red"])}
                {renderDropdown("turbidity", "Turbidity", fieldIndex++, ["normal", "High"])}
                {renderField("specificGravity", "Specific Gravity", fieldIndex++)}
                {renderField("totalProteinAscites", "Total Protein", fieldIndex++)}
                {renderField("albuminAscites", "Albumin", fieldIndex++)}
                {renderField("saag", "SAAG", fieldIndex++)}
                {renderField("ldh", "LDH", fieldIndex++)}
                {renderField("glucose", "Glucose", fieldIndex++)}
                {renderField("amylase", "Amylase", fieldIndex++)}
                {renderField("wbcCount", "WBC Count", fieldIndex++)}
                {renderField("neutrophils", "Neutrophils", fieldIndex++)}
                {renderField("rbcCount", "RBC Count", fieldIndex++)}
                {renderDropdown("gramStain", "Gram Stain", fieldIndex++, ["Gram positive", "gram negative", "do not take up the Gram stain"])}
                {renderDropdown("culture", "Culture", fieldIndex++, ["Positive", "Negative"])}
                {renderDropdown("afbStain", "AFB Stain", fieldIndex++, ["Positive", "Negative"])}
                {renderDropdown("pcrTb", "PCR for TB", fieldIndex++, ["Positive", "Negative"])}
                {renderDropdown("xpertTb", "Xpert for TB", fieldIndex++, ["Positive", "Negative"])}
                {renderDropdown("cytology", "Cytology", fieldIndex++, ["Positive for malignant cell", "Negative for malignant cell"])}
                {renderField("ada", "ADA", fieldIndex++)}
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
