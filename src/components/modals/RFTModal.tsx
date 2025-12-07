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
  onDataChange?: (data: any, date: Date) => void
  patientId?: string | null
  onSaveSuccess?: () => void
  savedData?: Array<{ sampleDate: Date | string; rft?: any }>
}

export default function RFTModal({ onClose, defaultDate, onDataChange, patientId, onSaveSuccess, savedData = [] }: Props) {
  const [formData, setFormData] = useState<Record<string, { value1: string; value2: string }>>({})
  const [reportDate, setReportDate] = useState(defaultDate)
  const [saving, setSaving] = useState(false)
  const reportType = "rft"
  const reportName = "RFT (Renal Function Test)"

  // Load saved data when modal opens
  useEffect(() => {
    if (savedData && savedData.length > 0) {
      // Find the most recent RFT data for the selected date or closest date
      const dateStr = reportDate.toISOString().split('T')[0]
      const matchingTest = savedData.find(test => {
        if (!test.rft) return false
        const testDate = test.sampleDate instanceof Date 
          ? test.sampleDate.toISOString().split('T')[0]
          : new Date(test.sampleDate).toISOString().split('T')[0]
        return testDate === dateStr
      })
      
      // If no exact match, get the most recent one
      const testToLoad = matchingTest || savedData
        .filter(test => test.rft)
        .sort((a, b) => {
          const dateA = a.sampleDate instanceof Date ? a.sampleDate : new Date(a.sampleDate)
          const dateB = b.sampleDate instanceof Date ? b.sampleDate : new Date(b.sampleDate)
          return dateB.getTime() - dateA.getTime()
        })[0]
      
      if (testToLoad?.rft) {
        setFormData(testToLoad.rft as Record<string, { value1: string; value2: string }>)
        const testDate = testToLoad.sampleDate instanceof Date 
          ? testToLoad.sampleDate 
          : new Date(testToLoad.sampleDate)
        setReportDate(testDate)
      }
    }
  }, [savedData, reportDate])

  const updateField = (fieldName: string, value: string, type: 'value1' | 'value2') => {
    const numValue = parseFloat(value) || 0
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          [type]: value
        }
      }
      
      // Auto calculate based on formulas
      if (fieldName === "creatinine") {
        if (type === 'value1' && value) {
          // mg/dL to µmol/L: mg/dL × 88.42 = µmol/L
          const calculated = (numValue * 88.42).toFixed(2)
          updated[fieldName].value2 = calculated
        } else if (type === 'value2' && value) {
          // µmol/L to mg/dL: µmol/L ÷ 88.42 = mg/dL
          const calculated = (numValue / 88.42).toFixed(2)
          updated[fieldName].value1 = calculated
        }
      } else if (['sodium', 'potassium', 'chloride', 'bicarbonate'].includes(fieldName)) {
        // mmol/L = mEq/L (same value)
        if (type === 'value1' && value) {
          updated[fieldName].value2 = value
        } else if (type === 'value2' && value) {
          updated[fieldName].value1 = value
        }
      }
      
      return updated
    })
  }

  const getFieldValue1 = (fieldName: string) => formData[fieldName]?.value1 || ""
  const getFieldValue2 = (fieldName: string) => formData[fieldName]?.value2 || ""

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

  const renderField = (fieldName: string, label: string, index: number, unit1: string, unit2: string) => {
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
              value={getFieldValue1(fieldName)}
              onChange={(e) => updateField(fieldName, e.target.value, 'value1')}
              placeholder={unit1}
              className="bg-white"
            />
          </div>
          <div>
            <Label className="text-sm">Value ({unit2})</Label>
            <Input
              value={getFieldValue2(fieldName)}
              onChange={(e) => updateField(fieldName, e.target.value, 'value2')}
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const hasData = Object.keys(formData).length > 0 && 
      Object.values(formData).some(f => f.value1 || f.value2)
    
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
          sampleDate: reportDate.toISOString(),
          rft: formData,
        })
      })

      if (response.ok) {
        if (onSaveSuccess) onSaveSuccess()
        if (onDataChange) onDataChange(formData, reportDate)
        alert("RFT data saved successfully!")
        onClose()
      } else {
        const error = await response.json()
        alert(error.message || "Failed to save data. Please try again.")
      }
    } catch (error) {
      console.error("Error saving RFT data:", error)
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
            <h2 className="text-xl font-bold">RFT (Renal Function Test)</h2>
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
            {/* S. Creatinine */}
            <div className="mb-6 pb-4 border-b">
              <h3 className="font-semibold text-lg mb-3 text-blue-700">S. Creatinine</h3>
              <div className="space-y-2">
                {renderField("creatinine", "S. Creatinine", fieldIndex++, "mg/dL", "µmol/L")}
              </div>
            </div>

            {/* S. Electrolyte */}
            <div className="mb-6 pb-4 border-b">
              <h3 className="font-semibold text-lg mb-3 text-blue-700">S. Electrolyte</h3>
              <div className="space-y-2">
                {renderField("sodium", "Sodium (Na+)", fieldIndex++, "mmol/L", "mEq/L")}
                {renderField("potassium", "Potassium (K+)", fieldIndex++, "mmol/L", "mEq/L")}
                {renderField("chloride", "Chloride (Cl-)", fieldIndex++, "mmol/L", "mEq/L")}
                {renderField("bicarbonate", "Bicarbonate (HCO3-)", fieldIndex++, "mmol/L", "mEq/L")}
              </div>
            </div>

            {/* Blood Urea Nitrogen */}
            <div className="mb-6 pb-4 border-b">
              <h3 className="font-semibold text-lg mb-3 text-blue-700">Blood Urea Nitrogen (BUN)</h3>
              <div className="space-y-2">
                {(() => {
                  const colorClass = fieldColors[fieldIndex % fieldColors.length]
                  return (
                    <div className={`p-2 rounded ${colorClass}`}>
                      <div className="grid grid-cols-2 gap-2 items-end">
                        <div>
                          <Label className="text-sm font-medium">Blood Urea Nitrogen (BUN)</Label>
                        </div>
                        <div>
                          <Label className="text-sm">Value</Label>
                          <Input
                            value={getFieldValue1("bun")}
                            onChange={(e) => updateField("bun", e.target.value, 'value1')}
                            placeholder="Enter value"
                            className="bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })()}
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
