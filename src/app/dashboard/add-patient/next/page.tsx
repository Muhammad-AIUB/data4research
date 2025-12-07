'use client'

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import CalendarWithNavigation from "@/components/CalendarWithNavigation"
import ExpandableSection from "@/components/ExpandableSection"
import AutoimmunoProfileModal from "@/components/modals/AutoimmunoProfileModal"
import CardiologyModal from "@/components/modals/CardiologyModal"
import RFTModal from "@/components/modals/RFTModal"
import LFTModal from "@/components/modals/LFTModal"
import DiseaseHistoryModal from "@/components/modals/DiseaseHistoryModal"
import ImagingHistopathologyModal from "@/components/modals/ImagingHistopathologyModal"
import HematologyModal from "@/components/modals/HematologyModal"
import { Button } from "@/components/ui/button"
import { formatTestData } from "@/lib/formatTestData"

export default function NextPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const patientId = searchParams.get('patientId')
  
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [openModal, setOpenModal] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [savedTestData, setSavedTestData] = useState<any[]>([])
  const [loadingSavedData, setLoadingSavedData] = useState(false)
  
  // Store all test data from modals
  const [testData, setTestData] = useState({
    patientId: patientId || '',
    sampleDate: new Date().toISOString(),
    autoimmunoProfile: null as any,
    cardiology: null as any,
    rft: null as any,
    lft: null as any,
    diseaseHistory: null as any,
    imaging: null as any,
    hematology: null as any,
  })

  useEffect(() => {
    if (patientId) {
      setTestData(prev => ({ ...prev, patientId }))
    }
    // Always fetch saved data on mount and when patientId changes
    fetchSavedTestData()
  }, [patientId])

  const fetchSavedTestData = async () => {
    setLoadingSavedData(true)
    try {
      const currentPatientId = patientId || testData.patientId
      // Fetch all tests if no patientId, or filter by patientId if provided
      const url = currentPatientId 
        ? `/api/patient-tests?patientId=${currentPatientId}`
        : `/api/patient-tests`
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        console.log("Fetched saved test data:", data)
        setSavedTestData(data.tests || [])
      } else {
        console.error("Failed to fetch saved test data:", response.status)
      }
    } catch (error) {
      console.error("Error fetching saved test data:", error)
    } finally {
      setLoadingSavedData(false)
    }
  }

  const handleDateChange = (date: Date) => {
    setSelectedDate(date)
    setTestData(prev => ({ ...prev, sampleDate: date.toISOString() }))
  }

  const updateTestData = (section: string, data: any, date?: Date) => {
    setTestData(prev => ({ 
      ...prev, 
      [section]: {
        data,
        date: date ? date.toISOString() : selectedDate.toISOString()
      }
    }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/patient-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...testData,
          patientId,
        })
      })

      if (response.ok) {
        alert("Patient test data submitted successfully!")
        // Refresh saved test data
        await fetchSavedTestData()
        // Don't redirect, stay on page to see the saved data
      } else {
        const error = await response.json()
        alert(error.message || "Failed to submit patient test data. Please try again.")
      }
    } catch (error) {
      console.error("Error submitting patient test data:", error)
      alert("Failed to submit patient test data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const sectionColors = [
    "bg-blue-50 border-blue-200",
    "bg-green-50 border-green-200",
    "bg-purple-50 border-purple-200",
    "bg-yellow-50 border-yellow-200",
    "bg-pink-50 border-pink-200",
    "bg-indigo-50 border-indigo-200",
    "bg-orange-50 border-orange-200",
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Patient Test Information</h1>

        {/* Calendar Section */}
        <div className="mb-8">
          <CalendarWithNavigation 
            selectedDate={selectedDate} 
            onDateChange={handleDateChange} 
          />
          <div className="mt-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 rounded">
            <p className="text-sm text-yellow-800 font-medium">
              <strong>Note:</strong> Please check for sample received date or given date, not report delivery date.
            </p>
          </div>
        </div>

        {/* Expandable Sections */}
        <div className="space-y-4">
          <ExpandableSection
            title="Autoimmuno profile"
            isOpen={openModal === "autoimmuno"}
            onToggle={() => setOpenModal(openModal === "autoimmuno" ? null : "autoimmuno")}
            colorClass={sectionColors[0]}
          >
            <AutoimmunoProfileModal 
              onClose={() => setOpenModal(null)} 
              defaultDate={selectedDate}
              patientId={patientId}
              onDataChange={(data, date) => updateTestData('autoimmunoProfile', data, date)}
              onSaveSuccess={fetchSavedTestData}
            />
          </ExpandableSection>

          <ExpandableSection
            title="Cardiology"
            isOpen={openModal === "cardiology"}
            onToggle={() => setOpenModal(openModal === "cardiology" ? null : "cardiology")}
            colorClass={sectionColors[1]}
          >
            <CardiologyModal 
              onClose={() => setOpenModal(null)} 
              defaultDate={selectedDate}
              patientId={patientId}
              onDataChange={(data, date) => updateTestData('cardiology', data, date)}
              onSaveSuccess={fetchSavedTestData}
            />
          </ExpandableSection>

          <ExpandableSection
            title="RFT"
            isOpen={openModal === "rft"}
            onToggle={() => setOpenModal(openModal === "rft" ? null : "rft")}
            colorClass={sectionColors[2]}
          >
            <RFTModal 
              onClose={() => setOpenModal(null)} 
              defaultDate={selectedDate}
              patientId={patientId}
              onDataChange={(data, date) => updateTestData('rft', data, date)}
              onSaveSuccess={fetchSavedTestData}
            />
          </ExpandableSection>

          <ExpandableSection
            title="LFT"
            isOpen={openModal === "lft"}
            onToggle={() => setOpenModal(openModal === "lft" ? null : "lft")}
            colorClass={sectionColors[3]}
          >
            <LFTModal 
              onClose={() => setOpenModal(null)} 
              defaultDate={selectedDate}
              patientId={patientId}
              onDataChange={(data, date) => updateTestData('lft', data, date)}
              onSaveSuccess={fetchSavedTestData}
            />
          </ExpandableSection>

          <ExpandableSection
            title="on examination Disease history"
            isOpen={openModal === "disease-history"}
            onToggle={() => setOpenModal(openModal === "disease-history" ? null : "disease-history")}
            colorClass={sectionColors[4]}
          >
            <DiseaseHistoryModal 
              onClose={() => setOpenModal(null)} 
              defaultDate={selectedDate}
              patientId={patientId}
              onDataChange={(data, date) => updateTestData('diseaseHistory', data, date)}
              onSaveSuccess={fetchSavedTestData}
            />
          </ExpandableSection>

          <ExpandableSection
            title="Imaging, Histopathology"
            isOpen={openModal === "imaging"}
            onToggle={() => setOpenModal(openModal === "imaging" ? null : "imaging")}
            colorClass={sectionColors[5]}
          >
            <ImagingHistopathologyModal 
              onClose={() => setOpenModal(null)} 
              defaultDate={selectedDate}
              patientId={patientId}
              onDataChange={(data, date) => updateTestData('imaging', data, date)}
              onSaveSuccess={fetchSavedTestData}
            />
          </ExpandableSection>

          <ExpandableSection
            title="Hematology"
            isOpen={openModal === "hematology"}
            onToggle={() => setOpenModal(openModal === "hematology" ? null : "hematology")}
            colorClass={sectionColors[6]}
          >
            <HematologyModal 
              onClose={() => setOpenModal(null)} 
              defaultDate={selectedDate}
              patientId={patientId}
              onDataChange={(data, date) => updateTestData('hematology', data, date)}
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
            <div className="text-center py-8 text-gray-500">Loading saved data...</div>
          ) : savedTestData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No saved test data found. Submit test data to see it here.</div>
          ) : (
            <div className="space-y-6">
              {(Object.entries(
                savedTestData.reduce((acc: Record<string, any[]>, test: any) => {
                  // Handle both Date object and ISO string
                  const sampleDate = test.sampleDate instanceof Date 
                    ? test.sampleDate 
                    : new Date(test.sampleDate)
                  
                  const date = sampleDate.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })
                  if (!acc[date]) acc[date] = []
                  acc[date].push(test)
                  return acc
                }, {} as Record<string, any[]>)
              ) as [string, any[]][])
                .sort(([dateA], [dateB]) => new Date(dateB.split('/').reverse().join('-')).getTime() - new Date(dateA.split('/').reverse().join('-')).getTime())
                .map(([date, tests]) => {
                  // Sort tests within each date group by sampleDate (latest first)
                  const sortedTests = [...tests].sort((a, b) => {
                    const dateA = a.sampleDate instanceof Date ? a.sampleDate : new Date(a.sampleDate)
                    const dateB = b.sampleDate instanceof Date ? b.sampleDate : new Date(b.sampleDate)
                    return dateB.getTime() - dateA.getTime()
                  })
                  
                  return (
                  <div key={date} className="bg-white border rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                      <h3 className="text-xl font-semibold text-blue-600">Test Reports</h3>
                      <span className="text-sm font-medium text-gray-600">{date}</span>
                    </div>
                    <div className="space-y-4">
                      {sortedTests.map((test, index) => (
                        <div key={index} className="bg-gray-50 rounded p-4 border-l-4 border-blue-500">
                          {test.autoimmunoProfile && (
                            <div className="mb-3">
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold text-blue-700">Autoimmuno Profile</h4>
                                <span className="text-xs text-gray-500">
                                  {new Date(test.sampleDate).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  })}
                                </span>
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
                                <span className="text-xs text-gray-500">
                                  {new Date(test.sampleDate).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  })}
                                </span>
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
                                <span className="text-xs text-gray-500">
                                  {new Date(test.sampleDate).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  })}
                                </span>
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
                                <span className="text-xs text-gray-500">
                                  {new Date(test.sampleDate).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  })}
                                </span>
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
                                <span className="text-xs text-gray-500">
                                  {new Date(test.sampleDate).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  })}
                                </span>
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
                                <span className="text-xs text-gray-500">
                                  {new Date(test.sampleDate).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  })}
                                </span>
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
                                <span className="text-xs text-gray-500">
                                  {new Date(test.sampleDate).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  })}
                                </span>
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

