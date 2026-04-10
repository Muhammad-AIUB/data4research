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
import {
  FAVOURITES_CHANGED_EVENT,
  getFavouriteFieldValues,
  getFavourites,
  hydrateFavouritesFromApi,
  isFavouritesCacheReady,
  type FavouriteField,
} from "@/lib/favourites";
import searchIndex from "@/lib/searchIndex";
import { Stethoscope } from "lucide-react";

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
  createdAt?: Date | string;
  autoimmunoProfile?: TestDataSection;
  cardiology?: TestDataSection;
  rft?: TestDataSection;
  lft?: TestDataSection;
  diseaseHistory?: TestDataSection;
  imaging?: TestDataSection;
  hematology?: TestDataSection;
  basdai?: TestDataSection;
};

const MAIN_CATEGORY_MODAL_IDS = new Set<string>([
  "my-favorites",
  "basdai",
  "autoimmuno",
  "cardiology",
  "rft",
  "lft",
  "disease-history",
  "imaging",
  "hematology",
]);

/** Sub-category / section-only search rows may use a section slug in `modal` instead of the parent accordion id. */
const SECTION_KEY_TO_PARENT_MODAL: Record<string, string> = {
  cbc: "hematology",
  coagulation: "hematology",
  coag: "hematology",
  chemistry: "hematology",
};

