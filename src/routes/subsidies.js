/**
 * Routes API pour la recherche unifiée de subventions
 * Agrège les résultats de toutes les sources configurées
 */

const express = require('express');
const router = express.Router();
const { getAggregator } = require('../services/SubsidyAggregator');
const { getScoringService } = require('../services/ScoringService');

// Prisma optionnel - peut ne pas être disponible
let prisma = null;
try {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
} catch (e) {
  console.warn('[Subsidies] Prisma not available - scoring by collectivite disabled');
}

/**
 * GET /api/subsidies/search
 * Recherche unifiée sur toutes les sources
 *
 * Query params:
 * - text: Texte de recherche
 * - sources: Sources à interroger (comma-separated)
 * - beneficiaryTypes: Types de bénéficiaires (comma-separated)
 * - projectTypes: Types de projets (comma-separated)
 * - aidTypes: Types d'aides (comma-separated)
 * - collectiviteId: ID de la collectivité (pour scoring)
 * - projetId: ID du projet (pour scoring)
 * - page: Numéro de page
 * - pageSize: Taille de page
 * - sortBy: Critère de tri (relevance, deadline, amount_desc, amount_asc, name)
 */
router.get('/search', async (req, res) => {
  try {
    const {
      text,
      sources,
      beneficiaryTypes,
      projectTypes,
      aidTypes,
      collectiviteId,
      projetId,
      page = 1,
      pageSize = 20,
      sortBy = 'relevance',
    } = req.query;

    const aggregator = getAggregator();

    // Préparer les paramètres de recherche
    const searchParams = {
      text: text || '',
      sources: sources ? sources.split(',') : null,
      beneficiaryTypes: beneficiaryTypes ? beneficiaryTypes.split(',') : null,
      projectTypes: projectTypes ? projectTypes.split(',') : null,
      aidTypes: aidTypes ? aidTypes.split(',') : null,
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      sortBy,
    };

    // Effectuer la recherche
    const results = await aggregator.search(searchParams);

    // Si une collectivité est spécifiée et Prisma disponible, calculer les scores
    if (collectiviteId && prisma) {
      try {
        const collectivite = await prisma.collectivite.findUnique({
          where: { id: collectiviteId },
        });

        if (collectivite) {
          const scoringService = getScoringService();
          let projet = null;

          if (projetId) {
            projet = await prisma.projet.findUnique({
              where: { id: projetId },
            });
          }

          // Ajouter les scores aux résultats
          results.items = results.items.map(item => ({
            ...item,
            score: scoringService.calculateScore(item, collectivite, projet),
          }));

          // Re-trier par score si demandé
          if (sortBy === 'relevance') {
            results.items.sort((a, b) => b.score.global - a.score.global);
          }
        }
      } catch (dbError) {
        console.warn('Database not available for scoring:', dbError.message);
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Error in subsidies search:', error);
    res.status(500).json({
      error: 'Erreur lors de la recherche',
      message: error.message,
    });
  }
});

/**
 * GET /api/subsidies/sources
 * Liste les sources de données disponibles
 */
router.get('/sources', async (req, res) => {
  try {
    const aggregator = getAggregator();
    const sources = aggregator.getSources();
    res.json(sources);
  } catch (error) {
    console.error('Error getting sources:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des sources',
      message: error.message,
    });
  }
});

/**
 * GET /api/subsidies/health
 * Vérifie l'état de santé des sources
 */
router.get('/health', async (req, res) => {
  try {
    const aggregator = getAggregator();
    const health = await aggregator.healthCheck();
    res.json(health);
  } catch (error) {
    console.error('Error checking health:', error);
    res.status(500).json({
      error: 'Erreur lors de la vérification',
      message: error.message,
    });
  }
});

/**
 * GET /api/subsidies/stats
 * Statistiques sur les sources
 */
router.get('/stats', async (req, res) => {
  try {
    const aggregator = getAggregator();
    const stats = await aggregator.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des statistiques',
      message: error.message,
    });
  }
});

/**
 * GET /api/subsidies/:source/:id
 * Récupère les détails d'une subvention depuis sa source
 */
router.get('/:source/:id', async (req, res) => {
  try {
    const { source, id } = req.params;
    const { collectiviteId, projetId } = req.query;

    const aggregator = getAggregator();
    const details = await aggregator.getDetails(source, id);

    // Calculer le score si collectivité spécifiée et Prisma disponible
    if (collectiviteId && prisma) {
      try {
        const collectivite = await prisma.collectivite.findUnique({
          where: { id: collectiviteId },
        });

        if (collectivite) {
          const scoringService = getScoringService();
          let projet = null;

          if (projetId) {
            projet = await prisma.projet.findUnique({
              where: { id: projetId },
            });
          }

          details.score = scoringService.calculateScore(details, collectivite, projet);
        }
      } catch (dbError) {
        console.warn('Database not available for scoring:', dbError.message);
      }
    }

    res.json(details);
  } catch (error) {
    console.error('Error getting subsidy details:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des détails',
      message: error.message,
    });
  }
});

