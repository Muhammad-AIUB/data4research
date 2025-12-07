import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import type { Session } from 'next-auth'
import { formatTestData } from '@/lib/formatTestData'

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ patientId: string }>
}) {
  const { patientId } = await params

  // @ts-expect-error - getServerSession type inference issue with custom callbacks
  const session = await getServerSession(authOptions) as Session | null
  
  // Redirect to login if not authenticated
  if (!session || !session.user) {
    redirect('/login')
  }

  // Fetch patient by patientId (not database id)
  const patient = await prisma.patient.findUnique({
    where: { patientId },
    include: {
      tests: {
        orderBy: {
          sampleDate: 'desc'
        }
      }
    }
  })

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Patient Not Found</h1>
            <p className="text-gray-600 mb-6">The patient with ID {patientId} could not be found.</p>
            <Link 
              href="/dashboard/patients"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to All Patients
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link 
              href="/dashboard/patients"
              className="text-blue-600 hover:text-blue-700 font-medium mb-2 inline-block"
            >
              ← Back to All Patients
            </Link>
            <h1 className="text-3xl font-bold">Patient Details</h1>
          </div>
          <Link
            href={`/dashboard/add-patient/next?patientId=${patient.patientId}`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            + Add Test Report
          </Link>
        </div>

        {/* Patient Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Patient Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Patient ID</p>
              <p className="font-medium">{patient.patientId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{patient.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Age</p>
              <p className="font-medium">{patient.age}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Ethnicity</p>
              <p className="font-medium capitalize">{patient.ethnicity || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Religion</p>
              <p className="font-medium capitalize">{patient.religion || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">NID</p>
              <p className="font-medium">{patient.nid || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Mobile</p>
              <p className="font-medium">{patient.mobile}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Spouse Mobile</p>
              <p className="font-medium">{patient.spouseMobile || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Relative Mobile</p>
              <p className="font-medium">{patient.relativeMobile || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">District</p>
              <p className="font-medium">{patient.district || '-'}</p>
            </div>
            {patient.address && (
              <div className="col-span-2 md:col-span-3">
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">{patient.address}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Created At</p>
              <p className="font-medium">
                {new Date(patient.createdAt).toLocaleString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          {/* Tags */}
          {patient.tags && patient.tags.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-1">Tags</p>
              <div className="flex flex-wrap gap-2">
                {patient.tags.map((tag: string, idx: number) => (
                  <span
                    key={idx}
                    className="bg-blue-50 text-blue-800 px-2 py-1 rounded-full text-xs border border-blue-200"
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
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Clinical Information</h2>
            <div className="space-y-4">
              {patient.shortHistory && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Short History</p>
                  <p className="text-sm text-gray-800 whitespace-pre-line bg-gray-50 rounded-md p-3">
                    {patient.shortHistory}
                  </p>
                </div>
              )}
              {patient.surgicalHistory && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Surgical History</p>
                  <p className="text-sm text-gray-800 whitespace-pre-line bg-gray-50 rounded-md p-3">
                    {patient.surgicalHistory}
                  </p>
                </div>
              )}
              {patient.familyHistory && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Family History</p>
                  <p className="text-sm text-gray-800 whitespace-pre-line bg-gray-50 rounded-md p-3">
                    {patient.familyHistory}
                  </p>
                </div>
              )}
              {patient.pastIllness && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Past Illness</p>
                  <p className="text-sm text-gray-800 whitespace-pre-line bg-gray-50 rounded-md p-3">
                    {patient.pastIllness}
                  </p>
                </div>
              )}
              {patient.specialNotes && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Special Notes</p>
                  <p className="text-sm text-gray-800 whitespace-pre-line bg-gray-50 rounded-md p-3">
                    {patient.specialNotes}
                  </p>
                </div>
              )}
              {patient.finalDiagnosis && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Final Diagnosis</p>
                  <p className="text-sm text-gray-800 whitespace-pre-line bg-yellow-50 rounded-md p-3 border border-yellow-200">
                    {patient.finalDiagnosis}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Test Reports */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Test Reports ({patient.tests.length})</h2>
          
          {patient.tests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
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
              {(Object.entries(
                patient.tests.reduce((acc: Record<string, any[]>, test: any) => {
                  // Fix timezone issue - use local date components
                  const sampleDate = test.sampleDate instanceof Date 
                    ? test.sampleDate 
                    : new Date(test.sampleDate)
                  
                  // Get local date components to avoid timezone conversion issues
                  const year = sampleDate.getFullYear()
                  const month = String(sampleDate.getMonth() + 1).padStart(2, '0')
                  const day = String(sampleDate.getDate()).padStart(2, '0')
                  const date = `${day}/${month}/${year}`
                  
                  if (!acc[date]) acc[date] = []
                  acc[date].push(test)
                  return acc
                }, {} as Record<string, any[]>)
              ) as [string, any[]][])
                .sort(([dateA], [dateB]) => new Date(dateB.split('/').reverse().join('-')).getTime() - new Date(dateA.split('/').reverse().join('-')).getTime())
                .map(([date, tests]) => {
                  // Sort by createdAt (latest first) to ensure newest saves appear first
                  const sortedTests = [...tests].sort((a: any, b: any) => {
                    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
                    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
                    if (timeA !== timeB) return timeB - timeA // Latest first
                    // If same creation time, sort by sampleDate
                    const dateA = a.sampleDate instanceof Date ? a.sampleDate : new Date(a.sampleDate)
                    const dateB = b.sampleDate instanceof Date ? b.sampleDate : new Date(b.sampleDate)
                    return dateB.getTime() - dateA.getTime()
                  })
                  
                  return (
                    <div key={date} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h3 className="text-lg font-semibold text-blue-600">Date: {date}</h3>
                      </div>
                      <div className="space-y-4">
                        {sortedTests.map((test, index) => (
                          <div key={index} className="bg-gray-50 rounded p-4 border-l-4 border-blue-500">
                            {test.autoimmunoProfile && (
                              <div className="mb-3">
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="font-semibold text-blue-700">Autoimmuno Profile</h4>
                                </div>
                                <div className="bg-white p-3 rounded space-y-1">
                                  {formatTestData(test.autoimmunoProfile, 'autoimmunoProfile').map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                      <span className="font-medium text-gray-700">{item.label}:</span>
                                      <span className="text-gray-900">{item.value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {test.cardiology && (
                              <div className="mb-3">
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="font-semibold text-green-700">Cardiology</h4>
                                </div>
                                <div className="bg-white p-3 rounded space-y-1">
                                  {formatTestData(test.cardiology, 'cardiology').map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                      <span className="font-medium text-gray-700">{item.label}:</span>
                                      <span className="text-gray-900">{item.value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {test.rft && (
                              <div className="mb-3">
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="font-semibold text-purple-700">RFT</h4>
                                </div>
                                <div className="bg-white p-3 rounded space-y-1">
                                  {formatTestData(test.rft, 'rft').map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                      <span className="font-medium text-gray-700">{item.label}:</span>
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
                                </div>
                                <div className="bg-white p-3 rounded space-y-1">
                                  {formatTestData(test.lft, 'lft').map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                      <span className="font-medium text-gray-700">{item.label}:</span>
                                      <span className="text-gray-900">{item.value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {test.diseaseHistory && (
                              <div className="mb-3">
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="font-semibold text-pink-700">Disease History</h4>
                                </div>
                                <div className="bg-white p-3 rounded space-y-1">
                                  {formatTestData(test.diseaseHistory, 'diseaseHistory').map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                      <span className="font-medium text-gray-700">{item.label}:</span>
                                      <span className="text-gray-900">{item.value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {test.imaging && (
                              <div className="mb-3">
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="font-semibold text-indigo-700">Imaging, Histopathology</h4>
                                </div>
                                <div className="bg-white p-3 rounded space-y-1">
                                  {formatTestData(test.imaging, 'imaging').map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                      <span className="font-medium text-gray-700">{item.label}:</span>
                                      <span className="text-gray-900">{item.value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {test.hematology && (
                              <div className="mb-3">
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="font-semibold text-orange-700">Hematology</h4>
                                </div>
                                <div className="bg-white p-3 rounded space-y-1">
                                  {formatTestData(test.hematology, 'hematology').map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                      <span className="font-medium text-gray-700">{item.label}:</span>
                                      <span className="text-gray-900">{item.value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

