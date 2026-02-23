'use client'

import { useState } from 'react'
import { Sparkles, Loader2, FileText, ExternalLink, Download, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export function AssistantIASarthe() {
  const [description, setDescription] = useState('')
  const [commune, setCommune] = useState('')
  const [budget, setBudget] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultats, setResultats] = useState<any>(null)
  const [error, setError] = useState('')

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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-300'
    if (score >= 60) return 'bg-blue-100 text-blue-800 border-blue-300'
    return 'bg-orange-100 text-orange-800 border-orange-300'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent match'
    if (score >= 60) return 'Bon match'
    return 'Match possible'
  }

  return (
    <div className="space-y-6">
      {/* Assistant IA Card - Prominent */}
      <Card className="border-2 border-blue-500 shadow-lg bg-gradient-to-br from-blue-50 to-white">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">Assistant IA Sarthe</CardTitle>
              <p className="text-sm text-slate-600 mt-1">
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
              <label className="block text-sm font-medium text-slate-700 mb-2">
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
                <label className="block text-sm font-medium text-slate-700 mb-2">
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
                <label className="block text-sm font-medium text-slate-700 mb-2">
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              {error}
            </div>
          )}

          {/* Résultats */}
          {resultats && (
            <div className="space-y-4 mt-6 pt-6 border-t">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  🎯 Top 3 des aides pour votre projet
                </h3>
                <Badge variant="outline" className="text-sm">
                  {resultats.total_found} aides analysées
                </Badge>
              </div>

              <div className="space-y-4">
                {resultats.aides.map((aide: any, index: number) => (
                  <Card key={aide.id} className="border-2 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 text-center">
                          <div className="text-3xl font-bold text-blue-600">
                            #{index + 1}
                          </div>
                          <Badge className={`mt-2 ${getScoreColor(aide.score)}`}>
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {aide.score}%
                          </Badge>
                          <div className="text-xs text-slate-600 mt-1">
                            {getScoreLabel(aide.score)}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900 mb-1">
                            {aide.name}
                          </h4>
                          <p className="text-sm text-slate-600 mb-2">
                            {aide.financers?.[0] || 'Non spécifié'}
                          </p>

                          {/* Explication IA */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                            <p className="text-sm text-blue-900 leading-relaxed">
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
                              onClick={() => {
                                // TODO: Générer PDF
                                alert('Génération PDF bientôt disponible')
                              }}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Télécharger dossier
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* CTA Global */}
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
                <CardContent className="p-6 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-green-600" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Dossier complet prêt à déposer
                  </h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Téléchargez un PDF professionnel avec plan de financement, calendrier et pièces requises
                  </p>
                  <Button
                    size="lg"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      // TODO: Générer PDF complet
                      alert('Génération PDF complet bientôt disponible')
                    }}
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Télécharger le dossier complet (PDF)
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
