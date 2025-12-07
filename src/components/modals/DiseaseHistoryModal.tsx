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
  savedData?: Array<{ sampleDate: Date | string; diseaseHistory?: any }>
}

export default function DiseaseHistoryModal({ onClose, defaultDate, onDataChange, patientId, onSaveSuccess, savedData = [] }: Props) {
  const [reportDate, setReportDate] = useState(defaultDate)
  const [saving, setSaving] = useState(false)
  const reportType = "diseaseHistory"
  const reportName = "On Examination Disease History"
  const [formData, setFormData] = useState<Record<string, string | number>>({
    age: "",
    heightCm: "",
    heightFeet: "",
    heightInch: "",
    weightLb: "",
    weightKg: "",
    sbp: "",
    dbp: "",
    map: "",
    pulse: "",
    pulseNote: "",
    bmi: "",
    idealBodyWeightLb: "",
    idealBodyWeightKg: "",
    anaemia: "",
    jaundice: "",
    respiratoryRate: "",
    spO2: "",
    ascites: "",
    auscultationHeart: "",
    auscultationLung: "",
    specialNote: "",
    diseaseHistory: "",
    surgicalHistory: "",
  })

  const updateField = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const getFieldValue = (field: string) => formData[field] || ""

  // Height conversions: feet/inches to cm
  useEffect(() => {
    const feet = parseFloat(String(formData.heightFeet || ""))
    const inch = parseFloat(String(formData.heightInch || ""))
    if (!isNaN(feet) && !isNaN(inch) && (feet > 0 || inch > 0)) {
      const cm = (feet * 30.48) + (inch * 2.54)
      if (String(formData.heightCm) !== cm.toFixed(2)) {
        updateField("heightCm", cm.toFixed(2))
      }
    } else if (formData.heightFeet === "" && formData.heightInch === "" && formData.heightCm !== "") {
      updateField("heightCm", "")
    }
  }, [formData.heightFeet, formData.heightInch])

  // Height conversion: cm to feet/inches
  useEffect(() => {
    const cm = parseFloat(String(formData.heightCm || ""))
    if (!isNaN(cm) && cm > 0) {
      const totalInches = cm / 2.54
      const feet = Math.floor(totalInches / 12)
      const inches = (totalInches % 12).toFixed(2)
      if (String(formData.heightFeet) !== feet.toString() || String(formData.heightInch) !== inches) {
        updateField("heightFeet", feet.toString())
        updateField("heightInch", inches)
      }
    } else if (formData.heightCm === "" && (formData.heightFeet !== "" || formData.heightInch !== "")) {
      updateField("heightFeet", "")
      updateField("heightInch", "")
    }
  }, [formData.heightCm])

  // Weight conversion: lb to kg
  useEffect(() => {
    const lb = parseFloat(String(formData.weightLb || ""))
    if (!isNaN(lb) && lb > 0) {
      const kg = lb * 0.453592
      if (String(formData.weightKg) !== kg.toFixed(2)) {
        updateField("weightKg", kg.toFixed(2))
      }
    } else if (formData.weightLb === "" && formData.weightKg !== "") {
      updateField("weightKg", "")
    }
  }, [formData.weightLb])

  // Weight conversion: kg to lb
  useEffect(() => {
    const kg = parseFloat(String(formData.weightKg || ""))
    if (!isNaN(kg) && kg > 0) {
      const lb = kg / 0.453592
      if (String(formData.weightLb) !== lb.toFixed(2)) {
        updateField("weightLb", lb.toFixed(2))
      }
    } else if (formData.weightKg === "" && formData.weightLb !== "") {
      updateField("weightLb", "")
    }
  }, [formData.weightKg])

  // MAP calculation: [SBP + (2 x DBP)]/3
  useEffect(() => {
    const sbp = parseFloat(String(formData.sbp || ""))
    const dbp = parseFloat(String(formData.dbp || ""))
    if (!isNaN(sbp) && !isNaN(dbp)) {
      const map = (sbp + (2 * dbp)) / 3
      if (String(formData.map) !== map.toFixed(2)) {
        updateField("map", map.toFixed(2))
      }
    } else if ((formData.sbp === "" || formData.dbp === "") && formData.map !== "") {
      updateField("map", "")
    }
  }, [formData.sbp, formData.dbp])

  // BMI calculation: weight / (height in cm / 100)^2
  useEffect(() => {
    const weight = parseFloat(String(formData.weightKg || ""))
    const heightCm = parseFloat(String(formData.heightCm || ""))
    if (!isNaN(weight) && !isNaN(heightCm) && heightCm > 0) {
      const heightM = heightCm / 100
      const bmi = weight / (heightM * heightM)
      if (String(formData.bmi) !== bmi.toFixed(2)) {
        updateField("bmi", bmi.toFixed(2))
      }
    } else if ((formData.weightKg === "" || formData.heightCm === "") && formData.bmi !== "") {
      updateField("bmi", "")
    }
  }, [formData.weightKg, formData.heightCm])

  // Load saved data when modal opens
  useEffect(() => {
    if (savedData && savedData.length > 0) {
      const dateStr = reportDate.toISOString().split('T')[0]
      const matchingTest = savedData.find(test => {
        if (!test.diseaseHistory) return false
        const testDate = test.sampleDate instanceof Date 
          ? test.sampleDate.toISOString().split('T')[0]
          : new Date(test.sampleDate).toISOString().split('T')[0]
        return testDate === dateStr
      })
      
      const testToLoad = matchingTest || savedData
        .filter(test => test.diseaseHistory)
        .sort((a, b) => {
          const dateA = a.sampleDate instanceof Date ? a.sampleDate : new Date(a.sampleDate)
          const dateB = b.sampleDate instanceof Date ? b.sampleDate : new Date(b.sampleDate)
          return dateB.getTime() - dateA.getTime()
        })[0]
      
      if (testToLoad?.diseaseHistory) {
        setFormData(testToLoad.diseaseHistory as Record<string, string | number>)
        const testDate = testToLoad.sampleDate instanceof Date 
          ? testToLoad.sampleDate 
          : new Date(testToLoad.sampleDate)
        setReportDate(testDate)
      }
    }
  }, [savedData])

  // Ideal body weight range: 19.5 x (height in cm / 100)^2 to 25 x (height in cm / 100)^2
  useEffect(() => {
    const heightCm = parseFloat(String(formData.heightCm || ""))
    if (!isNaN(heightCm) && heightCm > 0) {
      const heightM = heightCm / 100
      const minKg = 19.5 * (heightM * heightM)
      const maxKg = 25 * (heightM * heightM)
      const minLb = minKg / 0.453592
      const maxLb = maxKg / 0.453592
      const kgRange = `${minKg.toFixed(2)} - ${maxKg.toFixed(2)}`
      const lbRange = `${minLb.toFixed(2)} - ${maxLb.toFixed(2)}`
      if (String(formData.idealBodyWeightKg) !== kgRange || String(formData.idealBodyWeightLb) !== lbRange) {
        updateField("idealBodyWeightKg", kgRange)
        updateField("idealBodyWeightLb", lbRange)
      }
    } else if (formData.heightCm === "" && (formData.idealBodyWeightKg !== "" || formData.idealBodyWeightLb !== "")) {
      updateField("idealBodyWeightKg", "")
      updateField("idealBodyWeightLb", "")
    }
  }, [formData.heightCm])


  const fieldColors = [
    "bg-purple-50 border-purple-200",
    "bg-yellow-50 border-yellow-200",
    "bg-green-50 border-green-200",
    "bg-blue-50 border-blue-200",
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const hasData = Object.keys(formData).length > 0 && 
      Object.values(formData).some(f => f !== "" && f !== null && f !== undefined)
    
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
          diseaseHistory: formData,
        })
      })

      if (response.ok) {
        if (onSaveSuccess) onSaveSuccess()
        if (onDataChange) onDataChange(formData, reportDate)
        alert("Disease History data saved successfully!")
        onClose()
      } else {
        const error = await response.json()
        alert(error.message || "Failed to save data. Please try again.")
      }
    } catch (error) {
      console.error("Error saving Disease History data:", error)
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
            <h2 className="text-xl font-bold">On Examination Disease History</h2>
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
            {/* Age */}
            <div className={`p-2 rounded ${fieldColors[0]}`}>
              <Label className="text-sm font-medium">Age</Label>
              <Input
                type="number"
                value={getFieldValue("age")}
                onChange={(e) => updateField("age", e.target.value)}
                placeholder="Enter age"
                className="bg-white"
              />
            </div>

            {/* Height */}
            <div className={`p-2 rounded ${fieldColors[1]}`}>
              <Label className="text-sm font-medium mb-2 block">Height</Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">cm</Label>
                  <Input
                    type="number"
                    value={getFieldValue("heightCm")}
                    onChange={(e) => updateField("heightCm", e.target.value)}
                    placeholder="cm"
                    className="bg-white"
                  />
                </div>
                <div>
                  <Label className="text-xs">feet</Label>
                  <Input
                    type="number"
                    value={getFieldValue("heightFeet")}
                    onChange={(e) => updateField("heightFeet", e.target.value)}
                    placeholder="feet"
                    className="bg-white"
                  />
                </div>
                <div>
                  <Label className="text-xs">inch</Label>
                  <Input
                    type="number"
                    value={getFieldValue("heightInch")}
                    onChange={(e) => updateField("heightInch", e.target.value)}
                    placeholder="inch"
                    className="bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Weight */}
            <div className="grid grid-cols-2 gap-2">
              <div className={`p-2 rounded ${fieldColors[1]}`}>
                <Label className="text-sm font-medium">Weight (pound/lb)</Label>
                <Input
                  type="number"
                  value={getFieldValue("weightLb")}
                  onChange={(e) => updateField("weightLb", e.target.value)}
                  placeholder="pound(lb)"
                  className="bg-white"
                />
              </div>
              <div className={`p-2 rounded ${fieldColors[0]}`}>
                <Label className="text-sm font-medium">Weight (KG)</Label>
                <Input
                  type="number"
                  value={getFieldValue("weightKg")}
                  onChange={(e) => updateField("weightKg", e.target.value)}
                  placeholder="KG"
                  className="bg-white"
                />
              </div>
            </div>

            {/* BP */}
            <div className="space-y-2">
              <div className={`p-2 rounded ${fieldColors[1]}`}>
                <Label className="text-sm font-medium">Systolic (SBP) (mmHg)</Label>
                <Input
                  type="number"
                  value={getFieldValue("sbp")}
                  onChange={(e) => updateField("sbp", e.target.value)}
                  placeholder="mmHg"
                  className="bg-white"
                />
              </div>
              <div className={`p-2 rounded ${fieldColors[1]}`}>
                <Label className="text-sm font-medium">Diastolic (DBP) (mmHg)</Label>
                <Input
                  type="number"
                  value={getFieldValue("dbp")}
                  onChange={(e) => updateField("dbp", e.target.value)}
                  placeholder="mmHg"
                  className="bg-white"
                />
              </div>
              <div className={`p-2 rounded ${fieldColors[0]}`}>
                <Label className="text-sm font-medium">Mean Arterial Pressure (mmHg)</Label>
                <Input
                  type="number"
                  value={getFieldValue("map")}
                  readOnly
                  placeholder="Auto-calculated"
                  className="bg-white"
                />
              </div>
            </div>

            {/* Pulse */}
            <div className="grid grid-cols-2 gap-2">
              <div className={`p-2 rounded ${fieldColors[1]}`}>
                <Label className="text-sm font-medium">Pulse (b/m)</Label>
                <Input
                  type="number"
                  value={getFieldValue("pulse")}
                  onChange={(e) => updateField("pulse", e.target.value)}
                  placeholder="beats per minute"
                  className="bg-white"
                />
              </div>
              <div className={`p-2 rounded ${fieldColors[3]}`}>
                <Label className="text-sm font-medium">Note</Label>
                <Input
                  value={getFieldValue("pulseNote")}
                  onChange={(e) => updateField("pulseNote", e.target.value)}
                  placeholder="Note"
                  className="bg-white"
                />
              </div>
            </div>

            {/* BMI */}
            <div className={`p-2 rounded ${fieldColors[0]}`}>
              <Label className="text-sm font-medium">BMI</Label>
              <Input
                type="number"
                value={getFieldValue("bmi")}
                readOnly
                placeholder="Auto-calculated"
                className="bg-white"
              />
            </div>

            {/* Ideal Body Weight */}
            <div className="grid grid-cols-2 gap-2">
              <div className={`p-2 rounded ${fieldColors[0]}`}>
                <Label className="text-sm font-medium">Ideal Body Weight (pound/lb)</Label>
                <Input
                  value={getFieldValue("idealBodyWeightLb")}
                  readOnly
                  placeholder="Auto-calculated"
                  className="bg-white"
                />
              </div>
              <div className={`p-2 rounded ${fieldColors[0]}`}>
                <Label className="text-sm font-medium">Ideal Body Weight (KG)</Label>
                <Input
                  value={getFieldValue("idealBodyWeightKg")}
                  readOnly
                  placeholder="Auto-calculated"
                  className="bg-white"
                />
              </div>
            </div>

            {/* Anaemia */}
            <div className={`p-2 rounded ${fieldColors[2]}`}>
              <Label className="text-sm font-medium">Anaemia</Label>
              <Select
                value={getFieldValue("anaemia")}
                onValueChange={(v) => updateField("anaemia", v)}
                className="bg-white"
              >
                <SelectValue placeholder="Select" />
                <SelectItem value="+">+</SelectItem>
                <SelectItem value="++">++</SelectItem>
                <SelectItem value="+++">+++</SelectItem>
              </Select>
            </div>

            {/* Jaundice */}
            <div className={`p-2 rounded ${fieldColors[2]}`}>
              <Label className="text-sm font-medium">Jaundice</Label>
              <Select
                value={getFieldValue("jaundice")}
                onValueChange={(v) => updateField("jaundice", v)}
                className="bg-white"
              >
                <SelectValue placeholder="Select" />
                <SelectItem value="+">+</SelectItem>
                <SelectItem value="++">++</SelectItem>
                <SelectItem value="+++">+++</SelectItem>
              </Select>
            </div>

            {/* Respiratory Rate */}
            <div className={`p-2 rounded ${fieldColors[1]}`}>
              <Label className="text-sm font-medium">Respiratory Rate (/min)</Label>
              <Input
                type="number"
                value={getFieldValue("respiratoryRate")}
                onChange={(e) => updateField("respiratoryRate", e.target.value)}
                placeholder="/min"
                className="bg-white"
              />
            </div>

            {/* Oxygen Saturation */}
            <div className={`p-2 rounded ${fieldColors[1]}`}>
              <Label className="text-sm font-medium">Oxygen Saturation (SpO2) (%)</Label>
              <Input
                type="number"
                value={getFieldValue("spO2")}
                onChange={(e) => updateField("spO2", e.target.value)}
                placeholder="%"
                className="bg-white"
              />
            </div>

            {/* Ascites */}
            <div className={`p-2 rounded ${fieldColors[2]}`}>
              <Label className="text-sm font-medium">Ascites</Label>
              <Select
                value={getFieldValue("ascites")}
                onValueChange={(v) => updateField("ascites", v)}
                className="bg-white"
              >
                <SelectValue placeholder="Select" />
                <SelectItem value="absent">absent</SelectItem>
                <SelectItem value="Mild">Mild</SelectItem>
                <SelectItem value="Moderate">Moderate</SelectItem>
                <SelectItem value="Huge">Huge</SelectItem>
              </Select>
            </div>

            {/* Auscultation Heart */}
            <div className={`p-2 rounded ${fieldColors[3]}`}>
              <Label className="text-sm font-medium">Auscultation Heart</Label>
              <textarea
                value={getFieldValue("auscultationHeart")}
                onChange={(e) => updateField("auscultationHeart", e.target.value)}
                className="w-full px-3 py-2 border rounded-md min-h-20 bg-white"
                placeholder="Enter findings"
              />
            </div>

            {/* Auscultation of Lung */}
            <div className={`p-2 rounded ${fieldColors[3]}`}>
              <Label className="text-sm font-medium">Auscultation of Lung</Label>
              <textarea
                value={getFieldValue("auscultationLung")}
                onChange={(e) => updateField("auscultationLung", e.target.value)}
                className="w-full px-3 py-2 border rounded-md min-h-20 bg-white"
                placeholder="Enter findings"
              />
            </div>

            {/* Special note or other findings of O/E */}
            <div className={`p-2 rounded ${fieldColors[3]}`}>
              <Label className="text-sm font-medium">Special note or other findings of O/E (On Examination)</Label>
              <textarea
                value={getFieldValue("specialNote")}
                onChange={(e) => updateField("specialNote", e.target.value)}
                className="w-full px-3 py-2 border rounded-md min-h-20 bg-white"
                placeholder="Enter special notes or findings"
              />
            </div>

            {/* Disease History */}
            <div className={`p-2 rounded ${fieldColors[3]}`}>
              <Label className="text-sm font-medium">Disease History e.g first known, disease event etc.</Label>
              <textarea
                value={getFieldValue("diseaseHistory")}
                onChange={(e) => updateField("diseaseHistory", e.target.value)}
                className="w-full px-3 py-2 border rounded-md min-h-20 bg-white"
                placeholder="Enter disease history"
              />
            </div>

            {/* Surgical or Intervention History */}
            <div className={`p-2 rounded ${fieldColors[3]}`}>
              <Label className="text-sm font-medium">Surgical or Intervention History e.g. cholecystectomy, RFA of cardiac fiber, TACE of HCC etc.</Label>
              <textarea
                value={getFieldValue("surgicalHistory")}
                onChange={(e) => updateField("surgicalHistory", e.target.value)}
                className="w-full px-3 py-2 border rounded-md min-h-20 bg-white"
                placeholder="Enter surgical or intervention history"
              />
            </div>

            <div className="flex gap-2 justify-end sticky bottom-0 bg-white pt-4 border-t mt-4">
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
