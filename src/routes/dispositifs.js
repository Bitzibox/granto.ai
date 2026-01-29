const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET tous les dispositifs
router.get('/', async (req, res) => {
  try {
    const dispositifs = await prisma.dispositif.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(dispositifs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET un dispositif par ID
router.get('/:id', async (req, res) => {
  try {
    const dispositif = await prisma.dispositif.findUnique({
      where: { id: req.params.id }
    });
    
    if (!dispositif) {
      return res.status(404).json({ error: 'Dispositif non trouvé' });
    }
    
    res.json(dispositif);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST créer un dispositif (ou retourner l'existant si URL identique)
router.post('/', async (req, res) => {
  try {
    const {
      nom,
      description,
      organisme,
      typesProjets,
      tauxMin,
      tauxMax,
      montantMin,
      montantMax,
      zonesEligibles,
      dateOuverture,
      dateCloture,
      url,
      criteresEligibilite,
      documentsRequis
    } = req.body;

    // Si URL fournie, vérifier si le dispositif existe déjà
    if (url) {
      const existant = await prisma.dispositif.findFirst({
        where: { url }
      });

      if (existant) {
        // Retourner le dispositif existant
        return res.status(200).json(existant);
      }
    }

    // Créer le nouveau dispositif
    const dispositif = await prisma.dispositif.create({
      data: {
        nom: nom || 'Dispositif sans nom',
        description,
        organisme,
        typesProjets: typesProjets || [],
        tauxMin,
        tauxMax,
        montantMin: montantMin ? parseInt(montantMin) : null,
        montantMax: montantMax ? parseInt(montantMax) : null,
        zonesEligibles: zonesEligibles || [],
        dateOuverture: dateOuverture ? new Date(dateOuverture) : null,
        dateCloture: dateCloture ? new Date(dateCloture) : null,
        url,
        criteresEligibilite,
        documentsRequis: documentsRequis || []
      }
    });
    res.status(201).json(dispositif);
  } catch (error) {
    console.error('Erreur création dispositif:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT mettre à jour un dispositif
router.put('/:id', async (req, res) => {
  try {
    const dispositif = await prisma.dispositif.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(dispositif);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE supprimer un dispositif
router.delete('/:id', async (req, res) => {
  try {
    await prisma.dispositif.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
