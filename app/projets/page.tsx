'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, FolderKanban, Eye, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { projetsAPI } from '@/lib/api'

export default function ProjetsPage() {
  const router = useRouter()
  const [projets, setProjets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProjets()
  }, [])

  const loadProjets = async () => {
    try {
      const data = await projetsAPI.getAll()
      setProjets(data)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce projet ?')) return
    try {
      await projetsAPI.delete(id)
      loadProjets()
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Mes projets</h1>
          <p className="text-slate-600">Gérez vos projets de collectivité</p>
        </div>

        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          onClick={() => router.push('/projet/nouveau')}
        >
          <Plus className="h-5 w-5" />
          Nouveau projet
        </Button>
      </div>

      {projets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-slate-500">
            <FolderKanban className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="mb-4">Aucun projet. Créez votre premier projet.</p>
            <Button onClick={() => router.push('/projet/nouveau')}>
              Créer un projet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projets.map((projet) => (
            <Card key={projet.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      {projet.titre}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {projet.collectivite?.nom}
                    </p>
                  </div>
                  <Badge variant="secondary">{projet.statut}</Badge>
                </div>

                {projet.description && (
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                    {projet.description}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  {projet.typeProjet && (
                    <div className="text-sm text-slate-600">
                      Type: {projet.typeProjet}
                    </div>
                  )}
                  
                  {projet.montantTtc && (
                    <div className="text-sm font-medium text-slate-700">
                      Budget: {parseFloat(projet.montantTtc).toLocaleString()}€ TTC
                    </div>
                  )}

                  {projet.dateDebut && (
                    <div className="text-sm text-slate-600">
                      Début: {new Date(projet.dateDebut).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/projet/${projet.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Voir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/projet/${projet.id}/edit`)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(projet.id)}
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
