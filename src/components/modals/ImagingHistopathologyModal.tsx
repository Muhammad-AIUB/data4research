"use client";

import { useState, useEffect } from "react";
import { X, Heart } from "lucide-react";
import {
  addFavouriteField,
  isFieldFavourite,
  removeFavouriteField,
} from "@/lib/favourites";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import ModalDatePicker from "@/components/ModalDatePicker";

interface Props {
  onClose: () => void;
  defaultDate: Date;
  onDataChange?: (data: unknown, date: Date) => void;
  patientId?: string | null;
  onSaveSuccess?: () => void;
  savedData?: Array<{ sampleDate: Date | string; imaging?: unknown }>;
}

export default function ImagingHistopathologyModal({
  onClose,
  defaultDate,
  onDataChange,
  patientId,
  onSaveSuccess,
  savedData = [],
}: Props) {
  const [reportDate, setReportDate] = useState(defaultDate);
  const [saving, setSaving] = useState(false);
  const [, setFavoritesUpdated] = useState(0);

  const renderSectionHeader = (
    title: string,
  ) => {
    return (
      <div className="flex items-center justify-between mb-3 pb-2 border-b">
        <h3 className="font-semibold text-lg text-blue-700">{title}</h3>
      </div>
    );
  };
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
  });

  
  useEffect(() => {
    if (savedData && savedData.length > 0) {
      const dateStr = reportDate.toISOString().split("T")[0];
      const matchingTest = savedData.find((test) => {
        if (!test.imaging) return false;
        const testDate =
          test.sampleDate instanceof Date
            ? test.sampleDate.toISOString().split("T")[0]
            : new Date(test.sampleDate).toISOString().split("T")[0];
        return testDate === dateStr;
      });

      const testToLoad =
        matchingTest ||
        savedData
          .filter((test) => test.imaging)
          .sort((a, b) => {
            const dateA =
              a.sampleDate instanceof Date
                ? a.sampleDate
                : new Date(a.sampleDate);
            const dateB =
              b.sampleDate instanceof Date
                ? b.sampleDate
                : new Date(b.sampleDate);
            return dateB.getTime() - dateA.getTime();
          })[0];

      if (testToLoad?.imaging) {
        setFormData(testToLoad.imaging as typeof formData);
        const testDate =
          testToLoad.sampleDate instanceof Date
            ? testToLoad.sampleDate
            : new Date(testToLoad.sampleDate);
        setReportDate(testDate);
      }
    }
    
    
  }, [savedData]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasData = Object.values(formData).some(
      (f) => f && f.toString().trim() !== "",
    );

    if (!hasData) {
      alert("Please enter at least one field value before saving.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/patient-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patientId || null,
          sampleDate: `${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, "0")}-${String(reportDate.getDate()).padStart(2, "0")}`,
          imaging: formData,
        }),
      });

      if (response.ok) {
        if (onSaveSuccess) onSaveSuccess();
        if (onDataChange) onDataChange(formData, reportDate);
        alert("Imaging & Histopathology data saved successfully!");
        onClose();
      } else {
        const error = await response.json();
        alert(error.message || "Failed to save data. Please try again.");
      }
    } catch (error) {
      console.error("Error saving Imaging & Histopathology data:", error);
      alert("Failed to save data. Please try again.");
    } finally {
      setSaving(false);
    }
  };

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
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex gap-2 mr-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={saving}
                className="bg-white/10 hover:bg-white/20 text-gray-800 border-gray-300"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const form = document.getElementById("imaging-form");
                  form?.dispatchEvent(
                    new Event("submit", { cancelable: true, bubbles: true }),
                  );
                }}
                disabled={saving}
                className="bg-amber-400 hover:bg-amber-500 text-blue-900"
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form id="imaging-form" onSubmit={handleSubmit} className="space-y-4">
          {renderSectionHeader("All Fields")}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
              <Label>X-Ray</Label>
              <button
                type="button"
                onClick={() => {
                  const reportType = 'imaging'
                  const reportName = 'Imaging, Histopathology'
                  const isFav = isFieldFavourite(reportType, 'xray')
                  if (isFav) removeFavouriteField(reportType, 'xray')
                  else addFavouriteField(reportType, reportName, 'xray', 'X-Ray')
                  setFavoritesUpdated(prev => prev + 1)
                }}
                className="p-1 rounded hover:bg-gray-100"
                title={isFieldFavourite('imaging', 'xray') ? 'Remove from Favorites' : 'Add to Favorites'}
              >
                <Heart className={`h-5 w-5 ${isFieldFavourite('imaging', 'xray') ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} />
              </button>
            </div>
            <Input
              value={formData.xray}
              onChange={(e) =>
                setFormData({ ...formData, xray: e.target.value })
              }
            />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>CT Scan</Label>
                <button type="button" onClick={() => { const isFav = isFieldFavourite('imaging', 'ctScan'); if (isFav) removeFavouriteField('imaging', 'ctScan'); else addFavouriteField('imaging', 'Imaging, Histopathology', 'ctScan', 'CT Scan'); setFavoritesUpdated(prev => prev + 1) }} className="p-1 rounded hover:bg-gray-100" title={isFieldFavourite('imaging', 'ctScan') ? 'Remove from Favorites' : 'Add to Favorites'}><Heart className={`h-5 w-5 ${isFieldFavourite('imaging', 'ctScan') ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} /></button>
              </div>
              <Input
                value={formData.ctScan}
                onChange={(e) =>
                  setFormData({ ...formData, ctScan: e.target.value })
                }
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>MRI</Label>
                <button type="button" onClick={() => { const isFav = isFieldFavourite('imaging', 'mri'); if (isFav) removeFavouriteField('imaging', 'mri'); else addFavouriteField('imaging', 'Imaging, Histopathology', 'mri', 'MRI'); setFavoritesUpdated(prev => prev + 1) }} className="p-1 rounded hover:bg-gray-100" title={isFieldFavourite('imaging', 'mri') ? 'Remove from Favorites' : 'Add to Favorites'}><Heart className={`h-5 w-5 ${isFieldFavourite('imaging', 'mri') ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} /></button>
              </div>
              <Input
                value={formData.mri}
                onChange={(e) =>
                  setFormData({ ...formData, mri: e.target.value })
                }
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Ultrasound</Label>
                <button type="button" onClick={() => { const isFav = isFieldFavourite('imaging', 'ultrasound'); if (isFav) removeFavouriteField('imaging', 'ultrasound'); else addFavouriteField('imaging', 'Imaging, Histopathology', 'ultrasound', 'Ultrasound'); setFavoritesUpdated(prev => prev + 1) }} className="p-1 rounded hover:bg-gray-100" title={isFieldFavourite('imaging', 'ultrasound') ? 'Remove from Favorites' : 'Add to Favorites'}><Heart className={`h-5 w-5 ${isFieldFavourite('imaging', 'ultrasound') ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} /></button>
              </div>
              <Input
                value={formData.ultrasound}
                onChange={(e) =>
                  setFormData({ ...formData, ultrasound: e.target.value })
                }
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>PET Scan</Label>
                <button type="button" onClick={() => { const isFav = isFieldFavourite('imaging', 'petScan'); if (isFav) removeFavouriteField('imaging', 'petScan'); else addFavouriteField('imaging', 'Imaging, Histopathology', 'petScan', 'PET Scan'); setFavoritesUpdated(prev => prev + 1) }} className="p-1 rounded hover:bg-gray-100" title={isFieldFavourite('imaging', 'petScan') ? 'Remove from Favorites' : 'Add to Favorites'}><Heart className={`h-5 w-5 ${isFieldFavourite('imaging', 'petScan') ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} /></button>
              </div>
              <Input
                value={formData.petScan}
                onChange={(e) =>
                  setFormData({ ...formData, petScan: e.target.value })
                }
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Mammography</Label>
                <button type="button" onClick={() => { const isFav = isFieldFavourite('imaging', 'mammography'); if (isFav) removeFavouriteField('imaging', 'mammography'); else addFavouriteField('imaging', 'Imaging, Histopathology', 'mammography', 'Mammography'); setFavoritesUpdated(prev => prev + 1) }} className="p-1 rounded hover:bg-gray-100" title={isFieldFavourite('imaging', 'mammography') ? 'Remove from Favorites' : 'Add to Favorites'}><Heart className={`h-5 w-5 ${isFieldFavourite('imaging', 'mammography') ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} /></button>
              </div>
              <Input
                value={formData.mammography}
                onChange={(e) =>
                  setFormData({ ...formData, mammography: e.target.value })
                }
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Biopsy</Label>
                <button type="button" onClick={() => { const isFav = isFieldFavourite('imaging', 'biopsy'); if (isFav) removeFavouriteField('imaging', 'biopsy'); else addFavouriteField('imaging', 'Imaging, Histopathology', 'biopsy', 'Biopsy'); setFavoritesUpdated(prev => prev + 1) }} className="p-1 rounded hover:bg-gray-100" title={isFieldFavourite('imaging', 'biopsy') ? 'Remove from Favorites' : 'Add to Favorites'}><Heart className={`h-5 w-5 ${isFieldFavourite('imaging', 'biopsy') ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} /></button>
              </div>
              <Input
                value={formData.biopsy}
                onChange={(e) =>
                  setFormData({ ...formData, biopsy: e.target.value })
                }
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Histopathology</Label>
                <button type="button" onClick={() => { const isFav = isFieldFavourite('imaging', 'histopathology'); if (isFav) removeFavouriteField('imaging', 'histopathology'); else addFavouriteField('imaging', 'Imaging, Histopathology', 'histopathology', 'Histopathology'); setFavoritesUpdated(prev => prev + 1) }} className="p-1 rounded hover:bg-gray-100" title={isFieldFavourite('imaging', 'histopathology') ? 'Remove from Favorites' : 'Add to Favorites'}><Heart className={`h-5 w-5 ${isFieldFavourite('imaging', 'histopathology') ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} /></button>
              </div>
              <Input
                value={formData.histopathology}
                onChange={(e) =>
                  setFormData({ ...formData, histopathology: e.target.value })
                }
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Cytology</Label>
                <button type="button" onClick={() => { const isFav = isFieldFavourite('imaging', 'cytology'); if (isFav) removeFavouriteField('imaging', 'cytology'); else addFavouriteField('imaging', 'Imaging, Histopathology', 'cytology', 'Cytology'); setFavoritesUpdated(prev => prev + 1) }} className="p-1 rounded hover:bg-gray-100" title={isFieldFavourite('imaging', 'cytology') ? 'Remove from Favorites' : 'Add to Favorites'}><Heart className={`h-5 w-5 ${isFieldFavourite('imaging', 'cytology') ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} /></button>
              </div>
              <Input
                value={formData.cytology}
                onChange={(e) =>
                  setFormData({ ...formData, cytology: e.target.value })
                }
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Immunohistochemistry</Label>
                <button type="button" onClick={() => { const isFav = isFieldFavourite('imaging', 'immunohistochemistry'); if (isFav) removeFavouriteField('imaging', 'immunohistochemistry'); else addFavouriteField('imaging', 'Imaging, Histopathology', 'immunohistochemistry', 'Immunohistochemistry'); setFavoritesUpdated(prev => prev + 1) }} className="p-1 rounded hover:bg-gray-100" title={isFieldFavourite('imaging', 'immunohistochemistry') ? 'Remove from Favorites' : 'Add to Favorites'}><Heart className={`h-5 w-5 ${isFieldFavourite('imaging', 'immunohistochemistry') ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} /></button>
              </div>
              <Input
                value={formData.immunohistochemistry}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    immunohistochemistry: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Notes</Label>
              <button type="button" onClick={() => { const isFav = isFieldFavourite('imaging', 'notes'); if (isFav) removeFavouriteField('imaging', 'notes'); else addFavouriteField('imaging', 'Imaging, Histopathology', 'notes', 'Notes'); setFavoritesUpdated(prev => prev + 1) }} className="p-1 rounded hover:bg-gray-100" title={isFieldFavourite('imaging', 'notes') ? 'Remove from Favorites' : 'Add to Favorites'}><Heart className={`h-5 w-5 ${isFieldFavourite('imaging', 'notes') ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} /></button>
            </div>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md min-h-20"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
