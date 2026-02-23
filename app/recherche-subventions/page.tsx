'use client'

import { AssistantIASarthe } from '@/components/assistant-ia-sarthe'
import { GrantSearch } from '@/components/grant-search'

export default function RechercheSubventionsPage() {
  return (
    <div className="space-y-8">
      {/* Assistant IA Sarthe - EN HAUT (priorité visuelle) */}
      <AssistantIASarthe />

      {/* Séparateur visuel */}
      <div className="relative py-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-300"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-4 text-sm text-slate-500">
            ou recherchez manuellement
          </span>
        </div>
      </div>

      {/* Recherche manuelle - EN BAS (option alternative) */}
      <GrantSearch />
    </div>
  )
}
