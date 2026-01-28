'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Calendar, Euro, MapPin, Building2, FileText, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { dispositifsAPI, projetsAPI } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function DispositifDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [dispositif, setDispositif] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showSelectDialog, setShowSelectDialog] = useState(false)
  const [projets, setProjets] = useState<any[]>([])

  useEffect(() => {
    if (params.id) {
      loadData()
    }
  }, [params.id])

  const loadData = async () => {
    try {
      const [dispositifData, projetsData] = await Promise.all([
        dispositifsAPI.getById(params.id as string),
        projetsAPI.getAll()
      ])
      setDispositif(dispositifData)
      setProjets(projetsData)
    } catch (error) {
      console.error('Erreur chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDossier = () => {
    setShowSelectDialog(true)
  }

  const handleSelectProject = (projetId: string) => {
    // TODO: Créer un dossier de subvention
    console.log('Créer un dossier pour le projet', projetId, 'avec le dispositif', dispositif.id)
    setShowSelectDialog(false)
    // Rediriger vers le projet
    router.push(`/projet/${projetId}`)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!dispositif) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => router.push('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <p className="text-center text-slate-500 mt-8">Dispositif non trouvé</p>
      </div>
    )
  }

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
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{dispositif.nom}</h1>
            <p className="text-lg text-slate-600">{dispositif.organisme}</p>
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
                {dispositif.description || 'Aucune description disponible'}
              </p>
            </CardContent>
          </Card>

          {/* Critères d'éligibilité */}
          {dispositif.criteresEligibilite && (
            <Card>
              <CardHeader>
                <CardTitle>Critères d'éligibilité</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 whitespace-pre-line">{dispositif.criteresEligibilite}</p>
              </CardContent>
            </Card>
          )}

          {/* Documents requis */}
          {dispositif.documentsRequis && dispositif.documentsRequis.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Documents requis</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {dispositif.documentsRequis.map((doc: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{doc}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Types de projets éligibles */}
          {dispositif.typesProjets && dispositif.typesProjets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Types de projets éligibles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {dispositif.typesProjets.map((type: string, idx: number) => (
                    <Badge key={idx} variant="secondary">
                      {type}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informations clés */}
          <Card>
            <CardHeader>
              <CardTitle>Informations clés</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Organisme financeur */}
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Organisme</p>
                  <p className="text-sm text-slate-600">{dispositif.organisme || 'Non spécifié'}</p>
                </div>
              </div>

              {/* Taux de subvention */}
              {dispositif.tauxMax && (
                <div className="flex items-start gap-3">
                  <Euro className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Taux de subvention</p>
                    <p className="text-sm text-slate-600">
                      {dispositif.tauxMin && `${dispositif.tauxMin}% - `}
                      {dispositif.tauxMax}% maximum
                    </p>
                  </div>
                </div>
              )}

              {/* Montants */}
              {(dispositif.montantMin || dispositif.montantMax) && (
                <div className="flex items-start gap-3">
                  <Euro className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Montant</p>
                    <p className="text-sm text-slate-600">
                      {dispositif.montantMin && `${dispositif.montantMin.toLocaleString()}€ min`}
                      {dispositif.montantMin && dispositif.montantMax && ' - '}
                      {dispositif.montantMax && `${dispositif.montantMax.toLocaleString()}€ max`}
                    </p>
                  </div>
                </div>
              )}

              {/* Zones éligibles */}
              {dispositif.zonesEligibles && dispositif.zonesEligibles.length > 0 && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Zones éligibles</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {dispositif.zonesEligibles.map((zone: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {zone}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Dates */}
              {(dispositif.dateOuverture || dispositif.dateCloture) && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Calendrier</p>
                    {dispositif.dateOuverture && (
                      <p className="text-sm text-slate-600">
                        Ouverture: {new Date(dispositif.dateOuverture).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                    {dispositif.dateCloture && (
                      <p className="text-sm text-slate-600">
                        Clôture: {new Date(dispositif.dateCloture).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* URL */}
              {dispositif.url && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Plus d'informations</p>
                    <a
                      href={dispositif.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Voir sur le site officiel
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bouton d'action principal */}
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleCreateDossier}
          >
            Associer à un projet
          </Button>
        </div>
      </div>

      {/* Dialog pour sélectionner un projet */}
      <Dialog open={showSelectDialog} onOpenChange={setShowSelectDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Associer à un projet</DialogTitle>
            <DialogDescription>
              Sélectionnez le projet pour lequel vous souhaitez créer un dossier de subvention avec <strong>{dispositif.nom}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
            {projets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500 mb-4">Aucun projet disponible.</p>
                <Button onClick={() => router.push('/')}>
                  Créer un nouveau projet
                </Button>
              </div>
            ) : (
              projets.map((projet) => (
                <Card
                  key={projet.id}
                  className="cursor-pointer hover:bg-slate-50 hover:border-blue-300 transition-colors"
                  onClick={() => handleSelectProject(projet.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{projet.titre}</h4>
                        <p className="text-sm text-slate-600 mt-1">
                          {projet.collectivite?.nom}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          {projet.montantTtc && (
                            <span className="text-sm text-slate-500">
                              💶 {parseFloat(projet.montantTtc).toLocaleString()}€
                            </span>
                          )}
                          {projet.typeProjet && (
                            <Badge variant="secondary" className="text-xs">
                              {projet.typeProjet}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
