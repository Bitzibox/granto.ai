'use client'

import { useEffect, useState } from 'react'
import { Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { dossiersAPI } from '@/lib/api'

export default function CalendrierPage() {
  const [dossiers, setDossiers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDossiers()
  }, [])

  const loadDossiers = async () => {
    try {
      const data = await dossiersAPI.getAll()
      // Trier par date d'échéance
      const sorted = data
        .filter((d: any) => d.echeanceDepot)
        .sort((a: any, b: any) => 
          new Date(a.echeanceDepot).getTime() - new Date(b.echeanceDepot).getTime()
        )
      setDossiers(sorted)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const getJoursRestants = (date: string) => {
    const now = new Date()
    const echeance = new Date(date)
    const diff = Math.ceil((echeance.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const getUrgenceBadge = (jours: number) => {
    if (jours < 0) return <Badge variant="destructive">Dépassé</Badge>
    if (jours <= 7) return <Badge className="bg-red-500">Urgent - {jours}j</Badge>
    if (jours <= 30) return <Badge className="bg-orange-500">{jours} jours</Badge>
    return <Badge variant="secondary">{jours} jours</Badge>
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
          <CalendarIcon className="h-8 w-8" />
          Calendrier des échéances
        </h1>
        <p className="text-slate-600">Suivez les dates limites de dépôt de vos dossiers</p>
      </div>

      {dossiers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-slate-500">
            <Clock className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p>Aucune échéance à venir</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {dossiers.map((dossier) => {
            const joursRestants = getJoursRestants(dossier.echeanceDepot)
            return (
              <Card key={dossier.id} className={joursRestants <= 7 ? 'border-red-300 bg-red-50' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {joursRestants <= 7 && <AlertCircle className="h-5 w-5 text-red-600" />}
                        <h3 className="text-lg font-semibold text-slate-900">
                          {dossier.projet?.titre}
                        </h3>
                        {getUrgenceBadge(joursRestants)}
                      </div>
                      
                      <p className="text-sm text-slate-600 mb-1">
                        Dispositif: {dossier.dispositif?.nom}
                      </p>
                      
                      <p className="text-sm text-slate-600">
                        Collectivité: {dossier.projet?.collectivite?.nom}
                      </p>
                      
                      {dossier.montantDemande && (
                        <p className="text-sm font-medium text-slate-700 mt-2">
                          Montant demandé: {dossier.montantDemande.toLocaleString()}€
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-slate-600 mb-1">Échéance</div>
                      <div className="text-lg font-bold text-slate-900">
                        {new Date(dossier.echeanceDepot).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
