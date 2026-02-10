'use client'

import { useState, useEffect } from "react"
import { X, Heart } from "lucide-react"
import { Select, SelectItem, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import ModalDatePicker from "@/components/ModalDatePicker"
import { 
  addSectionFieldsToFavourites, 
  isFieldFavourite, 
  removeFavouriteField 
} from "@/lib/favourites"

type BASDAIData = {
  q1Fatigue: number
  q2SpinalPain: number
  q3JointPain: number
  q4TenderAreas: number
  q5MorningStiffness: number
  q6StiffnessDuration: number
  q6Label: string
  basdaiScore: number
}

type PatientTest = {
  sampleDate: Date | string
  basdai?: Partial<BASDAIData> | null
}

interface Props {
  onClose: () => void
  defaultDate: Date
  onDataChange?: (data: BASDAIData, date: Date) => void
  patientId?: string | null
  onSaveSuccess?: () => void
  savedData?: PatientTest[]
}

const scaleOptions = Array.from({ length: 11 }, (_, i) => ({
  value: i,
  label: i === 0 ? "0 - none" : i === 10 ? "10 - severe" : String(i),
}))

const stiffnessOptions: { value: number; label: string }[] = [
  { value: 0, label: "0 min" },
  { value: 1, label: "0–15 min" },
  { value: 2, label: "15–30 min" },
  { value: 3, label: "30–45 min" },
  { value: 4, label: "45–1 hr" },
  { value: 5, label: "1 hr" },
  { value: 6, label: "1 hr–1 hr 15 min" },
  { value: 7, label: "1 hr 15 min–1 hr 30 min" },
  { value: 8, label: "1 hr 30 min–1 hr 45 min" },
  { value: 9, label: "1 hr 45 min–2 hr" },
  { value: 10, label: "More than 2 hr" },
]

export default function BASDAIModal({
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

  const [form, setForm] = useState<BASDAIData>({
    q1Fatigue: 0,
    q2SpinalPain: 0,
    q3JointPain: 0,
    q4TenderAreas: 0,
    q5MorningStiffness: 0,
    q6StiffnessDuration: 0,
    q6Label: stiffnessOptions[0].label,
    basdaiScore: 0,
  })

  
  useEffect(() => {
    if (savedData.length === 0) return
    const today = reportDate.toISOString().split("T")[0]
    const match = savedData.find((item) => {
      const d = item.sampleDate instanceof Date ? item.sampleDate : new Date(item.sampleDate)
      return d.toISOString().split("T")[0] === today
    }) || savedData[savedData.length - 1]

    if (match?.basdai) {
      const bd = match.basdai
      setForm(prev => ({
        ...prev,
        q1Fatigue: Number(bd.q1Fatigue ?? prev.q1Fatigue),
        q2SpinalPain: Number(bd.q2SpinalPain ?? prev.q2SpinalPain),
        q3JointPain: Number(bd.q3JointPain ?? prev.q3JointPain),
        q4TenderAreas: Number(bd.q4TenderAreas ?? prev.q4TenderAreas),
        q5MorningStiffness: Number(bd.q5MorningStiffness ?? prev.q5MorningStiffness),
        q6StiffnessDuration: Number(bd.q6StiffnessDuration ?? prev.q6StiffnessDuration),
        q6Label: String(bd.q6Label ?? prev.q6Label),
        basdaiScore: Number(bd.basdaiScore ?? prev.basdaiScore),
      }))
    }
  }, [savedData, reportDate])

  
  useEffect(() => {
    const sumQ1toQ4 = form.q1Fatigue + form.q2SpinalPain + form.q3JointPain + form.q4TenderAreas
    const avgQ5Q6 = (form.q5MorningStiffness + form.q6StiffnessDuration) / 2
    const score = ((sumQ1toQ4 + avgQ5Q6) / 5)
    setForm(prev => ({ ...prev, basdaiScore: Number(score.toFixed(2)) }))
  }, [form.q1Fatigue, form.q2SpinalPain, form.q3JointPain, form.q4TenderAreas, form.q5MorningStiffness, form.q6StiffnessDuration])

  const update = (patch: Partial<BASDAIData>) => {
    setForm(prev => ({ ...prev, ...patch }))
  }

  const basdaiFields: Array<[string, string]> = [
    ["q1Fatigue", "Fatigue/tiredness"],
    ["q2SpinalPain", "AS neck/back/hip pain"],
    ["q3JointPain", "Pain/swelling in joints"],
    ["q4TenderAreas", "Tender areas discomfort"],
    ["q5MorningStiffness", "Morning stiffness severity"],
    ["q6StiffnessDuration", "Morning stiffness duration"],
  ]

  const handleSectionFavoriteToggle = () => {
    const reportType = "basdai"
    const reportName = "BASDAI"
    const allFavourite = basdaiFields.every(([fieldName]) => isFieldFavourite(reportType, fieldName))
    if (allFavourite) {
      basdaiFields.forEach(([fieldName]) => removeFavouriteField(reportType, fieldName))
    } else {
      addSectionFieldsToFavourites(reportType, reportName, basdaiFields, "BASDAI Questions")
    }
    setFavoritesUpdated(prev => prev + 1)
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

  const renderSectionHeader = () => {
    const reportType = "basdai"
    const allFavourite = basdaiFields.every(([fieldName]) => isFieldFavourite(reportType, fieldName))
    return (
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg text-blue-700">BASDAI Questions</h3>
        <button
          onClick={handleSectionFavoriteToggle}
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      patientId,
      sampleDate: reportDate.toISOString().split("T")[0],
      basdai: { ...form },
    }
    try {
      const res = await fetch("/api/patient-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        onSaveSuccess?.()
        onDataChange?.(form, reportDate)
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center bg-linear-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-t-lg shadow-md shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">BASDAI Score</h2>
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
                  const form = document.getElementById('basdai-form')
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
          <form id="basdai-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="mb-4 pb-2 border-b">
              {renderSectionHeader()}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  { label: "1. Fatigue/tiredness", value: String(form.q1Fatigue), onChange: (v: string) => update({ q1Fatigue: Number(v) }) },
                  { label: "2. AS neck, back or hip pain", value: String(form.q2SpinalPain), onChange: (v: string) => update({ q2SpinalPain: Number(v) }) },
                  { label: "3. Pain/swelling in joints", value: String(form.q3JointPain), onChange: (v: string) => update({ q3JointPain: Number(v) }) },
                  { label: "4. Tender areas discomfort", value: String(form.q4TenderAreas), onChange: (v: string) => update({ q4TenderAreas: Number(v) }) },
                  { label: "5. Morning stiffness (severity)", value: String(form.q5MorningStiffness), onChange: (v: string) => update({ q5MorningStiffness: Number(v) }) },
                ].map((f, idx) => {
                  const colorClass = fieldColors[idx % fieldColors.length]
                  return (
                    <div key={idx} className={`p-2 rounded ${colorClass}`}>
                      <Label className="text-sm">{f.label}</Label>
                      <Select
                        value={f.value}
                        onValueChange={(v) => f.onChange(v)}
                        className="bg-white h-16 text-xl px-4"
                      >
                        <SelectValue placeholder="Select" />
                        {scaleOptions.map(opt => (
                          <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                        ))}
                      </Select>
                    </div>
                  )
                })}
                {(() => {
                  const idx = 5
                  const colorClass = fieldColors[idx % fieldColors.length]
                  return (
                    <div className={`p-2 rounded ${colorClass}`}>
                      <Label className="text-sm">6. Morning stiffness duration</Label>
                      <Select
                        value={String(form.q6StiffnessDuration)}
                        onValueChange={(v) => {
                          const num = Number(v)
                          const lbl = stiffnessOptions.find(o => o.value === num)?.label || form.q6Label
                          update({ q6StiffnessDuration: num, q6Label: lbl })
                        }}
                        className="bg-white h-16 text-xl px-4"
                      >
                        <SelectValue placeholder="Select duration" />
                        {stiffnessOptions.map(opt => (
                          <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                        ))}
                      </Select>
                    </div>
                  )
                })()}
              </div>
            </div>

            <div className={`rounded-lg border border-indigo-200 bg-indigo-50 p-4`}>
              <p className="font-semibold text-lg">BASDAI Score: <span className="text-blue-700">{form.basdaiScore}</span></p>
              <p className="text-sm text-gray-600 mt-1">Formula: [(Q1 + Q2 + Q3 + Q4) + ((Q5 + Q6) / 2)] / 5</p>
              <a className="text-sm text-blue-600 mt-1 inline-block" href="https://www.physio-pedia.com/BASDAI" target="_blank" rel="noopener noreferrer">Learn more about BASDAI</a>
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
