/**
 * Routes API pour la génération de documents PDF
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { genererDossierPDF } = require('../services/pdfService');
const { getDefaultTemplate } = require('../services/pdfTemplateService');

// Prisma optionnel - peut ne pas être disponible
let prisma = null;
try {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
} catch (e) {
  console.warn('[PDF] Prisma not available - database features disabled');
}

/**
 * POST /api/pdf/demande-subvention
 * Génère un dossier de demande de subvention
 *
 * Body:
 * - dossierId: ID du dossier de subvention
 */
router.post('/demande-subvention', async (req, res) => {
  try {
    const { dossierId } = req.body;

    if (!dossierId) {
      return res.status(400).json({
        error: 'Données insuffisantes',
        message: 'Fournir dossierId',
      });
    }

    if (!prisma) {
      return res.status(500).json({
        error: 'Base de données non disponible',
        message: 'Prisma client non initialisé'
      });
    }

    // Récupérer les données depuis la base
    const dossierDb = await prisma.dossierSubvention.findUnique({
      where: { id: dossierId },
      include: {
        projet: {
          include: {
            collectivite: true,
          },
        },
        dispositif: true,
      },
    });

    if (!dossierDb) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }

    // Formater les données pour genererDossierPDF avec toutes les informations nécessaires
    const pdfData = {
      projet: {
        description: dossierDb.projet.description || dossierDb.projet.titre,
        budget: dossierDb.montantDemande || dossierDb.projet.montantHt || 0
      },
      aide: {
        name: dossierDb.dispositif.nom,
        slug: dossierDb.dispositif.id,
        financers: [dossierDb.dispositif.organisme || 'Non spécifié'],
        subvention_rate_lower_bound: dossierDb.dispositif.tauxMin || null,
        subvention_rate_upper_bound: dossierDb.dispositif.tauxMax || null,
        description: dossierDb.dispositif.description || dossierDb.dispositif.nom
      },
      commune: {
        nom: dossierDb.projet.collectivite.nom,
        departement: dossierDb.projet.collectivite.codePostal?.substring(0, 2) || '72',
        region: 'Pays de la Loire',
        codePostal: dossierDb.projet.collectivite.codePostal || '',
        ville: dossierDb.projet.collectivite.ville || dossierDb.projet.collectivite.nom,
      },
      collectivite: dossierDb.projet.collectivite.nom,
      analysis: {
        categorie_principale: dossierDb.projet.typeProjet || 'equipement',
        mots_cles: [
          dossierDb.projet.typeProjet || 'projet',
          'collectivité',
          'infrastructure'
        ],
        montant_estime: dossierDb.montantDemande || dossierDb.projet.montantHt || 0,
        description_enrichie: dossierDb.projet.description || dossierDb.projet.titre || 'Projet de la collectivité',
        eligibilite_detr: true,
        eligibilite_dsil: true
      }
    };

    // Récupérer le template par défaut (ou utiliser le template système)
    let templateConfig = null;
    try {
      templateConfig = await getDefaultTemplate(null, null);
    } catch (e) {
      console.warn('Utilisation du template système par défaut');
    }

    // Générer le PDF
    const pdfBuffer = await genererDossierPDF(pdfData, templateConfig);

    // Sauvegarder le PDF dans public/pdfs
    const timestamp = Date.now();
    const fileName = `dossier-${dossierDb.projet.titre.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${timestamp}.pdf`;
    const filePath = `/pdfs/${fileName}`;
    const publicDir = path.join(__dirname, '../../public');
    const pdfsDir = path.join(publicDir, 'pdfs');
    const absolutePath = path.join(pdfsDir, fileName);

    // Créer le dossier public/pdfs s'il n'existe pas
    await fs.mkdir(pdfsDir, { recursive: true });

    await fs.writeFile(absolutePath, pdfBuffer);

    // Créer l'enregistrement en base
    await prisma.generatedPdf.create({
      data: {
        dossierId,
        fileName,
        filePath,
        fileSize: pdfBuffer.length,
        templateUsed: templateConfig || null,
        generatedData: pdfData
      }
    });

    // Retourner le PDF directement
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating demande subvention PDF:', error);
    res.status(500).json({
      error: 'Erreur lors de la génération du PDF',
      message: error.message,
    });
  }
});

