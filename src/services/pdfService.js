/**
 * Service de génération de PDF pour les dossiers de subvention
 */

const PDFDocument = require('pdfkit');
const { generateDossierContent } = require('./geminiService');

/**
 * Template par défaut si aucun template fourni
 */
const DEFAULT_TEMPLATE = {
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
  logoUrl: null,
  logoPosition: 'header-left',
  logoWidth: 150,
  logoHeight: 50,
  showPageNumbers: false,
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

/**
 * Génère un PDF de dossier de subvention
 * @param {Object} params - Paramètres du dossier
 * @param {Object} templateConfig - Configuration du template (optionnel)
 * @returns {Promise<Buffer>} - PDF en buffer
 */
async function genererDossierPDF(params, templateConfig = null) {
  const {
    projet,
    aide,
    commune,
    collectivite,
    analysis
  } = params;

  // Fusionner template personnalisé avec le défaut
  const tpl = { ...DEFAULT_TEMPLATE, ...templateConfig };

  // Calculer le plan de financement depuis les données de l'aide
  const budget = analysis.montant_estime || projet.budget || 0;

  // Taux de subvention depuis l'aide (prendre la moyenne si disponible)
  let tauxSubvention = 0.5; // 50% par défaut
  if (aide.subvention_rate_lower_bound && aide.subvention_rate_upper_bound) {
    tauxSubvention = (aide.subvention_rate_lower_bound + aide.subvention_rate_upper_bound) / 200; // Moyenne en décimal
  } else if (aide.subvention_rate_lower_bound) {
    tauxSubvention = aide.subvention_rate_lower_bound / 100;
  }

  const montantSubvention = Math.round(budget * tauxSubvention);
  const autofinancement = budget - montantSubvention;
  const tauxPourcent = Math.round(tauxSubvention * 100);

  // Calendrier réaliste basé sur le type de projet
  const now = new Date();
  const debutTravaux = new Date(now.getFullYear(), now.getMonth() + 3, 1); // Dans 3 mois
  const finTravaux = new Date(now.getFullYear(), now.getMonth() + 9, 30); // 6 mois de travaux

  const formatDate = (date) => {
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  // Créer un nouveau document PDF avec marges du template
  const doc = new PDFDocument({
    size: 'A4',
    margins: {
      top: tpl.marginTop,
      bottom: tpl.marginBottom,
      left: tpl.marginLeft,
      right: tpl.marginRight
    }
  });

  // Buffer pour stocker le PDF
  const chunks = [];
  doc.on('data', chunk => chunks.push(chunk));

  // Générer le contenu avec Gemini
  let contenu;
  try {
    contenu = await generateDossierContent(analysis, aide, commune.nom, collectivite);
  } catch (error) {
    console.warn('⚠️ Erreur génération contenu IA:', error.message);
    // Fallback: contenu basique
    contenu = {
      contexte: `La commune de ${commune.nom} (${commune.departement}) souhaite réaliser un projet de ${analysis.categorie_principale}. Ce projet s'inscrit dans une démarche d'amélioration des services aux habitants et de modernisation des infrastructures communales.`,
      description: analysis.description_enrichie || projet.description,
      plan_financement: {
        cout_total_ht: budget,
        subvention: montantSubvention,
        autofinancement: autofinancement
      },
      calendrier: {
        debut: formatDate(debutTravaux),
        duree: '6 mois',
        fin: formatDate(finTravaux)
      },
      pieces_requises: [
        'Délibération du conseil municipal validant le projet',
        'Plan de financement détaillé',
        'Devis des entreprises',
        'Plan de situation et cadastre',
        'Notice descriptive des travaux'
      ]
    };
  }

  // S'assurer que le plan de financement utilise les bonnes valeurs
  contenu.plan_financement = {
    cout_total_ht: budget,
    subvention: montantSubvention,
    autofinancement: autofinancement
  };

  // S'assurer que le calendrier a des dates valides
  if (!contenu.calendrier || !contenu.calendrier.debut || contenu.calendrier.debut === 'undefined') {
    contenu.calendrier = {
      debut: formatDate(debutTravaux),
      duree: '6 mois',
      fin: formatDate(finTravaux)
    };
  }

  // S'assurer que pieces_requises est un tableau
  if (!Array.isArray(contenu.pieces_requises)) {
    contenu.pieces_requises = [
      'Délibération du conseil municipal',
      'Plan de financement détaillé',
      'Devis des entreprises',
      'Plan de situation'
    ];
  }

  // === Raccourcis template ===
  const col1 = tpl.marginLeft;
  const contentWidth = doc.page.width - tpl.marginLeft - tpl.marginRight;
  const col2 = tpl.marginLeft + contentWidth - 150;

  // Fonction helper: vérifier saut de page
  const checkPageBreak = (minSpace = 100) => {
    if (doc.y > doc.page.height - tpl.marginBottom - minSpace) {
      doc.addPage();
    }
  };

  // Fonction helper: titre de section
  const sectionTitle = (title) => {
    checkPageBreak(80);
    doc.fontSize(tpl.fontSizeHeading)
       .fillColor(tpl.colorPrimary)
       .text(title, { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(tpl.fontSize)
       .fillColor(tpl.colorSecondary);
  };

  // === EN-TÊTE PERSONNALISÉ ===
  if (tpl.headerText) {
    doc.fontSize(8)
       .fillColor(tpl.colorAccent)
       .text(tpl.headerText, { align: tpl.headerAlign });
    doc.moveDown(1);
  }

  // === TITRE PRINCIPAL ===
  doc.fontSize(tpl.fontSizeTitle)
     .fillColor(tpl.colorPrimary)
     .text('DEMANDE DE SUBVENTION', { align: 'center' });

  doc.moveDown();
  doc.fontSize(14)
     .fillColor(tpl.colorSecondary)
     .text(aide.name, { align: 'center' });

  doc.moveDown(2);

  // === SECTIONS DANS L'ORDRE DU TEMPLATE ===
  const sectionsOrder = Array.isArray(tpl.sectionsOrder) ? tpl.sectionsOrder : DEFAULT_TEMPLATE.sectionsOrder;
  const sectionsEnabled = typeof tpl.sectionsEnabled === 'object' && tpl.sectionsEnabled !== null
    ? tpl.sectionsEnabled
    : DEFAULT_TEMPLATE.sectionsEnabled;

  let sectionNumber = 0;

  for (const sectionKey of sectionsOrder) {
    if (!sectionsEnabled[sectionKey]) continue;
    sectionNumber++;

    const sectionConf = (tpl.sectionsConfig && tpl.sectionsConfig[sectionKey]) || {};

    switch (sectionKey) {
      case 'collectivite': {
        sectionTitle(sectionConf.title || 'COLLECTIVITÉ');
        doc.text(`Commune : ${commune.nom}`)
           .text(`Département : ${commune.departement} - ${commune.region}`)
           .text(`Code postal : ${commune.codePostal || ''}`);
        doc.moveDown(1.5);
        break;
      }

      case 'contexte': {
        sectionTitle(sectionConf.title || `${sectionNumber}. CONTEXTE ET ENJEUX`);
        doc.text(contenu.contexte, { align: 'justify' });
        doc.moveDown(1.5);
        break;
      }

      case 'description': {
        sectionTitle(sectionConf.title || `${sectionNumber}. DESCRIPTION DU PROJET`);
        doc.text(contenu.description, { align: 'justify' });
        doc.moveDown(1.5);
        break;
      }

      case 'financement': {
        sectionTitle(sectionConf.title || `${sectionNumber}. PLAN DE FINANCEMENT`);

        const tableTop = doc.y;

        doc.text('Coût total HT', col1, tableTop);
        doc.text(formatEuros(contenu.plan_financement.cout_total_ht), col2, tableTop, { width: 150, align: 'right' });

        doc.text('Subvention sollicitée', col1, tableTop + 20);
        doc.text(formatEuros(contenu.plan_financement.subvention), col2, tableTop + 20, { width: 150, align: 'right' });

        doc.text('Autofinancement', col1, tableTop + 40);
        doc.text(formatEuros(contenu.plan_financement.autofinancement), col2, tableTop + 40, { width: 150, align: 'right' });

        doc.moveTo(col1, tableTop + 55)
           .lineTo(col2 + 150, tableTop + 55)
           .stroke();

        doc.text('Taux de subvention', col1, tableTop + 65);
        doc.text(`${tauxPourcent} %`, col2, tableTop + 65, { width: 150, align: 'right' });

        doc.y = tableTop + 90;
        break;
      }

      case 'calendrier': {
        checkPageBreak(100);
        sectionTitle(sectionConf.title || `${sectionNumber}. CALENDRIER PRÉVISIONNEL`);

        doc.text(`Début des travaux :         ${contenu.calendrier.debut}`, col1);
        doc.moveDown(0.3);
        doc.text(`Durée prévisionnelle :      ${contenu.calendrier.duree}`, col1);
        doc.moveDown(0.3);
        doc.text(`Fin des travaux :           ${contenu.calendrier.fin}`, col1);
        doc.moveDown(1.5);
        break;
      }

      case 'pieces': {
        checkPageBreak(80);
        sectionTitle(sectionConf.title || `${sectionNumber}. PIÈCES JUSTIFICATIVES À FOURNIR`);

        contenu.pieces_requises.forEach((piece, index) => {
          checkPageBreak(30);
          doc.text(`${index + 1}. ${piece}`, col1, doc.y, {
            width: contentWidth,
            align: 'left'
          });
          doc.moveDown(0.3);
        });

        doc.moveDown(1.5);
        break;
      }

      case 'financeur': {
        if (aide.financers && aide.financers.length > 0) {
          checkPageBreak(60);
          sectionTitle(sectionConf.title || 'FINANCEUR');
          doc.text(aide.financers[0], col1);
          doc.moveDown(1);
        }
        break;
      }
    }
  }

  // === PIED DE PAGE ===
  if (tpl.footerText) {
    const footerY = doc.page.height - tpl.marginBottom;
    doc.fontSize(8)
       .fillColor(tpl.colorAccent)
       .text(
         `${tpl.footerText} - ${new Date().toLocaleDateString('fr-FR')}`,
         tpl.marginLeft,
         footerY,
         { align: tpl.footerAlign, width: contentWidth }
       );
  }

  // Finaliser le PDF
  doc.end();

  // Attendre que le PDF soit complet
  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      resolve(pdfBuffer);
    });
    doc.on('error', reject);
  });
}

/**
 * Formate un nombre en euros
 */
function formatEuros(montant) {
  if (isNaN(montant) || montant === null || montant === undefined) {
    return '0 €';
  }

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(montant);
}

module.exports = {
  genererDossierPDF
};
