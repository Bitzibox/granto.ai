const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * GET /api/notifications
 * Récupère les notifications de l'utilisateur
 */
router.get('/', async (req, res) => {
  try {
    const { userId, onlyUnread } = req.query;

    const where = {};
    if (userId) where.userId = userId;
    if (onlyUnread === 'true') where.isRead = false;

    const notifications = await prisma.notification.findMany({
      where,
      include: {
        dossier: {
          include: {
            projet: true,
            dispositif: true
          }
        },
        dispositif: true,
        projet: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limiter à 50 notifications
    });

    res.json(notifications);
  } catch (error) {
    console.error('Erreur récupération notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/notifications/count
 * Compte les notifications non lues
 */
router.get('/count', async (req, res) => {
  try {
    const { userId } = req.query;

    const where = { isRead: false };
    if (userId) where.userId = userId;

    const count = await prisma.notification.count({ where });

    res.json({ count });
  } catch (error) {
    console.error('Erreur comptage notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/notifications/generate
 * Génère les notifications automatiques basées sur les échéances
 */
router.post('/generate', async (req, res) => {
  try {
    const notificationsCreated = [];

    // 1. Récupérer tous les dossiers avec échéances
    const dossiers = await prisma.dossierSubvention.findMany({
      where: {
        echeanceDepot: {
          not: null
        }
      },
      include: {
        projet: true,
        dispositif: true
      }
    });

    const now = new Date();

    for (const dossier of dossiers) {
      if (!dossier.echeanceDepot) continue;

      const echeance = new Date(dossier.echeanceDepot);
      const joursRestants = Math.ceil((echeance.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      let type = null;
      let priorite = 'info';
      let titre = '';

      // Dépassée
      if (joursRestants < 0) {
        type = 'echeance_depassee';
        priorite = 'urgent';
        titre = `Échéance dépassée: ${dossier.projet?.titre || 'Dossier'}`;
      }
      // Urgente (7 jours ou moins)
      else if (joursRestants <= 7) {
        type = 'echeance_urgente';
        priorite = 'urgent';
        titre = `Échéance urgente: ${dossier.projet?.titre || 'Dossier'} (${joursRestants}j)`;
      }
      // Proche (30 jours ou moins)
      else if (joursRestants <= 30) {
        type = 'echeance_proche';
        priorite = 'warning';
        titre = `Échéance proche: ${dossier.projet?.titre || 'Dossier'} (${joursRestants}j)`;
      }

      if (type) {
        // Vérifier si la notification n'existe pas déjà (éviter les doublons)
        const existing = await prisma.notification.findFirst({
          where: {
            dossierId: dossier.id,
            type,
            isRead: false
          }
        });

        if (!existing) {
          const notification = await prisma.notification.create({
            data: {
              type,
              priorite,
              titre,
              message: `Le dossier pour "${dossier.dispositif?.nom}" a une échéance le ${echeance.toLocaleDateString('fr-FR')}`,
              dossierId: dossier.id,
              projetId: dossier.projetId
            }
          });
          notificationsCreated.push(notification);
        }
      }
    }

    // 2. Vérifier les nouveaux dispositifs ouverts (dateCloture dans le futur)
    const dispositifs = await prisma.dispositif.findMany({
      where: {
        dateCloture: {
          gte: now
        }
      }
    });

    for (const dispositif of dispositifs) {
      // Vérifier si notification déjà créée pour ce dispositif
      const existing = await prisma.notification.findFirst({
        where: {
          dispositifId: dispositif.id,
          type: 'nouveau_dispositif',
          isRead: false
        }
      });

      // Ne créer la notification que si le dispositif a été créé récemment (moins de 7 jours)
      const creationAge = Math.ceil((now.getTime() - dispositif.createdAt.getTime()) / (1000 * 60 * 60 * 24));

      if (!existing && creationAge <= 7) {
        const notification = await prisma.notification.create({
          data: {
            type: 'nouveau_dispositif',
            priorite: 'info',
            titre: `Nouveau dispositif disponible: ${dispositif.nom}`,
            message: dispositif.description || 'Consultez les détails de ce nouveau dispositif',
            dispositifId: dispositif.id
          }
        });
        notificationsCreated.push(notification);
      }
    }

    res.json({
      success: true,
      count: notificationsCreated.length,
      notifications: notificationsCreated
    });
  } catch (error) {
    console.error('Erreur génération notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Marque une notification comme lue
 */
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    res.json(notification);
  } catch (error) {
    console.error('Erreur marquage notification:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/notifications/read-all
 * Marque toutes les notifications comme lues
 */
router.put('/read-all', async (req, res) => {
  try {
    const { userId } = req.body;

    const where = { isRead: false };
    if (userId) where.userId = userId;

    const result = await prisma.notification.updateMany({
      where,
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    res.json({ success: true, count: result.count });
  } catch (error) {
    console.error('Erreur marquage toutes notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/notifications/:id
 * Supprime une notification
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.notification.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Erreur suppression notification:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
