# Spécification Technique - Templates PDF Personnalisables

## 📋 Vue d'ensemble

Système de templates PDF personnalisables permettant aux utilisateurs de configurer visuellement et structurellement les dossiers de subvention générés.

## 🎯 Objectifs

1. **Personnalisation visuelle** : Logo, polices, couleurs, marges, en-tête/pied de page
2. **Personnalisation structurelle** : Réorganiser sections, activer/désactiver, configurer
3. **Aperçu temps réel** : Prévisualisation du rendu avant export
4. **Templates multiples** : Plusieurs templates par utilisateur/collectivité

## 🏗️ Architecture

### Base de données

**Modèle `PdfTemplate`** (voir `prisma/schema.prisma`)

```prisma
model PdfTemplate {
  id              String    @id @default(uuid())
  nom             String
  description     String?
  userId          String?
  collectiviteId  String?
  isDefault       Boolean   @default(false)

  // Configuration visuelle
  logoUrl         String?
  fontFamily      String    @default("Helvetica")
  colorPrimary    String    @default("#1e40af")
  // ... voir schema complet

  // Configuration structurelle
  sectionsOrder   Json
  sectionsEnabled Json
  sectionsConfig  Json
}
```

### Backend

**1. Service de gestion des templates**

Fichier: `src/services/pdfTemplateService.js`

```javascript
class PdfTemplateService {
  // CRUD templates
  async createTemplate(data) { }
  async getTemplates(userId, collectiviteId) { }
  async getTemplateById(id) { }
  async updateTemplate(id, data) { }
  async deleteTemplate(id) { }
  async setDefaultTemplate(id, userId) { }

  // Template par défaut système
  getSystemDefaultTemplate() { }

  // Validation
  validateTemplate(config) { }
}
```

**2. Routes API**

Fichier: `src/routes/pdf-templates.js`

```javascript
// GET /api/pdf-templates - Liste templates
// GET /api/pdf-templates/:id - Récupérer un template
// POST /api/pdf-templates - Créer template
// PUT /api/pdf-templates/:id - Modifier template
// DELETE /api/pdf-templates/:id - Supprimer template
// POST /api/pdf-templates/:id/set-default - Définir par défaut
// POST /api/pdf-templates/:id/duplicate - Dupliquer
// POST /api/pdf-templates/preview - Générer aperçu
```

**3. Service PDF modifié**

Fichier: `src/services/pdfService.js`

```javascript
async function genererDossierPDF(params, templateId = null) {
  // 1. Charger le template (ou template par défaut)
  const template = templateId
    ? await getTemplateById(templateId)
    : await getDefaultTemplate(params.userId);

  // 2. Créer PDF avec config du template
  const doc = new PDFDocument({
    size: 'A4',
    margins: {
      top: template.marginTop,
      bottom: template.marginBottom,
      left: template.marginLeft,
      right: template.marginRight
    }
  });

  // 3. Appliquer logo si présent
  if (template.logoUrl) {
    renderLogo(doc, template);
  }

  // 4. Appliquer header/footer
  if (template.headerText) {
    renderHeader(doc, template);
  }

  // 5. Rendre sections dans l'ordre configuré
  const sectionsOrder = JSON.parse(template.sectionsOrder);
  for (const sectionKey of sectionsOrder) {
    if (template.sectionsEnabled[sectionKey]) {
      renderSection(doc, sectionKey, template, contenu);
    }
  }

  // 6. Footer et pagination
  renderFooter(doc, template);
}

function renderSection(doc, sectionKey, template, contenu) {
  const sectionConfig = template.sectionsConfig[sectionKey] || {};

  switch (sectionKey) {
    case 'collectivite':
      renderCollectiviteSection(doc, template, contenu, sectionConfig);
      break;
    case 'contexte':
      renderContexteSection(doc, template, contenu, sectionConfig);
      break;
    // ... autres sections
  }
}
```