function resolveMainCategoryModal(item: {
  key: string;
  label: string;
  modal: string;
}): string {
  const { modal, key, label } = item;
  if (MAIN_CATEGORY_MODAL_IDS.has(modal)) return modal;

  const fromModal = SECTION_KEY_TO_PARENT_MODAL[modal.toLowerCase()];
  if (fromModal) return fromModal;

  const fromKey = SECTION_KEY_TO_PARENT_MODAL[key.toLowerCase()];
  if (fromKey) return fromKey;

  const normLabel = label.trim().toLowerCase();
  if (SECTION_KEY_TO_PARENT_MODAL[normLabel]) {
    return SECTION_KEY_TO_PARENT_MODAL[normLabel];
  }

  const firstWord = normLabel.split(/[\s(/]/)[0] ?? "";
  if (firstWord && SECTION_KEY_TO_PARENT_MODAL[firstWord]) {
    return SECTION_KEY_TO_PARENT_MODAL[firstWord];
  }

  return modal;
}

function buildDefaultsFromFavourites(
  favourites: FavouriteField[],
  values: Record<string, string>,
): Record<string, Record<string, unknown>> {
  const result: Record<string, Record<string, unknown>> = {};

  for (const fav of favourites) {
    const { reportType, fieldName } = fav;
    const raw = values[`${reportType}:${fieldName}`] ?? "";
    if (!raw.trim()) continue;
    if (!result[reportType]) result[reportType] = {};

    if (fieldName.endsWith("_value1") || fieldName.endsWith("_value2")) {
      const base = fieldName.replace(/_value[12]$/, "");
      const key = fieldName.endsWith("_value1") ? "value1" : "value2";
      const existing = result[reportType][base];
      const obj =
        existing && typeof existing === "object" && !Array.isArray(existing)
          ? (existing as Record<string, unknown>)
          : {};
      obj[key] = raw;
      result[reportType][base] = obj;
      continue;
    }

    if (fieldName.endsWith("_notes")) {
      const base = fieldName.replace(/_notes$/, "");
      const existing = result[reportType][base];
      const obj =
        existing && typeof existing === "object" && !Array.isArray(existing)
          ? (existing as Record<string, unknown>)
          : {};
      obj.notes = raw;
      result[reportType][base] = obj;
      continue;
    }

    const existing = result[reportType][fieldName];
    if (existing && typeof existing === "object" && !Array.isArray(existing)) {
      (existing as Record<string, unknown>).value = raw;
    } else {
      result[reportType][fieldName] = raw;
    }
  }

  return result;
}

const DEFAULTS_REPORT_BLOCKS: Array<{
  key: string;
  label: string;
  color: string;
}> = [
  { key: "autoimmunoProfile", label: "Autoimmuno Profile", color: "text-blue-700" },
  { key: "cardiology", label: "Cardiology", color: "text-green-700" },
  { key: "rft", label: "RFT", color: "text-purple-700" },
  { key: "lft", label: "LFT", color: "text-yellow-700" },
  { key: "diseaseHistory", label: "On Examination & Disease History", color: "text-rose-700" },
  { key: "imaging", label: "Imaging, Histopathology", color: "text-indigo-700" },
  { key: "hematology", label: "Hematology", color: "text-orange-700" },
  { key: "basdai", label: "BASDAI", color: "text-cyan-700" },
];

function DefaultsReportBlock({
  savedTestData,
}: {
  savedTestData: PatientTest[];
}) {
  const [loading, setLoading] = useState(() => !isFavouritesCacheReady());
  const [data, setData] = useState<Record<string, Record<string, unknown>>>({});

  useEffect(() => {
    const sync = () => {
      setData(buildDefaultsFromFavourites(getFavourites(), getFavouriteFieldValues()));
      setLoading(false);
    };

    const bootstrap = async () => {
      if (!isFavouritesCacheReady()) await hydrateFavouritesFromApi();
      sync();
    };

    void bootstrap();
    window.addEventListener(FAVOURITES_CHANGED_EVENT, sync);
    return () => window.removeEventListener(FAVOURITES_CHANGED_EVENT, sync);
  }, []);

  const sectionsAlreadySaved = useMemo(() => {
    const set = new Set<string>();
    for (const test of savedTestData) {
      for (const b of DEFAULTS_REPORT_BLOCKS) {
        const section = test[b.key as keyof PatientTest];
        if (section && typeof section === "object") set.add(b.key);
      }
    }
    return set;
  }, [savedTestData]);

  const visibleBlocks = DEFAULTS_REPORT_BLOCKS.filter(
    (b) =>
      data[b.key] &&
      formatTestData(data[b.key], b.key).length > 0 &&
      !sectionsAlreadySaved.has(b.key),
  );

  if (loading || visibleBlocks.length === 0) return null;

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm border-l-4 border-sky-400">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h3 className="text-xl font-semibold text-sky-600">
          Saved Default Values
        </h3>
        <span className="text-xs text-gray-500">From My Favorites / Settings</span>
      </div>
      <div className="space-y-3">
        {visibleBlocks.map((b) => {
          const formatted = formatTestData(data[b.key], b.key);
          return (
            <div key={b.key} className="mb-3">
              <h4 className={`font-semibold mb-2 ${b.color}`}>{b.label}</h4>
              <div className="bg-gray-50 p-3 rounded space-y-1">
                {formatted.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{item.label}:</span>
                    <span className="text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SavedReportsDisplay({
  savedTestData,
}: {
  savedTestData: PatientTest[];
}) {
  const groupedAndSorted = useMemo(() => {
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
        return timeB - timeA; 
      },
    );

    const grouped = sortedByCreatedAt.reduce(
      (acc: Record<string, PatientTest[]>, test: PatientTest) => {
        const sampleDate =
          test.sampleDate instanceof Date
            ? test.sampleDate
            : new Date(test.sampleDate);
        const year = sampleDate.getFullYear();
        const month = String(sampleDate.getMonth() + 1).padStart(2, "0");
        const day = String(sampleDate.getDate()).padStart(2, "0");
        const date = `${day}/${month}/${year}`;
        if (!acc[date]) acc[date] = [];
        acc[date].push(test);
        return acc;
      },
      {} as Record<string, PatientTest[]>,
    );
    return Object.entries(grouped).sort(([, testsA], [, testsB]) => {
      const getLatestTime = (tests: PatientTest[]) => {
        return Math.max(
          ...tests.map((t: PatientTest & { createdAt?: Date | string }) =>
            t.createdAt ? new Date(t.createdAt).getTime() : 0,
          ),
        );
      };
      const timeA = getLatestTime(testsA);
      const timeB = getLatestTime(testsB);
      return timeB - timeA;
    }) as [string, PatientTest[]][];
  }, [savedTestData]);

  return (
    <div className="space-y-6">
      {groupedAndSorted.map(([date, tests]) => {
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

  const fetchSavedTestData = useCallback(async () => {
    setLoadingSavedData(true);
    try {
      const currentPatientId = patientId || testData.patientId;
      const url = currentPatientId
        ? `/api/patient-tests?patientId=${encodeURIComponent(currentPatientId)}&page=1&limit=40`
        : `/api/patient-tests?page=1&limit=40`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setSavedTestData(data.tests || []);
      } else {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to fetch saved test data:", response.status);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching saved test data:", error);
      }
    } finally {
      setLoadingSavedData(false);
    }
  }, [patientId, testData.patientId]);

  const onModalSaveSuccess = useCallback(
    (savedTest?: unknown) => {
      if (
        savedTest &&
        typeof savedTest === "object" &&
        savedTest !== null &&
        "id" in savedTest
      ) {
        const t = savedTest as PatientTest;
        setSavedTestData((prev) => {
          const rest = prev.filter((x) => x.id !== t.id);
          return [t, ...rest];
        });
        return;
      }
      void fetchSavedTestData();
    },
    [fetchSavedTestData],
  );

  useEffect(() => {
    if (patientId) {
      setTestData((prev) => ({ ...prev, patientId }));
    }
    fetchSavedTestData();
  }, [patientId, fetchSavedTestData]);


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
    if (!patientId || patientId.trim() === "") {
      alert(
        "Patient ID is missing. Please go back and create the patient first.",
      );
      return;
    }
    setLoading(true);

    if (!isFavouritesCacheReady()) {
      await hydrateFavouritesFromApi();
    }
    const defaultsBySection = buildDefaultsFromFavourites(
      getFavourites(),
      getFavouriteFieldValues(),
    );

    const unwrap = (section: TestDataSection): TestDataSection => {
      if (!section || typeof section !== "object") return section;
      if ("data" in section && section.data && typeof section.data === "object") {
        return section.data as TestDataSection;
      }
      return section;
    };

    const SECTION_KEYS = [
      "autoimmunoProfile", "cardiology", "rft", "lft",
      "diseaseHistory", "imaging", "hematology", "basdai",
    ] as const;

    const mergedTestData = { ...testData };
    for (const key of SECTION_KEYS) {
      const defaults = defaultsBySection[key];
      const userSection = unwrap(testData[key]);
      if (!defaults || Object.keys(defaults).length === 0) {
        if (userSection && typeof userSection === "object") {
          mergedTestData[key] = { data: userSection, date: testData.sampleDate };
        }
        continue;
      }
      const userData =
        userSection && typeof userSection === "object" ? userSection : {};
      const merged = { ...defaults, ...userData };
      mergedTestData[key] = { data: merged, date: testData.sampleDate };
    }

    const optimisticTest = {
      id: `temp-${Date.now()}`,
      createdAt: new Date(),
      sampleDate: testData.sampleDate,
      autoimmunoProfile: unwrap(mergedTestData.autoimmunoProfile),
      cardiology: unwrap(mergedTestData.cardiology),
      rft: unwrap(mergedTestData.rft),
      lft: unwrap(mergedTestData.lft),
      diseaseHistory: unwrap(mergedTestData.diseaseHistory),
      imaging: unwrap(mergedTestData.imaging),
      hematology: unwrap(mergedTestData.hematology),
      basdai: unwrap(mergedTestData.basdai),
    };
    setSavedTestData((prev) => [optimisticTest as PatientTest, ...prev]);
    
    try {
      const response = await fetch("/api/patient-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...mergedTestData,
          patientId,
        }),
      });

      const data = await response
        .json()
        .catch(() => ({} as { message?: string; test?: unknown }));

      if (response.ok) {
        alert("Patient test data submitted successfully!");
        if (
          data.test &&
          typeof data.test === "object" &&
          data.test !== null &&
          "id" in data.test
        ) {
          const t = data.test as PatientTest;
          setSavedTestData((prev) => {
            const withoutTemp = prev.filter((x) => x.id !== optimisticTest.id);
            const rest = withoutTemp.filter((x) => x.id !== t.id);
            return [t, ...rest];
          });
        } else {
          setSavedTestData((prev) =>
            prev.filter((t) => t.id !== optimisticTest.id),
          );
          void fetchSavedTestData();
        }
        setLoading(false);
      } else {
        setSavedTestData((prev) => prev.filter((t) => t.id !== optimisticTest.id));
        alert(
          (typeof data.message === "string" && data.message) ||
            "Failed to submit patient test data. Please try again.",
        );
        setLoading(false);
      }
    } catch (error) {
      setSavedTestData((prev) => prev.filter((t) => t.id !== optimisticTest.id));
      if (process.env.NODE_ENV === "development") {
        console.error("Error submitting patient test data:", error);
      }
      alert("Failed to submit patient test data. Please try again.");
      setLoading(false);
    }
  };

  const transformedSavedDataForDiseaseHistory = useMemo(() => {
    return savedTestData.map((test) => ({
      sampleDate: test.sampleDate,
      diseaseHistory:
        test.diseaseHistory === null
          ? undefined
          : (test.diseaseHistory as DiseaseHistoryData),
    }));
  }, [savedTestData]);

  

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
  }, [searchTerm]);

  const handleSearchSelect = useCallback((item: {
    key: string;
    label: string;
    modal: string;
  }) => {
    setOpenModal(resolveMainCategoryModal(item));
    setShowSuggestions(false);
    setSearchTerm("");
  }, []);

  const favoritesSectionShell =
    "bg-white/95 backdrop-blur-sm border-slate-200/90 border-l-sky-600 border-l-4";
  const favoritesContentPanel = "bg-slate-50/90";

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
                      handleSearchSelect(suggestions[0]);
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
                      onMouseDown={() => handleSearchSelect(s)}
                    >
                      {s.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <ExpandableSection
            title="Saved field defaults"
            isOpen={openModal === "my-favorites"}
            onToggle={() =>
              setOpenModal(openModal === "my-favorites" ? null : "my-favorites")
            }
            colorClass={favoritesSectionShell}
            contentClassName={favoritesContentPanel}
            icon={
              <Stethoscope
                className="h-5 w-5 text-sky-600"
                aria-hidden
              />
            }
            iconWrapperClassName="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-50 to-cyan-50/90 text-sky-600 ring-1 ring-sky-200/70 shadow-sm"
          >
            <MyFavoritesModal
              embedded
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
              embedded
              onClose={() => setOpenModal(null)}
              defaultDate={selectedDate}
              patientId={patientId}
              savedData={savedTestData}
              onDataChange={(data, date) =>
                updateTestData("basdai", data as TestDataSection, date)
              }
              onSaveSuccess={onModalSaveSuccess}
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
              embedded
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
              onSaveSuccess={onModalSaveSuccess}
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
              embedded
              onClose={() => setOpenModal(null)}
              defaultDate={selectedDate}
              patientId={patientId}
              savedData={savedTestData}
              onDataChange={(data, date) =>
                updateTestData("cardiology", data as TestDataSection, date)
              }
              onSaveSuccess={onModalSaveSuccess}
            />
          </ExpandableSection>

          <ExpandableSection
            title="RFT"
            isOpen={openModal === "rft"}
            onToggle={() => setOpenModal(openModal === "rft" ? null : "rft")}
            colorClass={sectionColors[3]}
          >
            <RFTModal
              embedded
              onClose={() => setOpenModal(null)}
              defaultDate={selectedDate}
              patientId={patientId}
              savedData={savedTestData}
              onDataChange={(data, date) =>
                updateTestData("rft", data as TestDataSection, date)
              }
              onSaveSuccess={onModalSaveSuccess}
            />
          </ExpandableSection>

          <ExpandableSection
            title="LFT"
            isOpen={openModal === "lft"}
            onToggle={() => setOpenModal(openModal === "lft" ? null : "lft")}
            colorClass={sectionColors[4]}
          >
            <LFTModal
              embedded
              onClose={() => setOpenModal(null)}
              defaultDate={selectedDate}
              patientId={patientId}
              savedData={savedTestData}
              onDataChange={(data, date) =>
                updateTestData("lft", data as TestDataSection, date)
              }
              onSaveSuccess={onModalSaveSuccess}
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
              embedded
              onClose={() => setOpenModal(null)}
              defaultDate={selectedDate}
              patientId={patientId}
              savedData={transformedSavedDataForDiseaseHistory}
              onDataChange={(data, date) =>
                updateTestData("diseaseHistory", data as TestDataSection, date)
              }
              onSaveSuccess={onModalSaveSuccess}
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
              embedded
              onClose={() => setOpenModal(null)}
              defaultDate={selectedDate}
              patientId={patientId}
              savedData={savedTestData}
              onDataChange={(data, date) =>
                updateTestData("imaging", data as TestDataSection, date)
              }
              onSaveSuccess={onModalSaveSuccess}
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
              embedded
              onClose={() => setOpenModal(null)}
              defaultDate={selectedDate}
              patientId={patientId}
              savedData={savedTestData}
              onDataChange={(data, date) =>
                updateTestData("hematology", data as TestDataSection, date)
              }
              onSaveSuccess={onModalSaveSuccess}
            />
          </ExpandableSection>
        </div>

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

        <div className="mt-8 mb-6 border-t-2 border-gray-300"></div>
        <div className="mt-6">
          <h2 className="text-2xl font-bold mb-4">Saved Test Reports</h2>

          <DefaultsReportBlock savedTestData={savedTestData} />

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
