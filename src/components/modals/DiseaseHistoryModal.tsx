'use client'

import { useState, useEffect, useCallback } from "react"
import { X, Heart } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { 
  addFavouriteField,
  isFieldFavourite,
  removeFavouriteField
} from "@/lib/favourites"
import {
  Select,
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
  const [, setFavoritesUpdated] = useState(0)
  
  const renderSectionHeader = (title: string) => {
    return (
      <div className="flex items-center justify-between mb-3 pb-2 border-b">
        <h3 className="font-semibold text-lg text-blue-700">{title}</h3>
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

  
  useEffect(() => {
    const lb = parseFloat(form.weightLb)
    if (lb > 0) {
      const nextKg = (lb * 0.453592).toFixed(2)
      if (form.weightKg !== nextKg) {
        update("weightKg", nextKg)
      }
    } else if (form.weightLb === "") {
      if (form.weightKg !== "") {
        update("weightKg", "")
      }
    }
  }, [form.weightLb, update]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const kg = parseFloat(form.weightKg)
    if (kg > 0) {
      const nextLb = (kg / 0.453592).toFixed(2)
      if (form.weightLb !== nextLb) {
        update("weightLb", nextLb)
      }
    } else if (form.weightKg === "") {
      if (form.weightLb !== "") {
        update("weightLb", "")
      }
    }
  }, [form.weightKg, update]) // eslint-disable-line react-hooks/exhaustive-deps

  
  useEffect(() => {
    const s = parseFloat(form.sbp)
    const d = parseFloat(form.dbp)
    if (s > 0 && d > 0) {
      update("map", ((s + 2 * d) / 3).toFixed(1))
    } else {
      update("map", "")
    }
  }, [form.sbp, form.dbp, update])

  
  useEffect(() => {
    const kg = parseFloat(form.weightKg)
    const cm = parseFloat(form.heightCm)
    if (kg > 0 && cm > 0) {
      update("bmi", (kg / ((cm / 100) ** 2)).toFixed(2))
    } else {
      update("bmi", "")
    }
  }, [form.weightKg, form.heightCm, update])

  
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
            {renderSectionHeader("Physical Measurements")}
          
          {/* Age */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center justify-between mb-1">
              <Label>Age</Label>
              <button
                type="button"
                onClick={() => {
                  const reportType = 'diseaseHistory'
                  const reportName = 'On Examination & Disease History'
                  const isFav = isFieldFavourite(reportType, 'age')
                  if (isFav) removeFavouriteField(reportType, 'age')
                  else addFavouriteField(reportType, reportName, 'age', 'Age')
                  setFavoritesUpdated(prev => prev + 1)
                }}
                className="p-1 rounded hover:bg-gray-100"
                title={isFieldFavourite('diseaseHistory', 'age') ? 'Remove from Favorites' : 'Add to Favorites'}
              >
                <Heart className={`h-5 w-5 ${isFieldFavourite('diseaseHistory', 'age') ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} />
              </button>
            </div>
            <Input value={form.age} onChange={(e) => update("age", e.target.value)} placeholder="35" className="bg-white" />
          </div>

          {/* Height */}
          <div className="rounded-lg border-2 border-yellow-300 bg-yellow-50 p-4">
            <Label className="mb-2 block font-bold">Height (delete any = clear all)</Label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>cm</Label>
                  <button
                    type="button"
                    onClick={() => {
                      const reportType = 'diseaseHistory'
                      const reportName = 'On Examination & Disease History'
                      const isFav = isFieldFavourite(reportType, 'heightCm')
                      if (isFav) removeFavouriteField(reportType, 'heightCm')
                      else addFavouriteField(reportType, reportName, 'heightCm', 'Height (cm)')
                      setFavoritesUpdated(prev => prev + 1)
                    }}
                    className="p-1 rounded hover:bg-gray-100"
                    title={isFieldFavourite('diseaseHistory', 'heightCm') ? 'Remove from Favorites' : 'Add to Favorites'}
                  >
                    <Heart className={`h-5 w-5 ${isFieldFavourite('diseaseHistory', 'heightCm') ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} />
                  </button>
                </div>
                <Input value={form.heightCm} onChange={(e) => handleCmChange(e.target.value)} placeholder="170" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>feet</Label>
                  <button
                    type="button"
                    onClick={() => {
                      const reportType = 'diseaseHistory'
                      const reportName = 'On Examination & Disease History'
                      const isFav = isFieldFavourite(reportType, 'heightFeet')
                      if (isFav) removeFavouriteField(reportType, 'heightFeet')
                      else addFavouriteField(reportType, reportName, 'heightFeet', 'Height (feet)')
                      setFavoritesUpdated(prev => prev + 1)
                    }}
                    className="p-1 rounded hover:bg-gray-100"
                    title={isFieldFavourite('diseaseHistory', 'heightFeet') ? 'Remove from Favorites' : 'Add to Favorites'}
                  >
                    <Heart className={`h-5 w-5 ${isFieldFavourite('diseaseHistory', 'heightFeet') ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} />
                  </button>
                </div>
                <Input value={form.heightFeet} onChange={(e) => handleFeetChange(e.target.value)} placeholder="5" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>inch</Label>
                  <button
                    type="button"
                    onClick={() => {
                      const reportType = 'diseaseHistory'
                      const reportName = 'On Examination & Disease History'
                      const isFav = isFieldFavourite(reportType, 'heightInch')
                      if (isFav) removeFavouriteField(reportType, 'heightInch')
                      else addFavouriteField(reportType, reportName, 'heightInch', 'Height (inch)')
                      setFavoritesUpdated(prev => prev + 1)
                    }}
                    className="p-1 rounded hover:bg-gray-100"
                    title={isFieldFavourite('diseaseHistory', 'heightInch') ? 'Remove from Favorites' : 'Add to Favorites'}
                  >
                    <Heart className={`h-5 w-5 ${isFieldFavourite('diseaseHistory', 'heightInch') ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} />
                  </button>
                </div>
                <Input value={form.heightInch} onChange={(e) => handleInchChange(e.target.value)} placeholder="7" step="0.1" />
              </div>
            </div>
          </div>

          {/* Weight */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-purple-300 bg-purple-50 p-4">
              <div className="flex items-center justify-between mb-1">
                <Label>pound (lb)</Label>
                <button
                  type="button"
                  onClick={() => {
                    const reportType = 'diseaseHistory'
                    const reportName = 'On Examination & Disease History'
                    const isFav = isFieldFavourite(reportType, 'weightLb')
                    if (isFav) removeFavouriteField(reportType, 'weightLb')
                    else addFavouriteField(reportType, reportName, 'weightLb', 'Weight (lb)')
                    setFavoritesUpdated(prev => prev + 1)
                  }}
                  className="p-1 rounded hover:bg-gray-100"
                  title={isFieldFavourite('diseaseHistory', 'weightLb') ? 'Remove from Favorites' : 'Add to Favorites'}
                >
                  <Heart className={`h-5 w-5 ${isFieldFavourite('diseaseHistory', 'weightLb') ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} />
                </button>
              </div>
              <Input value={form.weightLb} onChange={(e) => update("weightLb", e.target.value)} className="bg-white" />
            </div>
            <div className="rounded-lg border border-purple-300 bg-purple-50 p-4">
              <div className="flex items-center justify-between mb-1">
                <Label>KG</Label>
                <button
                  type="button"
                  onClick={() => {
                    const reportType = 'diseaseHistory'
                    const reportName = 'On Examination & Disease History'
                    const isFav = isFieldFavourite(reportType, 'weightKg')
                    if (isFav) removeFavouriteField(reportType, 'weightKg')
                    else addFavouriteField(reportType, reportName, 'weightKg', 'Weight (kg)')
                    setFavoritesUpdated(prev => prev + 1)
                  }}
                  className="p-1 rounded hover:bg-gray-100"
                  title={isFieldFavourite('diseaseHistory', 'weightKg') ? 'Remove from Favorites' : 'Add to Favorites'}
                >
                  <Heart className={`h-5 w-5 ${isFieldFavourite('diseaseHistory', 'weightKg') ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} />
                </button>
              </div>
              <Input value={form.weightKg} onChange={(e) => update("weightKg", e.target.value)} className="bg-white" />
            </div>
          </div>
          </div>

          {/* Vital Signs Section */}
          <div className="space-y-4">
            {renderSectionHeader("Vital Signs")}
          
          {/* BP + MAP */}
          <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Diastolic (DBP)</Label>
                  <button type="button" onClick={() => { const isFav = isFieldFavourite('diseaseHistory', 'dbp'); if (isFav) removeFavouriteField('diseaseHistory', 'dbp'); else addFavouriteField('diseaseHistory', 'On Examination & Disease History', 'dbp', 'Diastolic (DBP)'); setFavoritesUpdated(prev => prev + 1) }} className="p-1 rounded hover:bg-gray-100" title={isFieldFavourite('diseaseHistory', 'dbp') ? 'Remove from Favorites' : 'Add to Favorites'}><Heart className={`h-5 w-5 ${isFieldFavourite('diseaseHistory', 'dbp') ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} /></button>
                </div>
                <Input value={form.dbp} onChange={(e) => update("dbp", e.target.value)} className="bg-white" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Mean Arterial Pressure (auto)</Label>
                  <button type="button" onClick={() => { const isFav = isFieldFavourite('diseaseHistory', 'map'); if (isFav) removeFavouriteField('diseaseHistory', 'map'); else addFavouriteField('diseaseHistory', 'On Examination & Disease History', 'map', 'Mean Arterial Pressure'); setFavoritesUpdated(prev => prev + 1) }} className="p-1 rounded hover:bg-gray-100" title={isFieldFavourite('diseaseHistory', 'map') ? 'Remove from Favorites' : 'Add to Favorites'}><Heart className={`h-5 w-5 ${isFieldFavourite('diseaseHistory', 'map') ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} /></button>
                </div>
                <Input value={form.map} readOnly className="bg-gray-100" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Systolic (SBP)</Label>
                  <button type="button" onClick={() => { const isFav = isFieldFavourite('diseaseHistory', 'sbp'); if (isFav) removeFavouriteField('diseaseHistory', 'sbp'); else addFavouriteField('diseaseHistory', 'On Examination & Disease History', 'sbp', 'Systolic (SBP)'); setFavoritesUpdated(prev => prev + 1) }} className="p-1 rounded hover:bg-gray-100" title={isFieldFavourite('diseaseHistory', 'sbp') ? 'Remove from Favorites' : 'Add to Favorites'}><Heart className={`h-5 w-5 ${isFieldFavourite('diseaseHistory', 'sbp') ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} /></button>
                </div>
                <Input value={form.sbp} onChange={(e) => update("sbp", e.target.value)} className="bg-white" />
              </div>
            </div>
          </div>

          {/* BMI + Ideal Weight */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center justify-between mb-1">
                <Label>BMI (auto)</Label>
                <button type="button" onClick={() => { const isFav = isFieldFavourite('diseaseHistory', 'bmi'); if (isFav) removeFavouriteField('diseaseHistory', 'bmi'); else addFavouriteField('diseaseHistory', 'On Examination & Disease History', 'bmi', 'BMI'); setFavoritesUpdated(prev => prev + 1) }} className="p-1 rounded hover:bg-gray-100" title={isFieldFavourite('diseaseHistory', 'bmi') ? 'Remove from Favorites' : 'Add to Favorites'}><Heart className={`h-5 w-5 ${isFieldFavourite('diseaseHistory', 'bmi') ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} /></button>
              </div>
              <Input value={form.bmi} readOnly className="bg-gray-100" />
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center justify-between mb-1">
                <Label>Ideal Body Weight (kg)</Label>
                <button type="button" onClick={() => { const isFav = isFieldFavourite('diseaseHistory', 'idealWeightKg'); if (isFav) removeFavouriteField('diseaseHistory', 'idealWeightKg'); else addFavouriteField('diseaseHistory', 'On Examination & Disease History', 'idealWeightKg', 'Ideal Body Weight (kg)'); setFavoritesUpdated(prev => prev + 1) }} className="p-1 rounded hover:bg-gray-100" title={isFieldFavourite('diseaseHistory', 'idealWeightKg') ? 'Remove from Favorites' : 'Add to Favorites'}><Heart className={`h-5 w-5 ${isFieldFavourite('diseaseHistory', 'idealWeightKg') ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} /></button>
              </div>
              <Input value={form.idealWeightKg} readOnly className="bg-gray-100" />
            </div>
          </div>

          {/* Pulse + SpO2 + Respiratory Rate */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Pulse (b/m)</Label>
                  <button type="button" onClick={() => { const isFav = isFieldFavourite('diseaseHistory', 'pulse'); if (isFav) removeFavouriteField('diseaseHistory', 'pulse'); else addFavouriteField('diseaseHistory', 'On Examination & Disease History', 'pulse', 'Pulse'); setFavoritesUpdated(prev => prev + 1) }} className="p-1 rounded hover:bg-gray-100" title={isFieldFavourite('diseaseHistory', 'pulse') ? 'Remove from Favorites' : 'Add to Favorites'}><Heart className={`h-5 w-5 ${isFieldFavourite('diseaseHistory', 'pulse') ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} /></button>
                </div>
                <Input value={form.pulse} onChange={(e) => update("pulse", e.target.value)} className="bg-white" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Note</Label>
                  <button type="button" onClick={() => { const isFav = isFieldFavourite('diseaseHistory', 'pulseNote'); if (isFav) removeFavouriteField('diseaseHistory', 'pulseNote'); else addFavouriteField('diseaseHistory', 'On Examination & Disease History', 'pulseNote', 'Pulse Note'); setFavoritesUpdated(prev => prev + 1) }} className="p-1 rounded hover:bg-gray-100" title={isFieldFavourite('diseaseHistory', 'pulseNote') ? 'Remove from Favorites' : 'Add to Favorites'}><Heart className={`h-5 w-5 ${isFieldFavourite('diseaseHistory', 'pulseNote') ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} /></button>
                </div>
                <Input value={form.pulseNote} onChange={(e) => update("pulseNote", e.target.value)} className="bg-white" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Oxygen Saturation (SpO2)</Label>
                  <button type="button" onClick={() => { const isFav = isFieldFavourite('diseaseHistory', 'spO2'); if (isFav) removeFavouriteField('diseaseHistory', 'spO2'); else addFavouriteField('diseaseHistory', 'On Examination & Disease History', 'spO2', 'Oxygen Saturation (SpO2)'); setFavoritesUpdated(prev => prev + 1) }} className="p-1 rounded hover:bg-gray-100" title={isFieldFavourite('diseaseHistory', 'spO2') ? 'Remove from Favorites' : 'Add to Favorites'}><Heart className={`h-5 w-5 ${isFieldFavourite('diseaseHistory', 'spO2') ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} /></button>
                </div>
                <Input value={form.spO2} onChange={(e) => update("spO2", e.target.value)} className="bg-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Respiratory Rate</Label>
                  <button type="button" onClick={() => { const isFav = isFieldFavourite('diseaseHistory', 'respiratoryRate'); if (isFav) removeFavouriteField('diseaseHistory', 'respiratoryRate'); else addFavouriteField('diseaseHistory', 'On Examination & Disease History', 'respiratoryRate', 'Respiratory Rate'); setFavoritesUpdated(prev => prev + 1) }} className="p-1 rounded hover:bg-gray-100" title={isFieldFavourite('diseaseHistory', 'respiratoryRate') ? 'Remove from Favorites' : 'Add to Favorites'}><Heart className={`h-5 w-5 ${isFieldFavourite('diseaseHistory', 'respiratoryRate') ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} /></button>
                </div>
                <Input value={form.respiratoryRate} onChange={(e) => update("respiratoryRate", e.target.value)} className="bg-white" />
              </div>
              <div></div>
            </div>
          </div>
          </div>

          {/* Clinical Findings Section */}
          <div className="space-y-4">
            {renderSectionHeader("Clinical Findings")}
          
          {/* Anaemia / Jaundice / Ascites */}
          <div className="grid grid-cols-3 gap-4 rounded-lg border border-pink-200 bg-pink-50 p-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Anaemia</Label>
                <button type="button" onClick={() => { const isFav = isFieldFavourite('diseaseHistory', 'anaemia'); if (isFav) removeFavouriteField('diseaseHistory', 'anaemia'); else addFavouriteField('diseaseHistory', 'On Examination & Disease History', 'anaemia', 'Anaemia'); setFavoritesUpdated(prev => prev + 1) }} className="p-1 rounded hover:bg-gray-100" title={isFieldFavourite('diseaseHistory', 'anaemia') ? 'Remove from Favorites' : 'Add to Favorites'}><Heart className={`h-5 w-5 ${isFieldFavourite('diseaseHistory', 'anaemia') ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} /></button>
              </div>
              <Select value={form.anaemia ?? ""} onValueChange={(v) => update("anaemia", v)}>
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
              <div className="flex items-center justify-between mb-1">
                <Label>Jaundice</Label>
                <button type="button" onClick={() => { const isFav = isFieldFavourite('diseaseHistory', 'jaundice'); if (isFav) removeFavouriteField('diseaseHistory', 'jaundice'); else addFavouriteField('diseaseHistory', 'On Examination & Disease History', 'jaundice', 'Jaundice'); setFavoritesUpdated(prev => prev + 1) }} className="p-1 rounded hover:bg-gray-100" title={isFieldFavourite('diseaseHistory', 'jaundice') ? 'Remove from Favorites' : 'Add to Favorites'}><Heart className={`h-5 w-5 ${isFieldFavourite('diseaseHistory', 'jaundice') ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} /></button>
              </div>
              <Select value={form.jaundice ?? ""} onValueChange={(v) => update("jaundice", v)}>
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
              <div className="flex items-center justify-between mb-1">
                <Label>Ascites</Label>
                <button type="button" onClick={() => { const isFav = isFieldFavourite('diseaseHistory', 'ascites'); if (isFav) removeFavouriteField('diseaseHistory', 'ascites'); else addFavouriteField('diseaseHistory', 'On Examination & Disease History', 'ascites', 'Ascites'); setFavoritesUpdated(prev => prev + 1) }} className="p-1 rounded hover:bg-gray-100" title={isFieldFavourite('diseaseHistory', 'ascites') ? 'Remove from Favorites' : 'Add to Favorites'}><Heart className={`h-5 w-5 ${isFieldFavourite('diseaseHistory', 'ascites') ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} /></button>
              </div>
              <Select value={form.ascites ?? ""} onValueChange={(v) => update("ascites", v)}>
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

          {/* Auscultation */}
          <div className="grid grid-cols-2 gap-4 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Auscultation Heart</Label>
                <button type="button" onClick={() => { const isFav = isFieldFavourite('diseaseHistory', 'heart'); if (isFav) removeFavouriteField('diseaseHistory', 'heart'); else addFavouriteField('diseaseHistory', 'On Examination & Disease History', 'heart', 'Auscultation Heart'); setFavoritesUpdated(prev => prev + 1) }} className="p-1 rounded hover:bg-gray-100" title={isFieldFavourite('diseaseHistory', 'heart') ? 'Remove from Favorites' : 'Add to Favorites'}><Heart className={`h-5 w-5 ${isFieldFavourite('diseaseHistory', 'heart') ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} /></button>
              </div>
              <Input value={form.heart} onChange={(e) => update("heart", e.target.value)} className="bg-white" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Auscultation Lung</Label>
                <button type="button" onClick={() => { const isFav = isFieldFavourite('diseaseHistory', 'lung'); if (isFav) removeFavouriteField('diseaseHistory', 'lung'); else addFavouriteField('diseaseHistory', 'On Examination & Disease History', 'lung', 'Auscultation Lung'); setFavoritesUpdated(prev => prev + 1) }} className="p-1 rounded hover:bg-gray-100" title={isFieldFavourite('diseaseHistory', 'lung') ? 'Remove from Favorites' : 'Add to Favorites'}><Heart className={`h-5 w-5 ${isFieldFavourite('diseaseHistory', 'lung') ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} /></button>
              </div>
              <Input value={form.lung} onChange={(e) => update("lung", e.target.value)} className="bg-white" />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Special note or other findings of O/E</Label>
                <button type="button" onClick={() => { const isFav = isFieldFavourite('diseaseHistory', 'specialNote'); if (isFav) removeFavouriteField('diseaseHistory', 'specialNote'); else addFavouriteField('diseaseHistory', 'On Examination & Disease History', 'specialNote', 'Special Note'); setFavoritesUpdated(prev => prev + 1) }} className="p-1 rounded hover:bg-gray-100" title={isFieldFavourite('diseaseHistory', 'specialNote') ? 'Remove from Favorites' : 'Add to Favorites'}><Heart className={`h-5 w-5 ${isFieldFavourite('diseaseHistory', 'specialNote') ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} /></button>
              </div>
              <Input value={form.specialNote} onChange={(e) => update("specialNote", e.target.value)} className="bg-white" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Disease History (e.g. first known, disease event etc.)</Label>
                <button type="button" onClick={() => { const isFav = isFieldFavourite('diseaseHistory', 'diseaseHistory'); if (isFav) removeFavouriteField('diseaseHistory', 'diseaseHistory'); else addFavouriteField('diseaseHistory', 'On Examination & Disease History', 'diseaseHistory', 'Disease History'); setFavoritesUpdated(prev => prev + 1) }} className="p-1 rounded hover:bg-gray-100" title={isFieldFavourite('diseaseHistory', 'diseaseHistory') ? 'Remove from Favorites' : 'Add to Favorites'}><Heart className={`h-5 w-5 ${isFieldFavourite('diseaseHistory', 'diseaseHistory') ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} /></button>
              </div>
              <Input value={form.diseaseHistory} onChange={(e) => update("diseaseHistory", e.target.value)} className="bg-white" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Surgical or Intervention History</Label>
                <button type="button" onClick={() => { const isFav = isFieldFavourite('diseaseHistory', 'surgicalHistory'); if (isFav) removeFavouriteField('diseaseHistory', 'surgicalHistory'); else addFavouriteField('diseaseHistory', 'On Examination & Disease History', 'surgicalHistory', 'Surgical History'); setFavoritesUpdated(prev => prev + 1) }} className="p-1 rounded hover:bg-gray-100" title={isFieldFavourite('diseaseHistory', 'surgicalHistory') ? 'Remove from Favorites' : 'Add to Favorites'}><Heart className={`h-5 w-5 ${isFieldFavourite('diseaseHistory', 'surgicalHistory') ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} /></button>
              </div>
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
