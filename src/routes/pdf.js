/**
 * Routes API pour la génération de documents PDF
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { getPdfGenerator } = require('../services/PdfGenerator');

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
 * - ou données complètes (collectivite, projet, dispositif, dossier)
 */
router.post('/demande-subvention', async (req, res) => {
  try {
    const { dossierId, collectivite, projet, dispositif, dossier } = req.body;

    let pdfData;

    if (dossierId && prisma) {
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

      pdfData = {
        collectivite: dossierDb.projet.collectivite,
        projet: dossierDb.projet,
        dispositif: dossierDb.dispositif,
        dossier: dossierDb,
      };
    } else if (collectivite && projet) {
      // Utiliser les données fournies
      pdfData = { collectivite, projet, dispositif, dossier };
    } else {
      return res.status(400).json({
        error: 'Données insuffisantes',
        message: 'Fournir dossierId ou les données complètes (collectivite, projet)',
      });
    }

    const pdfGenerator = getPdfGenerator();
    const result = await pdfGenerator.generateDemandeSubvention(pdfData);

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
 * GET /api/pdf/download/:fileName
 * Télécharge un PDF généré
 */
router.get('/download/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    const pdfGenerator = getPdfGenerator();
    const filePath = path.join(pdfGenerator.outputDir, fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    // Mettre à jour le compteur de téléchargement si en base
    await prisma.generatedPdf.updateMany({
      where: { fileName },
      data: {
        downloadCount: { increment: 1 },
        lastDownload: new Date(),
      },
    });

    res.download(filePath, fileName);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    res.status(500).json({
      error: 'Erreur lors du téléchargement',
      message: error.message,
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
    const pdfGenerator = getPdfGenerator();

    const deleted = pdfGenerator.deletePdf(fileName);

    if (!deleted) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    // Supprimer de la base aussi
    await prisma.generatedPdf.deleteMany({
      where: { fileName },
    });

    res.json({ success: true, message: 'PDF supprimé' });
  } catch (error) {
    console.error('Error deleting PDF:', error);
    res.status(500).json({
      error: 'Erreur lors de la suppression',
      message: error.message,
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
