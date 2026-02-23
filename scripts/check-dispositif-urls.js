/**
 * Script pour afficher les URLs des dispositifs en base de données
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDispositifUrls() {
  console.log('🔍 Vérification des URLs des dispositifs...\n');

  try {
    const dispositifs = await prisma.dispositif.findMany({
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📦 ${dispositifs.length} dispositifs trouvés\n`);

    dispositifs.forEach((dispositif, index) => {
      console.log(`${index + 1}. ${dispositif.nom}`);
      console.log(`   ID: ${dispositif.id}`);
      console.log(`   URL: ${dispositif.url || '(vide)'}`);

      if (dispositif.url) {
        if (dispositif.url.startsWith('http')) {
          console.log(`   ✅ URL absolue`);
        } else {
          console.log(`   ⚠️  URL relative (à corriger)`);
        }
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkDispositifUrls()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
