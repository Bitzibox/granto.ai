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
      contexte: `La commune de ${commune.nom} (${commune.departement}) souhaite réaliser un projet de ${analysis.categorie_principale}.`,
      description: analysis.description_enrichie,
      plan_financement: {
        cout_total_ht: analysis.montant_estime,
        subvention: Math.round(analysis.montant_estime * 0.7),
        autofinancement: Math.round(analysis.montant_estime * 0.3)
      },
      calendrier: {
        debut: 'T2 2026',
        duree: '6 mois',
        fin: 'T4 2026'
      },
      pieces_requises: [
        'Délibération du conseil municipal',
        'Plan de financement détaillé',
        'Devis des entreprises',
        'Plan de situation'
      ]
    };
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
     .text(`Code postal : ${commune.codePostal}`);

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
  const col2 = 350;

  doc.fontSize(10).fillColor('#000000');

  // Lignes du tableau
  doc.text('Coût total HT', col1, tableTop);
  doc.text(`${formatEuros(contenu.plan_financement.cout_total_ht)}`, col2, tableTop, { align: 'right' });

  doc.text('Subvention sollicitée', col1, tableTop + 20);
  doc.text(`${formatEuros(contenu.plan_financement.subvention)}`, col2, tableTop + 20, { align: 'right' });

  doc.text('Autofinancement', col1, tableTop + 40);
  doc.text(`${formatEuros(contenu.plan_financement.autofinancement)}`, col2, tableTop + 40, { align: 'right' });

  // Ligne de séparation
  doc.moveTo(col1, tableTop + 55)
     .lineTo(col2 + 100, tableTop + 55)
     .stroke();

  doc.text('Taux de subvention', col1, tableTop + 65);
  const taux = Math.round((contenu.plan_financement.subvention / contenu.plan_financement.cout_total_ht) * 100);
  doc.text(`${taux} %`, col2, tableTop + 65, { align: 'right' });

  doc.moveDown(5);

  // Calendrier
  doc.fontSize(12)
     .fillColor('#1e40af')
     .text('4. CALENDRIER PRÉVISIONNEL', { underline: true });

  doc.moveDown(0.5);
  doc.fontSize(10)
     .fillColor('#000000')
     .text(`Début des travaux : ${contenu.calendrier.debut}`)
     .text(`Durée prévisionnelle : ${contenu.calendrier.duree}`)
     .text(`Fin des travaux : ${contenu.calendrier.fin}`);

  doc.moveDown(1.5);

  // Pièces à fournir
  doc.fontSize(12)
     .fillColor('#1e40af')
     .text('5. PIÈCES JUSTIFICATIVES À FOURNIR', { underline: true });

  doc.moveDown(0.5);
  doc.fontSize(10)
     .fillColor('#000000');

  contenu.pieces_requises.forEach((piece, index) => {
    doc.text(`${index + 1}. ${piece}`);
  });

  doc.moveDown(2);

  // Financeur
  if (aide.financers && aide.financers.length > 0) {
    doc.fontSize(12)
       .fillColor('#1e40af')
       .text('FINANCEUR', { underline: true });

    doc.moveDown(0.5);
    doc.fontSize(10)
       .fillColor('#000000')
       .text(aide.financers[0]);

    doc.moveDown(1);
  }

  // Pied de page
  doc.fontSize(8)
     .fillColor('#666666')
     .text(
       `Document généré par Granto.ai le ${new Date().toLocaleDateString('fr-FR')}`,
       50,
       doc.page.height - 50,
       { align: 'center' }
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
