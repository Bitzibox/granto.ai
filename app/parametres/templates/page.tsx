'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  Settings, Palette, Type, Layout, Eye, Save, RotateCcw,
  ChevronUp, ChevronDown, GripVertical, FileText, Plus, Copy, Trash2, Upload, ImageIcon, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

// Template par defaut systeme
const SYSTEM_DEFAULT = {
  nom: 'Template par defaut',
  description: 'Template systeme Granto',
  fontFamily: 'Helvetica',
  fontSize: 10,
  fontSizeTitle: 20,
  fontSizeHeading: 12,
  colorPrimary: '#1e40af',
  colorSecondary: '#000000',
  colorAccent: '#64748b',
  marginTop: 50,
  marginBottom: 50,
  marginLeft: 50,
  marginRight: 50,
  headerText: '',
  headerAlign: 'center',
  footerText: 'Document genere par Granto.ai',
  footerAlign: 'center',
  showPageNumbers: false,
  logoUrl: '',
  logoPosition: 'header-left',
  logoWidth: 150,
  logoHeight: 50,
  sectionsOrder: ['collectivite', 'contexte', 'description', 'financement', 'calendrier', 'pieces', 'financeur'],
  sectionsEnabled: {
    collectivite: true,
    contexte: true,
    description: true,
    financement: true,
    calendrier: true,
    pieces: true,
    financeur: true,
  } as Record<string, boolean>,
  sectionsConfig: {} as Record<string, { title?: string }>,
}

const SECTION_LABELS: Record<string, string> = {
  collectivite: 'Collectivite',
  contexte: 'Contexte et enjeux',
  description: 'Description du projet',
  financement: 'Plan de financement',
  calendrier: 'Calendrier previsionnel',
  pieces: 'Pieces justificatives',
  financeur: 'Financeur',
}

const FONT_OPTIONS = [
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Times-Roman', label: 'Times Roman' },
  { value: 'Courier', label: 'Courier' },
]

type TemplateConfig = typeof SYSTEM_DEFAULT

interface SavedTemplate {
  id: string
  nom: string
  description?: string
  isDefault?: boolean
  [key: string]: any
}