/**
 * POST /api/pdf/budget-previsionnel
 * Génère un budget prévisionnel
 */
router.post('/budget-previsionnel', async (req, res) => {
  try {
    const { projetId, collectivite, projet, depenses, recettes } = req.body;

    let pdfData;

    if (projetId) {
      const projetDb = await prisma.projet.findUnique({
        where: { id: projetId },
        include: {
          collectivite: true,
        },
      });

      if (!projetDb) {
        return res.status(404).json({ error: 'Projet non trouvé' });
      }

      pdfData = {
        collectivite: projetDb.collectivite,
        projet: projetDb,
        depenses: depenses || [],
        recettes: recettes || [],
      };
    } else if (collectivite && projet) {
      pdfData = { collectivite, projet, depenses: depenses || [], recettes: recettes || [] };
    } else {
      return res.status(400).json({
        error: 'Données insuffisantes',
        message: 'Fournir projetId ou les données complètes (collectivite, projet)',
      });
    }

    const pdfGenerator = getPdfGenerator();
    const result = await pdfGenerator.generateBudgetPrevisionnel(pdfData);

    res.json({
      success: true,
      ...result,
      downloadUrl: `/api/pdf/download/${result.fileName}`,
    });
  } catch (error) {
    console.error('Error generating budget PDF:', error);
    res.status(500).json({
      error: 'Erreur lors de la génération du PDF',
      message: error.message,
    });
  }
});

/**
 * POST /api/pdf/deliberation
 * Génère un modèle de délibération
 */
router.post('/deliberation', async (req, res) => {
  try {
    const { dossierId, collectivite, projet, dispositif, dossier } = req.body;

    let pdfData;

    if (dossierId) {
      const dossierDb = await prisma.dossierSubvention.findUnique({
        where: { id: dossierId },
        include: {
          projet: {
            include: {
              collectivite: true,
            },
          },
          dispositif: true,
        },
      });

      if (!dossierDb) {
        return res.status(404).json({ error: 'Dossier non trouvé' });
      }

      pdfData = {
        collectivite: dossierDb.projet.collectivite,
        projet: dossierDb.projet,
        dispositif: dossierDb.dispositif,
        dossier: dossierDb,
      };
    } else if (collectivite && projet) {
      pdfData = { collectivite, projet, dispositif, dossier };
    } else {
      return res.status(400).json({
        error: 'Données insuffisantes',
        message: 'Fournir dossierId ou les données complètes (collectivite, projet)',
      });
    }

    const pdfGenerator = getPdfGenerator();
    const result = await pdfGenerator.generateDeliberation(pdfData);

    // Enregistrer en base si dossierId fourni
    if (dossierId) {
      await prisma.generatedPdf.create({
        data: {
          dossierId,
          fileName: result.fileName,
          filePath: result.filePath,
          fileSize: result.fileSize,
          generatedData: pdfData,
        },
      });
    }

    res.json({
      success: true,
      ...result,
      downloadUrl: `/api/pdf/download/${result.fileName}`,
    });
  } catch (error) {
    console.error('Error generating deliberation PDF:', error);
    res.status(500).json({
      error: 'Erreur lors de la génération du PDF',
      message: error.message,
    });
  }
});

/**
 * Valide et sanitize un nom de fichier pour prévenir le directory traversal
 */
function sanitizeFileName(fileName) {
  // Supprimer les caractères dangereux et les séquences de traversal
  const sanitized = path.basename(fileName).replace(/[^a-zA-Z0-9_\-\.]/g, '');

  // Vérifier que c'est un PDF
  if (!sanitized.toLowerCase().endsWith('.pdf')) {
    throw new Error('Seuls les fichiers PDF sont autorisés');
  }

  // Vérifier la longueur
  if (sanitized.length === 0 || sanitized.length > 255) {
    throw new Error('Nom de fichier invalide');
  }

  return sanitized;
}

/**
 * Vérifie que le chemin final est bien dans le répertoire autorisé
 */
function isPathSafe(requestedPath, allowedDir) {
  const resolvedPath = path.resolve(requestedPath);
  const resolvedAllowedDir = path.resolve(allowedDir);
  return resolvedPath.startsWith(resolvedAllowedDir);
}

