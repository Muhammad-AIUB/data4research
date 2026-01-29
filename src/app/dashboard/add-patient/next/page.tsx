"use client";

import { useState, useEffect, Suspense, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import CalendarWithNavigation from "@/components/CalendarWithNavigation";
import ExpandableSection from "@/components/ExpandableSection";
import AutoimmunoProfileModal from "@/components/modals/AutoimmunoProfileModal";
import CardiologyModal from "@/components/modals/CardiologyModal";
import RFTModal from "@/components/modals/RFTModal";
import LFTModal from "@/components/modals/LFTModal";
import DiseaseHistoryModal, {
  type DiseaseHistoryData,
} from "@/components/modals/DiseaseHistoryModal";
import ImagingHistopathologyModal from "@/components/modals/ImagingHistopathologyModal";
import HematologyModal from "@/components/modals/HematologyModal";
import MyFavoritesModal from "@/components/modals/MyFavoritesModal";
import BASDAIModal from "@/components/modals/BASDAIModal";
import { Button } from "@/components/ui/button";
import { formatTestData } from "@/lib/formatTestData";
import searchIndex from "@/lib/searchIndex";

// Type definitions for test data
type TestDataSection = Record<string, unknown> | null;
type TestData = {
  patientId: string;
  sampleDate: string;
  autoimmunoProfile: TestDataSection;
  cardiology: TestDataSection;
  rft: TestDataSection;
  lft: TestDataSection;
  diseaseHistory: TestDataSection;
  imaging: TestDataSection;
  hematology: TestDataSection;
  basdai: TestDataSection;
};

type PatientTest = {
  id: string;
  sampleDate: Date | string;
  autoimmunoProfile?: TestDataSection;
  cardiology?: TestDataSection;
  rft?: TestDataSection;
  lft?: TestDataSection;
  diseaseHistory?: TestDataSection;
  imaging?: TestDataSection;
  hematology?: TestDataSection;
  basdai?: TestDataSection;
};

// Separate component for saved reports to avoid conditional hook
function SavedReportsDisplay({
  savedTestData,
}: {
  savedTestData: PatientTest[];
}) {
  const groupedAndSorted = useMemo(() => {
    // First, sort all tests by createdAt (latest first) to maintain serial order
    const sortedByCreatedAt = [...savedTestData].sort(
      (
        a: PatientTest & { createdAt?: Date | string },
        b: PatientTest & { createdAt?: Date | string },
      ) => {
        const timeA = a.createdAt
          ? new Date(a.createdAt).getTime()
          : a.id
            ? 0
            : -1;
        const timeB = b.createdAt
          ? new Date(b.createdAt).getTime()
          : b.id
            ? 0
            : -1;
        return timeB - timeA; // Latest first
      },
    );

    // Then group by date while maintaining the order
    const grouped = sortedByCreatedAt.reduce(
      (acc: Record<string, PatientTest[]>, test: PatientTest) => {
        // Fix timezone issue - use local date components
        const sampleDate =
          test.sampleDate instanceof Date
            ? test.sampleDate
            : new Date(test.sampleDate);

        // Get local date components to avoid timezone conversion issues
        const year = sampleDate.getFullYear();
        const month = String(sampleDate.getMonth() + 1).padStart(2, "0");
        const day = String(sampleDate.getDate()).padStart(2, "0");
        const date = `${day}/${month}/${year}`;

        if (!acc[date]) acc[date] = [];
        acc[date].push(test); // Maintain order - latest saves will be first in each group
        return acc;
      },
      {} as Record<string, PatientTest[]>,
    );

    // Sort date groups by latest createdAt in each group (not by date itself)
    // This ensures latest saves appear first regardless of date
    return Object.entries(grouped).sort(([, testsA], [, testsB]) => {
      // Get the latest createdAt from each group
      const getLatestTime = (tests: PatientTest[]) => {
        return Math.max(
          ...tests.map((t: PatientTest & { createdAt?: Date | string }) =>
            t.createdAt ? new Date(t.createdAt).getTime() : 0,
          ),
        );
      };
      const timeA = getLatestTime(testsA);
      const timeB = getLatestTime(testsB);
      return timeB - timeA; // Latest first
    }) as [string, PatientTest[]][];
  }, [savedTestData]);

  return (
    <div className="space-y-6">
      {groupedAndSorted.map(([date, tests]) => {
        // Tests are already sorted by createdAt (latest first) from the grouping step
        // No need to sort again - maintain the order
        const sortedTests = tests;

        return (
          <div key={date} className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-xl font-semibold text-blue-600">
                Test Reports
              </h3>
              <span className="text-sm font-medium text-gray-600">{date}</span>
            </div>
            <div className="space-y-4">
              {sortedTests.map((test, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded p-4 border-l-4 border-blue-500"
                >
                  {test.autoimmunoProfile && (
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-blue-700">
                          Autoimmuno Profile
                        </h4>
                        <span className="text-xs text-gray-500">
                          {(() => {
                            const d =
                              test.sampleDate instanceof Date
                                ? test.sampleDate
                                : new Date(test.sampleDate);
                            const year = d.getFullYear();
                            const month = String(d.getMonth() + 1).padStart(
                              2,
                              "0",
                            );
                            const day = String(d.getDate()).padStart(2, "0");
                            return `${day}/${month}/${year}`;
                          })()}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded space-y-1">
                        {formatTestData(
                          test.autoimmunoProfile,
                          "autoimmunoProfile",
                        ).map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between text-sm"
                          >
                            <span className="font-medium text-gray-700">
                              {item.label}:
                            </span>
                            <span className="text-gray-900">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {test.cardiology && (
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-green-700">
                          Cardiology
                        </h4>
                        <span className="text-xs text-gray-500">
                          {(() => {
                            const d =
                              test.sampleDate instanceof Date
                                ? test.sampleDate
                                : new Date(test.sampleDate);
                            const year = d.getFullYear();
                            const month = String(d.getMonth() + 1).padStart(
                              2,
                              "0",
                            );
                            const day = String(d.getDate()).padStart(2, "0");
                            return `${day}/${month}/${year}`;
                          })()}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded space-y-1">
                        {formatTestData(test.cardiology, "cardiology").map(
                          (item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between text-sm"
                            >
                              <span className="font-medium text-gray-700">
                                {item.label}:
                              </span>
                              <span className="text-gray-900">
                                {item.value}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                  {test.rft && (
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-purple-700">RFT</h4>
                        <span className="text-xs text-gray-500">
                          {(() => {
                            const d =
                              test.sampleDate instanceof Date
                                ? test.sampleDate
                                : new Date(test.sampleDate);
                            const year = d.getFullYear();
                            const month = String(d.getMonth() + 1).padStart(
                              2,
                              "0",
                            );
                            const day = String(d.getDate()).padStart(2, "0");
                            return `${day}/${month}/${year}`;
                          })()}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded space-y-1">
                        {formatTestData(test.rft, "rft").map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between text-sm"
                          >
                            <span className="font-medium text-gray-700">
                              {item.label}:
                            </span>
                            <span className="text-gray-900">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {test.lft && (
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-yellow-700">LFT</h4>
                        <span className="text-xs text-gray-500">
                          {(() => {
                            const d =
                              test.sampleDate instanceof Date
                                ? test.sampleDate
                                : new Date(test.sampleDate);
                            const year = d.getFullYear();
                            const month = String(d.getMonth() + 1).padStart(
                              2,
                              "0",
                            );
                            const day = String(d.getDate()).padStart(2, "0");
                            return `${day}/${month}/${year}`;
                          })()}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded space-y-1">
                        {formatTestData(test.lft, "lft").map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between text-sm"
                          >
                            <span className="font-medium text-gray-700">
                              {item.label}:
                            </span>
                            <span className="text-gray-900">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {test.diseaseHistory && (
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-pink-700">
                          Disease History
                        </h4>
                        <span className="text-xs text-gray-500">
                          {(() => {
                            const d =
                              test.sampleDate instanceof Date
                                ? test.sampleDate
                                : new Date(test.sampleDate);
                            const year = d.getFullYear();
                            const month = String(d.getMonth() + 1).padStart(
                              2,
                              "0",
                            );
                            const day = String(d.getDate()).padStart(2, "0");
                            return `${day}/${month}/${year}`;
                          })()}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded space-y-1">
                        {formatTestData(
                          test.diseaseHistory,
                          "diseaseHistory",
                        ).map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between text-sm"
                          >
                            <span className="font-medium text-gray-700">
                              {item.label}:
                            </span>
                            <span className="text-gray-900">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {test.imaging && (
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-indigo-700">
                          Imaging, Histopathology
                        </h4>
                        <span className="text-xs text-gray-500">
                          {(() => {
                            const d =
                              test.sampleDate instanceof Date
                                ? test.sampleDate
                                : new Date(test.sampleDate);
                            const year = d.getFullYear();
                            const month = String(d.getMonth() + 1).padStart(
                              2,
                              "0",
                            );
                            const day = String(d.getDate()).padStart(2, "0");
                            return `${day}/${month}/${year}`;
                          })()}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded space-y-1">
                        {formatTestData(test.imaging, "imaging").map(
                          (item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between text-sm"
                            >
                              <span className="font-medium text-gray-700">
                                {item.label}:
                              </span>
                              <span className="text-gray-900">
                                {item.value}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                  {test.hematology && (
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-orange-700">
                          Hematology
                        </h4>
                        <span className="text-xs text-gray-500">
                          {(() => {
                            const d =
                              test.sampleDate instanceof Date
                                ? test.sampleDate
                                : new Date(test.sampleDate);
                            const year = d.getFullYear();
                            const month = String(d.getMonth() + 1).padStart(
                              2,
                              "0",
                            );
                            const day = String(d.getDate()).padStart(2, "0");
                            return `${day}/${month}/${year}`;
                          })()}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded space-y-1">
                        {formatTestData(test.hematology, "hematology").map(
                          (item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between text-sm"
                            >
                              <span className="font-medium text-gray-700">
                                {item.label}:
                              </span>
                              <span className="text-gray-900">
                                {item.value}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                  {test.basdai && (
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-pink-700">
                          BASDAI Score
                        </h4>
                        <span className="text-xs text-gray-500">
                          {(() => {
                            const d =
                              test.sampleDate instanceof Date
                                ? test.sampleDate
                                : new Date(test.sampleDate);
                            const year = d.getFullYear();
                            const month = String(d.getMonth() + 1).padStart(
                              2,
                              "0",
                            );
                            const day = String(d.getDate()).padStart(2, "0");
                            return `${day}/${month}/${year}`;
                          })()}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded space-y-1">
                        {formatTestData(test.basdai, "basdai").map(
                          (item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between text-sm"
                            >
                              <span className="font-medium text-gray-700">
                                {item.label}:
                              </span>
                              <span className="text-gray-900">
                                {item.value}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NextPageContent() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId");

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [openModal, setOpenModal] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedTestData, setSavedTestData] = useState<PatientTest[]>([]);
  const [loadingSavedData, setLoadingSavedData] = useState(false);

  // Store all test data from modals
  const [testData, setTestData] = useState<TestData>({
    patientId: patientId || "",
    sampleDate: new Date().toISOString(),
    autoimmunoProfile: null,
    cardiology: null,
    rft: null,
    lft: null,
    diseaseHistory: null,
    imaging: null,
    hematology: null,
    basdai: null,
  });

  useEffect(() => {
    if (patientId) {
      setTestData((prev) => ({ ...prev, patientId }));
    }
    // Always fetch saved data on mount and when patientId changes
    fetchSavedTestData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const fetchSavedTestData = useCallback(async () => {
    setLoadingSavedData(true);
    try {
      const currentPatientId = patientId || testData.patientId;
      // Fetch all tests if no patientId, or filter by patientId if provided
      const url = currentPatientId
        ? `/api/patient-tests?patientId=${currentPatientId}`
        : `/api/patient-tests`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setSavedTestData(data.tests || []);
      } else {
        console.error("Failed to fetch saved test data:", response.status);
      }
    } catch (error) {
      console.error("Error fetching saved test data:", error);
    } finally {
      setLoadingSavedData(false);
    }
  }, [patientId, testData.patientId]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setTestData((prev) => ({ ...prev, sampleDate: date.toISOString() }));
  };

  const updateTestData = (
    section: keyof TestData,
    data: TestDataSection,
    date?: Date,
  ) => {
    setTestData((prev) => ({
      ...prev,
      [section]: {
        data,
        date: date ? date.toISOString() : selectedDate.toISOString(),
      },
    }));
  };

  const handleSubmit = async () => {
    // Validate patientId exists before submitting
    if (!patientId || patientId.trim() === "") {
      alert(
        "Patient ID is missing. Please go back and create the patient first.",
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/patient-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...testData,
          patientId,
        }),
      });

      if (response.ok) {
        alert("Patient test data submitted successfully!");
        // Refresh saved test data in background (don't wait)
        fetchSavedTestData().catch(console.error);
        setLoading(false);
        // Don't redirect, stay on page to see the saved data
      } else {
        const error = await response.json();
        alert(
          error.message ||
            "Failed to submit patient test data. Please try again.",
        );
        setLoading(false);
      }
    } catch (error) {
      console.error("Error submitting patient test data:", error);
      alert("Failed to submit patient test data. Please try again.");
      setLoading(false);
    }
  };

  // Transform savedTestData for DiseaseHistoryModal (convert null to undefined)
  const transformedSavedDataForDiseaseHistory = useMemo(() => {
    return savedTestData.map((test) => ({
      sampleDate: test.sampleDate,
      diseaseHistory:
        test.diseaseHistory === null
          ? undefined
          : (test.diseaseHistory as DiseaseHistoryData),
    }));
  }, [savedTestData]);

  // use centralized search index (includes fields from all modals)

  const suggestions = useMemo(() => {
    if (!searchTerm) return [];
    const q = searchTerm.trim().toLowerCase();
    return searchIndex
      .filter(
        (item) =>
          item.key.toLowerCase().includes(q) ||
          item.label.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [searchTerm, searchIndex]);

  const openModalForSuggestion = (modalId: string) => {
    setOpenModal(modalId);
    setShowSuggestions(false);
    setSearchTerm("");
  };

  const sectionColors = [
    "bg-red-50 border-red-200",
    "bg-blue-50 border-blue-200",
    "bg-green-50 border-green-200",
    "bg-purple-50 border-purple-200",
    "bg-yellow-50 border-yellow-200",
    "bg-pink-50 border-pink-200",
    "bg-indigo-50 border-indigo-200",
    "bg-orange-50 border-orange-200",
  ];

  return (
    <div className="min-h-screen text-slate-800">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800">
            Patient Test Information
          </h1>
        </div>

        {/* Calendar Section */}
        <div className="mb-8">
          <CalendarWithNavigation
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
          />
          <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="text-sm text-blue-800 font-medium">
              <strong>Note:</strong> Please check for sample received date or
              given date, not report delivery date.
            </p>
          </div>
          {/* Search box placed under the Note as requested */}
          <div className="mt-4">
            <div className="relative w-full md:w-1/3 mx-auto">
              <input
                aria-label="Search tests"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (suggestions.length > 0)
                      openModalForSuggestion(suggestions[0].modal);
                  } else if (e.key === "Escape") {
                    setShowSuggestions(false);
                  }
                }}
                placeholder="Search (e.g. RBC, creatinine, ANA)"
                className="w-full px-3 py-2 border rounded-md shadow-sm"
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-40 left-0 right-0 bg-white border rounded-md mt-1 max-h-48 overflow-auto shadow">
                  {suggestions.map((s) => (
                    <li
                      key={s.key}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      onMouseDown={() => openModalForSuggestion(s.modal)}
                    >
                      {s.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Expandable Sections */}
        <div className="space-y-4">
          <ExpandableSection
            title="My Favorites"
            isOpen={openModal === "my-favorites"}
            onToggle={() =>
              setOpenModal(openModal === "my-favorites" ? null : "my-favorites")
            }
            colorClass={sectionColors[0]}
          >
            <MyFavoritesModal
              onClose={() => setOpenModal(null)}
              savedData={savedTestData}
            />
          </ExpandableSection>

          <ExpandableSection
            title="BASDAI Score"
            isOpen={openModal === "basdai"}
            onToggle={() =>
              setOpenModal(openModal === "basdai" ? null : "basdai")
            }
            colorClass={sectionColors[0]}
          >
            <BASDAIModal
              onClose={() => setOpenModal(null)}
              defaultDate={selectedDate}
              patientId={patientId}
              savedData={savedTestData}
              onDataChange={(data, date) =>
                updateTestData("basdai", data as TestDataSection, date)
              }
              onSaveSuccess={fetchSavedTestData}
            />
          </ExpandableSection>

          <ExpandableSection
            title="Autoimmuno profile"
            isOpen={openModal === "autoimmuno"}
            onToggle={() =>
              setOpenModal(openModal === "autoimmuno" ? null : "autoimmuno")
            }
            colorClass={sectionColors[1]}
          >
            <AutoimmunoProfileModal
              onClose={() => setOpenModal(null)}
              defaultDate={selectedDate}
              patientId={patientId}
              savedData={savedTestData}
              onDataChange={(data: unknown, date) =>
                updateTestData(
                  "autoimmunoProfile",
                  data as TestDataSection,
                  date,
                )
              }
              onSaveSuccess={fetchSavedTestData}
            />
          </ExpandableSection>

          <ExpandableSection
            title="Cardiology"
            isOpen={openModal === "cardiology"}
            onToggle={() =>
              setOpenModal(openModal === "cardiology" ? null : "cardiology")
            }
            colorClass={sectionColors[2]}
          >
            <CardiologyModal
              onClose={() => setOpenModal(null)}
              defaultDate={selectedDate}
              patientId={patientId}
              savedData={savedTestData}
              onDataChange={(data, date) =>
                updateTestData("cardiology", data as TestDataSection, date)
              }
              onSaveSuccess={fetchSavedTestData}
            />
          </ExpandableSection>

          <ExpandableSection
            title="RFT"
            isOpen={openModal === "rft"}
            onToggle={() => setOpenModal(openModal === "rft" ? null : "rft")}
            colorClass={sectionColors[3]}
          >
            <RFTModal
              onClose={() => setOpenModal(null)}
              defaultDate={selectedDate}
              patientId={patientId}
              savedData={savedTestData}
              onDataChange={(data, date) =>
                updateTestData("rft", data as TestDataSection, date)
              }
              onSaveSuccess={fetchSavedTestData}
            />
          </ExpandableSection>

          <ExpandableSection
            title="LFT"
            isOpen={openModal === "lft"}
            onToggle={() => setOpenModal(openModal === "lft" ? null : "lft")}
            colorClass={sectionColors[4]}
          >
            <LFTModal
              onClose={() => setOpenModal(null)}
              defaultDate={selectedDate}
              patientId={patientId}
              savedData={savedTestData}
              onDataChange={(data, date) =>
                updateTestData("lft", data as TestDataSection, date)
              }
              onSaveSuccess={fetchSavedTestData}
            />
          </ExpandableSection>

          <ExpandableSection
            title="on examination Disease history"
            isOpen={openModal === "disease-history"}
            onToggle={() =>
              setOpenModal(
                openModal === "disease-history" ? null : "disease-history",
              )
            }
            colorClass={sectionColors[5]}
          >
            <DiseaseHistoryModal
              onClose={() => setOpenModal(null)}
              defaultDate={selectedDate}
              patientId={patientId}
              savedData={transformedSavedDataForDiseaseHistory}
              onDataChange={(data, date) =>
                updateTestData("diseaseHistory", data as TestDataSection, date)
              }
              onSaveSuccess={fetchSavedTestData}
            />
          </ExpandableSection>

          <ExpandableSection
            title="Imaging, Histopathology"
            isOpen={openModal === "imaging"}
            onToggle={() =>
              setOpenModal(openModal === "imaging" ? null : "imaging")
            }
            colorClass={sectionColors[6]}
          >
            <ImagingHistopathologyModal
              onClose={() => setOpenModal(null)}
              defaultDate={selectedDate}
              patientId={patientId}
              savedData={savedTestData}
              onDataChange={(data, date) =>
                updateTestData("imaging", data as TestDataSection, date)
              }
              onSaveSuccess={fetchSavedTestData}
            />
          </ExpandableSection>

          <ExpandableSection
            title="Hematology"
            isOpen={openModal === "hematology"}
            onToggle={() =>
              setOpenModal(openModal === "hematology" ? null : "hematology")
            }
            colorClass={sectionColors[7]}
          >
            <HematologyModal
              onClose={() => setOpenModal(null)}
              defaultDate={selectedDate}
              patientId={patientId}
              savedData={savedTestData}
              onDataChange={(data, date) =>
                updateTestData("hematology", data as TestDataSection, date)
              }
              onSaveSuccess={fetchSavedTestData}
            />
          </ExpandableSection>
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex justify-center">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 py-3 text-lg font-semibold"
            size="lg"
          >
            {loading ? "Submitting..." : "Submit Patient Data"}
          </Button>
        </div>

        {/* Border Divider */}
        <div className="mt-8 mb-6 border-t-2 border-gray-300"></div>

        {/* Saved Test Data Section */}
        <div className="mt-6">
          <h2 className="text-2xl font-bold mb-4">Saved Test Reports</h2>

          {loadingSavedData ? (
            <div className="text-center py-8 text-gray-500">
              Loading saved data...
            </div>
          ) : savedTestData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No saved test data found. Submit test data to see it here.
            </div>
          ) : (
            <SavedReportsDisplay savedTestData={savedTestData} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function NextPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-600">Loading...</p>
          </div>
        </div>
      }
    >
      <NextPageContent />
    </Suspense>
  );
}
