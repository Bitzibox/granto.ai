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

// POST créer un dispositif
router.post('/', async (req, res) => {
  try {
    const dispositif = await prisma.dispositif.create({ 
      data: req.body 
    });
    res.status(201).json(dispositif);
  } catch (error) {
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
