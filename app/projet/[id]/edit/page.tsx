'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { projetsAPI, collectivitesAPI } from '@/lib/api'

export default function EditProjetPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [collectivites, setCollectivites] = useState<any[]>([])
  const [formData, setFormData] = useState({
    titre: '',
    collectiviteId: '',
    typeProjet: '',
    description: '',
    montantHt: '',
    montantTtc: '',
    maturite: '',
    calendrierDebut: '',
    calendrierFin: '',
    objectifs: '',
    statut: '',
  })

  useEffect(() => {
    loadData()
  }, [params.id])

  const loadData = async () => {
    try {
      const [projet, collsData] = await Promise.all([
        projetsAPI.getById(params.id as string),
        collectivitesAPI.getAll()
      ])

      setFormData({
        titre: projet.titre || '',
        collectiviteId: projet.collectiviteId || '',
        typeProjet: projet.typeProjet || '',
        description: projet.description || '',
        montantHt: projet.montantHt || '',
        montantTtc: projet.montantTtc || '',
        maturite: projet.maturite || '',
        calendrierDebut: projet.calendrierDebut ? projet.calendrierDebut.split('T')[0] : '',
        calendrierFin: projet.calendrierFin ? projet.calendrierFin.split('T')[0] : '',
        objectifs: projet.objectifs || '',
        statut: projet.statut || 'brouillon',
      })

      setCollectivites(collsData)
    } catch (error) {
      console.error('Erreur chargement:', error)
      alert('Erreur lors du chargement du projet')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Auto-calculer TTC
    if (field === 'montantHt' && value) {
      const ht = parseFloat(value)
      if (!isNaN(ht)) {
        setFormData(prev => ({
          ...prev,
          montantTtc: (ht * 1.20).toFixed(2)
        }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const dataToSend = {
        ...formData,
        montantHt: formData.montantHt ? parseFloat(formData.montantHt) : null,
        montantTtc: formData.montantTtc ? parseFloat(formData.montantTtc) : null,
        calendrierDebut: formData.calendrierDebut ? new Date(formData.calendrierDebut).toISOString() : null,
        calendrierFin: formData.calendrierFin ? new Date(formData.calendrierFin).toISOString() : null,
      }

      await projetsAPI.update(params.id as string, dataToSend)
      router.push(`/projet/${params.id}`)
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
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
      <Button
        variant="ghost"
        onClick={() => router.push(`/projet/${params.id}`)}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Annuler
      </Button>

      <h1 className="text-3xl font-bold text-slate-900 mb-8">Modifier le projet</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Titre du projet *</label>
                  <Input
                    value={formData.titre}
                    onChange={(e) => handleChange('titre', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Collectivité *</label>
                  <Select value={formData.collectiviteId} onValueChange={(val) => handleChange('collectiviteId', val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {collectivites.map(coll => (
                        <SelectItem key={coll.id} value={coll.id}>{coll.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Type de projet</label>
                  <Select value={formData.typeProjet} onValueChange={(val) => handleChange('typeProjet', val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="équipement public">Équipement public</SelectItem>
                      <SelectItem value="voirie">Voirie/Mobilité</SelectItem>
                      <SelectItem value="rénovation énergétique">Rénovation énergétique</SelectItem>
                      <SelectItem value="bâtiment public">Bâtiment public</SelectItem>
                      <SelectItem value="infrastructure">Infrastructure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Objectifs</label>
                  <Textarea
                    value={formData.objectifs}
                    onChange={(e) => handleChange('objectifs', e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Montant HT (€)</label>
                    <Input
                      type="number"
                      value={formData.montantHt}
                      onChange={(e) => handleChange('montantHt', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Montant TTC (€)</label>
                    <Input
                      type="number"
                      value={formData.montantTtc}
                      disabled
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
                <CardTitle>Statut et calendrier</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Statut</label>
                  <Select value={formData.statut} onValueChange={(val) => handleChange('statut', val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brouillon">Brouillon</SelectItem>
                      <SelectItem value="actif">En cours</SelectItem>
                      <SelectItem value="a_preparer">Prêt à déposer</SelectItem>
                      <SelectItem value="termine">Terminé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Maturité</label>
                  <Select value={formData.maturite} onValueChange={(val) => handleChange('maturite', val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="idée">Idée</SelectItem>
                      <SelectItem value="études préliminaires">Études préliminaires</SelectItem>
                      <SelectItem value="études en cours">Études en cours</SelectItem>
                      <SelectItem value="projet défini">Projet défini</SelectItem>
                      <SelectItem value="consultation">Consultation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Date de début</label>
                  <Input
                    type="date"
                    value={formData.calendrierDebut}
                    onChange={(e) => handleChange('calendrierDebut', e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Date de fin</label>
                  <Input
                    type="date"
                    value={formData.calendrierFin}
                    onChange={(e) => handleChange('calendrierFin', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
