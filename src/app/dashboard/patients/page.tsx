'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function AllPatientsPage() {
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchPatients = useCallback(async (query: string = '') => {
    setLoading(true)
    try {
      const url = query 
        ? `/api/patients?search=${encodeURIComponent(query)}`
        : '/api/patients'
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setPatients(data.patients || [])
      } else {
        console.error('Failed to fetch patients')
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchPatients(searchQuery)
  }

  useEffect(() => {
    if (searchQuery === '') {
      fetchPatients('')
      return
    }
    
    const timeoutId = setTimeout(() => {
      fetchPatients(searchQuery)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, fetchPatients])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">All Patients Data</h1>
          <Link 
            href="/dashboard/add-patient"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            + Add New Patient
          </Link>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search with patient name, mobile number, diagnosis or tags..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 w-full"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              Search
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  fetchPatients('')
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg font-medium"
              >
                Clear
              </button>
            )}
          </form>
          <p className="text-sm text-gray-500 mt-2">
            Search by patient name, mobile number, diagnosis, or tags
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600">Loading patients...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">No patients found.</p>
            <Link 
              href="/dashboard/add-patient"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Add your first patient →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="font-medium">{patient.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          ID: {patient.patientId} • Mobile: {patient.mobile}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/dashboard/patients/${patient.patientId}`}
                          className="text-green-600 hover:text-green-900"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

