'use client'

import { useEffect, useState } from 'react'
import { Calendar as CalendarIcon, Clock, AlertCircle, FileText, Tag } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { dossiersAPI } from '@/lib/api'

interface Echeance {
  id: string
  type: 'dossier' | 'dispositif'
  titre: string
  description: string
  date: Date
  nomCollectivite?: string
  montantDemande?: number
  dispositifNom?: string
  statut?: string
}

export default function CalendrierPage() {
  const [dossiers, setDossiers] = useState<any[]>([])
  const [dispositifs, setDispositifs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [echeances, setEcheances] = useState<Echeance[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      console.log('📅 Calendrier: Chargement des dossiers...')
      // Charger les dossiers avec échéances
      const dossiersData = await dossiersAPI.getAll()
      console.log('✅ Dossiers chargés:', dossiersData.length, 'dossiers')
      setDossiers(dossiersData)

      // Charger les dispositifs avec dates de clôture
      console.log('📅 Calendrier: Chargement des dispositifs...')
      const dispositifsRes = await fetch('/api/dispositifs')
      if (dispositifsRes.ok) {
        const dispositifsData = await dispositifsRes.json()
        console.log('✅ Dispositifs chargés:', dispositifsData.length, 'dispositifs')
        setDispositifs(dispositifsData)
      } else {
        console.error('❌ Erreur chargement dispositifs:', dispositifsRes.status)
      }

      // Construire la liste des échéances
      const toutesEcheances: Echeance[] = []

      // Ajouter les échéances de dépôt des dossiers
      console.log('📅 Traitement des échéances de dossiers...')
      dossiersData.forEach((dossier: any) => {
        if (dossier.echeanceDepot) {
          console.log(`  ✓ Dossier: ${dossier.projet?.titre} - Échéance: ${dossier.echeanceDepot}`)
          toutesEcheances.push({
            id: `dossier-${dossier.id}`,
            type: 'dossier',
            titre: dossier.projet?.titre || 'Projet sans titre',
            description: `Échéance de dépôt du dossier`,
            date: new Date(dossier.echeanceDepot),
            nomCollectivite: dossier.projet?.collectivite?.nom,
            montantDemande: dossier.montantDemande,
            dispositifNom: dossier.dispositif?.nom,
            statut: dossier.statut
          })
        } else {
          console.log(`  ⊘ Dossier sans échéance: ${dossier.projet?.titre}`)
        }
      })
      console.log(`📊 Total échéances dossiers: ${toutesEcheances.length}`)

      // Charger aussi les dispositifs ouverts (pour information)
      console.log('📅 Traitement des dispositifs ouverts...')
      const dispositifsRes2 = await fetch('/api/dispositifs')
      if (dispositifsRes2.ok) {
        const dispoData = await dispositifsRes2.json()
        const now = new Date()
        let dispositifsCount = 0
        dispoData.forEach((dispositif: any) => {
          if (dispositif.dateCloture) {
            const dateCloture = new Date(dispositif.dateCloture)
            // N'afficher que les dispositifs dont la date de clôture n'est pas encore passée
            if (dateCloture > now) {
              console.log(`  ✓ Dispositif: ${dispositif.nom.substring(0, 50)}... - Clôture: ${dispositif.dateCloture}`)
              toutesEcheances.push({
                id: `dispositif-${dispositif.id}`,
                type: 'dispositif',
                titre: dispositif.nom,
                description: `Clôture de l'appel à projets`,
                date: dateCloture,
                dispositifNom: dispositif.organisme
              })
              dispositifsCount++
            }
          }
        })
        console.log(`📊 Total échéances dispositifs (futurs): ${dispositifsCount}`)
      }

      // Trier par date
      toutesEcheances.sort((a, b) => a.date.getTime() - b.date.getTime())
      console.log(`✅ Total final échéances: ${toutesEcheances.length}`)
      setEcheances(toutesEcheances)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const getJoursRestants = (date: Date) => {
    const now = new Date()
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const getUrgenceBadge = (jours: number) => {
    if (jours < 0) return <Badge variant="destructive">Dépassé</Badge>
    if (jours <= 7) return <Badge className="bg-red-500 text-white">Urgent - {jours}j</Badge>
    if (jours <= 30) return <Badge className="bg-orange-500 text-white">{jours} jours</Badge>
    if (jours <= 60) return <Badge className="bg-yellow-500 text-white">{jours} jours</Badge>
    return <Badge variant="secondary">{jours} jours</Badge>
  }

  const getDossiersEcheances = () => echeances.filter(e => e.type === 'dossier')
  const getDispositifsEcheances = () => echeances.filter(e => e.type === 'dispositif')

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <CalendarIcon className="h-8 w-8" />
          Calendrier des échéances
        </h1>
        <p className="text-muted-foreground">Suivez les dates limites de dépôt de vos dossiers et les clôtures des dispositifs</p>
      </div>

      <Tabs defaultValue="tout" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="tout">
            Toutes ({echeances.length})
          </TabsTrigger>
          <TabsTrigger value="dossiers">
            Mes dossiers ({getDossiersEcheances().length})
          </TabsTrigger>
          <TabsTrigger value="dispositifs">
            Dispositifs ouverts ({getDispositifsEcheances().length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tout" className="space-y-4">
          {echeances.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Aucune échéance à venir</p>
              </CardContent>
            </Card>
          ) : (
            echeances.map((echeance) => {
              const joursRestants = getJoursRestants(echeance.date)
              const isUrgent = joursRestants <= 7 && joursRestants >= 0
              return (
                <Card key={echeance.id} className={isUrgent ? 'border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800' : ''}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {isUrgent && <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
                          {echeance.type === 'dossier' ? (
                            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <Tag className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          )}
                          <h3 className="text-lg font-semibold text-foreground">
                            {echeance.titre}
                          </h3>
                          {getUrgenceBadge(joursRestants)}
                          <Badge variant="outline">
                            {echeance.type === 'dossier' ? 'Dossier' : 'Dispositif'}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground mb-1">
                          {echeance.description}
                        </p>

                        {echeance.dispositifNom && (
                          <p className="text-sm text-muted-foreground">
                            {echeance.type === 'dossier' ? 'Dispositif' : 'Organisme'}: {echeance.dispositifNom}
                          </p>
                        )}

                        {echeance.nomCollectivite && (
                          <p className="text-sm text-muted-foreground">
                            Collectivité: {echeance.nomCollectivite}
                          </p>
                        )}

                        {echeance.montantDemande && (
                          <p className="text-sm font-medium text-foreground mt-2">
                            Montant demandé: {echeance.montantDemande.toLocaleString()}€
                          </p>
                        )}

                        {echeance.statut && (
                          <Badge variant="secondary" className="mt-2">
                            {echeance.statut}
                          </Badge>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-muted-foreground mb-1">
                          {echeance.type === 'dossier' ? 'Échéance dépôt' : 'Date de clôture'}
                        </div>
                        <div className="text-lg font-bold text-foreground">
                          {echeance.date.toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="dossiers" className="space-y-4">
          {getDossiersEcheances().length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Aucun dossier avec échéance</p>
              </CardContent>
            </Card>
          ) : (
            getDossiersEcheances().map((echeance) => {
              const joursRestants = getJoursRestants(echeance.date)
              const isUrgent = joursRestants <= 7 && joursRestants >= 0
              return (
                <Card key={echeance.id} className={isUrgent ? 'border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800' : ''}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {isUrgent && <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
                          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          <h3 className="text-lg font-semibold text-foreground">
                            {echeance.titre}
                          </h3>
                          {getUrgenceBadge(joursRestants)}
                        </div>

                        <p className="text-sm text-muted-foreground mb-1">
                          {echeance.description}
                        </p>

                        {echeance.dispositifNom && (
                          <p className="text-sm text-muted-foreground">
                            Dispositif: {echeance.dispositifNom}
                          </p>
                        )}

                        {echeance.nomCollectivite && (
                          <p className="text-sm text-muted-foreground">
                            Collectivité: {echeance.nomCollectivite}
                          </p>
                        )}

                        {echeance.montantDemande && (
                          <p className="text-sm font-medium text-foreground mt-2">
                            Montant demandé: {echeance.montantDemande.toLocaleString()}€
                          </p>
                        )}

                        {echeance.statut && (
                          <Badge variant="secondary" className="mt-2">
                            {echeance.statut}
                          </Badge>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-muted-foreground mb-1">Échéance dépôt</div>
                        <div className="text-lg font-bold text-foreground">
                          {echeance.date.toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="dispositifs" className="space-y-4">
          {getDispositifsEcheances().length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Aucun dispositif ouvert actuellement</p>
              </CardContent>
            </Card>
          ) : (
            getDispositifsEcheances().map((echeance) => {
              const joursRestants = getJoursRestants(echeance.date)
              const isUrgent = joursRestants <= 7 && joursRestants >= 0
              return (
                <Card key={echeance.id} className={isUrgent ? 'border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800' : ''}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {isUrgent && <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
                          <Tag className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          <h3 className="text-lg font-semibold text-foreground">
                            {echeance.titre}
                          </h3>
                          {getUrgenceBadge(joursRestants)}
                        </div>

                        <p className="text-sm text-muted-foreground mb-1">
                          {echeance.description}
                        </p>

                        {echeance.dispositifNom && (
                          <p className="text-sm text-muted-foreground">
                            Organisme: {echeance.dispositifNom}
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-muted-foreground mb-1">Date de clôture</div>
                        <div className="text-lg font-bold text-foreground">
                          {echeance.date.toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
