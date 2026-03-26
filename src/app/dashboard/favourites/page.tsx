'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
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

  /** Unified cards with a subtle left accent stripe per section */
  const sections: { title: string; accent: string }[] = [
    { title: 'Autoimmuno profile', accent: 'border-l-blue-600' },
    { title: 'Cardiology', accent: 'border-l-emerald-600' },
    { title: 'RFT', accent: 'border-l-violet-600' },
    { title: 'LFT', accent: 'border-l-amber-500' },
    { title: 'On examination & disease history', accent: 'border-l-rose-500' },
    { title: 'Imaging, histopathology', accent: 'border-l-indigo-600' },
    { title: 'Hematology', accent: 'border-l-orange-500' },
  ]

  const cardShell = (accent: string) =>
    `bg-white/95 backdrop-blur-sm border-slate-200/90 ${accent} border-l-4`

  const contentPanel = 'bg-slate-50/90'

  return (
    <div className="min-h-[calc(100vh-3rem)] text-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <header className="mb-8 sm:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-100/90 px-3 py-1 text-sm font-medium text-blue-800 ring-1 ring-blue-200/60 mb-3">
                <Heart className="h-4 w-4 fill-red-500 text-red-500" aria-hidden />
                Favourites
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-800">
                Customize your favourites
              </h1>
              <p className="mt-2 max-w-2xl text-base text-slate-600 leading-relaxed">
                Open a section and use the heart icons next to each field to choose what appears in your
                favourites for new patients.
              </p>
            </div>
          </div>
        </header>

        <div className="space-y-3 sm:space-y-4">
          <ExpandableSection
            title={sections[0].title}
            isOpen={openModal === "autoimmuno"}
            onToggle={() => setOpenModal(openModal === "autoimmuno" ? null : "autoimmuno")}
            colorClass={cardShell(sections[0].accent)}
            contentClassName={contentPanel}
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
            title={sections[1].title}
            isOpen={openModal === "cardiology"}
            onToggle={() => setOpenModal(openModal === "cardiology" ? null : "cardiology")}
            colorClass={cardShell(sections[1].accent)}
            contentClassName={contentPanel}
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
            title={sections[2].title}
            isOpen={openModal === "rft"}
            onToggle={() => setOpenModal(openModal === "rft" ? null : "rft")}
            colorClass={cardShell(sections[2].accent)}
            contentClassName={contentPanel}
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
            title={sections[3].title}
            isOpen={openModal === "lft"}
            onToggle={() => setOpenModal(openModal === "lft" ? null : "lft")}
            colorClass={cardShell(sections[3].accent)}
            contentClassName={contentPanel}
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
            title={sections[4].title}
            isOpen={openModal === "disease-history"}
            onToggle={() => setOpenModal(openModal === "disease-history" ? null : "disease-history")}
            colorClass={cardShell(sections[4].accent)}
            contentClassName={contentPanel}
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
            title={sections[5].title}
            isOpen={openModal === "imaging"}
            onToggle={() => setOpenModal(openModal === "imaging" ? null : "imaging")}
            colorClass={cardShell(sections[5].accent)}
            contentClassName={contentPanel}
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
            title={sections[6].title}
            isOpen={openModal === "hematology"}
            onToggle={() => setOpenModal(openModal === "hematology" ? null : "hematology")}
            colorClass={cardShell(sections[6].accent)}
            contentClassName={contentPanel}
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