/**
 * POST /api/subsidies/sync
 * Déclenche une synchronisation des sources
 */
router.post('/sync', async (req, res) => {
  try {
    const { sources } = req.body;
    const aggregator = getAggregator();

    // Lancer la sync en arrière-plan
    const syncPromise = aggregator.syncAll(sources);

    // Répondre immédiatement
    res.json({
      message: 'Synchronisation démarrée',
      sources: sources || 'all',
    });

    // Attendre la fin de la sync (pour les logs)
    syncPromise.then(result => {
      console.log('Sync completed:', result);
    }).catch(err => {
      console.error('Sync failed:', err);
    });
  } catch (error) {
    console.error('Error starting sync:', error);
    res.status(500).json({
      error: 'Erreur lors du démarrage de la synchronisation',
      message: error.message,
    });
  }
});

/**
 * POST /api/subsidies/score
 * Calcule le score de pertinence pour une liste de subventions
 */
router.post('/score', async (req, res) => {
  try {
    const { subsidies, collectiviteId, projetId } = req.body;

    if (!subsidies || !Array.isArray(subsidies)) {
      return res.status(400).json({
        error: 'Liste de subventions requise',
      });
    }

    if (!collectiviteId) {
      return res.status(400).json({
        error: 'ID de collectivité requis',
      });
    }

    if (!prisma) {
      return res.status(503).json({
        error: 'Base de données non disponible',
      });
    }

    const collectivite = await prisma.collectivite.findUnique({
      where: { id: collectiviteId },
    });

    if (!collectivite) {
      return res.status(404).json({
        error: 'Collectivité non trouvée',
      });
    }

    let projet = null;
    if (projetId) {
      projet = await prisma.projet.findUnique({
        where: { id: projetId },
      });
    }

    const scoringService = getScoringService();
    const scoredSubsidies = scoringService.rankSubsidies(subsidies, collectivite, projet);

    res.json({
      items: scoredSubsidies,
      collectivite: {
        id: collectivite.id,
        nom: collectivite.nom,
        type: collectivite.type,
      },
      projet: projet ? {
        id: projet.id,
        titre: projet.titre,
        typeProjet: projet.typeProjet,
      } : null,
    });
  } catch (error) {
    console.error('Error scoring subsidies:', error);
    res.status(500).json({
      error: 'Erreur lors du calcul des scores',
      message: error.message,
    });
  }
});

/**
 * GET /api/subsidies/filters
 * Récupère les options de filtrage disponibles
 */
router.get('/filters', async (req, res) => {
  try {
    res.json({
      beneficiaryTypes: [
        { value: 'commune', label: 'Commune' },
        { value: 'epci', label: 'EPCI / Intercommunalité' },
        { value: 'departement', label: 'Département' },
        { value: 'region', label: 'Région' },
        { value: 'association', label: 'Association' },
        { value: 'entreprise', label: 'Entreprise' },
      ],
      projectTypes: [
        { value: 'environnement', label: 'Environnement' },
        { value: 'energie', label: 'Énergie / Transition énergétique' },
        { value: 'urbanisme', label: 'Urbanisme / Aménagement' },
        { value: 'culture', label: 'Culture / Patrimoine' },
        { value: 'sport', label: 'Sport / Loisirs' },
        { value: 'numerique', label: 'Numérique' },
        { value: 'mobilite', label: 'Mobilité / Transports' },
        { value: 'eau', label: 'Eau / Assainissement' },
        { value: 'social', label: 'Social / Solidarité' },
        { value: 'education', label: 'Éducation / Jeunesse' },
        { value: 'economie', label: 'Développement économique' },
        { value: 'sante', label: 'Santé' },
      ],
      aidTypes: [
        { value: 'subvention', label: 'Subvention' },
        { value: 'pret', label: 'Prêt' },
        { value: 'avance_remboursable', label: 'Avance remboursable' },
        { value: 'dotation', label: 'Dotation' },
        { value: 'ingenierie', label: 'Ingénierie / Accompagnement' },
        { value: 'garantie', label: 'Garantie' },
      ],
      sortOptions: [
        { value: 'relevance', label: 'Pertinence' },
        { value: 'deadline', label: 'Date limite' },
        { value: 'amount_desc', label: 'Montant (décroissant)' },
        { value: 'amount_asc', label: 'Montant (croissant)' },
        { value: 'name', label: 'Nom (A-Z)' },
      ],
    });
  } catch (error) {
    console.error('Error getting filters:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des filtres',
      message: error.message,
    });
  }
});

module.exports = router;
