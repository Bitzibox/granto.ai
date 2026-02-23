/**
 * Script pour corriger les URLs des dispositifs en base de données
 * Les URLs relatives ou tronquées sont converties en URLs absolues vers aides-territoires.beta.gouv.fr
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDispositifUrls() {
  console.log('🔍 Recherche des dispositifs avec URLs à corriger...\n');

  try {
    // Récupérer tous les dispositifs
    const dispositifs = await prisma.dispositif.findMany();

    console.log(`📦 ${dispositifs.length} dispositifs trouvés\n`);

    let corrected = 0;
    let alreadyCorrect = 0;
    let noUrl = 0;

    for (const dispositif of dispositifs) {
      const url = dispositif.url;

      // Pas d'URL
      if (!url || url.trim() === '') {
        noUrl++;
        console.log(`⚪ ${dispositif.nom}: Pas d'URL`);
        continue;
      }

      // URL déjà absolue et correcte
      if (url.startsWith('http')) {
        alreadyCorrect++;
        console.log(`✅ ${dispositif.nom}: URL déjà correcte (${url})`);
        continue;
      }

      // URL relative à corriger
      let newUrl;
      if (url.startsWith('/aides/')) {
        // URL qui commence par /aides/
        newUrl = `https://aides-territoires.beta.gouv.fr${url}`;
      } else if (url.startsWith('/')) {
        // Autre URL commençant par /
        newUrl = `https://aides-territoires.beta.gouv.fr${url}`;
      } else {
        // URL sans / au début (slug uniquement)
        newUrl = `https://aides-territoires.beta.gouv.fr/aides/${url}/`;
      }

      console.log(`🔧 ${dispositif.nom}:`);
      console.log(`   Avant: ${url}`);
      console.log(`   Après: ${newUrl}`);

      // Mettre à jour dans la base
      await prisma.dispositif.update({
        where: { id: dispositif.id },
        data: { url: newUrl }
      });

      corrected++;
      console.log('');
    }

    console.log('\n📊 Résumé:');
    console.log(`✅ URLs déjà correctes: ${alreadyCorrect}`);
    console.log(`🔧 URLs corrigées: ${corrected}`);
    console.log(`⚪ Sans URL: ${noUrl}`);
    console.log(`📦 Total: ${dispositifs.length}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
fixDispositifUrls()
  .then(() => {
    console.log('\n✅ Migration terminée avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur lors de la migration:', error);
    process.exit(1);
  });
