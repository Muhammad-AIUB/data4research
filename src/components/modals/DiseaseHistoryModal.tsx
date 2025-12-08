'use client'

import { useState, useEffect, useCallback } from "react"
import { X, Heart } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { 
  addSectionFieldsToFavourites, 
  removeSectionFieldsFromFavourites, 
  areAllSectionFieldsFavourite,
  isFieldFavourite,
  removeFavouriteField
} from "@/lib/favourites"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import ModalDatePicker from "@/components/ModalDatePicker"

type FormState = {
  age: string
  heightCm: string
  heightFeet: string
  heightInch: string
  weightLb: string
  weightKg: string
  sbp: string
  dbp: string
  map: string
  pulse: string
  pulseNote: string
  bmi: string
  idealWeightKg: string
  idealWeightLb: string
  anaemia: string
  jaundice: string
  respiratoryRate: string
  spO2: string
  ascites: string
  heart: string
  lung: string
  specialNote: string
  diseaseHistory: string
  surgicalHistory: string
}

export type DiseaseHistoryData = Omit<FormState, "heightCm"> & {
  heightCm: number | null
}

interface Props {
  onClose: () => void
  defaultDate: Date
  onDataChange?: (data: DiseaseHistoryData, date: Date) => void
  patientId?: string | null
  onSaveSuccess?: () => void
  savedData?: Array<{ sampleDate: Date | string; diseaseHistory?: DiseaseHistoryData }>
}

