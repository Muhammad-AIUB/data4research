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
  savedData?: Array<{ sampleDate: Date | string; autoimmunoProfile?: any }>
}

export default function AutoimmunoProfileModal({ onClose, defaultDate, onDataChange, patientId, onSaveSuccess, savedData = [] }: Props) {
  const [formData, setFormData] = useState<Record<string, { value: string; notes: string }>>({})
  const [reportDate, setReportDate] = useState(defaultDate)
  const [saving, setSaving] = useState(false)
  const reportType = "autoimmunoProfile"
  const reportName = "Autoimmuno Profile"

  // Load saved data when modal opens
  useEffect(() => {
    if (savedData && savedData.length > 0) {
      const dateStr = reportDate.toISOString().split('T')[0]
      const matchingTest = savedData.find(test => {
        if (!test.autoimmunoProfile) return false
        const testDate = test.sampleDate instanceof Date 
          ? test.sampleDate.toISOString().split('T')[0]
          : new Date(test.sampleDate).toISOString().split('T')[0]
        return testDate === dateStr
      })
      
      const testToLoad = matchingTest || savedData
        .filter(test => test.autoimmunoProfile)
        .sort((a, b) => {
          const dateA = a.sampleDate instanceof Date ? a.sampleDate : new Date(a.sampleDate)
          const dateB = b.sampleDate instanceof Date ? b.sampleDate : new Date(b.sampleDate)
          return dateB.getTime() - dateA.getTime()
        })[0]
      
      if (testToLoad?.autoimmunoProfile) {
        setFormData(testToLoad.autoimmunoProfile as Record<string, { value: string; notes: string }>)
        const testDate = testToLoad.sampleDate instanceof Date 
          ? testToLoad.sampleDate 
          : new Date(testToLoad.sampleDate)
        setReportDate(testDate)
      }
    }
  }, [savedData, reportDate])

  const updateField = (fieldName: string, value: string, type: 'value' | 'notes') => {
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

  const renderField = (fieldName: string, label: string, index: number) => {
    const colorClass = fieldColors[index % fieldColors.length]
    const isFav = isFieldFavourite(reportType, fieldName)
    
    return (
      <div className={`grid grid-cols-4 gap-2 items-end p-2 rounded ${colorClass}`}>
        <div className="col-span-1">
          <Label className="text-sm">{label}</Label>
          <Select
            value={getFieldValue(fieldName)}
            onValueChange={(v) => updateField(fieldName, v, 'value')}
            className="bg-white"
          >
            <SelectValue placeholder="Select" />
            <SelectItem value="Positive">Positive</SelectItem>
            <SelectItem value="Negative">Negative</SelectItem>
          </Select>
        </div>
        <div className="col-span-2">
          <Label className="text-sm">Notes</Label>
          <Input
            value={getFieldNotes(fieldName)}
            onChange={(e) => updateField(fieldName, e.target.value, 'notes')}
            placeholder="Notes"
            className="bg-white"
          />
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
    )
  }

  const renderSection = (title: string, fields: Array<[string, string]>, startIndex: number) => (
    <div className="mb-6 pb-4 border-b">
      <h3 className="font-semibold text-lg mb-3 text-blue-700">{title}</h3>
      <div className="space-y-2">
        {fields.map(([fieldName, label], idx) => (
          <div key={fieldName}>
            {renderField(fieldName, label, startIndex + idx)}
          </div>
        ))}
      </div>
    </div>
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if there's any data to save
    const hasData = Object.keys(formData).length > 0 && 
      Object.values(formData).some(f => f.value || f.notes)
    
    if (!hasData) {
      alert("Please enter at least one field value before saving.")
      return
    }

    setSaving(true)
    try {
      // Save to database immediately
      const response = await fetch('/api/patient-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patientId || null,
          sampleDate: reportDate.toISOString(),
          autoimmunoProfile: formData,
        })
      })

      if (response.ok) {
        // Notify parent to refresh saved data
        if (onSaveSuccess) {
          onSaveSuccess()
        }
        if (onDataChange) {
          onDataChange(formData, reportDate)
        }
        alert("Autoimmuno Profile data saved successfully!")
        onClose()
      } else {
        const error = await response.json()
        alert(error.message || "Failed to save data. Please try again.")
      }
    } catch (error) {
      console.error("Error saving Autoimmuno Profile data:", error)
      alert("Failed to save data. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-t-lg shadow-md flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">Autoimmuno Profile</h2>
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
          {/* ANA PROFILE */}
          {renderSection("ANA PROFILE (Anti-Nuclear Antibody Panel)", [
            ["ana", "ANA (IFA, ELISA, or multiplex)"],
            ["antiDsDna", "Anti–dsDNA"],
            ["antiSm", "Anti–Sm"],
            ["antiSsaRo60", "Anti–SSA (Ro60)"],
            ["antiSsbLa", "Anti–SSB (La)"],
            ["antiRnp", "Anti–RNP"],
            ["antiScl70", "Anti–Scl-70 (Topoisomerase I)"],
            ["antiCentromere", "Anti–Centromere"],
            ["antiHistone", "Anti–Histone"],
            ["antiNucleosome", "Anti–Nucleosome"],
            ["antiChromatin", "Anti–Chromatin"],
            ["antiRibosomalP", "Anti–Ribosomal P"],
            ["antiPmScl", "Anti–PM/Scl"],
            ["antiJo1", "Anti–Jo-1 (myositis)"],
          ], 0)}

          {/* EXTENDED ENA PROFILE */}
          {renderSection("EXTENDED ENA PROFILE (Extractable Nuclear Antigen Panel)", [
            ["antiSsaRo60Extended", "Anti-SSA/Ro60"],
            ["antiRo52", "Anti-Ro52"],
            ["antiSsbLaExtended", "Anti-SSB/La"],
            ["antiSmExtended", "Anti-Sm"],
            ["antiRnpExtended", "Anti-RNP"],
            ["antiScl70Extended", "Anti-Scl-70"],
            ["antiCentromereB", "Anti-Centromere B"],
            ["antiJo1Extended", "Anti-Jo-1"],
            ["antiMi2", "Anti-Mi-2 (Dermatomyositis)"],
            ["antiTif1Gamma", "Anti-TIF1-γ"],
            ["antiMda5", "Anti-MDA-5"],
            ["antiSrp", "Anti-SRP"],
            ["antiPl7", "Anti-PL-7"],
            ["antiPl12", "Anti-PL-12"],
            ["antiEj", "Anti-EJ"],
            ["antiOj", "Anti-OJ"],
          ], 14)}

          {/* AUTOIMMUNE THYROID PROFILE */}
          {renderSection("AUTOIMMUNE THYROID PROFILE", [
            ["antiTpo", "Anti-TPO (Thyroid peroxidase antibody)"],
            ["antiTg", "Anti-Tg (Thyroglobulin antibody)"],
            ["trab", "TRAb (TSH receptor antibody)"],
            ["tsi", "TSI (Thyroid Stimulating Immunoglobulin)"],
          ], 30)}

          {/* RHEUMATOID & ARTHRITIS PROFILE */}
          {renderSection("RHEUMATOID & ARTHRITIS PROFILE", [
            ["rheumatoidFactor", "Rheumatoid Factor (RF)"],
            ["antiCcp", "Anti-CCP (Anti-cyclic citrullinated peptide)"],
            ["anaRheumatoid", "ANA"],
            ["esr", "ESR"],
            ["crp", "CRP"],
            ["hlaB27", "HLA-B27 (for spondyloarthropathy)"],
            ["antiCarp", "Anti-CarP (Carbamylated protein antibody)"],
          ], 34)}

          {/* AUTOIMMUNE LIVER DISEASE PROFILE */}
          {renderSection("AUTOIMMUNE LIVER DISEASE PROFILE", [
            ["anaLiver", "ANA"],
            ["asma", "ASMA (Anti-Smooth Muscle Ab)"],
            ["lkm1", "LKM-1 antibody"],
            ["slaLp", "SLA/LP antibody"],
            ["ama", "AMA (Anti-Mitochondrial Antibody)"],
            ["amaM2", "AMA-M2 specifically for PBC"],
            ["pAncaLiver", "p-ANCA (for PSC)"],
          ], 41)}

          {/* VASCULITIS PROFILE */}
          {renderSection("VASCULITIS PROFILE", [
            ["cAnca", "c-ANCA (Proteinase-3 or PR3 Ab)"],
            ["pAnca", "p-ANCA (Myeloperoxidase or MPO Ab)"],
            ["anaVasculitis", "ANA"],
            ["antiGbm", "Anti-GBM (Goodpasture syndrome)"],
            ["complementC3C4", "Complement C3, C4"],
          ], 48)}

          {/* NEURO-AUTOIMMUNE PROFILE */}
          {renderSection("NEURO-AUTOIMMUNE PROFILE", [
            ["antiAchr", "Anti-AChR (Acetylcholine receptor) – Myasthenia gravis"],
            ["antiMusk", "Anti-MuSK"],
            ["antiVgkc", "Anti-VGKC (voltage-gated potassium channel)"],
            ["antiGad65", "Anti-GAD65"],
            ["antiNmda", "Anti-NMDA receptor Ab"],
            ["antiLgi1", "Anti-LGI1"],
            ["antiCaspr2", "Anti-CASPR2"],
            ["antiAquaporin4", "Anti-Aquaporin-4 (NMO)"],
            ["antiMog", "Anti-MOG (Myelin oligodendrocyte glycoprotein)"],
          ], 53)}

          {/* CELIAC / GLUTEN AUTOIMMUNITY PROFILE */}
          {renderSection("CELIAC / GLUTEN AUTOIMMUNITY PROFILE", [
            ["antiTtgIga", "Anti-tTG IgA"],
            ["antiTtgIgg", "Anti-tTG IgG"],
            ["antiEma", "Anti-EMA (Endomysial Ab)"],
            ["antiDgp", "Anti-DGP (Deamidated gliadin peptide)"],
            ["totalIga", "Total IgA (to rule out IgA deficiency)"],
          ], 62)}

          {/* AUTOIMMUNE DIABETES PROFILE */}
          {renderSection("AUTOIMMUNE DIABETES PROFILE", [
            ["gad65", "GAD65 antibody"],
            ["ia2", "IA-2 antibody"],
            ["znt8", "ZnT8 antibody"],
            ["ica", "ICA (Islet cell Ab)"],
            ["iaa", "IAA (Insulin autoantibody)"],
          ], 67)}

          {/* AUTOIMMUNE KIDNEY PROFILE */}
          {renderSection("AUTOIMMUNE KIDNEY PROFILE", [
            ["anaKidney", "ANA"],
            ["ancaKidney", "ANCA (p-ANCA, c-ANCA)"],
            ["antiGbmKidney", "Anti-GBM"],
            ["complementKidney", "Complement (C3/C4)"],
            ["antiPla2r", "Anti-PLA2R (Membranous nephropathy)"],
            ["antiThsd7a", "Anti-THSD7A"],
          ], 72)}

          {/* DERMATOLOGY AUTOIMMUNE PROFILE */}
          {renderSection("DERMATOLOGY AUTOIMMUNE PROFILE", [
            ["antiDesmoglein1", "Anti-Desmoglein 1"],
            ["antiDesmoglein3", "Anti-Desmoglein 3"],
            ["antiBp180", "Anti-BP180 (Collagen XVII)"],
            ["antiBp230", "Anti-BP230"],
            ["antiEpidermalTransglutaminase", "Anti-Epidermal Transglutaminase"],
            ["antiType7Collagen", "Anti-Type VII collagen (Epidermolysis bullosa acquisita)"],
          ], 78)}

          {/* ANTIPHOSPHOLIPID SYNDROME (APS) PROFILE */}
          {renderSection("ANTIPHOSPHOLIPID SYNDROME (APS) PROFILE", [
            ["lupusAnticoagulant", "Lupus anticoagulant"],
            ["antiCardiolipin", "Anti-Cardiolipin IgG/IgM"],
            ["antiBeta2Glycoprotein", "Anti-β2 Glycoprotein I IgG/IgM"],
            ["phosphatidylserine", "Phosphatidylserine antibodies"],
          ], 84)}

          {/* AUTOIMMUNE GASTRO PROFILE */}
          {renderSection("AUTOIMMUNE GASTRO PROFILE", [
            ["antiParietalCell", "Anti-Parietal cell antibody"],
            ["antiIntrinsicFactor", "Anti-Intrinsic factor antibody (Pernicious anemia)"],
            ["antiEnterocyte", "Anti-Enterocyte antibody"],
          ], 88)}

          {/* SJÖGREN'S SYNDROME PROFILE */}
          {renderSection("SJÖGREN'S SYNDROME PROFILE", [
            ["antiSsaRoSjogren", "Anti-SSA/Ro"],
            ["antiSsbLaSjogren", "Anti-SSB/La"],
            ["schirmerTest", "Schirmer test (not antibody but part of evaluation)"],
            ["anaSjogren", "ANA"],
            ["rheumatoidFactorSjogren", "Rheumatoid Factor"],
          ], 91)}

          {/* AUTOIMMUNE MUSCLE/MYOSITIS PROFILE */}
          {renderSection("AUTOIMMUNE MUSCLE/MYOSITIS PROFILE", [
            ["antiJo1Myositis", "Anti-Jo-1"],
            ["antiMi2Myositis", "Anti-Mi-2"],
            ["antiSrpMyositis", "Anti-SRP"],
            ["antiPl7Myositis", "Anti-PL-7"],
            ["antiPl12Myositis", "Anti-PL-12"],
            ["antiMda5Myositis", "Anti-MDA-5"],
            ["antiTif1GammaMyositis", "Anti-TIF1-γ"],
            ["antiHmgcr", "Anti-HMGCR"],
          ], 96)}

          {/* AUTOIMMUNE FERTILITY / OVARIAN PROFILE */}
          {renderSection("AUTOIMMUNE FERTILITY / OVARIAN PROFILE", [
            ["antiOvarian", "Anti-Ovarian antibody"],
            ["antiZonaPelucida", "Anti-Zona-pelucida antibody"],
            ["antiSperm", "Anti-Sperm antibody"],
          ], 104)}

          {/* COMPLEMENT SYSTEM PROFILE */}
          {renderSection("COMPLEMENT SYSTEM PROFILE", [
            ["c3", "C3"],
            ["c4", "C4"],
            ["ch50", "CH50 (Total complement activity)"],
          ], 107)}

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