**4. Upload de logo**

Fichier: `src/routes/upload.js`

```javascript
const multer = require('multer');
const upload = multer({ dest: 'public/uploads/logos/' });

router.post('/api/upload/logo', upload.single('logo'), async (req, res) => {
  // Validation image
  // Redimensionnement si nécessaire
  // Retourner URL
});
```

### Frontend

**1. Page paramètres templates**

Fichier: `app/parametres/templates/page.tsx`

```tsx
export default function TemplatesPdfPage() {
  return (
    <div className="container mx-auto py-8">
      <h1>Templates de demandes de subvention</h1>

      {/* Liste des templates */}
      <TemplatesList />

      {/* Bouton créer nouveau */}
      <CreateTemplateButton />
    </div>
  );
}
```

**2. Éditeur de template**

Fichier: `app/parametres/templates/[id]/edit/page.tsx`

```tsx
export default function EditTemplatePage({ params }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Panneau gauche: Configuration */}
      <div className="overflow-y-auto">
        <TemplateEditor templateId={params.id} />
      </div>

      {/* Panneau droit: Aperçu */}
      <div className="sticky top-4">
        <PdfPreview templateId={params.id} />
      </div>
    </div>
  );
}
```

**3. Composant éditeur**

Fichier: `components/template-editor.tsx`

```tsx
export function TemplateEditor({ templateId }) {
  const [template, setTemplate] = useState(null);

  return (
    <Tabs defaultValue="visual">
      <TabsList>
        <TabsTrigger value="visual">Visuel</TabsTrigger>
        <TabsTrigger value="structure">Structure</TabsTrigger>
        <TabsTrigger value="advanced">Avancé</TabsTrigger>
      </TabsList>

      <TabsContent value="visual">
        <VisualConfig template={template} onChange={setTemplate} />
      </TabsContent>

      <TabsContent value="structure">
        <StructureConfig template={template} onChange={setTemplate} />
      </TabsContent>

      <TabsContent value="advanced">
        <AdvancedConfig template={template} onChange={setTemplate} />
      </TabsContent>
    </Tabs>
  );
}
```

**4. Configuration visuelle**

Fichier: `components/template-editor/visual-config.tsx`

```tsx
export function VisualConfig({ template, onChange }) {
  return (
    <div className="space-y-6">
      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle>Logo</CardTitle>
        </CardHeader>
        <CardContent>
          <LogoUploader
            value={template.logoUrl}
            onChange={(url) => onChange({ ...template, logoUrl: url })}
          />
          <Select value={template.logoPosition}>
            <SelectItem value="header-left">En-tête gauche</SelectItem>
            <SelectItem value="header-center">En-tête centre</SelectItem>
            <SelectItem value="header-right">En-tête droite</SelectItem>
          </Select>
        </CardContent>
      </Card>

      {/* Polices */}
      <Card>
        <CardHeader>
          <CardTitle>Polices</CardTitle>
        </CardHeader>
        <CardContent>
          <FontSelector
            value={template.fontFamily}
            onChange={(font) => onChange({ ...template, fontFamily: font })}
          />
          <Slider
            label="Taille titre"
            value={template.fontSizeTitle}
            min={14} max={28}
          />
        </CardContent>
      </Card>

      {/* Couleurs */}
      <Card>
        <CardHeader>
          <CardTitle>Couleurs</CardTitle>
        </CardHeader>
        <CardContent>
          <ColorPicker
            label="Couleur principale"
            value={template.colorPrimary}
            onChange={(color) => onChange({ ...template, colorPrimary: color })}
          />
          <ColorPicker
            label="Couleur texte"
            value={template.colorSecondary}
          />
        </CardContent>
      </Card>

      {/* Marges */}
      <Card>
        <CardHeader>
          <CardTitle>Marges (en mm)</CardTitle>
        </CardHeader>
        <CardContent>
          <Input label="Haut" type="number" />
          <Input label="Bas" type="number" />
          <Input label="Gauche" type="number" />
          <Input label="Droite" type="number" />
        </CardContent>
      </Card>

      {/* En-tête / Pied de page */}
      <Card>
        <CardHeader>
          <CardTitle>En-tête et pied de page</CardTitle>
        </CardHeader>
        <CardContent>
          <Input label="Texte en-tête" />
          <Select label="Alignement">...</Select>
          <Input label="Texte pied de page" />
          <Switch label="Numérotation des pages" />
        </CardContent>
      </Card>
    </div>
  );
}
```

