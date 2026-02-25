'use client'

import { AssistantIASarthe } from '@/components/assistant-ia-sarthe'
import { Suspense } from 'react'
import { GrantSearch } from '@/components/grant-search'

export default function RechercheSubventionsPage() {
  return (
    <div className="space-y-8">
      {/* Assistant IA Sarthe - EN HAUT (priorité visuelle) */}
      <Suspense fallback={<div className="p-6 text-center text-muted-foreground">Chargement de l'Assistant IA...</div>}>
        <AssistantIASarthe />
      </Suspense>

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
      <div id="recherche-classique">
        <Suspense fallback={<div>Chargement de la recherche...</div>}>
          <GrantSearch />
        </Suspense>
      </div>
    </div>
  )
}
