const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET toutes les collectivités
router.get('/', async (req, res) => {
  try {
    const collectivites = await prisma.collectivite.findMany({
      include: { projets: true }
    });
    res.json(collectivites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET une collectivité par ID
router.get('/:id', async (req, res) => {
  try {
    const collectivite = await prisma.collectivite.findUnique({
      where: { id: req.params.id },
      include: { projets: true }
    });
    if (!collectivite) {
      return res.status(404).json({ error: 'Collectivité non trouvée' });
    }
    res.json(collectivite);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST créer une collectivité
router.post('/', async (req, res) => {
  try {
    const collectivite = await prisma.collectivite.create({
      data: req.body
    });
    res.status(201).json(collectivite);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT mettre à jour une collectivité
router.put('/:id', async (req, res) => {
  try {
    const collectivite = await prisma.collectivite.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(collectivite);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE supprimer une collectivité
router.delete('/:id', async (req, res) => {
  try {
    await prisma.collectivite.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
