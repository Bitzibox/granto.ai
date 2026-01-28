'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Edit, Trash2, Calendar, Euro, Building2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { projetsAPI } from '@/lib/api'

export default function ProjetDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [projet, setProjet] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      loadProjet(params.id as string)
    }
  }, [params.id])

  const loadProjet = async (id: string) => {
    try {
      const data = await projetsAPI.getById(id)
      setProjet(data)
    } catch (error) {
      console.error('Erreur chargement projet:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) return
    
    try {
      await projetsAPI.delete(params.id as string)
      router.push('/')
    } catch (error) {
      console.error('Erreur suppression:', error)
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

  if (!projet) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-slate-500">Projet non trouvé</p>
      </div>
    )
  }

  const statusConfig: any = {
    actif: { label: 'En cours', class: 'bg-blue-100 text-blue-800' },
    brouillon: { label: 'Brouillon', class: 'bg-slate-100 text-slate-800' },
    a_preparer: { label: 'Prêt à déposer', class: 'bg-amber-100 text-amber-800' },
  }

  const status = statusConfig[projet.statut] || statusConfig.brouillon

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{projet.titre}</h1>
            <Badge className={`${status.class} rounded-full`}>
              {status.label}
            </Badge>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/projet/${projet.id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700">
                {projet.description || 'Aucune description'}
              </p>
            </CardContent>
          </Card>

          {/* Objectifs */}
          {projet.objectifs && (
            <Card>
              <CardHeader>
                <CardTitle>Objectifs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700">{projet.objectifs}</p>
              </CardContent>
            </Card>
          )}

          {/* Dossiers de subvention */}
          <Card>
            <CardHeader>
              <CardTitle>Dossiers de subvention</CardTitle>
            </CardHeader>
            <CardContent>
              {projet.dossiers && projet.dossiers.length > 0 ? (
                <div className="space-y-3">
                  {projet.dossiers.map((dossier: any) => (
                    <div key={dossier.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{dossier.dispositif?.nom || 'Dispositif'}</h4>
                          <p className="text-sm text-slate-600">
                            Montant demandé: {parseFloat(dossier.montantDemande || 0).toLocaleString()}€
                          </p>
                        </div>
                        <Badge variant="secondary">{dossier.statut}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">Aucun dossier de subvention</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informations clés */}
          <Card>
            <CardHeader>
              <CardTitle>Informations clés</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {projet.collectivite && (
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Collectivité</p>
                    <p className="text-sm text-slate-600">{projet.collectivite.nom}</p>
                  </div>
                </div>
              )}

              {projet.typeProjet && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Type de projet</p>
                    <p className="text-sm text-slate-600">{projet.typeProjet}</p>
                  </div>
                </div>
              )}

              {projet.montantTtc && (
                <div className="flex items-start gap-3">
                  <Euro className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Budget</p>
                    <p className="text-sm text-slate-600">
                      {parseFloat(projet.montantTtc).toLocaleString()}€ TTC
                    </p>
                    {projet.montantHt && (
                      <p className="text-xs text-slate-500">
                        ({parseFloat(projet.montantHt).toLocaleString()}€ HT)
                      </p>
                    )}
                  </div>
                </div>
              )}

              {projet.calendrierDebut && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Calendrier</p>
                    <p className="text-sm text-slate-600">
                      Début: {new Date(projet.calendrierDebut).toLocaleDateString('fr-FR')}
                    </p>
                    {projet.calendrierFin && (
                      <p className="text-sm text-slate-600">
                        Fin: {new Date(projet.calendrierFin).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {projet.maturite && (
                <div>
                  <p className="text-sm font-medium text-slate-900 mb-1">Maturité</p>
                  <Badge variant="secondary">{projet.maturite}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Suivi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-slate-500">Créé le</p>
                <p className="text-sm text-slate-900">
                  {new Date(projet.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Dernière modification</p>
                <p className="text-sm text-slate-900">
                  {new Date(projet.updatedAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