export default function TemplatesPage() {
  const [template, setTemplate] = useState<TemplateConfig>({ ...SYSTEM_DEFAULT })
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('system-default')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Charger les templates
  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/pdf-templates')
      if (res.ok) {
        const data = await res.json()
        setSavedTemplates(data)
      }
    } catch (e) {
      console.error('Erreur chargement templates:', e)
    }
  }

  // Met a jour un champ du template
  const updateField = useCallback((field: string, value: any) => {
    setTemplate(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
    setSaveMessage('')
  }, [])

  // Met a jour une section enabled/disabled
  const toggleSection = useCallback((key: string) => {
    setTemplate(prev => ({
      ...prev,
      sectionsEnabled: {
        ...prev.sectionsEnabled,
        [key]: !prev.sectionsEnabled[key],
      },
    }))
    setHasChanges(true)
    setSaveMessage('')
  }, [])

  // Met a jour le titre custom d'une section
  const updateSectionTitle = useCallback((key: string, title: string) => {
    setTemplate(prev => ({
      ...prev,
      sectionsConfig: {
        ...prev.sectionsConfig,
        [key]: { ...(prev.sectionsConfig[key] || {}), title },
      },
    }))
    setHasChanges(true)
    setSaveMessage('')
  }, [])

  // Deplacer une section
  const moveSection = useCallback((index: number, direction: 'up' | 'down') => {
    setTemplate(prev => {
      const newOrder = [...prev.sectionsOrder]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= newOrder.length) return prev
      ;[newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]]
      return { ...prev, sectionsOrder: newOrder }
    })
    setHasChanges(true)
    setSaveMessage('')
  }, [])

  // Reset au defaut
  const resetToDefault = useCallback(() => {
    setTemplate({ ...SYSTEM_DEFAULT })
    setSelectedTemplateId('system-default')
    setHasChanges(false)
    setSaveMessage('')
  }, [])

  // Charger un template sauvegarde
  const loadTemplate = useCallback((tpl: SavedTemplate) => {
    setSelectedTemplateId(tpl.id)
    if (tpl.id === 'system-default') {
      setTemplate({ ...SYSTEM_DEFAULT })
    } else {
      setTemplate({
        nom: tpl.nom || 'Sans nom',
        description: tpl.description || '',
        fontFamily: tpl.fontFamily || SYSTEM_DEFAULT.fontFamily,
        fontSize: tpl.fontSize || SYSTEM_DEFAULT.fontSize,
        fontSizeTitle: tpl.fontSizeTitle || SYSTEM_DEFAULT.fontSizeTitle,
        fontSizeHeading: tpl.fontSizeHeading || SYSTEM_DEFAULT.fontSizeHeading,
        colorPrimary: tpl.colorPrimary || SYSTEM_DEFAULT.colorPrimary,
        colorSecondary: tpl.colorSecondary || SYSTEM_DEFAULT.colorSecondary,
        colorAccent: tpl.colorAccent || SYSTEM_DEFAULT.colorAccent,
        marginTop: tpl.marginTop ?? SYSTEM_DEFAULT.marginTop,
        marginBottom: tpl.marginBottom ?? SYSTEM_DEFAULT.marginBottom,
        marginLeft: tpl.marginLeft ?? SYSTEM_DEFAULT.marginLeft,
        marginRight: tpl.marginRight ?? SYSTEM_DEFAULT.marginRight,
        headerText: tpl.headerText || '',
        headerAlign: tpl.headerAlign || SYSTEM_DEFAULT.headerAlign,
        footerText: tpl.footerText ?? SYSTEM_DEFAULT.footerText,
        footerAlign: tpl.footerAlign || SYSTEM_DEFAULT.footerAlign,
        showPageNumbers: tpl.showPageNumbers ?? false,
        logoUrl: tpl.logoUrl || '',
        logoPosition: tpl.logoPosition || SYSTEM_DEFAULT.logoPosition,
        logoWidth: tpl.logoWidth ?? SYSTEM_DEFAULT.logoWidth,
        logoHeight: tpl.logoHeight ?? SYSTEM_DEFAULT.logoHeight,
        sectionsOrder: Array.isArray(tpl.sectionsOrder) ? tpl.sectionsOrder : SYSTEM_DEFAULT.sectionsOrder,
        sectionsEnabled: typeof tpl.sectionsEnabled === 'object' && tpl.sectionsEnabled !== null
          ? tpl.sectionsEnabled
          : { ...SYSTEM_DEFAULT.sectionsEnabled },
        sectionsConfig: typeof tpl.sectionsConfig === 'object' && tpl.sectionsConfig !== null
          ? tpl.sectionsConfig
          : {},
      })
    }
    setHasChanges(false)
    setSaveMessage('')
  }, [])

  // Sauvegarder
  const handleSave = async () => {
    setSaving(true)
    setSaveMessage('')
    try {
      if (selectedTemplateId === 'system-default') {
        // Creer un nouveau template
        const res = await fetch('/api/pdf-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...template,
            isDefault: false,
          }),
        })
        if (res.ok) {
          const created = await res.json()
          setSelectedTemplateId(created.id)
          setSaveMessage('Template cree avec succes')
          await fetchTemplates()
        } else {
          const err = await res.json()
          setSaveMessage(`Erreur: ${err.error || 'Echec de la sauvegarde'}`)
        }
      } else {
        // Mettre a jour
        const res = await fetch(`/api/pdf-templates/${selectedTemplateId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(template),
        })
        if (res.ok) {
          setSaveMessage('Template mis a jour')
          await fetchTemplates()
        } else {
          const err = await res.json()
          setSaveMessage(`Erreur: ${err.error || 'Echec de la sauvegarde'}`)
        }
      }
      setHasChanges(false)
    } catch (e: any) {
      setSaveMessage(`Erreur: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  // Dupliquer
  const handleDuplicate = async () => {
    try {
      const res = await fetch(`/api/pdf-templates/${selectedTemplateId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (res.ok) {
        const created = await res.json()
        await fetchTemplates()
        loadTemplate(created)
        setSaveMessage('Template duplique')
      }
    } catch (e: any) {
      setSaveMessage(`Erreur: ${e.message}`)
    }
  }

  // Supprimer
  const handleDelete = async () => {
    if (selectedTemplateId === 'system-default') return
    if (!confirm('Supprimer ce template ?')) return
    try {
      const res = await fetch(`/api/pdf-templates/${selectedTemplateId}`, {
        method: 'DELETE',
      })
      if (res.ok || res.status === 204) {
        resetToDefault()
        await fetchTemplates()
        setSaveMessage('Template supprime')
      }
    } catch (e: any) {
      setSaveMessage(`Erreur: ${e.message}`)
    }
  }

  // Preview PDF
  const handlePreview = async () => {
    setPreviewLoading(true)
    try {
      const res = await fetch('/api/pdf-templates/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template }),
      })
      if (res.ok) {
        const blob = await res.blob()
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setPreviewUrl(URL.createObjectURL(blob))
      }
    } catch (e) {
      console.error('Erreur preview:', e)
    } finally {
      setPreviewLoading(false)
    }
  }

  // Upload logo
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('logo', file)

      const res = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (res.ok && data.logoUrl) {
        updateField('logoUrl', data.logoUrl)
        setSaveMessage('Logo uploade avec succes')
      } else {
        setSaveMessage(`Erreur: ${data.error || 'Echec de l\'upload'}`)
      }
    } catch (err: any) {
      setSaveMessage(`Erreur upload: ${err.message}`)
    } finally {
      setUploading(false)
      // Reset le input pour pouvoir re-uploader le meme fichier
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Supprimer le logo
  const handleRemoveLogo = () => {
    updateField('logoUrl', '')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Templates PDF</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Personnalisez vos modeles de demandes de subvention
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-orange-600 border-orange-300">
              Modifications non sauvegardees
            </Badge>
          )}
          {saveMessage && (
            <Badge variant="outline" className={saveMessage.startsWith('Erreur') ? 'text-red-600 border-red-300' : 'text-green-600 border-green-300'}>
              {saveMessage}
            </Badge>
          )}
        </div>
      </div>

      {/* Selecteur de template */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label className="mb-2">Template actif</Label>
              <Select
                value={selectedTemplateId}
                onValueChange={(val) => {
                  const tpl = savedTemplates.find(t => t.id === val)
                  if (tpl) loadTemplate(tpl)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {savedTemplates.map((tpl) => (
                    <SelectItem key={tpl.id} value={tpl.id}>
                      {tpl.nom} {tpl.id === 'system-default' ? '(Systeme)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-5">
              <Button variant="outline" size="sm" onClick={handleDuplicate} title="Dupliquer">
                <Copy className="h-4 w-4" />
              </Button>
              {selectedTemplateId !== 'system-default' && (
                <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-600 hover:text-red-700" title="Supprimer">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche: configuration */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="visual">
            <TabsList className="w-full">
              <TabsTrigger value="visual" className="flex-1">
                <Palette className="h-4 w-4 mr-2" />
                Visuel
              </TabsTrigger>
              <TabsTrigger value="structure" className="flex-1">
                <Layout className="h-4 w-4 mr-2" />
                Structure
              </TabsTrigger>
              <TabsTrigger value="header" className="flex-1">
                <Type className="h-4 w-4 mr-2" />
                En-tete / Pied
              </TabsTrigger>
            </TabsList>

            {/* === TAB VISUEL === */}
            <TabsContent value="visual" className="space-y-4 mt-4">
              {/* Nom du template */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Informations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Nom du template</Label>
                    <Input
                      value={template.nom}
                      onChange={(e) => updateField('nom', e.target.value)}
                      placeholder="Mon template"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={template.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      placeholder="Description optionnelle"
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Polices */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Polices
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Police principale</Label>
                    <Select value={template.fontFamily} onValueChange={(v) => updateField('fontFamily', v)}>
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map(f => (
                          <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Titre (pt)</Label>
                      <Input
                        type="number"
                        min={12}
                        max={36}
                        value={template.fontSizeTitle}
                        onChange={(e) => updateField('fontSizeTitle', parseInt(e.target.value) || 20)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Sous-titre (pt)</Label>
                      <Input
                        type="number"
                        min={8}
                        max={24}
                        value={template.fontSizeHeading}
                        onChange={(e) => updateField('fontSizeHeading', parseInt(e.target.value) || 12)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Texte (pt)</Label>
                      <Input
                        type="number"
                        min={6}
                        max={16}
                        value={template.fontSize}
                        onChange={(e) => updateField('fontSize', parseInt(e.target.value) || 10)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Couleurs */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Couleurs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Principale</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="color"
                          value={template.colorPrimary}
                          onChange={(e) => updateField('colorPrimary', e.target.value)}
                          className="h-9 w-12 rounded border cursor-pointer"
                        />
                        <Input
                          value={template.colorPrimary}
                          onChange={(e) => updateField('colorPrimary', e.target.value)}
                          className="flex-1 font-mono text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Texte</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="color"
                          value={template.colorSecondary}
                          onChange={(e) => updateField('colorSecondary', e.target.value)}
                          className="h-9 w-12 rounded border cursor-pointer"
                        />
                        <Input
                          value={template.colorSecondary}
                          onChange={(e) => updateField('colorSecondary', e.target.value)}
                          className="flex-1 font-mono text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Accent</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="color"
                          value={template.colorAccent}
                          onChange={(e) => updateField('colorAccent', e.target.value)}
                          className="h-9 w-12 rounded border cursor-pointer"
                        />
                        <Input
                          value={template.colorAccent}
                          onChange={(e) => updateField('colorAccent', e.target.value)}
                          className="flex-1 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Marges */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Marges (en points)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-3">
                    {(['marginTop', 'marginBottom', 'marginLeft', 'marginRight'] as const).map((key) => (
                      <div key={key}>
                        <Label>{key === 'marginTop' ? 'Haut' : key === 'marginBottom' ? 'Bas' : key === 'marginLeft' ? 'Gauche' : 'Droite'}</Label>
                        <Input
                          type="number"
                          min={20}
                          max={100}
                          value={template[key]}
                          onChange={(e) => updateField(key, parseInt(e.target.value) || 50)}
                          className="mt-1"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* === TAB STRUCTURE === */}
            <TabsContent value="structure" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Layout className="h-4 w-4" />
                    Ordre et visibilite des sections
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-4">
                    Activez/desactivez les sections et reorganisez-les avec les fleches.
                    Vous pouvez aussi personnaliser le titre de chaque section.
                  </p>
                  <div className="space-y-2">
                    {template.sectionsOrder.map((key, index) => (
                      <div
                        key={key}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                          template.sectionsEnabled[key]
                            ? 'bg-card border-border'
                            : 'bg-muted/50 border-muted opacity-60'
                        }`}
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />

                        <div className="flex flex-col gap-1 flex-shrink-0 ">
                          <button
                            onClick={() => moveSection(index, 'up')}
                            disabled={index === 0}
                            className="p-0.5 rounded hover:bg-accent disabled:opacity-30"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => moveSection(index, 'down')}
                            disabled={index === template.sectionsOrder.length - 1}
                            className="p-0.5 rounded hover:bg-accent disabled:opacity-30"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </div>

                        <Switch
                          checked={template.sectionsEnabled[key]}
                          onCheckedChange={() => toggleSection(key)}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{SECTION_LABELS[key] || key}</div>
                          <Input
                            value={template.sectionsConfig[key]?.title || ''}
                            onChange={(e) => updateSectionTitle(key, e.target.value)}
                            placeholder={`Titre par defaut: ${SECTION_LABELS[key]}`}
                            className="mt-1 h-7 text-xs"
                            disabled={!template.sectionsEnabled[key]}
                          />
                        </div>

                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {index + 1}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* === TAB EN-TETE / PIED === */}
            <TabsContent value="header" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">En-tete</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Texte d'en-tete</Label>
                    <Input
                      value={template.headerText}
                      onChange={(e) => updateField('headerText', e.target.value)}
                      placeholder="Ex: Mairie de Saint-Mars-la-Briere"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Alignement</Label>
                    <Select value={template.headerAlign} onValueChange={(v) => updateField('headerAlign', v)}>
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Gauche</SelectItem>
                        <SelectItem value="center">Centre</SelectItem>
                        <SelectItem value="right">Droite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Pied de page</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Texte du pied de page</Label>
                    <Input
                      value={template.footerText}
                      onChange={(e) => updateField('footerText', e.target.value)}
                      placeholder="Document genere par Granto.ai"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Alignement</Label>
                    <Select value={template.footerAlign} onValueChange={(v) => updateField('footerAlign', v)}>
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Gauche</SelectItem>
                        <SelectItem value="center">Centre</SelectItem>
                        <SelectItem value="right">Droite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={template.showPageNumbers}
                      onCheckedChange={(v) => updateField('showPageNumbers', v)}
                    />
                    <Label>Afficher les numeros de page</Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Logo de la collectivite
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Apercu du logo actuel */}
                  {template.logoUrl && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="flex-shrink-0 bg-white rounded border p-2">
                        <img
                          src={template.logoUrl}
                          alt="Logo"
                          className="max-h-16 max-w-[120px] object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground truncate">{template.logoUrl}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={handleRemoveLogo} className="text-destructive hover:text-destructive flex-shrink-0">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Upload */}
                  <div>
                    <Label className="mb-2 block">Uploader un logo</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <Upload className="h-4 w-4 mr-2 animate-pulse" />
                          Upload en cours...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Choisir un fichier (PNG, JPG, SVG, WebP - max 2 Mo)
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Ou URL */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-card px-3 text-xs text-muted-foreground">ou</span>
                    </div>
                  </div>

                  <div>
                    <Label>URL du logo</Label>
                    <Input
                      value={template.logoUrl}
                      onChange={(e) => updateField('logoUrl', e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="mt-1"
                    />
                  </div>

                  {/* Position et dimensions */}
                  <div>
                    <Label>Position</Label>
                    <Select value={template.logoPosition} onValueChange={(v) => updateField('logoPosition', v)}>
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="header-left">En-tete gauche</SelectItem>
                        <SelectItem value="header-center">En-tete centre</SelectItem>
                        <SelectItem value="header-right">En-tete droite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Largeur (px)</Label>
                      <Input
                        type="number"
                        min={50}
                        max={300}
                        value={template.logoWidth}
                        onChange={(e) => updateField('logoWidth', parseInt(e.target.value) || 150)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Hauteur (px)</Label>
                      <Input
                        type="number"
                        min={20}
                        max={150}
                        value={template.logoHeight}
                        onChange={(e) => updateField('logoHeight', parseInt(e.target.value) || 50)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Colonne droite: apercu + actions */}
        <div className="space-y-4">
          {/* Actions */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <Button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Sauvegarde...' : selectedTemplateId === 'system-default' ? 'Creer ce template' : 'Sauvegarder'}
              </Button>
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={previewLoading}
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                {previewLoading ? 'Chargement...' : 'Apercu PDF'}
              </Button>
              <Button
                variant="outline"
                onClick={resetToDefault}
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reinitialiser
              </Button>
            </CardContent>
          </Card>

          {/* Apercu miniature */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Apercu
              </CardTitle>
            </CardHeader>
            <CardContent>
              {previewUrl ? (
                <div className="border rounded-lg overflow-hidden bg-white">
                  <iframe
                    src={previewUrl}
                    className="w-full h-[500px]"
                    title="Apercu du template PDF"
                  />
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  {/* Mini-preview statique basee sur la config */}
                  <div
                    className="mx-auto bg-white rounded shadow-sm border overflow-hidden"
                    style={{ width: '200px', height: '280px', position: 'relative' }}
                  >
                    {/* Header avec logo */}
                    {(template.headerText || template.logoUrl) && (
                      <div
                        className="px-2 py-1 border-b flex items-center gap-1"
                        style={{
                          fontSize: '5px',
                          color: template.colorAccent,
                          justifyContent: template.logoPosition === 'header-center'
                            ? 'center'
                            : template.logoPosition === 'header-right'
                            ? 'flex-end'
                            : 'flex-start'
                        }}
                      >
                        {template.logoUrl && (
                          <img
                            src={template.logoUrl}
                            alt="Logo"
                            className="object-contain"
                            style={{
                              maxHeight: '12px',
                              maxWidth: '30px',
                              opacity: 0.8
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        )}
                        {template.headerText && (
                          <span style={{ textAlign: template.headerAlign as any }}>
                            {template.headerText}
                          </span>
                        )}
                      </div>
                    )}
                    {/* Titre */}
                    <div className="px-3 pt-3">
                      <div
                        className="font-bold text-center mb-1"
                        style={{ fontSize: '8px', color: template.colorPrimary }}
                      >
                        DEMANDE DE SUBVENTION
                      </div>
                      <div
                        className="text-center mb-2"
                        style={{ fontSize: '6px', color: template.colorSecondary }}
                      >
                        DETR - Dotation d'Equipement
                      </div>
                    </div>
                    {/* Sections preview */}
                    <div className="px-3 space-y-1.5">
                      {template.sectionsOrder
                        .filter(k => template.sectionsEnabled[k])
                        .slice(0, 5)
                        .map((key, i) => (
                          <div key={key}>
                            <div
                              style={{ fontSize: '5px', color: template.colorPrimary }}
                              className="font-bold mb-0.5"
                            >
                              {template.sectionsConfig[key]?.title || SECTION_LABELS[key]}
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded" style={{ width: `${90 - i * 10}%` }} />
                            <div className="h-1.5 bg-gray-100 rounded mt-0.5" style={{ width: `${70 - i * 5}%` }} />
                          </div>
                        ))
                      }
                    </div>
                    {/* Footer */}
                    {template.footerText && (
                      <div
                        className="absolute bottom-0 left-0 right-0 px-2 py-1 border-t bg-white"
                        style={{ fontSize: '4px', color: template.colorAccent, textAlign: template.footerAlign as any }}
                      >
                        {template.footerText}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Cliquez sur "Apercu PDF" pour voir le rendu reel
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
