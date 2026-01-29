'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  FileText,
  Calendar,
  Euro,
  Building2,
  Save,
  ExternalLink,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
// API functions inline pour éviter les problèmes de bundling
const fetchDossier = async (id: string) => {
  const response = await fetch(`/api/dossiers/${id}`)
  if (!response.ok) throw new Error('Dossier non trouvé')
  return response.json()
}

const updateDossier = async (id: string, data: any) => {
  const response = await fetch(`/api/dossiers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) throw new Error('Erreur lors de la mise à jour')
  return response.json()
}

const statutOptions = [
  { value: 'brouillon', label: 'Brouillon', color: 'bg-slate-500' },
  { value: 'en_cours', label: 'En cours', color: 'bg-blue-500' },
  { value: 'depose', label: 'Déposé', color: 'bg-purple-500' },
  { value: 'accepte', label: 'Accepté', color: 'bg-green-500' },
  { value: 'refuse', label: 'Refusé', color: 'bg-red-500' },
  { value: 'abandonne', label: 'Abandonné', color: 'bg-slate-400' },
]

export default function DossierDetailPage() {
  const router = useRouter()
  const params = useParams()
  const dossierId = params.id as string

  const [dossier, setDossier] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Form state
  const [statut, setStatut] = useState('')
  const [montantDemande, setMontantDemande] = useState('')
  const [montantAccorde, setMontantAccorde] = useState('')
  const [tauxRetenu, setTauxRetenu] = useState('')
  const [echeanceDepot, setEcheanceDepot] = useState('')
  const [dateDepot, setDateDepot] = useState('')
  const [dateDecision, setDateDecision] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (dossierId) {
      loadDossier()
    }
  }, [dossierId])

  const loadDossier = async () => {
    try {
      setLoading(true)
      const data = await fetchDossier(dossierId)
      setDossier(data)

      // Initialize form fields
      setStatut(data.statut || 'brouillon')
      setMontantDemande(data.montantDemande?.toString() || '')
      setMontantAccorde(data.montantAccorde?.toString() || '')
      setTauxRetenu(data.tauxRetenu?.toString() || '')
      setEcheanceDepot(data.echeanceDepot ? data.echeanceDepot.split('T')[0] : '')
      setDateDepot(data.dateDepot ? data.dateDepot.split('T')[0] : '')
      setDateDecision(data.dateDecision ? data.dateDecision.split('T')[0] : '')
      setNotes(data.notes || '')
    } catch (err) {
      console.error('Erreur:', err)
      setError('Impossible de charger le dossier')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      await updateDossier(dossierId, {
        statut,
        montantDemande: montantDemande ? parseFloat(montantDemande) : null,
        montantAccorde: montantAccorde ? parseFloat(montantAccorde) : null,
        tauxRetenu: tauxRetenu ? parseFloat(tauxRetenu) : null,
        echeanceDepot: echeanceDepot || null,
        dateDepot: dateDepot || null,
        dateDecision: dateDecision || null,
        notes,
      })

      setSuccessMessage('Dossier enregistré avec succès')
      setTimeout(() => setSuccessMessage(null), 3000)

      // Reload to get fresh data
      loadDossier()
    } catch (err) {
      console.error('Erreur:', err)
      setError('Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const getStatutInfo = (statutValue: string) => {
    return statutOptions.find(s => s.value === statutValue) || statutOptions[0]
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error && !dossier) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/dossiers')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux dossiers
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dossiers')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux dossiers
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {dossier?.projet?.titre || 'Dossier de subvention'}
            </h1>
            <p className="text-slate-600">
              {dossier?.dispositif?.nom || 'Dispositif non spécifié'}
            </p>
          </div>
          <Badge className={getStatutInfo(statut).color}>
            {getStatutInfo(statut).label}
          </Badge>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-green-800">{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations du projet */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informations du projet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Projet
                </label>
                <p className="text-slate-900 font-medium">{dossier?.projet?.titre}</p>
                {dossier?.projet?.description && (
                  <p className="text-sm text-slate-600 mt-1">{dossier?.projet?.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Collectivité
                </label>
                <p className="text-slate-900">{dossier?.projet?.collectivite?.nom}</p>
              </div>

              {dossier?.dispositif?.url && (
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(dossier.dispositif.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Voir le dispositif
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statut et montants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Statut et montants
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Statut du dossier
                </label>
                <Select value={statut} onValueChange={setStatut}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statutOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Montant demandé (€)
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={montantDemande}
                    onChange={(e) => setMontantDemande(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Montant accordé (€)
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={montantAccorde}
                    onChange={(e) => setMontantAccorde(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Taux retenu (%)
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  min="0"
                  max="100"
                  value={tauxRetenu}
                  onChange={(e) => setTauxRetenu(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Dates importantes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Échéance de dépôt
                  </label>
                  <Input
                    type="date"
                    value={echeanceDepot}
                    onChange={(e) => setEcheanceDepot(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Date de dépôt
                  </label>
                  <Input
                    type="date"
                    value={dateDepot}
                    onChange={(e) => setDateDepot(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Date de décision
                  </label>
                  <Input
                    type="date"
                    value={dateDecision}
                    onChange={(e) => setDateDecision(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Ajoutez des notes sur ce dossier..."
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Save button */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => router.push('/dossiers')}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Dispositif info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" />
                Dispositif
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-slate-900">{dossier?.dispositif?.nom}</p>
                {dossier?.dispositif?.organisme && (
                  <p className="text-slate-600">{dossier?.dispositif?.organisme}</p>
                )}
              </div>

              {dossier?.dispositif?.description && (
                <p className="text-slate-600 line-clamp-4">
                  {dossier?.dispositif?.description}
                </p>
              )}

              {dossier?.dispositif?.dateCloture && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="h-4 w-4" />
                  <span>
                    Clôture: {new Date(dossier.dispositif.dateCloture).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}

              {dossier?.dispositif?.url && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open(dossier.dispositif.url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Voir sur Aides-Territoires
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historique</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-green-500"></div>
                  <div>
                    <p className="text-slate-900">Dossier créé</p>
                    <p className="text-slate-500">
                      {dossier?.createdAt
                        ? new Date(dossier.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })
                        : '-'}
                    </p>
                  </div>
                </div>

                {dossier?.dateDepot && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                    <div>
                      <p className="text-slate-900">Dossier déposé</p>
                      <p className="text-slate-500">
                        {new Date(dossier.dateDepot).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {dossier?.dateDecision && (
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 mt-2 rounded-full ${
                      dossier.statut === 'accepte' ? 'bg-green-500' :
                      dossier.statut === 'refuse' ? 'bg-red-500' : 'bg-purple-500'
                    }`}></div>
                    <div>
                      <p className="text-slate-900">Décision rendue</p>
                      <p className="text-slate-500">
                        {new Date(dossier.dateDecision).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-slate-300"></div>
                  <div>
                    <p className="text-slate-900">Dernière mise à jour</p>
                    <p className="text-slate-500">
                      {dossier?.updatedAt
                        ? new Date(dossier.updatedAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
