'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Plus,
  Grid3x3,
  List,
  Building2,
  Calendar,
  FileText,
  ChevronRight,
  MoreVertical,
  FolderOpen,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { NewProjectDialog } from '@/components/new-project-dialog'
import { projetsAPI } from '@/lib/api'
import { useRouter } from 'next/navigation'


type ViewMode = 'grid' | 'table'
type SortType = 'recent' | 'ancien' | 'montant-asc' | 'montant-desc' | 'nom'

const statusConfig: any = {
  actif: { label: 'En cours', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  brouillon: { label: 'Brouillon', className: 'bg-slate-100 text-slate-800 hover:bg-slate-100' },
  'a_preparer': { label: 'Prêt à déposer', className: 'bg-amber-100 text-amber-800 hover:bg-amber-100' },
  termine: { label: 'Terminé', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
}

export function ProjectsList() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('tous')
  const [typeFilter, setTypeFilter] = useState('tous')
  const [sortBy, setSortBy] = useState<SortType>('recent')
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const data = await projetsAPI.getAll()
      setProjects(data)
    } catch (error) {
      console.error('Erreur chargement projets:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setProjects(projects.map(p => p.id))
    } else {
      setSelectedProjects([])
    }
  }

  const handleSelectProject = (projectId: string, checked: boolean) => {
    if (checked) {
      setSelectedProjects([...selectedProjects, projectId])
    } else {
      setSelectedProjects(selectedProjects.filter(id => id !== projectId))
    }
  }

  // Calculer un pourcentage de complétion basé sur la maturité
  const getCompletionFromMaturite = (maturite: string) => {
    const levels: any = {
      'idée': 10,
      'études en cours': 30,
      'études préliminaires': 30,
      'APD': 50,
      'projet défini': 60,
      'PRO': 70,
      'consultation': 80,
      'travaux': 90,
    }
    return levels[maturite] || 50
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Mes projets</h1>
        <NewProjectDialog />
      </div>

      {/* Filters Bar */}
      <Card className="mb-6 border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Search Input */}
            <div className="relative flex-1 lg:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher un projet..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 flex-1">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous</SelectItem>
                  <SelectItem value="brouillon">Brouillon</SelectItem>
                  <SelectItem value="actif">En cours</SelectItem>
                  <SelectItem value="a_preparer">Prêt à déposer</SelectItem>
                  <SelectItem value="termine">Terminé</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous types</SelectItem>
                  <SelectItem value="équipement">Équipement public</SelectItem>
                  <SelectItem value="voirie">Voirie/Mobilité</SelectItem>
                  <SelectItem value="énergie">Énergie/Climat</SelectItem>
                  <SelectItem value="santé">Santé/Social</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortType)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Plus récents</SelectItem>
                  <SelectItem value="ancien">Plus anciens</SelectItem>
                  <SelectItem value="montant-asc">Montant croissant</SelectItem>
                  <SelectItem value="montant-desc">Montant décroissant</SelectItem>
                  <SelectItem value="nom">Nom A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Toggle */}
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                className={viewMode === 'grid' ? 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white' : 'hover:bg-slate-200'}
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={viewMode === 'table' ? 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white' : 'hover:bg-slate-200'}
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Projects Bar */}
      {selectedProjects.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <span className="text-sm text-blue-900 font-medium">
            {selectedProjects.length} sélectionné{selectedProjects.length > 1 ? 's' : ''}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setSelectedProjects([])}>
            Désélectionner
          </Button>
        </div>
      )}

      {projects.length === 0 ? (
        <Card className="border border-slate-200">
          <CardContent className="p-12 text-center text-slate-500">
            <p className="text-lg mb-4">Aucun projet pour le moment</p>
            <NewProjectDialog />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => {
                const status = statusConfig[project.statut] || statusConfig['brouillon']
                const completion = getCompletionFromMaturite(project.maturite)
                
                return (
                  <Card
                    key={project.id}
                    className="border border-slate-200 hover:shadow-lg transition-shadow cursor-pointer group"
                    onClick={() => router.push(`/projet/${project.id}`)}
		    >
                    <CardContent className="p-6">
                      {/* Status Badge & Menu */}
                      <div className="flex items-start justify-between mb-4">
                        <Badge className={`${status.className} rounded-full text-xs font-medium`}>
                          {status.label}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Modifier</DropdownMenuItem>
                            <DropdownMenuItem>Dupliquer</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">Supprimer</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Title & Collectivité */}
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">{project.titre}</h3>
                      {project.collectivite && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                          <Building2 className="h-4 w-4" />
                          <span>{project.collectivite.nom}</span>
                        </div>
                      )}

                      {/* Type Badge & Amount */}
                      <div className="flex items-center justify-between mb-4">
                        {project.typeProjet && (
                          <Badge variant="secondary" className="text-xs">
                            {project.typeProjet}
                          </Badge>
                        )}
                        {project.montantTtc && (
                          <span className="text-lg font-semibold text-slate-900">
                            {formatAmount(parseFloat(project.montantTtc))}
                          </span>
                        )}
                      </div>

                      {/* Calendar Info */}
                      {project.calendrierDebut && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                          <Calendar className="h-4 w-4" />
                          <span>Début: {new Date(project.calendrierDebut).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
                        </div>
                      )}

                      {/* Progress */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-slate-600">Complétion: {completion}%</span>
                        </div>
                        <Progress value={completion} className="h-2" />
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="gap-1">
                          <FileText className="h-3 w-3" />
                          {project.dossiers?.length || 0} subvention{(project.dossiers?.length || 0) > 1 ? 's' : ''}
                        </Badge>
                        <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="border border-slate-200 rounded-lg bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedProjects.length === projects.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Collectivité</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-center">Subventions</TableHead>
                    <TableHead>Complétion</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => {
                    const status = statusConfig[project.statut] || statusConfig['brouillon']
                    const completion = getCompletionFromMaturite(project.maturite)
                    
                    return (
                      <TableRow
                        key={project.id}
                        className="cursor-pointer hover:bg-slate-50"
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedProjects.includes(project.id)}
                            onCheckedChange={(checked) => handleSelectProject(project.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{project.titre}</TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {project.collectivite?.nom || '-'}
                        </TableCell>
                        <TableCell>
                          {project.typeProjet && (
                            <Badge variant="secondary" className="text-xs">
                              {project.typeProjet}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {project.montantTtc ? formatAmount(parseFloat(project.montantTtc)) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${status.className} rounded-full text-xs font-medium`}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="gap-1">
                            <FileText className="h-3 w-3" />
                            {project.dossiers?.length || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={completion} className="h-2 w-20" />
                            <span className="text-xs text-slate-600 min-w-[3ch]">{completion}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Modifier</DropdownMenuItem>
                              <DropdownMenuItem>Dupliquer</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">Supprimer</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-slate-600">1-{projects.length} sur {projects.length} projets</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Précédent
              </Button>
              <Button variant="outline" size="sm" className="bg-blue-600 text-white hover:bg-blue-700 hover:text-white">
                1
              </Button>
              <Button variant="outline" size="sm" disabled>
                Suivant
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