**5. Configuration structure**

Fichier: `components/template-editor/structure-config.tsx`

```tsx
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

export function StructureConfig({ template, onChange }) {
  const [sections, setSections] = useState(template.sectionsOrder);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = sections.indexOf(active.id);
      const newIndex = sections.indexOf(over.id);
      const newSections = arrayMove(sections, oldIndex, newIndex);
      setSections(newSections);
      onChange({ ...template, sectionsOrder: newSections });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ordre et activation des sections</CardTitle>
        <CardDescription>
          Glissez-déposez pour réorganiser. Décochez pour désactiver.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections}
            strategy={verticalListSortingStrategy}
          >
            {sections.map((sectionKey) => (
              <SortableSection
                key={sectionKey}
                id={sectionKey}
                enabled={template.sectionsEnabled[sectionKey]}
                onToggle={(enabled) => {
                  onChange({
                    ...template,
                    sectionsEnabled: {
                      ...template.sectionsEnabled,
                      [sectionKey]: enabled
                    }
                  });
                }}
              />
            ))}
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
}
```

**6. Aperçu PDF**

Fichier: `components/pdf-preview.tsx`

```tsx
export function PdfPreview({ templateId, demoData }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const generatePreview = async () => {
      setLoading(true);
      const res = await fetch('/api/pdf-templates/preview', {
        method: 'POST',
        body: JSON.stringify({
          templateId,
          demoData: demoData || getDefaultDemoData()
        })
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setLoading(false);
    };

    generatePreview();
  }, [templateId]);

  return (
    <div className="border rounded-lg overflow-hidden bg-slate-100">
      <div className="bg-white p-4 border-b">
        <h3 className="font-semibold">Aperçu en temps réel</h3>
        <p className="text-sm text-slate-600">
          Les modifications sont prévisualisées instantanément
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <iframe
          src={pdfUrl}
          className="w-full h-[800px]"
          title="Aperçu PDF"
        />
      )}

      <div className="p-4 bg-white border-t">
        <Button onClick={downloadPreview}>
          <Download className="mr-2 h-4 w-4" />
          Télécharger l'aperçu
        </Button>
      </div>
    </div>
  );
}

function getDefaultDemoData() {
  return {
    commune: {
      nom: 'Saint-Mars-la-Brière',
      departement: '72',
      region: 'Pays de la Loire',
      codePostal: '72470'
    },
    projet: {
      description: 'Rénovation du gymnase communal',
      budget: 200000
    },
    aide: {
      name: 'DETR - Dotation d\'Équipement des Territoires Ruraux',
      financers: ['État - Préfecture de la Sarthe']
    }
  };
}
```

## 🔄 Flux utilisateur

### 1. Accès aux paramètres
```
Menu principal → Paramètres → Templates PDF
```

### 2. Création d'un template
```
1. Clic "Nouveau template"
2. Nom + description
3. Partir de zéro ou dupliquer existant
4. Édition visuelle et structurelle
5. Aperçu temps réel
6. Enregistrer
7. Définir par défaut (optionnel)
```

### 3. Utilisation lors de génération
```
1. Assistant IA → Résultats
2. Clic "Télécharger dossier"
3. Popup: "Choisir un template" (ou utiliser par défaut)
4. PDF généré avec template choisi
```

