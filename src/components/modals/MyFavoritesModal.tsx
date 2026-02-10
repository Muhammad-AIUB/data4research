"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Heart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getFavourites,
  removeFavouriteField,
  setFavouriteFieldValue,
  getFavouriteFieldValue,
  type FavouriteField,
} from "@/lib/favourites";

type PatientTest = {
  id: string;
  sampleDate: Date | string;
  autoimmunoProfile?: unknown;
  cardiology?: unknown;
  rft?: unknown;
  lft?: unknown;
  diseaseHistory?: unknown;
  imaging?: unknown;
  hematology?: unknown;
};

interface Props {
  onClose: () => void;
  savedData?: PatientTest[];
}

export default function MyFavoritesModal({ onClose }: Props) {
  const [favourites, setFavourites] = useState<FavouriteField[]>([]);
  const groupedFavourites = useMemo(() => {
    const grouped: Record<string, Record<string, FavouriteField[]>> = {};
    favourites.forEach((fav) => {
      if (!fav || !fav.reportType || !fav.fieldName) return; 

      if (!grouped[fav.reportType]) {
        grouped[fav.reportType] = {};
      }
      
      const sectionKey =
        fav.sectionTitle && fav.sectionTitle.trim() !== ""
          ? fav.sectionTitle
          : "Other";
      if (!grouped[fav.reportType][sectionKey]) {
        grouped[fav.reportType][sectionKey] = [];
      }
      if (Array.isArray(grouped[fav.reportType][sectionKey])) {
        grouped[fav.reportType][sectionKey].push(fav);
      }
    });
    return grouped;
  }, [favourites]);
  const initialFieldValues = useMemo(() => {
    const values: Record<string, string> = {};
    favourites.forEach((fav) => {
      const key = `${fav.reportType}:${fav.fieldName}`;
      values[key] = getFavouriteFieldValue(fav.reportType, fav.fieldName);
    });
    return values;
  }, [favourites]);
  const [fieldValues, setFieldValues] =
    useState<Record<string, string>>(initialFieldValues);

  
  const fieldColors = [
    "bg-blue-50 border-blue-200",
    "bg-green-50 border-green-200",
    "bg-purple-50 border-purple-200",
    "bg-yellow-50 border-yellow-200",
    "bg-pink-50 border-pink-200",
    "bg-indigo-50 border-indigo-200",
    "bg-orange-50 border-orange-200",
    "bg-cyan-50 border-cyan-200",
  ];

  const loadFavourites = () => {
    const favs = getFavourites();
    setFavourites(favs);
  };

  useEffect(() => {
    loadFavourites();
  }, []);

  useEffect(() => {
    setFieldValues(initialFieldValues);
  }, [initialFieldValues]);

  const handleValueChange = (
    reportType: string,
    fieldName: string,
    value: string,
  ) => {
    const key = `${reportType}:${fieldName}`;
    setFieldValues((prev) => ({ ...prev, [key]: value }));
    setFavouriteFieldValue(reportType, fieldName, value);
  };

  const handleRemoveSection = (
    reportType: string,
    sectionTitle: string,
    fields: FavouriteField[],
  ) => {
    
    fields.forEach((fav) => {
      removeFavouriteField(fav.reportType, fav.fieldName);
      const key = `${fav.reportType}:${fav.fieldName}`;
      setFieldValues((prev) => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });

      
      if (
        fav.reportType === "autoimmunoProfile" &&
        !fav.fieldName.endsWith("_notes")
      ) {
        const notesFieldName = `${fav.fieldName}_notes`;
        removeFavouriteField(fav.reportType, notesFieldName);
        const notesKey = `${fav.reportType}:${notesFieldName}`;
        setFieldValues((prev) => {
          const updated = { ...prev };
          delete updated[notesKey];
          return updated;
        });
      }

      
      if (
        (fav.reportType === "rft" || fav.reportType === "lft") &&
        fav.fieldName.endsWith("_value1")
      ) {
        const value2FieldName = fav.fieldName.replace("_value1", "_value2");
        removeFavouriteField(fav.reportType, value2FieldName);
        const value2Key = `${fav.reportType}:${value2FieldName}`;
        setFieldValues((prev) => {
          const updated = { ...prev };
          delete updated[value2Key];
          return updated;
        });
      }

      
      if (
        (fav.reportType === "rft" || fav.reportType === "lft") &&
        fav.fieldName.endsWith("_value2")
      ) {
        const value1FieldName = fav.fieldName.replace("_value2", "_value1");
        removeFavouriteField(fav.reportType, value1FieldName);
        const value1Key = `${fav.reportType}:${value1FieldName}`;
        setFieldValues((prev) => {
          const updated = { ...prev };
          delete updated[value1Key];
          return updated;
        });
      }
    });
    loadFavourites();
    
  };

  const reportTypeLabels: Record<string, string> = {
    autoimmunoProfile: "Autoimmuno Profile",
    cardiology: "Cardiology",
    rft: "RFT",
    lft: "LFT",
    diseaseHistory: "Disease History",
    imaging: "Imaging, Histopathology",
    hematology: "Hematology",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Heart className="h-6 w-6 text-red-500" fill="currentColor" />
            <h2 className="text-2xl font-bold text-gray-900">My Favorites</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {favourites.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No favorite fields yet</p>
              <p className="text-gray-400 text-sm mt-2">
                Click the heart icon on any field in the test modals to add it
                to favorites
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedFavourites).map(
                ([reportType, sections]) => {
                  
                  if (
                    !sections ||
                    typeof sections !== "object" ||
                    Array.isArray(sections)
                  ) {
                    return null;
                  }

                  return (
                    <div
                      key={reportType}
                      className="bg-gray-50 rounded-lg p-4 border"
                    >
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        {reportTypeLabels[reportType] || reportType}
                      </h3>
                      <div className="space-y-6">
                        {Object.entries(sections).map(
                          ([sectionTitle, fields], sectionIndex) => {
                            
                            if (!Array.isArray(fields)) {
                              return null;
                            }

                            return (
                              <div
                                key={`${reportType}-${sectionTitle}`}
                                className="space-y-3"
                              >
                                {/* Always show section header with delete button */}
                                <div className="flex items-center justify-between mb-3 border-b pb-2">
                                  <h4 className="font-semibold text-base text-blue-700">
                                    {sectionTitle === "Other"
                                      ? "Other Fields"
                                      : sectionTitle}
                                  </h4>
                                  <button
                                    onClick={() =>
                                      handleRemoveSection(
                                        reportType,
                                        sectionTitle,
                                        fields,
                                      )
                                    }
                                    className="p-2 hover:bg-red-50 rounded-full transition-colors text-red-500 hover:text-red-600 shrink-0"
                                    title={`Remove all fields from ${sectionTitle === "Other" ? "Other Fields" : sectionTitle}`}
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </button>
                                </div>
                                <div className="space-y-2">
                                  {fields.map((fav, fieldIndex) => {
                                    const key = `${fav.reportType}:${fav.fieldName}`;
                                    const savedValue = fieldValues[key] || "";
                                    const colorIndex =
                                      (sectionIndex * fields.length +
                                        fieldIndex) %
                                      fieldColors.length;
                                    const colorClass = fieldColors[colorIndex];

                                    
                                    const isNotesField =
                                      fav.fieldName.endsWith("_notes");
                                    const isValue2Field =
                                      fav.fieldName.endsWith("_value2");
                                    const isValue1Field =
                                      fav.fieldName.endsWith("_value1");

                                    
                                    if (isValue2Field) {
                                      const mainFieldName =
                                        fav.fieldName.replace("_value2", "");
                                      const value1FieldExists = fields.find(
                                        (f) =>
                                          f.fieldName ===
                                          `${mainFieldName}_value1`,
                                      );
                                      if (value1FieldExists) {
                                        return null; 
                                      }
                                    }

                                    const mainFieldName = isNotesField
                                      ? fav.fieldName.replace("_notes", "")
                                      : isValue1Field
                                        ? fav.fieldName.replace("_value1", "")
                                        : isValue2Field
                                          ? fav.fieldName.replace("_value2", "")
                                          : fav.fieldName;

                                    const notesKey = isNotesField
                                      ? key
                                      : `${fav.reportType}:${mainFieldName}_notes`;
                                    const savedNotes =
                                      fieldValues[notesKey] || "";

                                    
                                    const value2Key = isValue1Field
                                      ? `${fav.reportType}:${mainFieldName}_value2`
                                      : null;
                                    const savedValue2 = value2Key
                                      ? fieldValues[value2Key] || ""
                                      : "";

                                    
                                    const getUnitFromLabel = (
                                      label: string,
                                    ) => {
                                      const match = label.match(/\(([^)]+)\)/);
                                      return match ? match[1] : "";
                                    };

                                    
                                    
                                    if (
                                      fav.reportType === "autoimmunoProfile" &&
                                      isNotesField
                                    ) {
                                      
                                      const mainFieldExists = fields.find(
                                        (f) => f.fieldName === mainFieldName,
                                      );
                                      if (mainFieldExists) {
                                        return null; 
                                      }
                                    }

                                    return (
                                      <div
                                        key={`${fav.reportType}-${fav.fieldName}`}
                                        className={`rounded p-3 border ${colorClass} transition-colors`}
                                      >
                                        <div className="flex items-start gap-4">
                                          <div className="flex-1 min-w-0 space-y-3">
                                            <div>
                                              <p className="font-medium text-gray-900 text-sm">
                                                {(() => {
                                                  if (isNotesField) {
                                                    return fav.fieldLabel.replace(
                                                      " - Notes",
                                                      "",
                                                    );
                                                  } else if (
                                                    isValue1Field ||
                                                    isValue2Field
                                                  ) {
                                                    
                                                    return fav.fieldLabel.split(
                                                      " - ",
                                                    )[0];
                                                  }
                                                  return fav.fieldLabel;
                                                })()}
                                              </p>
                                              <p className="text-xs text-gray-500 mt-1">
                                                {fav.fieldName}
                                              </p>
                                            </div>

                                            {/* For AutoimmunoProfile, show both Value (Select) and Notes */}
                                            {fav.reportType ===
                                              "autoimmunoProfile" &&
                                            !isNotesField &&
                                            !isValue1Field &&
                                            !isValue2Field ? (
                                              <div className="space-y-3">
                                                {/* Value field (Select) */}
                                                <div className="space-y-2">
                                                  <Label
                                                    htmlFor={`value-${key}`}
                                                    className="text-xs font-medium text-gray-700"
                                                  >
                                                    Value (Select)
                                                  </Label>
                                                  <Input
                                                    id={`value-${key}`}
                                                    type="text"
                                                    value={savedValue}
                                                    onChange={(e) =>
                                                      handleValueChange(
                                                        fav.reportType,
                                                        fav.fieldName,
                                                        e.target.value,
                                                      )
                                                    }
                                                    placeholder="Positive / Negative..."
                                                    className="bg-white text-sm"
                                                  />
                                                </div>
                                                {/* Notes field */}
                                                <div className="space-y-2">
                                                  <Label
                                                    htmlFor={`notes-${notesKey}`}
                                                    className="text-xs font-medium text-gray-700"
                                                  >
                                                    Notes
                                                  </Label>
                                                  <Input
                                                    id={`notes-${notesKey}`}
                                                    type="text"
                                                    value={savedNotes}
                                                    onChange={(e) =>
                                                      handleValueChange(
                                                        fav.reportType,
                                                        `${mainFieldName}_notes`,
                                                        e.target.value,
                                                      )
                                                    }
                                                    placeholder="Enter notes..."
                                                    className="bg-white text-sm"
                                                  />
                                                </div>
                                              </div>
                                            ) : isValue1Field &&
                                              savedValue2 !== undefined ? (
                                              /* For dual value fields (RFT, LFT, etc.), show both value1 and value2 */
                                              <div className="space-y-3">
                                                <div className="grid grid-cols-2 gap-3">
                                                  {/* Value 1 */}
                                                  <div className="space-y-2">
                                                    <Label
                                                      htmlFor={`value1-${key}`}
                                                      className="text-xs font-medium text-gray-700"
                                                    >
                                                      {getUnitFromLabel(
                                                        fav.fieldLabel,
                                                      ) || "Value (Unit 1)"}
                                                    </Label>
                                                    <Input
                                                      id={`value1-${key}`}
                                                      type="text"
                                                      value={savedValue}
                                                      onChange={(e) =>
                                                        handleValueChange(
                                                          fav.reportType,
                                                          fav.fieldName,
                                                          e.target.value,
                                                        )
                                                      }
                                                      placeholder="Enter value..."
                                                      className="bg-white text-sm"
                                                    />
                                                  </div>
                                                  {/* Value 2 */}
                                                  <div className="space-y-2">
                                                    <Label
                                                      htmlFor={`value2-${value2Key}`}
                                                      className="text-xs font-medium text-gray-700"
                                                    >
                                                      {(() => {
                                                        const value2Field =
                                                          fields.find(
                                                            (f) =>
                                                              f.fieldName ===
                                                              `${mainFieldName}_value2`,
                                                          );
                                                        return value2Field
                                                          ? getUnitFromLabel(
                                                              value2Field.fieldLabel,
                                                            ) ||
                                                              "Value (Unit 2)"
                                                          : "Value (Unit 2)";
                                                      })()}
                                                    </Label>
                                                    <Input
                                                      id={`value2-${value2Key}`}
                                                      type="text"
                                                      value={savedValue2}
                                                      onChange={(e) =>
                                                        handleValueChange(
                                                          fav.reportType,
                                                          `${mainFieldName}_value2`,
                                                          e.target.value,
                                                        )
                                                      }
                                                      placeholder="Enter value..."
                                                      className="bg-white text-sm"
                                                    />
                                                  </div>
                                                </div>
                                              </div>
                                            ) : (
                                              /* For single value fields or notes */
                                              <div className="space-y-2">
                                                <Label
                                                  htmlFor={`value-${key}`}
                                                  className="text-xs font-medium text-gray-700"
                                                >
                                                  {isNotesField
                                                    ? "Notes"
                                                    : "Value"}
                                                </Label>
                                                <Input
                                                  id={`value-${key}`}
                                                  type="text"
                                                  value={savedValue}
                                                  onChange={(e) =>
                                                    handleValueChange(
                                                      fav.reportType,
                                                      fav.fieldName,
                                                      e.target.value,
                                                    )
                                                  }
                                                  placeholder={
                                                    isNotesField
                                                      ? "Enter notes..."
                                                      : "Enter value..."
                                                  }
                                                  className="bg-white text-sm"
                                                />
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
