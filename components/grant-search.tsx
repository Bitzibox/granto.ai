'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  MapPin,
  Calendar,
  Euro,
  Building2,
  Filter,
  ExternalLink,
  Plus
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function GrantSearch() {
  const router = useRouter()
  const [territoire, setTerritoire] = useState('')
  const [motsCles, setMotsCles] = useState('')
  const [typeAide, setTypeAide] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDispositif, setSelectedDispositif] = useState<any>(null)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)

  // Charger les projets quand la modale s'ouvre
  useEffect(() => {
    if (showProjectModal && selectedDispositif) {
      loadProjects()
    }
  }, [showProjectModal, selectedDispositif])

  const loadProjects = async () => {
    setLoadingProjects(true)
    try {
      const response = await fetch('/api/projets')
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (err) {
      console.error('Erreur lors du chargement des projets:', err)
    } finally {
      setLoadingProjects(false)
    }
  }

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (territoire) params.append('targeted_audiences', territoire)
      if (motsCles) params.append('text', motsCles)
      if (typeAide) params.append('aid_types', typeAide)

      const response = await fetch(
        `/api/aides-territoires/search?${params.toString()}`
      )

      if (!response.ok) {
        throw new Error('Erreur lors de la recherche')
      }

      const data = await response.json()
      setResults(data.results || [])
} catch (err) {
  setError(err instanceof Error ? err.message : 'Une erreur est survenue')
  console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToProject = async (projectId: string) => {
  if (!selectedDispositif) return;
    try {
      const response = await fetch('/api/dossiers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projet_id: projectId,
          dispositif_id: selectedDispositif.id,
          nom: `Dossier ${selectedDispositif.name}`,
          statut: 'brouillon',
          dispositif_data: selectedDispositif
        }),
      })

      if (response.ok) {
        alert('✅ Dossier créé avec succès !')
        setShowProjectModal(false)
        setSelectedDispositif(null)
      } else {
        alert('❌ Erreur lors de la création du dossier')
      }
    } catch (err) {
      console.error('Erreur:', err)
      alert('❌ Erreur lors de la création du dossier')
    }
  }

  const handleViewOnAidesTerritoires = (dispositif) => {
    // L'API Aides-Territoires fournit l'URL complète dans le champ "url"
    if (dispositif.url) {
      window.open(dispositif.url, '_blank')
    } else {
      // Fallback si l'URL n'est pas fournie : construire l'URL à partir du slug
      const baseUrl = 'https://aides-territoires.beta.gouv.fr/aides'
      const url = dispositif.slug 
        ? `${baseUrl}/${dispositif.slug}/`
        : `${baseUrl}/?text=${encodeURIComponent(dispositif.name)}`
      window.open(url, '_blank')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Recherche de subventions</h1>
        <p className="text-slate-600">
          Trouvez les aides et subventions adaptées à votre projet
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Critères de recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <MapPin className="h-4 w-4 inline mr-2" />
                  Territoire
                </label>
                <Input
                  placeholder="Ex: Saint-Mars-la-Brière"
                  value={territoire}
                  onChange={(e) => setTerritoire(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Filter className="h-4 w-4 inline mr-2" />
                  Mots-clés
                </label>
                <Input
                  placeholder="Ex: panneaux solaires, rénovation"
                  value={motsCles}
                  onChange={(e) => setMotsCles(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Building2 className="h-4 w-4 inline mr-2" />
                  Type d'aide
                </label>
                <Input
                  placeholder="Ex: subvention, prêt"
                  value={typeAide}
                  onChange={(e) => setTypeAide(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Recherche en cours...' : 'Rechercher'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">❌ {error}</p>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            {results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
          </h2>

          {results.map((dispositif) => (
            <Card key={dispositif.id} className="border border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">
                      {dispositif.name}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {dispositif.aid_types?.map((type, idx) => (
                        <Badge key={idx} variant="secondary">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-slate-700 line-clamp-3">
                  {dispositif.description || 'Aucune description disponible'}
                </p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {dispositif.financers && dispositif.financers.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-600">
                        {dispositif.financers[0].name}
                      </span>
                    </div>
                  )}

                  {dispositif.submission_deadline && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-600">
                        Date limite: {new Date(dispositif.submission_deadline).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/dispositif/${dispositif.id}`)
                    }}
                  >
                    Voir les détails
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleViewOnAidesTerritoires(dispositif)
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Voir sur Aides-Territoires
                  </Button>
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedDispositif(dispositif)
                      setShowProjectModal(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter à mes projets
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showProjectModal} onOpenChange={setShowProjectModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Associer à un projet</DialogTitle>
          </DialogHeader>

          {loadingProjects ? (
            <p>Chargement des projets...</p>
          ) : projects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600 mb-4">
                Vous n'avez pas encore de projet
              </p>
              <Button onClick={() => router.push('/projets')}>
                Créer un projet
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleAddToProject(project.id)}
                >
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">{project.nom}</h3>
                    <p className="text-sm text-slate-600 mb-2">
                      {project.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      {project.budget && (
                        <span className="flex items-center gap-1">
                          <Euro className="h-3 w-3" />
                          {project.budget.toLocaleString('fr-FR')} €
                        </span>
                      )}
                      <Badge variant="outline">{project.statut}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
