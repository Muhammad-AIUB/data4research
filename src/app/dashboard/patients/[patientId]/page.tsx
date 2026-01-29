import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Session } from "next-auth";
import { formatTestData } from "@/lib/formatTestData";

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;

  // @ts-expect-error - getServerSession type inference issue with custom callbacks
  const session = (await getServerSession(authOptions)) as Session | null;

  // Redirect to login if not authenticated
  if (!session || !session.user) {
    redirect("/login");
  }

  // Fetch patient by patientId or database id
  // UUID format check: if it looks like a UUID (database id), search by id
  // Otherwise, search by patientId field
  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      patientId,
    );

  let patient = null;
  if (isUUID || patientId === "null" || !patientId) {
    // Search by database id
    patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        tests: {
          orderBy: [
            { createdAt: "desc" }, // Latest saves first
            { sampleDate: "desc" }, // Then by sample date
          ],
        },
      },
    });
  } else {
    // Search by patientId field
    patient = await prisma.patient.findUnique({
      where: { patientId },
      include: {
        tests: {
          orderBy: [
            { createdAt: "desc" }, // Latest saves first
            { sampleDate: "desc" }, // Then by sample date
          ],
        },
      },
    });
  }

  if (!patient) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-100 p-8 text-center">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">
              Patient Not Found
            </h1>
            <p className="text-slate-600 mb-6">
              The patient with ID {patientId} could not be found.
            </p>
            <Link
              href="/dashboard/patients"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to All Patients
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link
              href="/dashboard/patients"
              className="text-blue-600 hover:text-blue-700 font-medium mb-2 inline-block"
            >
              ← Back to All Patients
            </Link>
            <h1 className="text-3xl font-bold text-slate-800">
              Patient Details
            </h1>
          </div>
          <Link
            href={`/dashboard/add-patient/next?patientId=${patient.patientId || patient.id}`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium shadow-md transition-all"
          >
            + Add Test Report
          </Link>
        </div>

        {/* Patient Information - redesigned for clarity */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-extrabold shadow-md">
                {patient.name
                  ? patient.name
                      .split(" ")
                      .slice(0, 2)
                      .map((n: string) => n?.[0] ?? "")
                      .join("")
                  : "P"}
              </div>
              <div>
                <div className="text-2xl font-extrabold text-gray-900 truncate">
                  {patient.name}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {patient.district || ""} • Registered{" "}
                  {new Date(patient.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-slate-500">ID</div>
              <div className="px-3 py-1 rounded-full bg-gray-100 text-sm font-semibold text-slate-800">
                {patient.patientId}
              </div>
              <div className="text-sm text-slate-500">Age</div>
              <div className="px-3 py-1 rounded-full bg-gray-100 text-sm font-semibold text-slate-800">
                {patient.age}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-700">
            <div>
              <div className="text-xs text-gray-400">Mobile</div>
              <div className="font-medium text-slate-800">{patient.mobile}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">NID</div>
              <div className="font-medium text-slate-800">
                {patient.nid || "-"}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Ethnicity</div>
              <div className="font-medium text-slate-800 capitalize">
                {patient.ethnicity || "-"}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Spouse Mobile</div>
              <div className="font-medium text-slate-800">
                {patient.spouseMobile || "-"}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Relative Mobile</div>
              <div className="font-medium text-slate-800">
                {patient.relativeMobile || "-"}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">District</div>
              <div className="font-medium text-slate-800">
                {patient.district || "-"}
              </div>
            </div>
            {patient.address && (
              <div className="sm:col-span-3">
                <div className="text-xs text-gray-400">Address</div>
                <div className="font-medium text-slate-800">
                  {patient.address}
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          {patient.tags && patient.tags.length > 0 && (
            <div className="mt-4">
              <div className="text-xs text-gray-400 mb-2">Tags</div>
              <div className="flex flex-wrap gap-2">
                {patient.tags.map((tag: string, idx: number) => (
                  <span
                    key={idx}
                    className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-sm border border-blue-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Clinical Information from Add Patient Form */}
        {(patient.shortHistory ||
          patient.surgicalHistory ||
          patient.familyHistory ||
          patient.pastIllness ||
          patient.specialNotes ||
          patient.finalDiagnosis) && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-100 p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-slate-800">
              Clinical Information
            </h2>
            <div className="space-y-4">
              {patient.shortHistory && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Short History</p>
                  <p className="text-sm text-slate-800 whitespace-pre-line bg-gray-50 rounded-md p-3">
                    {patient.shortHistory}
                  </p>
                </div>
              )}
              {patient.surgicalHistory && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">
                    Surgical History
                  </p>
                  <p className="text-sm text-slate-800 whitespace-pre-line bg-gray-50 rounded-md p-3">
                    {patient.surgicalHistory}
                  </p>
                </div>
              )}
              {patient.familyHistory && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Family History</p>
                  <p className="text-sm text-slate-800 whitespace-pre-line bg-gray-50 rounded-md p-3">
                    {patient.familyHistory}
                  </p>
                </div>
              )}
              {patient.pastIllness && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Past Illness</p>
                  <p className="text-sm text-slate-800 whitespace-pre-line bg-gray-50 rounded-md p-3">
                    {patient.pastIllness}
                  </p>
                </div>
              )}
              {patient.specialNotes && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Special Notes</p>
                  <p className="text-sm text-slate-800 whitespace-pre-line bg-gray-50 rounded-md p-3">
                    {patient.specialNotes}
                  </p>
                </div>
              )}
              {patient.finalDiagnosis && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Final Diagnosis</p>
                  <p className="text-sm text-slate-800 whitespace-pre-line bg-yellow-50 rounded-md p-3 border border-yellow-200">
                    {patient.finalDiagnosis}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Test Reports */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-100 p-6">
          <h2 className="text-2xl font-semibold mb-4 text-slate-800">
            Test Reports ({patient.tests.length})
          </h2>

          {patient.tests.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>No test reports found for this patient.</p>
              <Link
                href={`/dashboard/add-patient/next?patientId=${patient.patientId}`}
                className="text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
              >
                Add first test report →
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {(
                Object.entries(
                  // First, sort all tests by createdAt (latest first) to maintain serial order
                  [...patient.tests]
                    .sort((a, b) => {
                      const timeA = a.createdAt
                        ? new Date(a.createdAt).getTime()
                        : 0;
                      const timeB = b.createdAt
                        ? new Date(b.createdAt).getTime()
                        : 0;
                      return timeB - timeA; // Latest first
                    })
                    .reduce(
                      (acc: Record<string, Array<{
                        sampleDate: Date | string;
                        createdAt?: Date | string;
                        autoimmunoProfile?: unknown;
                        cardiology?: unknown;
                        rft?: unknown;
                        lft?: unknown;
                        diseaseHistory?: unknown;
                        imaging?: unknown;
                        hematology?: unknown;
                        basdai?: unknown;
                      }>>, test: {
                        sampleDate: Date | string;
                        createdAt?: Date | string;
                        autoimmunoProfile?: unknown;
                        cardiology?: unknown;
                        rft?: unknown;
                        lft?: unknown;
                        diseaseHistory?: unknown;
                        imaging?: unknown;
                        hematology?: unknown;
                        basdai?: unknown;
                      }) => {
                        // Fix timezone issue - use local date components
                        const sampleDate =
                          test.sampleDate instanceof Date
                            ? test.sampleDate
                            : new Date(test.sampleDate);

                        // Get local date components to avoid timezone conversion issues
                        const year = sampleDate.getFullYear();
                        const month = String(
                          sampleDate.getMonth() + 1,
                        ).padStart(2, "0");
                        const day = String(sampleDate.getDate()).padStart(
                          2,
                          "0",
                        );
                        const date = `${day}/${month}/${year}`;

                        if (!acc[date]) acc[date] = [];
                        acc[date].push(test); // Maintain order - latest saves will be first in each group
                        return acc;
                      },
                      {} as Record<string, Array<{
                        sampleDate: Date | string;
                        createdAt?: Date | string;
                        autoimmunoProfile?: unknown;
                        cardiology?: unknown;
                        rft?: unknown;
                        lft?: unknown;
                        diseaseHistory?: unknown;
                        imaging?: unknown;
                        hematology?: unknown;
                        basdai?: unknown;
                      }>>,
                    ),
                ) as [string, Array<{
                  sampleDate: Date | string;
                  createdAt?: Date | string;
                  autoimmunoProfile?: unknown;
                  cardiology?: unknown;
                  rft?: unknown;
                  lft?: unknown;
                  diseaseHistory?: unknown;
                  imaging?: unknown;
                  hematology?: unknown;
                  basdai?: unknown;
                }>][]
              )
                .sort(([, testsA], [, testsB]) => {
                  // Sort date groups by latest createdAt in each group (not by date itself)
                  const getLatestTime = (tests: Array<{ createdAt?: Date | string; [key: string]: unknown }>) => {
                    return Math.max(
                      ...tests.map((t) =>
                        t.createdAt ? new Date(t.createdAt).getTime() : 0,
                      ),
                    );
                  };
                  const timeA = getLatestTime(testsA);
                  const timeB = getLatestTime(testsB);
                  return timeB - timeA; // Latest first
                })
                .map(([date, tests]) => {
                  // Tests are already sorted by createdAt (latest first) from the grouping step
                  // No need to sort again - maintain the order
                  const sortedTests = tests;

                  return (
                    <div
                      key={date}
                      className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-md border border-blue-100 p-4"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-800">
                          {date}
                        </h3>
                        <div className="text-sm text-slate-500">
                          {tests.length} report{tests.length > 1 ? "s" : ""}
                        </div>
                      </div>
                      <div className="space-y-4">
                        {sortedTests.map((test, index) => (
                          <div
                            key={index}
                            className="bg-white rounded-xl p-4 shadow-sm border border-blue-50"
                          >
                            {test.autoimmunoProfile != null && (
                              <div className="mb-3">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold text-slate-800">
                                    Autoimmuno Profile
                                  </h4>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50 p-3 rounded-md">
                                  {formatTestData(
                                    test.autoimmunoProfile,
                                    "autoimmunoProfile",
                                  ).map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="flex justify-between items-center text-sm"
                                    >
                                      <span className="text-slate-500">
                                        {item.label}
                                      </span>
                                      <span className="text-gray-900 font-medium">
                                        {item.value}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {test.cardiology != null && Boolean(test.cardiology) && (
                              <div className="mb-3">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold text-slate-800">
                                    Cardiology
                                  </h4>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50 p-3 rounded-md">
                                  {formatTestData(
                                    test.cardiology,
                                    "cardiology",
                                  ).map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="flex justify-between items-center text-sm"
                                    >
                                      <span className="text-slate-500">
                                        {item.label}
                                      </span>
                                      <span className="text-gray-900 font-medium">
                                        {item.value}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {test.rft != null && (
                              <div className="mb-3">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold text-slate-800">
                                    RFT
                                  </h4>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50 p-3 rounded-md">
                                  {formatTestData(test.rft, "rft").map(
                                    (item, idx) => (
                                      <div
                                        key={idx}
                                        className="flex justify-between items-center text-sm"
                                      >
                                        <span className="text-slate-500">
                                          {item.label}
                                        </span>
                                        <span className="text-gray-900 font-medium">
                                          {item.value}
                                        </span>
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}
                            {test.lft != null && Boolean(test.lft) && (
                              <div className="mb-3">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold text-slate-800">
                                    LFT
                                  </h4>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50 p-3 rounded-md">
                                  {formatTestData(test.lft, "lft").map(
                                    (item, idx) => (
                                      <div
                                        key={idx}
                                        className="flex justify-between items-center text-sm"
                                      >
                                        <span className="text-slate-500">
                                          {item.label}
                                        </span>
                                        <span className="text-gray-900 font-medium">
                                          {item.value}
                                        </span>
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}
                            {test.diseaseHistory != null && (
                              <div className="mb-3">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold text-slate-800">
                                    Disease History
                                  </h4>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50 p-3 rounded-md">
                                  {formatTestData(
                                    test.diseaseHistory,
                                    "diseaseHistory",
                                  ).map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="flex justify-between items-center text-sm"
                                    >
                                      <span className="text-slate-500">
                                        {item.label}
                                      </span>
                                      <span className="text-gray-900 font-medium">
                                        {item.value}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {test.imaging != null && Boolean(test.imaging) && (
                              <div className="mb-3">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold text-slate-800">
                                    Imaging, Histopathology
                                  </h4>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50 p-3 rounded-md">
                                  {formatTestData(test.imaging, "imaging").map(
                                    (item, idx) => (
                                      <div
                                        key={idx}
                                        className="flex justify-between items-center text-sm"
                                      >
                                        <span className="text-slate-500">
                                          {item.label}
                                        </span>
                                        <span className="text-gray-900 font-medium">
                                          {item.value}
                                        </span>
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}
                            {test.hematology != null && Boolean(test.hematology) && (
                              <div className="mb-3">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold text-slate-800">
                                    Hematology
                                  </h4>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50 p-3 rounded-md">
                                  {formatTestData(
                                    test.hematology,
                                    "hematology",
                                  ).map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="flex justify-between items-center text-sm"
                                    >
                                      <span className="text-slate-500">
                                        {item.label}
                                      </span>
                                      <span className="text-gray-900 font-medium">
                                        {item.value}
                                      </span>
                                    </div>
                                  ))}
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
          )}
        </div>
      </div>
    </div>
  );
}
