const express = require('express');
const router = express.Router();
const {
  createTemplate,
  getTemplates,
  getTemplateById,
  getDefaultTemplate,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
  duplicateTemplate,
  validateTemplate,
  getSystemDefaultTemplate
} = require('../services/pdfTemplateService');

/**
 * GET /api/pdf-templates
 * Liste les templates (+ template système par défaut)
 */
router.get('/', async (req, res) => {
  try {
    const { userId, collectiviteId } = req.query;

    let templates = [];
    try {
      templates = await getTemplates(userId || null, collectiviteId || null);
    } catch (e) {
      // Table pas encore migrée - retourner seulement le template système
      console.warn('⚠️ Table PdfTemplate pas encore disponible, utilisation du template système');
    }

    // Toujours ajouter le template système en premier s'il n'y a rien
    const systemTemplate = {
      id: 'system-default',
      ...getSystemDefaultTemplate(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Si aucun template personnalisé, retourner le système
    if (templates.length === 0) {
      return res.json([systemTemplate]);
    }

    res.json([systemTemplate, ...templates]);
  } catch (error) {
    console.error('Erreur liste templates:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/pdf-templates/default
 * Récupère le template par défaut de l'utilisateur
 */
router.get('/default', async (req, res) => {
  try {
    const { userId, collectiviteId } = req.query;

    if (!userId) {
      // Si pas d'userId, retourner le template système
      return res.json({
        id: 'system-default',
        ...getSystemDefaultTemplate()
      });
    }

    try {
      const defaultTemplate = await getDefaultTemplate(userId, collectiviteId || null);

      if (defaultTemplate) {
        return res.json(defaultTemplate);
      }
    } catch (e) {
      console.warn('⚠️ Erreur récupération template par défaut:', e.message);
    }

    // Fallback: template système
    res.json({
      id: 'system-default',
      ...getSystemDefaultTemplate()
    });
  } catch (error) {
    console.error('Erreur récupération template par défaut:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/pdf-templates/:id
 */
router.get('/:id', async (req, res) => {
  try {
    if (req.params.id === 'system-default') {
      return res.json({
        id: 'system-default',
        ...getSystemDefaultTemplate()
      });
    }
    const template = await getTemplateById(req.params.id);
    res.json(template);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

/**
 * POST /api/pdf-templates
 */
router.post('/', async (req, res) => {
  try {
    const validation = validateTemplate(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Validation échouée', details: validation.errors });
    }
    const template = await createTemplate(req.body);
    res.status(201).json(template);
  } catch (error) {
    console.error('Erreur création template:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/pdf-templates/:id
 */
router.put('/:id', async (req, res) => {
  try {
    if (req.params.id === 'system-default') {
      return res.status(400).json({ error: 'Impossible de modifier le template système' });
    }
    const validation = validateTemplate(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Validation échouée', details: validation.errors });
    }
    const template = await updateTemplate(req.params.id, req.body);
    res.json(template);
  } catch (error) {
    console.error('Erreur mise à jour template:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/pdf-templates/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    if (req.params.id === 'system-default') {
      return res.status(400).json({ error: 'Impossible de supprimer le template système' });
    }
    await deleteTemplate(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/pdf-templates/:id/set-default
 */
router.post('/:id/set-default', async (req, res) => {
  try {
    const { userId } = req.body;
    const template = await setDefaultTemplate(req.params.id, userId);
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/pdf-templates/:id/duplicate
 */
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { userId } = req.body;

    if (req.params.id === 'system-default') {
      // Dupliquer le template système = créer à partir du défaut
      const systemDefault = getSystemDefaultTemplate();
      const template = await createTemplate({
        ...systemDefault,
        nom: 'Mon template personnalisé',
        userId,
        isDefault: false
      });
      return res.status(201).json(template);
    }

    const template = await duplicateTemplate(req.params.id, userId);
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/pdf-templates/preview
 * Génère un aperçu PDF avec un template donné
 */
router.post('/preview', async (req, res) => {
  try {
    const { template: templateConfig } = req.body;
    const { genererDossierPDF } = require('../services/pdfService');

    // Données de démo pour l'aperçu
    const demoData = {
      projet: {
        description: 'Rénovation du gymnase communal',
        budget: 200000
      },
      aide: {
        name: 'DETR - Dotation d\'Équipement des Territoires Ruraux',
        slug: 'detr-sarthe',
        financers: ['État - Préfecture de la Sarthe'],
        subvention_rate_lower_bound: 20,
        subvention_rate_upper_bound: 50
      },
      commune: {
        nom: 'Saint-Mars-la-Brière',
        departement: '72',
        region: 'Pays de la Loire',
        codePostal: '72470'
      },
      collectivite: 'Saint-Mars-la-Brière',
      analysis: {
        categorie_principale: 'batiment',
        mots_cles: ['rénovation', 'gymnase', 'sport'],
        montant_estime: 200000,
        description_enrichie: 'Le projet porte sur la rénovation complète du gymnase communal. Les travaux comprennent l\'isolation thermique, la réfection de la toiture, la mise aux normes d\'accessibilité et la modernisation des équipements sportifs.',
        eligibilite_detr: true,
        eligibilite_dsil: true
      }
    };

    const pdfBuffer = await genererDossierPDF(demoData, templateConfig);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="apercu-template.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Erreur aperçu template:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
