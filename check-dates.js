const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dossiers = await prisma.dossierSubvention.findMany({
    include: {
      projet: {
        include: { collectivite: true }
      },
      dispositif: true
    }
  });

  console.log(`\n📊 Total dossiers: ${dossiers.length}\n`);

  dossiers.forEach((d, i) => {
    console.log(`${i+1}. ${d.projet.titre}`);
    console.log(`   Échéance dépôt: ${d.echeanceDepot || 'NON DÉFINIE'}`);
    console.log(`   Date dépôt: ${d.dateDepot || 'non définie'}`);
    console.log(`   Date décision: ${d.dateDecision || 'non définie'}`);
    console.log(`   Statut: ${d.statut}`);
    console.log('');
  });

  const dispositifs = await prisma.dispositif.findMany({
    select: { id: true, nom: true, dateCloture: true }
  });

  console.log(`\n📋 Dispositifs avec dates de clôture:\n`);
  let count = 0;
  dispositifs.forEach((d, i) => {
    if (d.dateCloture) {
      count++;
      console.log(`${count}. ${d.nom.substring(0, 60)}...`);
      console.log(`   Clôture: ${d.dateCloture}`);
    }
  });

  console.log(`\nTotal dispositifs avec date de clôture: ${count}/${dispositifs.length}`);

  await prisma.$disconnect();
}

main().catch(console.error);
