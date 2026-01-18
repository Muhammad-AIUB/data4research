'use client'

import { useState } from 'react'
import ExpandableSection from '@/components/ExpandableSection'
import AutoimmunoProfileModal from '@/components/modals/AutoimmunoProfileModal'
import CardiologyModal from '@/components/modals/CardiologyModal'
import RFTModal from '@/components/modals/RFTModal'
import LFTModal from '@/components/modals/LFTModal'
import DiseaseHistoryModal from '@/components/modals/DiseaseHistoryModal'
import ImagingHistopathologyModal from '@/components/modals/ImagingHistopathologyModal'
import HematologyModal from '@/components/modals/HematologyModal'

type SavedTest = {
  sampleDate: Date | string
}

export default function FavouritesPage() {
  const [openModal, setOpenModal] = useState<string | null>(null)
  const defaultDate = new Date()
  const savedData: SavedTest[] = []
  const noop = () => {}

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
    <div className="min-h-screen text-gray-900">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-white">Customize your favourites</h1>

        <div className="space-y-4">
          <ExpandableSection
            title="Autoimmuno profile"
            isOpen={openModal === "autoimmuno"}
            onToggle={() => setOpenModal(openModal === "autoimmuno" ? null : "autoimmuno")}
            colorClass={sectionColors[0]}
          >
            <AutoimmunoProfileModal 
              onClose={() => setOpenModal(null)} 
              defaultDate={defaultDate}
              patientId={undefined}
              savedData={savedData}
              onDataChange={noop}
              onSaveSuccess={noop}
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
              defaultDate={defaultDate}
              patientId={undefined}
              savedData={savedData}
              onDataChange={noop}
              onSaveSuccess={noop}
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
              defaultDate={defaultDate}
              patientId={undefined}
              savedData={savedData}
              onDataChange={noop}
              onSaveSuccess={noop}
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
              defaultDate={defaultDate}
              patientId={undefined}
              savedData={savedData}
              onDataChange={noop}
              onSaveSuccess={noop}
            />
          </ExpandableSection>

          <ExpandableSection
            title="On examination Disease history"
            isOpen={openModal === "disease-history"}
            onToggle={() => setOpenModal(openModal === "disease-history" ? null : "disease-history")}
            colorClass={sectionColors[4]}
          >
            <DiseaseHistoryModal 
              onClose={() => setOpenModal(null)} 
              defaultDate={defaultDate}
              patientId={undefined}
              savedData={savedData}
              onDataChange={noop}
              onSaveSuccess={noop}
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
              defaultDate={defaultDate}
              patientId={undefined}
              savedData={savedData}
              onDataChange={noop}
              onSaveSuccess={noop}
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
              defaultDate={defaultDate}
              patientId={undefined}
              savedData={savedData}
              onDataChange={noop}
              onSaveSuccess={noop}
            />
          </ExpandableSection>
        </div>
      </div>
    </div>
  )
}