/**
 * GET /api/pdf/download/:fileName
 * Télécharge un PDF généré
 */
router.get('/download/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;

    // SÉCURITÉ: Valider et sanitizer le nom de fichier
    let sanitizedFileName;
    try {
      sanitizedFileName = sanitizeFileName(fileName);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    const pdfGenerator = getPdfGenerator();
    const filePath = path.join(pdfGenerator.outputDir, sanitizedFileName);

    // SÉCURITÉ: Vérifier que le chemin final est bien dans le répertoire autorisé
    if (!isPathSafe(filePath, pdfGenerator.outputDir)) {
      console.warn(`Tentative de directory traversal bloquée: ${fileName}`);
      return res.status(403).json({ error: 'Accès refusé' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    // Mettre à jour le compteur de téléchargement si en base
    await prisma.generatedPdf.updateMany({
      where: { fileName: sanitizedFileName },
      data: {
        downloadCount: { increment: 1 },
        lastDownload: new Date(),
      },
    });

    res.download(filePath, sanitizedFileName);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    // SÉCURITÉ: Ne pas exposer les détails de l'erreur
    res.status(500).json({
      error: 'Erreur lors du téléchargement'
    });
  }
});

/**
 * GET /api/pdf/list
 * Liste les PDF générés
 */
router.get('/list', async (req, res) => {
  try {
    const pdfGenerator = getPdfGenerator();
    const files = pdfGenerator.listGeneratedPdfs();
    res.json(files);
  } catch (error) {
    console.error('Error listing PDFs:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération de la liste',
      message: error.message,
    });
  }
});

/**
 * GET /api/pdf/dossier/:dossierId
 * Liste les PDF générés pour un dossier
 */
router.get('/dossier/:dossierId', async (req, res) => {
  try {
    const { dossierId } = req.params;

    const pdfs = await prisma.generatedPdf.findMany({
      where: { dossierId },
      orderBy: { generatedAt: 'desc' },
    });

    res.json(pdfs.map(pdf => ({
      ...pdf,
      downloadUrl: `/api/pdf/download/${pdf.fileName}`,
    })));
  } catch (error) {
    console.error('Error listing dossier PDFs:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des PDF',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/pdf/:fileName
 * Supprime un PDF généré
 */
router.delete('/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;

    // SÉCURITÉ: Valider et sanitizer le nom de fichier
    let sanitizedFileName;
    try {
      sanitizedFileName = sanitizeFileName(fileName);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    const pdfGenerator = getPdfGenerator();
    const deleted = pdfGenerator.deletePdf(sanitizedFileName);

    if (!deleted) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    // Supprimer de la base aussi
    await prisma.generatedPdf.deleteMany({
      where: { fileName: sanitizedFileName },
    });

    res.json({ success: true, message: 'PDF supprimé' });
  } catch (error) {
    console.error('Error deleting PDF:', error);
    // SÉCURITÉ: Ne pas exposer les détails de l'erreur
    res.status(500).json({
      error: 'Erreur lors de la suppression'
    });
  }
});

/**
 * GET /api/pdf/templates
 * Liste les templates disponibles
 */
router.get('/templates', async (req, res) => {
  try {
    res.json([
      {
        id: 'demande-subvention',
        name: 'Demande de subvention',
        description: 'Formulaire de demande de subvention standard',
        endpoint: '/api/pdf/demande-subvention',
        requiredFields: ['collectivite', 'projet'],
        optionalFields: ['dispositif', 'dossier'],
      },
      {
        id: 'budget-previsionnel',
        name: 'Budget prévisionnel',
        description: 'Tableau récapitulatif des dépenses et recettes',
        endpoint: '/api/pdf/budget-previsionnel',
        requiredFields: ['collectivite', 'projet'],
        optionalFields: ['depenses', 'recettes'],
      },
      {
        id: 'deliberation',
        name: 'Modèle de délibération',
        description: 'Extrait du registre des délibérations pour demande de subvention',
        endpoint: '/api/pdf/deliberation',
        requiredFields: ['collectivite', 'projet'],
        optionalFields: ['dispositif', 'dossier'],
      },
    ]);
  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des templates',
      message: error.message,
    });
  }
});

module.exports = router;
