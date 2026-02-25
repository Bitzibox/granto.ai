'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Loader2, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Fonctions API inline
const fetchCollectivite = async (id: string) => {
  const response = await fetch(`/api/collectivites/${id}`)
  if (!response.ok) throw new Error('Collectivité non trouvée')
  return response.json()
}

const updateCollectivite = async (id: string, data: any) => {
  const response = await fetch(`/api/collectivites/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Erreur mise à jour')
  }
  return response.json()
}

const TYPES_COLLECTIVITE = [
  { value: 'Commune', label: 'Commune' },
  { value: 'EPCI', label: 'EPCI' },
  { value: 'Département', label: 'Département' },
  { value: 'Région', label: 'Région' },
]

export default function EditCollectivitePage() {
  const router = useRouter()
  const params = useParams()
  const collectiviteId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nom: '',
    type: 'Commune',
    siret: '',
    adresse: '',
    codePostal: '',
    ville: '',
    email: '',
    telephone: ''
  })

  useEffect(() => {
    if (collectiviteId) {
      loadData()
    }
  }, [collectiviteId])

  const loadData = async () => {
    try {
      const collectivite = await fetchCollectivite(collectiviteId)

      setFormData({
        nom: collectivite.nom || '',
        type: collectivite.type || 'Commune',
        siret: collectivite.siret || '',
        adresse: collectivite.adresse || '',
        codePostal: collectivite.codePostal || '',
        ville: collectivite.ville || '',
        email: collectivite.email || '',
        telephone: collectivite.telephone || '',
      })
    } catch (err) {
      console.error('Erreur chargement collectivité:', err)
      setError('Impossible de charger la collectivité')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nom.trim()) {
      setError('Le nom est obligatoire')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const dataToSend = {
        nom: formData.nom.trim(),
        type: formData.type,
        siret: formData.siret || null,
        adresse: formData.adresse || null,
        codePostal: formData.codePostal || null,
        ville: formData.ville || null,
        email: formData.email || null,
        telephone: formData.telephone || null,
      }

      await updateCollectivite(collectiviteId, dataToSend)
      router.push('/collectivites')
    } catch (err) {
      console.error('Erreur sauvegarde:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
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
        onClick={() => router.push('/collectivites')}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour à la liste
      </Button>

      <div className="mb-8 flex items-center gap-4">
        <div className="bg-blue-100 p-4 rounded-lg">
          <Building2 className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Modifier la collectivité
          </h1>
          <p className="text-slate-600">
            Modifiez les informations de votre collectivité territoriale
          </p>
        </div>
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
                <CardDescription>Informations principales de la collectivité</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.nom}
                    onChange={(e) => handleChange('nom', e.target.value)}
                    required
                    placeholder="Mairie de..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Type <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.type}
                      onValueChange={(val) => handleChange('type', val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPES_COLLECTIVITE.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      SIRET
                    </label>
                    <Input
                      value={formData.siret}
                      onChange={(e) => handleChange('siret', e.target.value)}
                      placeholder="12345678900012"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Adresse</CardTitle>
                <CardDescription>Coordonnées postales</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Adresse
                  </label>
                  <Input
                    value={formData.adresse}
                    onChange={(e) => handleChange('adresse', e.target.value)}
                    placeholder="Rue, avenue..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Code postal
                    </label>
                    <Input
                      value={formData.codePostal}
                      onChange={(e) => handleChange('codePostal', e.target.value)}
                      placeholder="75000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Ville
                    </label>
                    <Input
                      value={formData.ville}
                      onChange={(e) => handleChange('ville', e.target.value)}
                      placeholder="Paris"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="contact@mairie.fr"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Téléphone
                  </label>
                  <Input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => handleChange('telephone', e.target.value)}
                    placeholder="01 23 45 67 89"
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
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
