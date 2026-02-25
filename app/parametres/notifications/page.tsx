'use client'

import { useState, useEffect } from 'react'
import { Bell, AlertCircle, Calendar, Tag, FileText, Save, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface NotificationSettings {
  echeance_proche_enabled: boolean
  echeance_proche_jours: number
  echeance_urgente_enabled: boolean
  echeance_urgente_jours: number
  echeance_depassee_enabled: boolean
  nouveau_dispositif_enabled: boolean
  nouveau_dispositif_jours: number
  statut_dossier_enabled: boolean
  auto_generate_enabled: boolean
  auto_generate_interval: number
}

const DEFAULT_SETTINGS: NotificationSettings = {
  echeance_proche_enabled: true,
  echeance_proche_jours: 30,
  echeance_urgente_enabled: true,
  echeance_urgente_jours: 7,
  echeance_depassee_enabled: true,
  nouveau_dispositif_enabled: true,
  nouveau_dispositif_jours: 7,
  statut_dossier_enabled: true,
  auto_generate_enabled: true,
  auto_generate_interval: 120, // 2 heures en minutes
}

export default function NotificationsSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = () => {
    // Charger depuis localStorage pour l'instant
    // TODO: Charger depuis API quand l'authentification sera implémentée
    const saved = localStorage.getItem('granto_notification_settings')
    if (saved) {
      try {
        setSettings(JSON.parse(saved))
      } catch (e) {
        console.error('Erreur chargement paramètres:', e)
      }
    }
  }

  const saveSettings = () => {
    setLoading(true)
    setSaveMessage('')

    try {
      // Sauvegarder dans localStorage pour l'instant
      // TODO: Sauvegarder via API quand l'authentification sera implémentée
      localStorage.setItem('granto_notification_settings', JSON.stringify(settings))
      setSaveMessage('✅ Paramètres sauvegardés')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (e: any) {
      setSaveMessage(`❌ Erreur: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateNotifications = async () => {
    setGenerating(true)
    setSaveMessage('')

    try {
      const res = await fetch('/api/notifications/generate', {
        method: 'POST'
      })

      if (res.ok) {
        const data = await res.json()
        setSaveMessage(`✅ ${data.count} notification(s) générée(s)`)
      } else {
        setSaveMessage('❌ Erreur lors de la génération')
      }
    } catch (e) {
      setSaveMessage('❌ Erreur de connexion')
    } finally {
      setGenerating(false)
      setTimeout(() => setSaveMessage(''), 5000)
    }
  }

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS)
    setSaveMessage('⚠️ Paramètres réinitialisés (pensez à sauvegarder)')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <Bell className="h-8 w-8" />
          Paramètres des notifications
        </h1>
        <p className="text-muted-foreground">
          Configurez vos préférences de notifications et alertes
        </p>
      </div>

      {saveMessage && (
        <Card className={`mb-6 ${saveMessage.startsWith('✅') ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : saveMessage.startsWith('⚠️') ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' : 'border-red-500 bg-red-50 dark:bg-red-950/20'}`}>
          <CardContent className="p-4">
            <p className="text-sm font-medium">{saveMessage}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche: Paramètres */}
        <div className="lg:col-span-2 space-y-6">
          {/* Échéances proches */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                    <Calendar className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <CardTitle>Échéances proches</CardTitle>
                    <CardDescription>Alertes pour les échéances à venir</CardDescription>
                  </div>
                </div>
                <Switch
                  checked={settings.echeance_proche_enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, echeance_proche_enabled: checked })}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="echeance_proche_jours">Notifier X jours avant l'échéance</Label>
                  <Input
                    id="echeance_proche_jours"
                    type="number"
                    min={1}
                    max={90}
                    value={settings.echeance_proche_jours}
                    onChange={(e) => setSettings({ ...settings, echeance_proche_jours: parseInt(e.target.value) || 30 })}
                    className="mt-2"
                    disabled={!settings.echeance_proche_enabled}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Recevoir une notification de niveau "warning"</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Échéances urgentes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <CardTitle>Échéances urgentes</CardTitle>
                    <CardDescription>Alertes critiques pour les échéances imminentes</CardDescription>
                  </div>
                </div>
                <Switch
                  checked={settings.echeance_urgente_enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, echeance_urgente_enabled: checked })}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="echeance_urgente_jours">Notifier X jours avant l'échéance</Label>
                  <Input
                    id="echeance_urgente_jours"
                    type="number"
                    min={1}
                    max={30}
                    value={settings.echeance_urgente_jours}
                    onChange={(e) => setSettings({ ...settings, echeance_urgente_jours: parseInt(e.target.value) || 7 })}
                    className="mt-2"
                    disabled={!settings.echeance_urgente_enabled}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Recevoir une notification de niveau "urgent"</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Échéances dépassées */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-800">
                    <AlertCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <CardTitle>Échéances dépassées</CardTitle>
                    <CardDescription>Alertes pour les dossiers en retard</CardDescription>
                  </div>
                </div>
                <Switch
                  checked={settings.echeance_depassee_enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, echeance_depassee_enabled: checked })}
                />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Recevoir une notification de niveau "urgent" dès qu'une échéance est dépassée
              </p>
            </CardContent>
          </Card>

          {/* Nouveaux dispositifs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                    <Tag className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle>Nouveaux dispositifs</CardTitle>
                    <CardDescription>Alertes pour les nouveaux appels à projets</CardDescription>
                  </div>
                </div>
                <Switch
                  checked={settings.nouveau_dispositif_enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, nouveau_dispositif_enabled: checked })}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nouveau_dispositif_jours">Notifier pendant X jours après création</Label>
                  <Input
                    id="nouveau_dispositif_jours"
                    type="number"
                    min={1}
                    max={30}
                    value={settings.nouveau_dispositif_jours}
                    onChange={(e) => setSettings({ ...settings, nouveau_dispositif_jours: parseInt(e.target.value) || 7 })}
                    className="mt-2"
                    disabled={!settings.nouveau_dispositif_enabled}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Recevoir une notification de niveau "info"</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Changements de statut */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle>Changements de statut</CardTitle>
                    <CardDescription>Alertes lors des modifications de dossiers</CardDescription>
                  </div>
                </div>
                <Switch
                  checked={settings.statut_dossier_enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, statut_dossier_enabled: checked })}
                />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Recevoir une notification lorsqu'un dossier change de statut (accepté, refusé, etc.)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Colonne droite: Actions & Résumé */}
        <div className="space-y-6">
          {/* Actions rapides */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={saveSettings}
                disabled={loading}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>

              <Button
                onClick={handleGenerateNotifications}
                disabled={generating}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                {generating ? 'Génération...' : 'Générer les notifications'}
              </Button>

              <Button
                onClick={resetSettings}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            </CardContent>
          </Card>

          {/* Résumé */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Résumé</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Échéances proches</span>
                <Badge variant={settings.echeance_proche_enabled ? 'default' : 'secondary'}>
                  {settings.echeance_proche_enabled ? `≤ ${settings.echeance_proche_jours}j` : 'Désactivé'}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Échéances urgentes</span>
                <Badge variant={settings.echeance_urgente_enabled ? 'destructive' : 'secondary'}>
                  {settings.echeance_urgente_enabled ? `≤ ${settings.echeance_urgente_jours}j` : 'Désactivé'}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Échéances dépassées</span>
                <Badge variant={settings.echeance_depassee_enabled ? 'destructive' : 'secondary'}>
                  {settings.echeance_depassee_enabled ? 'Activé' : 'Désactivé'}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Nouveaux dispositifs</span>
                <Badge variant={settings.nouveau_dispositif_enabled ? 'default' : 'secondary'}>
                  {settings.nouveau_dispositif_enabled ? `≤ ${settings.nouveau_dispositif_jours}j` : 'Désactivé'}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Changements statut</span>
                <Badge variant={settings.statut_dossier_enabled ? 'default' : 'secondary'}>
                  {settings.statut_dossier_enabled ? 'Activé' : 'Désactivé'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Informations */}
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Informations
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                Les notifications sont générées automatiquement en fonction de vos paramètres.
              </p>
              <p>
                Vous pouvez forcer la génération immédiate avec le bouton "Générer les notifications".
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
