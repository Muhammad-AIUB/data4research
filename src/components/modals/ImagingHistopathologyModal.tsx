"use client";

import { useState, useEffect } from "react";
import { X, Heart } from "lucide-react";
import {
  addSectionFieldsToFavourites,
  removeSectionFieldsFromFavourites,
  areAllSectionFieldsFavourite,
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
  const [favoritesUpdated, setFavoritesUpdated] = useState(0);
  const reportType = "imaging";
  const reportName = "Imaging, Histopathology";

  const handleSectionFavoriteToggle = (
    fields: Array<[string, string]>,
    sectionTitle: string,
  ) => {
    
    const allFavourite = fields.every(([fieldName]) =>
      isFieldFavourite(reportType, fieldName),
    );

    if (allFavourite) {
      
      fields.forEach(([fieldName]) => {
        removeFavouriteField(reportType, fieldName);
      });
    } else {
      
      addSectionFieldsToFavourites(
        reportType,
        reportName,
        fields,
        sectionTitle,
      );
    }
    setFavoritesUpdated((prev) => prev + 1);
  };

  const renderSectionHeader = (
    title: string,
    fields: Array<[string, string]>,
  ) => {
    
    const allFavourite = fields.every(([fieldName]) =>
      isFieldFavourite(reportType, fieldName),
    );

    return (
      <div className="flex items-center justify-between mb-3 pb-2 border-b">
        <h3 className="font-semibold text-lg text-blue-700">{title}</h3>
        <button
          onClick={() => handleSectionFavoriteToggle(fields, title)}
          className="flex items-center gap-2 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors"
          title={
            allFavourite
              ? "Remove all fields from favorites"
              : "Add all fields to favorites"
          }
        >
          <Heart
            className={`h-5 w-5 ${allFavourite ? "text-red-500 fill-red-500" : "text-gray-400 hover:text-red-500"}`}
          />
          <span className="text-sm text-gray-600">
            {allFavourite ? "Remove from Favorites" : "Add to Favorites"}
          </span>
        </button>
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
    
    
  }, [savedData]);

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
          {renderSectionHeader("All Fields", [
            ["xray", "X-Ray"],
            ["ctScan", "CT Scan"],
            ["mri", "MRI"],
            ["ultrasound", "Ultrasound"],
            ["petScan", "PET Scan"],
            ["mammography", "Mammography"],
            ["biopsy", "Biopsy"],
            ["histopathology", "Histopathology"],
            ["cytology", "Cytology"],
            ["immunohistochemistry", "Immunohistochemistry"],
            ["notes", "Notes"],
          ])}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>X-Ray</Label>
              <Input
                value={formData.xray}
                onChange={(e) =>
                  setFormData({ ...formData, xray: e.target.value })
                }
              />
            </div>
            <div>
              <Label>CT Scan</Label>
              <Input
                value={formData.ctScan}
                onChange={(e) =>
                  setFormData({ ...formData, ctScan: e.target.value })
                }
              />
            </div>
            <div>
              <Label>MRI</Label>
              <Input
                value={formData.mri}
                onChange={(e) =>
                  setFormData({ ...formData, mri: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Ultrasound</Label>
              <Input
                value={formData.ultrasound}
                onChange={(e) =>
                  setFormData({ ...formData, ultrasound: e.target.value })
                }
              />
            </div>
            <div>
              <Label>PET Scan</Label>
              <Input
                value={formData.petScan}
                onChange={(e) =>
                  setFormData({ ...formData, petScan: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Mammography</Label>
              <Input
                value={formData.mammography}
                onChange={(e) =>
                  setFormData({ ...formData, mammography: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Biopsy</Label>
              <Input
                value={formData.biopsy}
                onChange={(e) =>
                  setFormData({ ...formData, biopsy: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Histopathology</Label>
              <Input
                value={formData.histopathology}
                onChange={(e) =>
                  setFormData({ ...formData, histopathology: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Cytology</Label>
              <Input
                value={formData.cytology}
                onChange={(e) =>
                  setFormData({ ...formData, cytology: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Immunohistochemistry</Label>
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
            <Label>Notes</Label>
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
