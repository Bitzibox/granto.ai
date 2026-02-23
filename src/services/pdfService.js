/**
 * Service de génération de PDF pour les dossiers de subvention
 */

const PDFDocument = require('pdfkit');
const { generateDossierContent } = require('./geminiService');

/**
 * Génère un PDF de dossier de subvention
 * @param {Object} params - Paramètres du dossier
 * @returns {Promise<Buffer>} - PDF en buffer
 */
async function genererDossierPDF(params) {
  const {
    projet,
    aide,
    commune,
    collectivite,
    analysis
  } = params;

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

  // Créer un nouveau document PDF
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 }
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

  // En-tête
  doc.fontSize(20)
     .fillColor('#1e40af')
     .text('DEMANDE DE SUBVENTION', { align: 'center' });

  doc.moveDown();
  doc.fontSize(14)
     .fillColor('#000000')
     .text(aide.name, { align: 'center' });

  doc.moveDown(2);

  // Informations collectivité
  doc.fontSize(12)
     .fillColor('#1e40af')
     .text('COLLECTIVITÉ', { underline: true });

  doc.moveDown(0.5);
  doc.fontSize(10)
     .fillColor('#000000')
     .text(`Commune : ${commune.nom}`)
     .text(`Département : ${commune.departement} - ${commune.region}`)
     .text(`Code postal : ${commune.codePostal || ''}`);

  doc.moveDown(1.5);

  // Contexte communal
  doc.fontSize(12)
     .fillColor('#1e40af')
     .text('1. CONTEXTE ET ENJEUX', { underline: true });

  doc.moveDown(0.5);
  doc.fontSize(10)
     .fillColor('#000000')
     .text(contenu.contexte, { align: 'justify' });

  doc.moveDown(1.5);

  // Description du projet
  doc.fontSize(12)
     .fillColor('#1e40af')
     .text('2. DESCRIPTION DU PROJET', { underline: true });

  doc.moveDown(0.5);
  doc.fontSize(10)
     .fillColor('#000000')
     .text(contenu.description, { align: 'justify' });

  doc.moveDown(1.5);

  // Plan de financement
  doc.fontSize(12)
     .fillColor('#1e40af')
     .text('3. PLAN DE FINANCEMENT', { underline: true });

  doc.moveDown(0.5);

  const tableTop = doc.y;
  const col1 = 50;
  const col2 = 400;

  doc.fontSize(10).fillColor('#000000');

  // Lignes du tableau
  doc.text('Coût total HT', col1, tableTop);
  doc.text(formatEuros(contenu.plan_financement.cout_total_ht), col2, tableTop, { width: 150, align: 'right' });

  doc.text('Subvention sollicitée', col1, tableTop + 20);
  doc.text(formatEuros(contenu.plan_financement.subvention), col2, tableTop + 20, { width: 150, align: 'right' });

  doc.text('Autofinancement', col1, tableTop + 40);
  doc.text(formatEuros(contenu.plan_financement.autofinancement), col2, tableTop + 40, { width: 150, align: 'right' });

  // Ligne de séparation
  doc.moveTo(col1, tableTop + 55)
     .lineTo(col2 + 150, tableTop + 55)
     .stroke();

  doc.text('Taux de subvention', col1, tableTop + 65);
  doc.text(`${tauxPourcent} %`, col2, tableTop + 65, { width: 150, align: 'right' });

  doc.y = tableTop + 90; // Position après le tableau

  // Vérifier s'il faut une nouvelle page AVANT le calendrier
  if (doc.y > 620) {
    doc.addPage();
  }

  // Calendrier - utiliser le flux normal sans positions absolues
  doc.fontSize(12)
     .fillColor('#1e40af')
     .text('4. CALENDRIER PRÉVISIONNEL', { underline: true });

  doc.moveDown(0.5);
  doc.fontSize(10)
     .fillColor('#000000');

  // Utiliser un tableau simple sans positions absolues
  doc.text(`Début des travaux :         ${contenu.calendrier.debut}`, col1);
  doc.moveDown(0.3);
  doc.text(`Durée prévisionnelle :      ${contenu.calendrier.duree}`, col1);
  doc.moveDown(0.3);
  doc.text(`Fin des travaux :           ${contenu.calendrier.fin}`, col1);

  doc.moveDown(1.5);

  // Vérifier s'il faut une nouvelle page AVANT les pièces
  if (doc.y > 650) {
    doc.addPage();
  }

  // Pièces à fournir
  doc.fontSize(12)
     .fillColor('#1e40af')
     .text('5. PIÈCES JUSTIFICATIVES À FOURNIR', { underline: true });

  doc.moveDown(0.5);
  doc.fontSize(10)
     .fillColor('#000000');

  contenu.pieces_requises.forEach((piece, index) => {
    const y = doc.y;

    // Nouvelle page si besoin
    if (y > 700) {
      doc.addPage();
    }

    doc.text(`${index + 1}. ${piece}`, col1, doc.y, {
      width: 500,
      align: 'left'
    });

    doc.moveDown(0.3);
  });

  doc.moveDown(1.5);

  // Vérifier s'il faut une nouvelle page pour le financeur
  if (doc.y > 700) {
    doc.addPage();
  }

  // Financeur
  if (aide.financers && aide.financers.length > 0) {
    doc.fontSize(12)
       .fillColor('#1e40af')
       .text('FINANCEUR', { underline: true });

    doc.moveDown(0.5);
    doc.fontSize(10)
       .fillColor('#000000')
       .text(aide.financers[0], col1);

    doc.moveDown(1);
  }

  // Pied de page (sur la dernière page uniquement)
  // Position en bas de page
  const footerY = doc.page.height - 50;
  doc.fontSize(8)
     .fillColor('#666666')
     .text(
       `Document généré par Granto.ai le ${new Date().toLocaleDateString('fr-FR')}`,
       50,
       footerY,
       { align: 'center', width: doc.page.width - 100 }
     );

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
