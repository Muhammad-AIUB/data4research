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
}

export default function ImagingHistopathologyModal({ onClose, defaultDate, onDataChange }: Props) {
  const [reportDate, setReportDate] = useState(defaultDate)
  const reportType = "imaging"
  const reportName = "Imaging, Histopathology"
  const [formData, setFormData] = useState({
    xray: "",
    ctScan: "",
    mri: "",
    ultrasound: "",
    petScan: "",
    mammography: "",
    biopsy: "",
    histopathology: "",
    cytology: "",
    immunohistochemistry: "",
    notes: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      formData,
      date: reportDate.toISOString()
    }
    console.log("Imaging & Histopathology Data:", data)
    if (onDataChange) {
      onDataChange(formData, reportDate)
    }
    onClose()
  }


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">Imaging, Histopathology</h2>
            <ModalDatePicker
              selectedDate={reportDate}
              onDateChange={setReportDate}
              defaultDate={defaultDate}
            />
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>X-Ray</Label>
              <Input
                value={formData.xray}
                onChange={(e) => setFormData({ ...formData, xray: e.target.value })}
              />
            </div>
            <div>
              <Label>CT Scan</Label>
              <Input
                value={formData.ctScan}
                onChange={(e) => setFormData({ ...formData, ctScan: e.target.value })}
              />
            </div>
            <div>
              <Label>MRI</Label>
              <Input
                value={formData.mri}
                onChange={(e) => setFormData({ ...formData, mri: e.target.value })}
              />
            </div>
            <div>
              <Label>Ultrasound</Label>
              <Input
                value={formData.ultrasound}
                onChange={(e) => setFormData({ ...formData, ultrasound: e.target.value })}
              />
            </div>
            <div>
              <Label>PET Scan</Label>
              <Input
                value={formData.petScan}
                onChange={(e) => setFormData({ ...formData, petScan: e.target.value })}
              />
            </div>
            <div>
              <Label>Mammography</Label>
              <Input
                value={formData.mammography}
                onChange={(e) => setFormData({ ...formData, mammography: e.target.value })}
              />
            </div>
            <div>
              <Label>Biopsy</Label>
              <Input
                value={formData.biopsy}
                onChange={(e) => setFormData({ ...formData, biopsy: e.target.value })}
              />
            </div>
            <div>
              <Label>Histopathology</Label>
              <Input
                value={formData.histopathology}
                onChange={(e) => setFormData({ ...formData, histopathology: e.target.value })}
              />
            </div>
            <div>
              <Label>Cytology</Label>
              <Input
                value={formData.cytology}
                onChange={(e) => setFormData({ ...formData, cytology: e.target.value })}
              />
            </div>
            <div>
              <Label>Immunohistochemistry</Label>
              <Input
                value={formData.immunohistochemistry}
                onChange={(e) => setFormData({ ...formData, immunohistochemistry: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-md min-h-20"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

