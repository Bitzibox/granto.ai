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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Tableau de bord</h1>
          <p className="text-slate-600">Vue d'ensemble de vos projets et subventions</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          onClick={() => router.push('/projet/nouveau')}
        >
          <Plus className="h-5 w-5" />
          Nouveau projet
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Projets actifs</p>
                <p className="text-3xl font-bold text-slate-900">{stats.projetsActifs}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {stats.totalProjets} projets au total
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <FolderKanban className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Montant total</p>
                <p className="text-3xl font-bold text-slate-900">
                  {Math.round(stats.montantTotal / 1000)}k€
                </p>
                <p className="text-xs text-slate-500 mt-1">Coût estimé des projets</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Euro className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Subventions demandées</p>
                <p className="text-3xl font-bold text-slate-900">
                  {Math.round(stats.subventionsDemandees / 1000)}k€
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {stats.dossiersDeposes} dossiers déposés
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Actions requises</p>
                <p className="text-3xl font-bold text-slate-900">{stats.actionsRequises}</p>
                <p className="text-xs text-slate-500 mt-1">0 urgentes cette semaine</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projets récents */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Projets récents</h2>
          <Button 
            variant="ghost" 
            className="text-blue-600 hover:text-blue-700"
            onClick={() => router.push('/projets')}
          >
            Voir tout
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {projetsRecents.length === 0 ? (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projetsRecents.map((projet) => (
              <Card key={projet.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => router.push(`/projet/${projet.id}`)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{projet.titre}</CardTitle>
                    <Badge variant="secondary">{projet.statut}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-3">
                    {projet.collectivite?.nom}
                  </p>
                  {projet.typeProjet && (
                    <Badge variant="outline" className="mb-2">
                      {projet.typeProjet}
                    </Badge>
                  )}
                  {projet.montantTtc && (
                    <p className="text-sm font-medium text-slate-700 mt-2">
                      {parseFloat(projet.montantTtc).toLocaleString()}€
                    </p>
                  )}
                  {projet._count?.dossiers > 0 && (
                    <div className="flex items-center gap-1 text-sm text-green-600 mt-2">
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            À faire
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-300" />
            <p className="text-lg font-medium text-green-600 mb-1">Tout est à jour !</p>
            <p className="text-sm">Aucune action urgente à traiter</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
