'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2, FolderPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Fonctions API inline pour éviter les problèmes de bundling
const fetchCollectivites = async () => {
  const response = await fetch('/api/collectivites')
  if (!response.ok) throw new Error('Erreur chargement collectivités')
  return response.json()
}

const createProjet = async (data: any) => {
  const response = await fetch('/api/projets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Erreur création projet')
  }
  return response.json()
}

const TYPES_PROJET = [
  { value: 'equipement_public', label: 'Équipement public' },
  { value: 'voirie', label: 'Voirie / Mobilité' },
  { value: 'renovation_energetique', label: 'Rénovation énergétique' },
  { value: 'batiment_public', label: 'Bâtiment public' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'environnement', label: 'Environnement' },
  { value: 'numerique', label: 'Numérique' },
  { value: 'culture', label: 'Culture / Sport' },
  { value: 'autre', label: 'Autre' },
]

export default function NouveauProjetPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [collectivites, setCollectivites] = useState<any[]>([])

  const [formData, setFormData] = useState({
    titre: '',
    collectiviteId: '',
    typeProjet: '',
    description: '',
    montantHt: '',
    montantTtc: '',
    dateDebut: '',
    dateFin: '',
    statut: 'brouillon',
  })

  useEffect(() => {
    loadCollectivites()
  }, [])

  const loadCollectivites = async () => {
    try {
      const data = await fetchCollectivites()
      setCollectivites(data)
      // Sélectionner automatiquement la première collectivité
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, collectiviteId: data[0].id }))
      }
    } catch (err) {
      console.error('Erreur:', err)
      setError('Impossible de charger les collectivités')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Auto-calculer TTC (TVA 20%)
    if (field === 'montantHt' && value) {
      const ht = parseFloat(value)
      if (!isNaN(ht)) {
        setFormData(prev => ({ ...prev, montantTtc: (ht * 1.20).toFixed(2) }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.titre.trim()) {
      setError('Le titre est obligatoire')
      return
    }

    if (!formData.collectiviteId) {
      setError('Veuillez sélectionner une collectivité')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const dataToSend = {
        titre: formData.titre.trim(),
        collectiviteId: formData.collectiviteId,
        typeProjet: formData.typeProjet || null,
        description: formData.description || null,
        montantHt: formData.montantHt || null,
        montantTtc: formData.montantTtc || null,
        dateDebut: formData.dateDebut ? new Date(formData.dateDebut).toISOString() : null,
        dateFin: formData.dateFin ? new Date(formData.dateFin).toISOString() : null,
        statut: formData.statut,
      }

      const projet = await createProjet(dataToSend)
      router.push(`/projet/${projet.id}`)
    } catch (err) {
      console.error('Erreur:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la création')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => router.push('/projets')}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour aux projets
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
          <FolderPlus className="h-8 w-8 text-blue-600" />
          Nouveau projet
        </h1>
        <p className="text-slate-600">
          Créez un nouveau projet pour votre collectivité
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
                <CardDescription>Décrivez votre projet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Titre du projet <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.titre}
                    onChange={(e) => handleChange('titre', e.target.value)}
                    placeholder="Ex: Rénovation de la salle des fêtes"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Collectivité <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.collectiviteId}
                    onValueChange={(val) => handleChange('collectiviteId', val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une collectivité" />
                    </SelectTrigger>
                    <SelectContent>
                      {collectivites.map(coll => (
                        <SelectItem key={coll.id} value={coll.id}>
                          {coll.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Type de projet
                  </label>
                  <Select
                    value={formData.typeProjet}
                    onValueChange={(val) => handleChange('typeProjet', val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES_PROJET.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Décrivez votre projet en quelques lignes..."
                    className="min-h-[120px]"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Budget prévisionnel</CardTitle>
                <CardDescription>Estimation du coût du projet</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Montant HT (€)
                    </label>
                    <Input
                      type="number"
                      value={formData.montantHt}
                      onChange={(e) => handleChange('montantHt', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Montant TTC (€)
                    </label>
                    <Input
                      type="number"
                      value={formData.montantTtc}
                      onChange={(e) => handleChange('montantTtc', e.target.value)}
                      placeholder="Calculé automatiquement"
                      className="bg-slate-50"
                    />
                    <p className="text-xs text-slate-500 mt-1">TVA 20% appliquée automatiquement</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Calendrier</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Statut
                  </label>
                  <Select
                    value={formData.statut}
                    onValueChange={(val) => handleChange('statut', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brouillon">Brouillon</SelectItem>
                      <SelectItem value="actif">En cours</SelectItem>
                      <SelectItem value="termine">Terminé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Date de début prévue
                  </label>
                  <Input
                    type="date"
                    value={formData.dateDebut}
                    onChange={(e) => handleChange('dateDebut', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Date de fin prévue
                  </label>
                  <Input
                    type="date"
                    value={formData.dateFin}
                    onChange={(e) => handleChange('dateFin', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Créer le projet
                </>
              )}
            </Button>

            <p className="text-xs text-slate-500 text-center">
              Vous pourrez modifier ces informations à tout moment
            </p>
          </div>
        </div>
      </form>
    </div>
  )
}
