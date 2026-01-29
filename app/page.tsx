'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  FolderKanban, 
  Euro, 
  TrendingUp, 
  Clock,
  Plus,
  ArrowRight,
  CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { projetsAPI, dossiersAPI } from '@/lib/api'

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState({
    projetsActifs: 0,
    montantTotal: 0,
    subventionsDemandees: 0,
    actionsRequises: 0,
    totalProjets: 0,
    dossiersDeposes: 0
  })
  const [projetsRecents, setProjetsRecents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [projets, dossiers] = await Promise.all([
        projetsAPI.getAll(),
        dossiersAPI.getAll()
      ])

      const projetsActifs = projets.filter((p: any) => p.statut === 'en_cours')
      const montantTotal = projets.reduce((sum: number, p: any) => 
        sum + (parseFloat(p.montantTtc) || 0), 0
      )
      const subventionsDemandees = dossiers.reduce((sum: number, d: any) => 
        sum + (d.montantDemande || 0), 0
      )
      const dossiersDeposes = dossiers.filter((d: any) => d.statut === 'depose').length

      setStats({
        projetsActifs: projetsActifs.length,
        montantTotal,
        subventionsDemandees,
        actionsRequises: 0,
        totalProjets: projets.length,
        dossiersDeposes
      })

      setProjetsRecents(projets.slice(0, 3))
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2 text-gradient-primary">Tableau de bord</h1>
          <p className="text-muted-foreground text-lg">Vue d'ensemble de vos projets et subventions</p>
        </div>
        <Button
          size="lg"
          className="gap-2 shadow-glow-primary"
          onClick={() => router.push('/projet/nouveau')}
        >
          <Plus className="h-5 w-5" />
          Nouveau projet
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-gradient">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Projets actifs</p>
                <p className="text-3xl font-bold text-foreground">{stats.projetsActifs}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalProjets} projets au total
                </p>
              </div>
              <div className="bg-gradient-primary p-3 rounded-xl shadow-glow-primary">
                <FolderKanban className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gradient">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Montant total</p>
                <p className="text-3xl font-bold text-foreground">
                  {Math.round(stats.montantTotal / 1000)}k€
                </p>
                <p className="text-xs text-muted-foreground mt-1">Coût estimé des projets</p>
              </div>
              <div className="bg-gradient-accent p-3 rounded-xl shadow-glow-accent">
                <Euro className="h-6 w-6 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gradient">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Subventions demandées</p>
                <p className="text-3xl font-bold text-foreground">
                  {Math.round(stats.subventionsDemandees / 1000)}k€
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.dossiersDeposes} dossiers déposés
                </p>
              </div>
              <div className="bg-gradient-primary p-3 rounded-xl shadow-glow-primary">
                <TrendingUp className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gradient">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Actions requises</p>
                <p className="text-3xl font-bold text-foreground">{stats.actionsRequises}</p>
                <p className="text-xs text-muted-foreground mt-1">0 urgentes cette semaine</p>
              </div>
              <div className="bg-gradient-accent p-3 rounded-xl shadow-glow-accent">
                <Clock className="h-6 w-6 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projets récents */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Projets récents</h2>
          <Button
            variant="ghost"
            className="gap-1"
            onClick={() => router.push('/projets')}
          >
            Voir tout
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {projetsRecents.length === 0 ? (
          <Card className="bg-gradient-card">
            <CardContent className="p-12 text-center">
              <FolderKanban className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="mb-4 text-muted-foreground">Aucun projet. Créez votre premier projet.</p>
              <Button size="lg" onClick={() => router.push('/projet/nouveau')}>
                Créer un projet
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projetsRecents.map((projet) => (
              <Card key={projet.id} className="cursor-pointer group"
                    onClick={() => router.push(`/projet/${projet.id}`)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">{projet.titre}</CardTitle>
                    <Badge variant="secondary">{projet.statut}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {projet.collectivite?.nom}
                  </p>
                  {projet.typeProjet && (
                    <Badge variant="outline" className="mb-2">
                      {projet.typeProjet}
                    </Badge>
                  )}
                  {projet.montantTtc && (
                    <p className="text-sm font-medium text-foreground mt-2">
                      {parseFloat(projet.montantTtc).toLocaleString()}€
                    </p>
                  )}
                  {projet._count?.dossiers > 0 && (
                    <div className="flex items-center gap-1 text-sm text-primary mt-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{projet._count.dossiers} subvention(s)</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Section À faire */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            À faire
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-primary opacity-50" />
            <p className="text-lg font-medium text-primary mb-1">Tout est à jour !</p>
            <p className="text-sm text-muted-foreground">Aucune action urgente à traiter</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
