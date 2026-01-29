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
  Plus,
  TrendingUp,
  X,
  Loader2,
  CheckCircle2
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Types d'aide disponibles
const TYPES_AIDE = [
  { value: '', label: 'Tous les types' },
  { value: 'grant', label: 'Subvention' },
  { value: 'loan', label: 'Prêt' },
  { value: 'recoverable_advance', label: 'Avance récupérable' },
  { value: 'tax_benefit', label: 'Avantage fiscal' },
  { value: 'cee', label: 'CEE' },
  { value: 'technical_engineering', label: 'Ingénierie technique' },
  { value: 'financial_engineering', label: 'Ingénierie financière' },
  { value: 'legal_engineering', label: 'Ingénierie juridique' },
  { value: 'other', label: 'Autre' },
]

// Catégories thématiques
const CATEGORIES = [
  { value: '', label: 'Toutes les catégories' },
  { value: 'environnement', label: 'Environnement' },
  { value: 'energie', label: 'Énergie' },
  { value: 'urbanisme', label: 'Urbanisme' },
  { value: 'mobilite', label: 'Mobilité' },
  { value: 'culture', label: 'Culture' },
  { value: 'education', label: 'Éducation' },
  { value: 'sante', label: 'Santé' },
  { value: 'numerique', label: 'Numérique' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'tourisme', label: 'Tourisme' },
]

