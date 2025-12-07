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
  savedData?: Array<{ sampleDate: Date | string; cardiology?: any }>
}

export default function CardiologyModal({ onClose, defaultDate, onDataChange, patientId, onSaveSuccess, savedData = [] }: Props) {
  const [formData, setFormData] = useState<Record<string, { value: string; notes?: string }>>({})
  const [reportDate, setReportDate] = useState(defaultDate)
  const [saving, setSaving] = useState(false)
  const reportType = "cardiology"
  const reportName = "Cardiology"

  // Load saved data when modal opens
  useEffect(() => {
    if (savedData && savedData.length > 0) {
      const dateStr = reportDate.toISOString().split('T')[0]
      const matchingTest = savedData.find(test => {
        if (!test.cardiology) return false
        const testDate = test.sampleDate instanceof Date 
          ? test.sampleDate.toISOString().split('T')[0]
          : new Date(test.sampleDate).toISOString().split('T')[0]
        return testDate === dateStr
      })
      
      const testToLoad = matchingTest || savedData
        .filter(test => test.cardiology)
        .sort((a, b) => {
          const dateA = a.sampleDate instanceof Date ? a.sampleDate : new Date(a.sampleDate)
          const dateB = b.sampleDate instanceof Date ? b.sampleDate : new Date(b.sampleDate)
          return dateB.getTime() - dateA.getTime()
        })[0]
      
      if (testToLoad?.cardiology) {
        setFormData(testToLoad.cardiology as Record<string, { value: string; notes?: string }>)
        const testDate = testToLoad.sampleDate instanceof Date 
          ? testToLoad.sampleDate 
          : new Date(testToLoad.sampleDate)
        setReportDate(testDate)
      }
    }
  }, [savedData, reportDate])

  const updateField = (fieldName: string, value: string, type: 'value' | 'notes' = 'value') => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        [type]: value
      }
    }))
  }

  const getFieldValue = (fieldName: string) => formData[fieldName]?.value || ""
  const getFieldNotes = (fieldName: string) => formData[fieldName]?.notes || ""

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

  const renderField = (fieldName: string, label: string, index: number, unit?: string, hasNotes: boolean = false) => {
    const colorClass = fieldColors[index % fieldColors.length]
    const isFav = isFieldFavourite(reportType, fieldName)
    const fullLabel = `${label}${unit ? ` (${unit})` : ''}`
    
    return (
      <div className={`p-2 rounded ${colorClass}`}>
        <div className="grid grid-cols-4 gap-2 items-end">
          <div className="col-span-1">
            <Label className="text-sm">{label} {unit && <span className="text-gray-500">({unit})</span>}</Label>
            <Input
              value={getFieldValue(fieldName)}
              onChange={(e) => updateField(fieldName, e.target.value, 'value')}
              placeholder="Enter value"
              className="bg-white"
            />
          </div>
          {hasNotes && (
            <div className="col-span-2">
              <Label className="text-sm">Notes</Label>
              <Input
                value={getFieldNotes(fieldName)}
                onChange={(e) => updateField(fieldName, e.target.value, 'notes')}
                placeholder="Notes"
                className="bg-white"
              />
            </div>
          )}
          <div className="col-span-1 flex justify-end">
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

  const renderSelectField = (fieldName: string, label: string, index: number, options: string[]) => {
    const colorClass = fieldColors[index % fieldColors.length]
    const isFav = isFieldFavourite(reportType, fieldName)
    
    return (
      <div className={`p-2 rounded ${colorClass}`}>
        <div className="grid grid-cols-4 gap-2 items-end">
          <div className="col-span-3">
            <Label className="text-sm">{label}</Label>
            <Select
              value={getFieldValue(fieldName)}
              onValueChange={(v) => updateField(fieldName, v, 'value')}
              className="bg-white"
            >
              <SelectValue placeholder="Select" />
              {options.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </Select>
          </div>
          <div className="col-span-1 flex justify-end">
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

  const renderTextAreaField = (fieldName: string, label: string, index: number) => {
    const colorClass = fieldColors[index % fieldColors.length]
    const isFav = isFieldFavourite(reportType, fieldName)
    
    return (
      <div className={`p-2 rounded ${colorClass}`}>
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <Label className="text-sm">{label}</Label>
            <textarea
              value={getFieldValue(fieldName)}
              onChange={(e) => updateField(fieldName, e.target.value, 'value')}
              className="w-full px-3 py-2 border rounded-md min-h-20 bg-white"
              placeholder="Enter report"
            />
          </div>
          <div className="pt-6">
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
      Object.values(formData).some(f => f.value || f.notes)
    
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
          cardiology: formData,
        })
      })

      if (response.ok) {
        if (onSaveSuccess) onSaveSuccess()
        if (onDataChange) onDataChange(formData, reportDate)
        alert("Cardiology data saved successfully!")
        onClose()
      } else {
        const error = await response.json()
        alert(error.message || "Failed to save data. Please try again.")
      }
    } catch (error) {
      console.error("Error saving Cardiology data:", error)
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
            <h2 className="text-xl font-bold">Cardiology</h2>
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
            {/* Cardiovascular Tests */}
            <div className="mb-6 pb-4 border-b">
              <h3 className="font-semibold text-lg mb-3 text-blue-700">Cardiovascular Tests</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  {renderSelectField("ecg", "ECG", fieldIndex++, ["Normal", "Abnormal", "Not Done"])}
                  <div></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {renderSelectField("echocardiogramType", "Echocardiogram - Type", fieldIndex++, ["2D Echo", "3D Echo", "Stress Echo", "TEE"])}
                  {renderTextAreaField("echocardiogramReport", "Echocardiogram - Report", fieldIndex++)}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {renderSelectField("ettReport", "ETT - Report", fieldIndex++, ["Normal", "Abnormal", "Positive", "Negative", "Not Done"])}
                  {renderTextAreaField("ettReportDetails", "ETT - Report Details", fieldIndex++)}
                </div>
              </div>
            </div>

            {/* Lipid Profile */}
            <div className="mb-6 pb-4 border-b">
              <h3 className="font-semibold text-lg mb-3 text-blue-700">Lipid Profile</h3>
              <div className="space-y-2">
                {(() => {
                  const lipidTests = [
                    { name: "totalCholesterol", label: "Total Cholesterol", hasMmol: true },
                    { name: "triglycerides", label: "Triglycerides", hasMmol: true },
                    { name: "ldl", label: "Low-Density Lipoprotein (LDL) Cholesterol", hasMmol: true },
                    { name: "hdl", label: "High-Density Lipoprotein (HDL) Cholesterol", hasMmol: true },
                    { name: "vldl", label: "Very Low-Density Lipoprotein (VLDL) Cholesterol", hasMmol: true },
                    { name: "tcHdlRatio", label: "Total Cholesterol / HDL Ratio (TC/HDL)", hasMmol: false },
                  ]
                  return lipidTests.map((test, idx) => {
                    const currentIndex = fieldIndex++
                    const colorClass = fieldColors[currentIndex % fieldColors.length]
                    return (
                      <div key={test.name} className={`p-2 rounded ${colorClass}`}>
                        <div className="grid grid-cols-4 gap-2 items-end">
                          <div className="col-span-1">
                            <Label className="text-sm">{test.label}</Label>
                          </div>
                          <div>
                            <Label className="text-sm">Value (mg/dL)</Label>
                            <Input
                              value={getFieldValue(test.name)}
                              onChange={(e) => updateField(test.name, e.target.value, 'value')}
                              placeholder="mg/dL"
                              className="bg-white"
                            />
                          </div>
                          {test.hasMmol && (
                            <div>
                              <Label className="text-sm">Value (mmol/L)</Label>
                              <Input
                                value={getFieldValue(`${test.name}Mmol`)}
                                onChange={(e) => updateField(`${test.name}Mmol`, e.target.value, 'value')}
                                placeholder="mmol/L"
                                className="bg-white"
                              />
                            </div>
                          )}
                          {!test.hasMmol && <div></div>}
                          <div>
                            <Label className="text-sm">Notes</Label>
                            <Input
                              value={getFieldNotes(test.name)}
                              onChange={(e) => updateField(test.name, e.target.value, 'notes')}
                              placeholder="Notes"
                              className="bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>

            {/* Cardiac Markers */}
            <div className="mb-6 pb-4 border-b">
              <h3 className="font-semibold text-lg mb-3 text-blue-700">Cardiac Markers</h3>
              <div className="space-y-2">
                {renderField("lpPla2", "Lp-PLA2", fieldIndex++, "nmol/min/mL", true)}
                {renderField("tropI", "Trop I", fieldIndex++, undefined, true)}
                {renderField("highSensitiveTropI", "High Sensitive Trop I", fieldIndex++, undefined, true)}
                {renderField("ckMb", "CK MB", fieldIndex++, undefined, true)}
              </div>
            </div>

            {/* Diagnostic Procedures */}
            <div className="mb-6 pb-4 border-b">
              <h3 className="font-semibold text-lg mb-3 text-blue-700">Diagnostic Procedures</h3>
              <div className="space-y-2">
                {renderTextAreaField("angiogram", "Angiogram", fieldIndex++)}
                {renderTextAreaField("tiltTableTest", "Tilt Table Test", fieldIndex++)}
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
