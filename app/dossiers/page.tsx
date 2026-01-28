'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Eye, Trash2, Calendar, Euro } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { dossiersAPI } from '@/lib/api'

const statutLabels: Record<string, { label: string; color: string }> = {
  brouillon: { label: 'Brouillon', color: 'bg-slate-500' },
  en_cours: { label: 'En cours', color: 'bg-blue-500' },
  depose: { label: 'Déposé', color: 'bg-purple-500' },
  accepte: { label: 'Accepté', color: 'bg-green-500' },
  refuse: { label: 'Refusé', color: 'bg-red-500' },
  abandonne: { label: 'Abandonné', color: 'bg-slate-400' },
}

export default function DossiersPage() {
  const router = useRouter()
  const [dossiers, setDossiers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDossiers()
  }, [])

  const loadDossiers = async () => {
    try {
      const data = await dossiersAPI.getAll()
      setDossiers(data)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce dossier ?')) return
    try {
      await dossiersAPI.delete(id)
      loadDossiers()
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression')
    }
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
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Mes dossiers de subvention</h1>
        <p className="text-slate-600">Gérez vos demandes de financement</p>
      </div>

      {dossiers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-slate-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="mb-4">Aucun dossier de subvention</p>
            <Button onClick={() => router.push('/recherche-subventions')}>
              Rechercher des subventions
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {dossiers.map((dossier) => (
            <Card key={dossier.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      {dossier.projet?.titre}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {dossier.dispositif?.nom}
                    </p>
                  </div>
                  <Badge className={statutLabels[dossier.statut]?.color || 'bg-slate-500'}>
                    {statutLabels[dossier.statut]?.label || dossier.statut}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  {dossier.montantDemande && (
                    <div className="flex items-center gap-2 text-sm">
                      <Euro className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-700">
                        Montant demandé: <strong>{dossier.montantDemande.toLocaleString()}€</strong>
                      </span>
                    </div>
                  )}

                  {dossier.echeanceDepot && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-700">
                        Échéance: {new Date(dossier.echeanceDepot).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}

                  <div className="text-sm text-slate-600">
                    Collectivité: {dossier.projet?.collectivite?.nom}
                  </div>
                </div>

                {dossier.notes && (
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                    {dossier.notes}
                  </p>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/dossier/${dossier.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Voir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(dossier.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