export function GrantSearch() {
  const router = useRouter()
  const [territoire, setTerritoire] = useState('')
  const [motsCles, setMotsCles] = useState('')
  const [typeAide, setTypeAide] = useState('')
  const [categorie, setCategorie] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDispositif, setSelectedDispositif] = useState<any>(null)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [addingToProject, setAddingToProject] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  // Fonction pour obtenir le badge territorial
  const getTerritorialBadge = (scale: string) => {
    const badges = {
      'Pays': { label: '🇫🇷 National', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      'France': { label: '🇫🇷 National', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      'Région': { label: '🏛️ Régional', color: 'bg-green-100 text-green-800 border-green-200' },
      'Département': { label: '🏢 Départemental', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      'Commune': { label: '🏘️ Local', color: 'bg-orange-100 text-orange-800 border-orange-200' },
      'EPCI': { label: '🏘️ Intercommunal', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    }
    return badges[scale] || { label: scale, color: 'bg-gray-100 text-gray-800 border-gray-200' }
  }

  // Fonction pour calculer le score de compatibilité
  const calculateCompatibilityScore = (aid: any, searchTerritoire: string, searchMotsCles: string) => {
    let score = 0
    let details = []

    // 1. Correspondance du territoire (40 points)
    if (aid.perimeter && searchTerritoire) {
      const perimeterLower = aid.perimeter.toLowerCase()
      const territoireLower = searchTerritoire.toLowerCase()
      
      if (perimeterLower.includes(territoireLower) || territoireLower.includes(perimeterLower)) {
        score += 40
        details.push('Territoire correspond')
      } else if (aid.perimeter_scale === 'Région' || aid.perimeter_scale === 'France') {
        score += 20
        details.push('Territoire couvert')
      }
    } else if (aid.perimeter_scale === 'France') {
      score += 30
      details.push('National (tout territoire)')
    }

    // 2. Correspondance des mots-clés (40 points)
    if (searchMotsCles) {
      const keywords = searchMotsCles.toLowerCase().split(' ')
      const description = (aid.description || '').toLowerCase()
      const name = (aid.name || '').toLowerCase()
      
      let keywordMatches = 0
      keywords.forEach(keyword => {
        if (keyword.length > 2) {
          if (name.includes(keyword)) {
            keywordMatches += 2
          } else if (description.includes(keyword)) {
            keywordMatches += 1
          }
        }
      })
      
      const keywordScore = Math.min(40, keywordMatches * 10)
      score += keywordScore
      if (keywordScore > 20) {
        details.push('Mots-clés correspondent')
      } else if (keywordScore > 0) {
        details.push('Mots-clés partiels')
      }
    }

    // 3. Disponibilité et statut (20 points)
    if (aid.is_live) {
      score += 10
      details.push('Aide active')
    }
    
    if (!aid.submission_deadline || new Date(aid.submission_deadline) > new Date()) {
      score += 10
      details.push('Candidature ouverte')
    }

    return { score: Math.min(100, Math.round(score)), details }
  }

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

  const handleSearch = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault()
    setLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      const params = new URLSearchParams()
      if (territoire) params.append('targeted_audiences', territoire)
      if (motsCles) params.append('text', motsCles)
      if (typeAide) params.append('aid_types', typeAide)
      if (categorie) params.append('categories', categorie)

      const response = await fetch(
        `/api/aides-territoires/search?${params.toString()}`
      )

      if (!response.ok) {
        throw new Error('Erreur lors de la recherche')
      }

      const data = await response.json()

      // Calculer les scores de compatibilité et trier
      const resultsWithScores = (data.results || []).map(aid => ({
        ...aid,
        compatibility: calculateCompatibilityScore(aid, territoire, motsCles)
      }))

      // Trier par score décroissant
      resultsWithScores.sort((a, b) => b.compatibility.score - a.compatibility.score)

      setResults(resultsWithScores)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  // Réinitialiser les filtres
  const handleClearFilters = () => {
    setTerritoire('')
    setMotsCles('')
    setTypeAide('')
    setCategorie('')
  }

  const handleAddToProject = async (projectId: string) => {
    if (!selectedDispositif) return
    setAddingToProject(projectId)

    try {
      // Construire l'URL du dispositif
      const dispositifUrl = selectedDispositif.url || `https://aides-territoires.beta.gouv.fr/aides/${selectedDispositif.slug}/`

      // 1. D'abord créer ou récupérer le dispositif
      const dispositifResponse = await fetch('/api/dispositifs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nom: selectedDispositif.name,
          description: selectedDispositif.description || '',
          organisme: selectedDispositif.financers?.[0] || 'Non spécifié',
          typesProjets: selectedDispositif.categories || [],
          url: dispositifUrl,
          dateOuverture: selectedDispositif.start_date || null,
          dateCloture: selectedDispositif.submission_deadline || null,
          montantMin: selectedDispositif.subvention_rate_lower_bound || null,
          montantMax: selectedDispositif.subvention_rate_upper_bound || null,
          criteresEligibilite: selectedDispositif.eligibility || '',
          zonesEligibles: selectedDispositif.perimeter ? [selectedDispositif.perimeter] : [],
        }),
      })

      if (!dispositifResponse.ok) {
        const errorData = await dispositifResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erreur lors de la création du dispositif')
      }

      const dispositif = await dispositifResponse.json()

      // 2. Ensuite créer le dossier de subvention
      const dossierResponse = await fetch('/api/dossiers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projetId: projectId,
          dispositifId: dispositif.id,
        }),
      })

      if (!dossierResponse.ok) {
        const errorData = await dossierResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erreur lors de la création du dossier')
      }

      setSuccessMessage(`Dossier créé avec succès pour "${selectedDispositif.name}"`)
      setShowProjectModal(false)
      setSelectedDispositif(null)

      // Masquer le message de succès après 5 secondes
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err) {
      console.error('Erreur:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du dossier')
    } finally {
      setAddingToProject(null)
    }
  }

  const handleViewOnAidesTerritoires = (dispositif: any) => {
    // Utiliser external_url si disponible, sinon construire l'URL
    const baseUrl = 'https://aides-territoires.beta.gouv.fr'
    let url = dispositif.external_url

    if (!url || !url.startsWith('http')) {
      // Construire l'URL à partir du slug
      url = `${baseUrl}/aides/${dispositif.slug}/`
    }

    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200'
    if (score >= 40) return 'text-orange-600 bg-orange-50 border-orange-200'
    return 'text-gray-600 bg-gray-50 border-gray-200'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Recherche de subventions</h1>
        <p className="text-slate-600">
          Trouvez les aides et subventions adaptées à votre projet
        </p>
      </div>

      {/* Message de succès */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-green-800">{successMessage}</span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => setSuccessMessage(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Critères de recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  placeholder="Ex: panneaux solaires"
                  value={motsCles}
                  onChange={(e) => setMotsCles(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Building2 className="h-4 w-4 inline mr-2" />
                  Type d'aide
                </label>
                <Select value={typeAide} onValueChange={setTypeAide}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES_AIDE.map((type) => (
                      <SelectItem key={type.value} value={type.value || 'all'}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Filter className="h-4 w-4 inline mr-2" />
                  Catégorie
                </label>
                <Select value={categorie} onValueChange={setCategorie}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value || 'all'}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Recherche en cours...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Rechercher
                  </>
                )}
              </Button>
              {(territoire || motsCles || typeAide || categorie) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  Effacer
                </Button>
              )}
            </div>
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

          {results.map((dispositif: any) => {
            const territorialBadge = getTerritorialBadge(dispositif.perimeter_scale)
            const compatibility = dispositif.compatibility || { score: 0, details: [] }
            
            return (
              <Card key={dispositif.id} className="border border-slate-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border font-semibold text-sm ${getScoreColor(compatibility.score)}`}>
                          <TrendingUp className="h-4 w-4" />
                          {compatibility.score}% compatible
                        </div>
                        <Badge className={territorialBadge.color + ' border'}>
                          {territorialBadge.label}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg mb-2">
                        {dispositif.name}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {dispositif.perimeter && (
                          <Badge variant="outline" className="text-xs">
                            📍 {dispositif.perimeter}
                          </Badge>
                        )}
                        {dispositif.aid_types_full?.map((type: any, idx: number) => (
                          <Badge key={idx} variant="secondary">
                            {type.name}
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
                          {dispositif.financers[0]}
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

                  {compatibility.details.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {compatibility.details.map((detail, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          ✓ {detail}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
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
            )
          })}
        </div>
      )}

      <Dialog open={showProjectModal} onOpenChange={setShowProjectModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Associer à un projet</DialogTitle>
          </DialogHeader>

          {selectedDispositif && (
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-slate-600 mb-1">Aide sélectionnée :</p>
              <p className="font-medium">{selectedDispositif.name}</p>
            </div>
          )}

          {loadingProjects ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-400 mb-2" />
              <p className="text-slate-600">Chargement des projets...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600 mb-4">
                Vous n'avez pas encore de projet
              </p>
              <Button onClick={() => router.push('/projets')}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un projet
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Sélectionnez un projet pour y associer cette aide :
              </p>
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className={`cursor-pointer hover:shadow-md transition-all border-2 ${
                    addingToProject === project.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-transparent hover:border-slate-200'
                  }`}
                  onClick={() => !addingToProject && handleAddToProject(project.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">{project.titre}</h3>
                        <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                          {project.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          {project.montantTtc && (
                            <span className="flex items-center gap-1">
                              <Euro className="h-3 w-3" />
                              {parseFloat(project.montantTtc).toLocaleString('fr-FR')} € TTC
                            </span>
                          )}
                          <Badge variant="outline">{project.statut}</Badge>
                        </div>
                      </div>
                      {addingToProject === project.id && (
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      )}
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
