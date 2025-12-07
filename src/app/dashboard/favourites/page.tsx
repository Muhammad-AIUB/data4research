'use client'

import { useState, useEffect } from 'react'
import { getFavourites, removeFavouriteField, getAllFavouritesGrouped, type FavouriteField } from '@/lib/favourites'
import { Trash2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function FavouritesPage() {
  const [favourites, setFavourites] = useState<Record<string, FavouriteField[]>>({})
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    setFavourites(getAllFavouritesGrouped())
  }, [refreshKey])

  const handleRemove = (reportType: string, fieldName: string) => {
    removeFavouriteField(reportType, fieldName)
    setRefreshKey(prev => prev + 1)
  }

  const reportNames: Record<string, string> = {
    autoimmunoProfile: "Autoimmuno Profile",
    cardiology: "Cardiology",
    rft: "RFT (Renal Function Test)",
    lft: "LFT (Liver Function Test)",
    diseaseHistory: "On Examination Disease History",
    imaging: "Imaging, Histopathology",
    hematology: "Hematology"
  }

  const reportColors: Record<string, string> = {
    autoimmunoProfile: "bg-blue-50 border-blue-200",
    cardiology: "bg-green-50 border-green-200",
    rft: "bg-purple-50 border-purple-200",
    lft: "bg-yellow-50 border-yellow-200",
    diseaseHistory: "bg-pink-50 border-pink-200",
    imaging: "bg-indigo-50 border-indigo-200",
    hematology: "bg-orange-50 border-orange-200"
  }

  const totalFavourites = Object.values(favourites).reduce((sum, fields) => sum + fields.length, 0)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Favourites</h1>
            <p className="text-gray-600">
              {totalFavourites} favourite field{totalFavourites !== 1 ? 's' : ''} saved
            </p>
          </div>
        </div>

        {totalFavourites === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center border">
            <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No favourites yet</h2>
            <p className="text-gray-500">
              Add fields to favourites from any report modal to see them here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(favourites).map(([reportType, fields]) => (
              <div
                key={reportType}
                className={`border rounded-lg p-4 ${reportColors[reportType] || 'bg-gray-50'}`}
              >
                <h2 className="text-xl font-bold mb-4 text-gray-800">
                  {reportNames[reportType] || reportType}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {fields.map((field) => (
                    <div
                      key={`${field.reportType}-${field.fieldName}`}
                      className="bg-white rounded-md p-3 border border-gray-200 flex items-center justify-between shadow-sm"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-800">{field.fieldLabel}</div>
                        <div className="text-xs text-gray-500 mt-1">{field.fieldName}</div>
                      </div>
                      <button
                        onClick={() => handleRemove(field.reportType, field.fieldName)}
                        className="ml-2 p-1.5 hover:bg-red-100 rounded text-red-600 transition-colors"
                        title="Remove from favourites"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