export default function DiseaseHistoryModal({
  onClose,
  defaultDate,
  onDataChange,
  patientId,
  onSaveSuccess,
  savedData = [],
}: Props) {
  const [reportDate, setReportDate] = useState<Date>(defaultDate)
  const [saving, setSaving] = useState(false)
  const [favoritesUpdated, setFavoritesUpdated] = useState(0)
  
  const handleSectionFavoriteToggle = (fields: Array<[string, string]>, sectionTitle: string) => {
    const reportType = 'diseaseHistory'
    const reportName = 'Disease History'
    
    // Check if all fields are favorites
    const allFavourite = fields.every(([fieldName]) => 
      isFieldFavourite(reportType, fieldName)
    )
    
    if (allFavourite) {
      // Remove all fields
      fields.forEach(([fieldName]) => {
        removeFavouriteField(reportType, fieldName)
      })
    } else {
      // Add all fields
      addSectionFieldsToFavourites(reportType, reportName, fields, sectionTitle)
    }
    setFavoritesUpdated(prev => prev + 1)
  }

  const renderSectionHeader = (title: string, fields: Array<[string, string]>) => {
    const reportType = 'diseaseHistory'
    // Check if all fields are favorites
    const allFavourite = fields.every(([fieldName]) => 
      isFieldFavourite(reportType, fieldName)
    )
    
    return (
      <div className="flex items-center justify-between mb-3 pb-2 border-b">
        <h3 className="font-semibold text-lg text-blue-700">{title}</h3>
        <button
          onClick={() => handleSectionFavoriteToggle(fields, title)}
          className="flex items-center gap-2 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors"
          title={allFavourite ? "Remove all fields from favorites" : "Add all fields to favorites"}
        >
          <Heart 
            className={`h-5 w-5 ${allFavourite ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} 
          />
          <span className="text-sm text-gray-600">
            {allFavourite ? 'Remove from Favorites' : 'Add to Favorites'}
          </span>
        </button>
      </div>
    )
  }

  const [form, setForm] = useState<FormState>({
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
    idealWeightKg: "",
    idealWeightLb: "",
    anaemia: "",
    jaundice: "",
    respiratoryRate: "",
    spO2: "",
    ascites: "",
    heart: "",
    lung: "",
    specialNote: "",
    diseaseHistory: "",
    surgicalHistory: "",
  })

  const update = useCallback((key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  // Height handlers (from provided calculator logic)
  const handleFeetChange = useCallback(
    (value: string) => {
      update("heightFeet", value)
      if (value === "" || value === null) {
        update("heightInch", "")
        update("heightCm", "")
      } else {
        const feetNum = parseFloat(value) || 0
        const totalInches = feetNum * 12
        const cmValue = totalInches * 2.54
        update("heightInch", totalInches.toFixed(2))
        update("heightCm", cmValue.toFixed(2))
      }
    },
    [update]
  )

  const handleInchChange = useCallback(
    (value: string) => {
      update("heightInch", value)
      if (value === "" || value === null) {
        update("heightFeet", "")
        update("heightCm", "")
      } else {
        const inchNum = parseFloat(value) || 0
        const feetNum = inchNum / 12
        const cmValue = inchNum * 2.54
        update("heightFeet", feetNum.toFixed(2))
        update("heightCm", cmValue.toFixed(2))
      }
    },
    [update]
  )

  const handleCmChange = useCallback(
    (value: string) => {
      update("heightCm", value)
      if (value === "" || value === null) {
        update("heightFeet", "")
        update("heightInch", "")
      } else {
        const cmNum = parseFloat(value) || 0
        const totalInches = cmNum / 2.54
        const feetNum = totalInches / 12
        update("heightFeet", feetNum.toFixed(2))
        update("heightInch", totalInches.toFixed(2))
      }
    },
    [update]
  )

  // Weight lb ↔ kg
  useEffect(() => {
    const lb = parseFloat(form.weightLb)
    if (lb > 0) {
      update("weightKg", (lb * 0.453592).toFixed(2))
    } else if (form.weightLb === "") {
      update("weightKg", "")
    }
  }, [form.weightLb, update])

  useEffect(() => {
    const kg = parseFloat(form.weightKg)
    if (kg > 0) {
      update("weightLb", (kg / 0.453592).toFixed(2))
    } else if (form.weightKg === "") {
      update("weightLb", "")
    }
  }, [form.weightKg, update])

  // MAP = (SBP + 2×DBP)/3
  useEffect(() => {
    const s = parseFloat(form.sbp)
    const d = parseFloat(form.dbp)
    if (s > 0 && d > 0) {
      update("map", ((s + 2 * d) / 3).toFixed(1))
    } else {
      update("map", "")
    }
  }, [form.sbp, form.dbp, update])

  // BMI
  useEffect(() => {
    const kg = parseFloat(form.weightKg)
    const cm = parseFloat(form.heightCm)
    if (kg > 0 && cm > 0) {
      update("bmi", (kg / ((cm / 100) ** 2)).toFixed(2))
    } else {
      update("bmi", "")
    }
  }, [form.weightKg, form.heightCm, update])

  // Ideal Body Weight (19.5 – 25 BMI)
  useEffect(() => {
    const cm = parseFloat(form.heightCm)
    if (cm > 0) {
      const m2 = (cm / 100) ** 2
      const min = (19.5 * m2).toFixed(1)
      const max = (25 * m2).toFixed(1)
      update("idealWeightKg", `${min} – ${max}`)
      update("idealWeightLb", `${(parseFloat(min) / 0.453592).toFixed(1)} – ${(parseFloat(max) / 0.453592).toFixed(1)}`)
    } else {
      update("idealWeightKg", "")
      update("idealWeightLb", "")
    }
  }, [form.heightCm, update])

  // Load saved data
  useEffect(() => {
    if (savedData.length === 0) return
    const today = reportDate.toISOString().split("T")[0]
    const match = savedData.find((item) => {
      const d = item.sampleDate instanceof Date ? item.sampleDate : new Date(item.sampleDate)
      return d.toISOString().split("T")[0] === today
    }) || savedData[savedData.length - 1]

    if (match?.diseaseHistory) {
      const dh = match.diseaseHistory
      setForm((prev) => ({
        ...prev,
        ...dh,
        heightCm: dh.heightCm != null ? String(dh.heightCm) : "",
        heightFeet: dh.heightFeet ?? "",
        heightInch: dh.heightInch ?? "",
        anaemia: dh.anaemia ?? "",
        jaundice: dh.jaundice ?? "",
        ascites: dh.ascites ?? "",
      }))
    }
  }, [savedData, reportDate, update])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const payload = {
      patientId,
      sampleDate: reportDate.toISOString().split("T")[0],
      diseaseHistory: {
        ...form,
        heightCm: form.heightCm ? Number(form.heightCm) : null,
      } as DiseaseHistoryData,
    }

    try {
      const res = await fetch("/api/patient-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        onSaveSuccess?.()
        onDataChange?.(payload.diseaseHistory, reportDate)
        alert("Saved successfully!")
        onClose()
      }
    } catch {
      alert("Save failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-lg bg-white">
        <div className="sticky top-0 flex items-center justify-between bg-linear-to-r from-blue-600 to-purple-600 p-4 text-white">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">On Examination & Disease History</h2>
            <ModalDatePicker selectedDate={reportDate} onDateChange={setReportDate} defaultDate={defaultDate} />
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving} className="bg-white/10 hover:bg-white/20 text-white border-white/30">
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const formEl = document.getElementById("disease-history-form")
                  formEl?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
                }}
                disabled={saving}
                className="bg-amber-400 hover:bg-amber-500 text-blue-900"
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
            <button onClick={onClose} className="rounded-full p-2 hover:bg-white/20">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form id="disease-history-form" onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Physical Measurements Section */}
          <div className="space-y-4">
            {renderSectionHeader("Physical Measurements", [
              ["age", "Age"],
              ["heightCm", "Height (cm)"],
              ["heightFeet", "Height (feet)"],
              ["heightInch", "Height (inch)"],
              ["weightLb", "Weight (lb)"],
              ["weightKg", "Weight (kg)"],
              ["bmi", "BMI"],
              ["idealWeightKg", "Ideal Weight (kg)"],
              ["idealWeightLb", "Ideal Weight (lb)"],
            ])}
          
          {/* Age */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <Label>Age</Label>
            <Input value={form.age} onChange={(e) => update("age", e.target.value)} placeholder="35" className="bg-white" />
          </div>

          {/* Height */}
          <div className="rounded-lg border-2 border-yellow-300 bg-yellow-50 p-4">
            <Label className="mb-2 block font-bold">Height (delete any = clear all)</Label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>cm</Label>
                <Input value={form.heightCm} onChange={(e) => handleCmChange(e.target.value)} placeholder="170" />
              </div>
              <div>
                <Label>feet</Label>
                <Input value={form.heightFeet} onChange={(e) => handleFeetChange(e.target.value)} placeholder="5" />
              </div>
              <div>
                <Label>inch</Label>
                <Input value={form.heightInch} onChange={(e) => handleInchChange(e.target.value)} placeholder="7" step="0.1" />
              </div>
            </div>
          </div>

          {/* Weight */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-purple-300 bg-purple-50 p-4">
              <Label>pound (lb)</Label>
              <Input value={form.weightLb} onChange={(e) => update("weightLb", e.target.value)} className="bg-white" />
            </div>
            <div className="rounded-lg border border-purple-300 bg-purple-50 p-4">
              <Label>KG</Label>
              <Input value={form.weightKg} onChange={(e) => update("weightKg", e.target.value)} className="bg-white" />
            </div>
          </div>
          </div>

          {/* Vital Signs Section */}
          <div className="space-y-4">
            {renderSectionHeader("Vital Signs", [
              ["sbp", "Systolic (SBP)"],
              ["dbp", "Diastolic (DBP)"],
              ["map", "Mean Arterial Pressure"],
              ["pulse", "Pulse"],
              ["pulseNote", "Pulse Note"],
              ["respiratoryRate", "Respiratory Rate"],
              ["spO2", "Oxygen Saturation (SpO2)"],
            ])}
          
          {/* BP + MAP */}
          <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Diastolic (DBP)</Label>
                <Input value={form.dbp} onChange={(e) => update("dbp", e.target.value)} className="bg-white" />
              </div>
              <div>
                <Label>Mean Arterial Pressure (auto)</Label>
                <Input value={form.map} readOnly className="bg-gray-100" />
              </div>
              <div>
                <Label>Systolic (SBP)</Label>
                <Input value={form.sbp} onChange={(e) => update("sbp", e.target.value)} className="bg-white" />
              </div>
            </div>
          </div>

          {/* BMI + Ideal Weight */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <Label>BMI (auto)</Label>
              <Input value={form.bmi} readOnly className="bg-gray-100" />
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <Label>Ideal Body Weight (kg)</Label>
              <Input value={form.idealWeightKg} readOnly className="bg-gray-100" />
            </div>
          </div>

          {/* Pulse + SpO2 + Respiratory Rate */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Pulse (b/m)</Label>
                <Input value={form.pulse} onChange={(e) => update("pulse", e.target.value)} className="bg-white" />
              </div>
              <div>
                <Label>Note</Label>
                <Input value={form.pulseNote} onChange={(e) => update("pulseNote", e.target.value)} className="bg-white" />
              </div>
              <div>
                <Label>Oxygen Saturation (SpO2)</Label>
                <Input value={form.spO2} onChange={(e) => update("spO2", e.target.value)} className="bg-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Respiratory Rate</Label>
                <Input value={form.respiratoryRate} onChange={(e) => update("respiratoryRate", e.target.value)} className="bg-white" />
              </div>
              <div></div>
            </div>
          </div>
          </div>

          {/* Clinical Findings Section */}
          <div className="space-y-4">
            {renderSectionHeader("Clinical Findings", [
              ["anaemia", "Anaemia"],
              ["jaundice", "Jaundice"],
              ["ascites", "Ascites"],
              ["heart", "Heart"],
              ["lung", "Lung"],
              ["specialNote", "Special Note"],
              ["diseaseHistory", "Disease History"],
              ["surgicalHistory", "Surgical History"],
            ])}
          
          {/* Anaemia / Jaundice / Ascites */}
          <div className="grid grid-cols-3 gap-4 rounded-lg border border-pink-200 bg-pink-50 p-4">
            <div>
              <Label>Anaemia</Label>
              <Select value={form.anaemia ?? ""} onValueChange={(v) => update("anaemia", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Select</SelectItem>
                  <SelectItem value="+">+</SelectItem>
                  <SelectItem value="++">++</SelectItem>
                  <SelectItem value="+++">+++</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Jaundice</Label>
              <Select value={form.jaundice ?? ""} onValueChange={(v) => update("jaundice", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Select</SelectItem>
                  <SelectItem value="+">+</SelectItem>
                  <SelectItem value="++">++</SelectItem>
                  <SelectItem value="+++">+++</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ascites</Label>
              <Select value={form.ascites ?? ""} onValueChange={(v) => update("ascites", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
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

          {/* Auscultation */}
          <div className="grid grid-cols-2 gap-4 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
            <div>
              <Label>Auscultation Heart</Label>
              <Input value={form.heart} onChange={(e) => update("heart", e.target.value)} className="bg-white" />
            </div>
            <div>
              <Label>Auscultation Lung</Label>
              <Input value={form.lung} onChange={(e) => update("lung", e.target.value)} className="bg-white" />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div>
              <Label>Special note or other findings of O/E</Label>
              <Input value={form.specialNote} onChange={(e) => update("specialNote", e.target.value)} className="bg-white" />
            </div>
            <div>
              <Label>Disease History (e.g. first known, disease event etc.)</Label>
              <Input value={form.diseaseHistory} onChange={(e) => update("diseaseHistory", e.target.value)} className="bg-white" />
            </div>
            <div>
              <Label>Surgical or Intervention History</Label>
              <Input value={form.surgicalHistory} onChange={(e) => update("surgicalHistory", e.target.value)} className="bg-white" />
            </div>
          </div>
          </div>

          {/* Save Buttons */}
          <div className="flex justify-end gap-4 border-t pt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}