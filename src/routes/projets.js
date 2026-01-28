const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET tous les projets
router.get('/', async (req, res) => {
  try {
    const projets = await prisma.projet.findMany({ 
      include: { 
        collectivite: true, 
        dossiers: {
          include: { dispositif: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(projets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET un projet par ID
router.get('/:id', async (req, res) => {
  try {
    const projet = await prisma.projet.findUnique({
      where: { id: req.params.id },
      include: { 
        collectivite: true, 
        dossiers: {
          include: { dispositif: true }
        }
      }
    });
    if (!projet) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }
    res.json(projet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST créer un projet
router.post('/', async (req, res) => {
  try {
    const projet = await prisma.projet.create({ 
      data: req.body,
      include: { collectivite: true }
    });
    res.status(201).json(projet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT mettre à jour un projet
router.put('/:id', async (req, res) => {
  try {
    const projet = await prisma.projet.update({
      where: { id: req.params.id },
      data: req.body,
      include: { collectivite: true }
    });
    res.json(projet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE supprimer un projet
router.delete('/:id', async (req, res) => {
  try {
    await prisma.projet.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