## 📦 Dépendances

### Backend
```json
{
  "pdfkit": "^0.14.0",
  "multer": "^1.4.5-lts.1",
  "sharp": "^0.33.0"
}
```

### Frontend
```json
{
  "@dnd-kit/core": "^6.1.0",
  "@dnd-kit/sortable": "^8.0.0",
  "react-color": "^2.19.3"
}
```

## 🚀 Plan de développement

### Phase 1: Base de données et backend (2-3h)
- [x] Créer schéma Prisma PdfTemplate
- [ ] Migration base de données
- [ ] Service pdfTemplateService.js
- [ ] Routes API CRUD templates
- [ ] Modifier pdfService.js pour templates
- [ ] Route upload logo

### Phase 2: Interface basique (2-3h)
- [ ] Page liste templates
- [ ] Page création/édition template
- [ ] Formulaire configuration visuelle
- [ ] Formulaire configuration structurelle

### Phase 3: Drag & Drop et aperçu (2-3h)
- [ ] Intégration @dnd-kit
- [ ] Réorganisation sections
- [ ] Génération aperçu PDF
- [ ] Iframe prévisualisation temps réel

### Phase 4: Fonctionnalités avancées (2-3h)
- [ ] Upload et gestion logos
- [ ] Duplication templates
- [ ] Templates publics/partagés
- [ ] Export/Import templates
- [ ] Historique modifications

### Total estimé: 8-12 heures de développement

## 🧪 Tests

### Test unitaires
- Validation configuration template
- Génération PDF avec différents templates
- Upload logo

### Test d'intégration
- CRUD complet templates
- Génération PDF avec template personnalisé
- Aperçu temps réel

### Test utilisateur
- Création template de A à Z
- Réorganisation sections
- Génération PDF final

## 📝 Documentation utilisateur

À créer dans `/docs/templates-pdf.md`:
- Guide de création de template
- Exemples de configurations
- FAQ
- Limites et contraintes

## 🎨 Wireframes

### Page liste templates
```
┌─────────────────────────────────────┐
│ Templates de demandes de subvention │
│                                     │
│ [+ Nouveau template]                │
│                                     │
│ ┌─────────────┐ ┌─────────────┐   │
│ │ Template 1  │ │ Template 2  │   │
│ │ [Défaut]    │ │             │   │
│ │ Modifier    │ │ Modifier    │   │
│ │ Dupliquer   │ │ Supprimer   │   │
│ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────┘
```

### Éditeur template (split view)
```
┌──────────────────┬──────────────────┐
│ Configuration    │ Aperçu PDF       │
│                  │                  │
│ [Visuel]         │ ┌──────────────┐ │
│ [Structure]      │ │              │ │
│ [Avancé]         │ │  [PDF live]  │ │
│                  │ │              │ │
│ Logo:            │ │              │ │
│ [Upload]         │ │              │ │
│                  │ │              │ │
│ Polices:         │ │              │ │
│ [Helvetica ▼]    │ └──────────────┘ │
│                  │                  │
│ Couleurs:        │ [Télécharger]    │
│ [🎨 #1e40af]    │                  │
│                  │                  │
│ [Enregistrer]    │                  │
└──────────────────┴──────────────────┘
```

## 🔒 Sécurité

- Validation taille et type fichiers logos
- Sanitization des inputs
- Limite nombre de templates par utilisateur
- Validation des couleurs hex
- Validation des marges (min/max)

## ⚡ Performance

- Cache des templates fréquents
- Génération asynchrone des aperçus
- Debounce sur modifications (aperçu)
- Lazy loading des templates

## 🌐 Internationalisation

- Supports français par défaut
- Prévoir traductions interface
- Format dates selon locale
- Unités (mm, cm, in) configurables

---

**Document créé le:** 2026-02-23
**Dernière mise à jour:** 2026-02-23
**Auteur:** Claude Code
**Version:** 1.0
