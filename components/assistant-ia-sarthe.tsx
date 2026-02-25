'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Sparkles, Loader2, FileText, ExternalLink, Download, TrendingUp, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface PdfTemplate {
  id: string
  nom: string
  description?: string
  isDefault?: boolean
}

export function AssistantIASarthe() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [description, setDescription] = useState('')
  const [commune, setCommune] = useState('')
  const [budget, setBudget] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultats, setResultats] = useState<any>(null)
  const [error, setError] = useState('')
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null)
  const [templates, setTemplates] = useState<PdfTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('system-default')

  // Pré-remplir depuis les URL params (prioritaire) ou localStorage (fallback)
  useEffect(() => {
    // 1. D'abord vérifier les URL query params
    const urlDescription = searchParams.get('description')
    const urlCommune = searchParams.get('commune')
    const urlBudget = searchParams.get('budget')

    if (urlDescription || urlCommune || urlBudget) {
      // Pré-remplir depuis l'URL
      if (urlDescription) setDescription(urlDescription)
      if (urlCommune) setCommune(urlCommune)
      if (urlBudget) setBudget(urlBudget)
      return
    }

    // 2. Sinon fallback sur localStorage
    try {
      const prefillData = localStorage.getItem('chatbot_prefill')
      if (prefillData) {
        const data = JSON.parse(prefillData)

        // Vérifier que c'est récent (< 5 minutes)
        const age = Date.now() - data.timestamp
        if (age < 5 * 60 * 1000 && data.path === '/recherche-subventions' && data.params) {
          if (data.params.description) setDescription(data.params.description)
          if (data.params.commune) setCommune(data.params.commune)
          if (data.params.budget) setBudget(data.params.budget.toString())

          // Nettoyer après utilisation
          localStorage.removeItem('chatbot_prefill')
        }
      }
    } catch (err) {
      console.error('Erreur lecture chatbot_prefill:', err)
    }
  }, [searchParams])

  // Charger les templates disponibles
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        // TODO: Récupérer userId depuis le contexte d'authentification
        const res = await fetch('/api/pdf-templates')
        if (res.ok) {
          const data = await res.json()
          setTemplates(data)

          // Pré-sélectionner le template par défaut
          const defaultTemplate = data.find((t: PdfTemplate) => t.isDefault)
          if (defaultTemplate) {
            setSelectedTemplateId(defaultTemplate.id)
          }
        }
      } catch (err) {
        console.error('Erreur chargement templates:', err)
      }
    }
    loadTemplates()
  }, [])

  const handleAnalyse = async () => {
    if (!description.trim() || !commune.trim() || !budget) {
      setError('Veuillez remplir tous les champs')
      return
    }

    setLoading(true)
    setError('')
    setResultats(null)

    try {
      const res = await fetch('/api/assistant-ia/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          commune: commune.trim(),
          budget: parseInt(budget)
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erreur lors de l\'analyse')
      }

      const data = await res.json()
      setResultats(data)
    } catch (err: any) {
      console.error('Erreur:', err)
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePdf = async (aide: any) => {
    if (!resultats) return

    setGeneratingPdf(aide.id)

    try {
      const res = await fetch('/api/assistant-ia/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aide,
          commune: resultats.commune,
          analysis: resultats.analysis,
          collectivite: resultats.commune?.nom || commune,
          templateId: selectedTemplateId,
          userId: null // TODO: Récupérer depuis le contexte d'authentification
        })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur génération PDF' }))
        throw new Error(err.error || 'Erreur lors de la génération du PDF')
      }

      // Télécharger le PDF
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Dossier_${aide.slug || 'subvention'}_${Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

    } catch (err: any) {
      console.error('Erreur PDF:', err)
      alert(err.message || 'Erreur lors de la génération du PDF')
    } finally {
      setGeneratingPdf(null)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
    if (score >= 60) return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
    return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent match'
    if (score >= 60) return 'Bon match'
    return 'Match possible'
  }

  const handleVoirToutesLesAides = () => {
    if (!resultats) return

    // Construire les paramètres de recherche pour la recherche classique
    const params = new URLSearchParams()
    params.set('territoire', resultats.commune?.nom || commune)
    params.set('text', description)

    // Recharger la page avec les paramètres pour pré-remplir la recherche classique
    // La recherche classique va lire ces params et auto-lancer la recherche
    window.location.href = `/recherche-subventions?${params.toString()}#recherche-classique`
  }

  return (
    <div className="space-y-6">
      {/* Assistant IA Card - Prominent */}
      <Card className="border-2 border-primary shadow-lg bg-gradient-to-br from-primary/5 to-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">Assistant IA Sarthe</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Décrivez votre projet, obtenez les meilleures aides en secondes
              </p>
            </div>
            <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              Nouveau
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Formulaire */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Décrivez votre projet *
              </label>
              <Textarea
                placeholder="Ex: Rénovation voirie principale avec éclairage LED"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-24 resize-none"
                disabled={loading}
              />
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Commune *
                </label>
                <Input
                  placeholder="Saint-Mars-la-Brière"
                  value={commune}
                  onChange={(e) => setCommune(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Budget estimé (€) *
                </label>
                <Input
                  type="number"
                  placeholder="50000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleAnalyse}
            disabled={loading}
            size="lg"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg py-6"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Trouver les meilleures aides
              </>
            )}
          </Button>

          {/* Error */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
              {error}
            </div>
          )}

          {/* Résultats */}
          {resultats && (
            <div className="space-y-4 mt-6 pt-6 border-t border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  🎯 Top 3 des aides pour votre projet
                </h3>
                <Badge variant="outline" className="text-sm">
                  {resultats.total_found} aides analysées
                </Badge>
              </div>

              {/* Sélecteur de template PDF */}
              {templates.length > 0 && (
                <Card className="bg-gradient-to-r from-purple-500/5 to-pink-500/5 border-purple-200 dark:border-purple-800">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Template PDF pour vos dossiers
                        </label>
                        <select
                          value={selectedTemplateId}
                          onChange={(e) => setSelectedTemplateId(e.target.value)}
                          className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {templates.map((template) => (
                            <option key={template.id} value={template.id}>
                              {template.nom}
                              {template.isDefault ? ' (Par défaut)' : ''}
                              {template.description ? ` - ${template.description}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                {resultats.aides.map((aide: any, index: number) => (
                  <Card key={aide.id} className="border-2 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 text-center">
                          <div className="text-3xl font-bold text-primary">
                            #{index + 1}
                          </div>
                          <Badge className={`mt-2 ${getScoreColor(aide.score)}`}>
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {aide.score}%
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {getScoreLabel(aide.score)}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground mb-1">
                            {aide.name}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {aide.financers?.[0] || 'Non spécifié'}
                          </p>

                          {/* Explication IA */}
                          <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 mb-3">
                            <p className="text-sm text-foreground leading-relaxed">
                              <Sparkles className="h-4 w-4 inline mr-1" />
                              {aide.explication}
                            </p>
                          </div>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {aide.perimeter && (
                              <Badge variant="outline" className="text-xs">
                                📍 {aide.perimeter}
                              </Badge>
                            )}
                            {aide.aid_types_full?.[0] && (
                              <Badge variant="outline" className="text-xs">
                                💰 {aide.aid_types_full[0].name}
                              </Badge>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(aide.external_url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Voir l'aide
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleGeneratePdf(aide)}
                              disabled={generatingPdf === aide.id}
                            >
                              {generatingPdf === aide.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  Génération...
                                </>
                              ) : (
                                <>
                                  <Download className="h-4 w-4 mr-1" />
                                  Télécharger dossier
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Autres aides disponibles */}
              {resultats.autres_aides && resultats.autres_aides.length > 0 && (
                <div className="mt-8 pt-6 border-t border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    📋 Autres aides disponibles ({resultats.autres_aides.length})
                  </h3>
                  <div className="space-y-3">
                    {resultats.autres_aides.map((aide: any, index: number) => (
                      <Card key={aide.id} className="border hover:shadow-sm transition-shadow">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              <Badge className={`${getScoreColor(aide.score)}`}>
                                {aide.score}%
                              </Badge>
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-foreground text-sm mb-1">
                                {aide.name}
                              </h4>
                              <p className="text-xs text-muted-foreground mb-2">
                                {aide.financers?.[0] || 'Non spécifié'} • {aide.perimeter}
                              </p>

                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => window.open(aide.external_url, '_blank')}
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Détails
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="h-7 text-xs bg-slate-600 hover:bg-slate-700"
                                  onClick={() => handleGeneratePdf(aide)}
                                  disabled={generatingPdf === aide.id}
                                >
                                  {generatingPdf === aide.id ? (
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  ) : (
                                    <Download className="h-3 w-3 mr-1" />
                                  )}
                                  PDF
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Bouton Voir toutes les aides */}
              <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-2 border-blue-500/20">
                <CardContent className="p-6 text-center">
                  <Search className="h-12 w-12 mx-auto mb-3 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Explorer toutes les aides disponibles
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Vous voulez voir plus de résultats? Accédez à la recherche classique avec {resultats.total_found} aides analysées
                  </p>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                    onClick={handleVoirToutesLesAides}
                  >
                    <Search className="h-5 w-5 mr-2" />
                    Voir toutes les aides ({resultats.total_found})
                  </Button>
                </CardContent>
              </Card>

              {/* CTA Global */}
              <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-2 border-green-500/20">
                <CardContent className="p-6 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-green-600 dark:text-green-400" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Dossier complet prêt à déposer
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Téléchargez un PDF professionnel avec plan de financement, calendrier et pièces requises
                  </p>
                  <Button
                    size="lg"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleGeneratePdf(resultats.aides[0])}
                    disabled={generatingPdf !== null}
                  >
                    {generatingPdf ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Génération en cours...
                      </>
                    ) : (
                      <>
                        <Download className="h-5 w-5 mr-2" />
                        Télécharger le dossier complet (PDF)
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
