/**
 * Service de gestion des templates PDF
 * Permet de créer, modifier, supprimer et utiliser des templates personnalisés
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Template par défaut du système
 */
function getSystemDefaultTemplate() {
  return {
    nom: 'Template par défaut',
    description: 'Template standard de Granto',
    isDefault: true,
    isPublic: false,

    // Configuration visuelle par défaut
    logoUrl: null,
    logoPosition: 'header-left',
    logoWidth: 150,
    logoHeight: 50,

    fontFamily: 'Helvetica',
    fontSize: 10,
    fontSizeTitle: 20,
    fontSizeHeading: 12,

    colorPrimary: '#1e40af',
    colorSecondary: '#000000',
    colorAccent: '#64748b',

    marginTop: 50,
    marginBottom: 50,
    marginLeft: 50,
    marginRight: 50,

    headerText: null,
    headerAlign: 'center',
    footerText: 'Document généré par Granto.ai',
    footerAlign: 'center',
    showPageNumbers: false,

    // Configuration structurelle par défaut
    sectionsOrder: ['collectivite', 'contexte', 'description', 'financement', 'calendrier', 'pieces', 'financeur'],
    sectionsEnabled: {
      collectivite: true,
      contexte: true,
      description: true,
      financement: true,
      calendrier: true,
      pieces: true,
      financeur: true
    },
    sectionsConfig: {}
  };
}

/**
 * Crée un nouveau template
 */
async function createTemplate(data) {
  const template = await prisma.pdfTemplate.create({
    data: {
      ...data,
      sectionsOrder: data.sectionsOrder || getSystemDefaultTemplate().sectionsOrder,
      sectionsEnabled: data.sectionsEnabled || getSystemDefaultTemplate().sectionsEnabled,
      sectionsConfig: data.sectionsConfig || {}
    }
  });

  console.log(`✅ Template créé: ${template.nom} (${template.id})`);
  return template;
}

/**
 * Liste les templates d'un utilisateur ou d'une collectivité
 */
async function getTemplates(userId, collectiviteId = null) {
  const where = {};

  if (userId) {
    where.OR = [
      { userId },
      { isPublic: true }
    ];
  }

  if (collectiviteId) {
    where.collectiviteId = collectiviteId;
  }

  const templates = await prisma.pdfTemplate.findMany({
    where,
    orderBy: [
      { isDefault: 'desc' },
      { updatedAt: 'desc' }
    ]
  });

  return templates;
}

/**
 * Récupère un template par son ID
 */
async function getTemplateById(id) {
  const template = await prisma.pdfTemplate.findUnique({
    where: { id }
  });

  if (!template) {
    throw new Error(`Template ${id} introuvable`);
  }

  return template;
}

/**
 * Récupère le template par défaut d'un utilisateur
 */
async function getDefaultTemplate(userId, collectiviteId = null) {
  // Chercher le template par défaut de l'utilisateur
  let template = await prisma.pdfTemplate.findFirst({
    where: {
      userId,
      isDefault: true
    }
  });

  // Si pas trouvé, chercher le template par défaut de la collectivité
  if (!template && collectiviteId) {
    template = await prisma.pdfTemplate.findFirst({
      where: {
        collectiviteId,
        isDefault: true
      }
    });
  }

  // Si toujours pas trouvé, retourner le template système
  if (!template) {
    return getSystemDefaultTemplate();
  }

  return template;
}

/**
 * Met à jour un template
 */
async function updateTemplate(id, data) {
  const template = await prisma.pdfTemplate.update({
    where: { id },
    data
  });

  console.log(`✅ Template mis à jour: ${template.nom} (${template.id})`);
  return template;
}

/**
 * Supprime un template
 */
async function deleteTemplate(id) {
  await prisma.pdfTemplate.delete({
    where: { id }
  });

  console.log(`✅ Template supprimé: ${id}`);
}

/**
 * Définit un template comme template par défaut
 */
async function setDefaultTemplate(id, userId) {
  // Construire la requête where en fonction du userId
  const whereCondition = userId ? { userId } : {};

  // Désactiver tous les templates par défaut (de l'utilisateur si userId fourni, sinon tous)
  await prisma.pdfTemplate.updateMany({
    where: whereCondition,
    data: { isDefault: false }
  });

  // Activer le template choisi
  const template = await prisma.pdfTemplate.update({
    where: { id },
    data: { isDefault: true }
  });

  console.log(`✅ Template par défaut: ${template.nom} (${template.id})`);
  return template;
}

/**
 * Retire le statut par défaut d'un template (revient au template système)
 */
async function unsetDefaultTemplate(id, userId) {
  // Construire la requête where en fonction du userId
  const whereCondition = userId ? { userId } : {};

  // Désactiver tous les templates par défaut (de l'utilisateur si userId fourni, sinon tous)
  await prisma.pdfTemplate.updateMany({
    where: whereCondition,
    data: { isDefault: false }
  });

  console.log(`✅ Template par défaut retiré, retour au template système`);
}

/**
 * Duplique un template
 */
async function duplicateTemplate(id, userId) {
  const original = await getTemplateById(id);

  const { id: _, createdAt, updatedAt, lastUsedAt, usageCount, ...templateData } = original;

  const duplicate = await createTemplate({
    ...templateData,
    nom: `${original.nom} (copie)`,
    userId,
    isDefault: false,
    isPublic: false
  });

  console.log(`✅ Template dupliqué: ${duplicate.nom} (${duplicate.id})`);
  return duplicate;
}

/**
 * Incrémente le compteur d'utilisation
 */
async function incrementUsageCount(id) {
  await prisma.pdfTemplate.update({
    where: { id },
    data: {
      usageCount: { increment: 1 },
      lastUsedAt: new Date()
    }
  });
}

/**
 * Valide la configuration d'un template
 */
function validateTemplate(config) {
  const errors = [];

  // Validation des couleurs (format hex)
  const colorFields = ['colorPrimary', 'colorSecondary', 'colorAccent'];
  colorFields.forEach(field => {
    if (config[field] && !/^#[0-9A-Fa-f]{6}$/.test(config[field])) {
      errors.push(`${field} doit être au format hex (#RRGGBB)`);
    }
  });

  // Validation des marges (positives)
  const marginFields = ['marginTop', 'marginBottom', 'marginLeft', 'marginRight'];
  marginFields.forEach(field => {
    if (config[field] !== undefined && (config[field] < 0 || config[field] > 200)) {
      errors.push(`${field} doit être entre 0 et 200`);
    }
  });

  // Validation des tailles de police
  const fontSizeFields = ['fontSize', 'fontSizeTitle', 'fontSizeHeading'];
  fontSizeFields.forEach(field => {
    if (config[field] !== undefined && (config[field] < 6 || config[field] > 72)) {
      errors.push(`${field} doit être entre 6 et 72`);
    }
  });

  // Validation du logo
  if (config.logoWidth && (config.logoWidth < 50 || config.logoWidth > 500)) {
    errors.push('logoWidth doit être entre 50 et 500');
  }
  if (config.logoHeight && (config.logoHeight < 20 || config.logoHeight > 200)) {
    errors.push('logoHeight doit être entre 20 et 200');
  }

  // Validation des sections
  if (config.sectionsOrder && !Array.isArray(config.sectionsOrder)) {
    errors.push('sectionsOrder doit être un tableau');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  createTemplate,
  getTemplates,
  getTemplateById,
  getDefaultTemplate,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
  unsetDefaultTemplate,
  duplicateTemplate,
  incrementUsageCount,
  validateTemplate,
  getSystemDefaultTemplate
};
