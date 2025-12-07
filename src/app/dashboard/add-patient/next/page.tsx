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
      fetchSavedTestData()
    }
  }, [patientId])

  const fetchSavedTestData = async () => {
    if (!patientId) return
    
    setLoadingSavedData(true)
    try {
      const response = await fetch(`/api/patient-tests?patientId=${patientId}`)
      if (response.ok) {
        const data = await response.json()
        setSavedTestData(data.tests || [])
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
    if (!patientId) {
      alert("Patient ID is missing. Please go back and create the patient first.")
      return
    }

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
              onDataChange={(data, date) => updateTestData('autoimmunoProfile', data, date)}
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
              onDataChange={(data, date) => updateTestData('cardiology', data, date)}
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
              onDataChange={(data, date) => updateTestData('rft', data, date)}
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
              onDataChange={(data, date) => updateTestData('lft', data, date)}
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
              onDataChange={(data, date) => updateTestData('diseaseHistory', data, date)}
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
              onDataChange={(data, date) => updateTestData('imaging', data, date)}
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
              onDataChange={(data, date) => updateTestData('hematology', data, date)}
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
              {Object.entries(
                savedTestData.reduce((acc: any, test: any) => {
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
                }, {})
              )
                .sort(([dateA], [dateB]) => new Date(dateB.split('/').reverse().join('-')).getTime() - new Date(dateA.split('/').reverse().join('-')).getTime())
                .map(([date, tests]: [string, any[]]) => (
                  <div key={date} className="bg-white border rounded-lg p-4 shadow-sm">
                    <h3 className="text-xl font-semibold mb-4 text-blue-600 border-b pb-2">
                      Date: {date}
                    </h3>
                    <div className="space-y-4">
                      {tests.map((test, index) => (
                        <div key={index} className="bg-gray-50 rounded p-4 border-l-4 border-blue-500">
                          {test.autoimmunoProfile && (
                            <div className="mb-3">
                              <h4 className="font-semibold text-blue-700 mb-2">Autoimmuno Profile</h4>
                              <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40">
                                {JSON.stringify(test.autoimmunoProfile, null, 2)}
                              </pre>
                            </div>
                          )}
                          {test.cardiology && (
                            <div className="mb-3">
                              <h4 className="font-semibold text-green-700 mb-2">Cardiology</h4>
                              <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40">
                                {JSON.stringify(test.cardiology, null, 2)}
                              </pre>
                            </div>
                          )}
                          {test.rft && (
                            <div className="mb-3">
                              <h4 className="font-semibold text-purple-700 mb-2">RFT</h4>
                              <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40">
                                {JSON.stringify(test.rft, null, 2)}
                              </pre>
                            </div>
                          )}
                          {test.lft && (
                            <div className="mb-3">
                              <h4 className="font-semibold text-yellow-700 mb-2">LFT</h4>
                              <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40">
                                {JSON.stringify(test.lft, null, 2)}
                              </pre>
                            </div>
                          )}
                          {test.diseaseHistory && (
                            <div className="mb-3">
                              <h4 className="font-semibold text-pink-700 mb-2">Disease History</h4>
                              <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40">
                                {JSON.stringify(test.diseaseHistory, null, 2)}
                              </pre>
                            </div>
                          )}
                          {test.imaging && (
                            <div className="mb-3">
                              <h4 className="font-semibold text-indigo-700 mb-2">Imaging, Histopathology</h4>
                              <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40">
                                {JSON.stringify(test.imaging, null, 2)}
                              </pre>
                            </div>
                          )}
                          {test.hematology && (
                            <div className="mb-3">
                              <h4 className="font-semibold text-orange-700 mb-2">Hematology</h4>
                              <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40">
                                {JSON.stringify(test.hematology, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

