const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET tous les dossiers
router.get('/', async (req, res) => {
  try {
    const dossiers = await prisma.dossierSubvention.findMany({
      include: {
        projet: {
          include: {
            collectivite: true
          }
        },
        dispositif: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(dossiers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET un dossier par ID
router.get('/:id', async (req, res) => {
  try {
    const dossier = await prisma.dossierSubvention.findUnique({
      where: { id: req.params.id },
      include: {
        projet: {
          include: {
            collectivite: true
          }
        },
        dispositif: true
      }
    });
    
    if (!dossier) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }
    
    res.json(dossier);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET dossiers par projet
router.get('/projet/:projetId', async (req, res) => {
  try {
    const dossiers = await prisma.dossierSubvention.findMany({
      where: { projetId: req.params.projetId },
      include: {
        dispositif: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(dossiers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST créer un dossier
router.post('/', async (req, res) => {
  try {
    const { projetId, dispositifId, montantDemande, echeanceDepot, notes } = req.body;
    
    // Vérifier que le projet et le dispositif existent
    const projet = await prisma.projet.findUnique({ where: { id: projetId } });
    const dispositif = await prisma.dispositif.findUnique({ where: { id: dispositifId } });
    
    if (!projet || !dispositif) {
      return res.status(404).json({ error: 'Projet ou dispositif non trouvé' });
    }
    
    // Vérifier qu'un dossier n'existe pas déjà
    const existant = await prisma.dossierSubvention.findFirst({
      where: { projetId, dispositifId }
    });
    
    if (existant) {
      return res.status(400).json({ error: 'Un dossier existe déjà pour ce projet et ce dispositif' });
    }
    
    const dossier = await prisma.dossierSubvention.create({
      data: {
        projetId,
        dispositifId,
        montantDemande: montantDemande ? parseFloat(montantDemande) : null,
        echeanceDepot: echeanceDepot ? new Date(echeanceDepot) : dispositif.dateCloture,
        notes,
        statut: 'brouillon'
      },
      include: {
        projet: {
          include: {
            collectivite: true
          }
        },
        dispositif: true
      }
    });
    
    res.status(201).json(dossier);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT mettre à jour un dossier
router.put('/:id', async (req, res) => {
  try {
    const dossier = await prisma.dossierSubvention.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        montantDemande: req.body.montantDemande ? parseFloat(req.body.montantDemande) : undefined,
        montantAccorde: req.body.montantAccorde ? parseFloat(req.body.montantAccorde) : undefined,
        tauxRetenu: req.body.tauxRetenu ? parseFloat(req.body.tauxRetenu) : undefined,
        dateDepot: req.body.dateDepot ? new Date(req.body.dateDepot) : undefined,
        dateDecision: req.body.dateDecision ? new Date(req.body.dateDecision) : undefined,
        echeanceDepot: req.body.echeanceDepot ? new Date(req.body.echeanceDepot) : undefined,
      },
      include: {
        projet: {
          include: {
            collectivite: true
          }
        },
        dispositif: true
      }
    });
    res.json(dossier);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE supprimer un dossier
router.delete('/:id', async (req, res) => {
  try {
    await prisma.dossierSubvention.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET statistiques des dossiers
router.get('/stats/overview', async (req, res) => {
  try {
    const total = await prisma.dossierSubvention.count();
    const parStatut = await prisma.dossierSubvention.groupBy({
      by: ['statut'],
      _count: true
    });
    
    const montantTotal = await prisma.dossierSubvention.aggregate({
      _sum: {
        montantDemande: true,
        montantAccorde: true
      }
    });
    
    res.json({
      total,
      parStatut,
      montantTotalDemande: montantTotal._sum.montantDemande || 0,
      montantTotalAccorde: montantTotal._sum.montantAccorde || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
