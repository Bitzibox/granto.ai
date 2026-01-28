const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seeding...\n');

  // 1. Créer des collectivités
  console.log('📍 Création des collectivités...');
  const collectivite1 = await prisma.collectivite.create({
    data: {
      nom: "Commune de Saint-Mars-la-Brière",
      type: "commune",
      population: 2500,
      zone: "rural",
      departement: "72",
      region: "Pays de la Loire"
    }
  });

  const collectivite2 = await prisma.collectivite.create({
    data: {
      nom: "Communauté de Communes du Pays de Loué",
      type: "intercommunalité",
      population: 15000,
      zone: "rural",
      departement: "72",
      region: "Pays de la Loire"
    }
  });

  console.log(`✅ ${collectivite1.nom}`);
  console.log(`✅ ${collectivite2.nom}\n`);

  // 2. Créer des dispositifs
  console.log('💰 Création des dispositifs de financement...');
  
  const dispositif1 = await prisma.dispositif.create({
    data: {
      nom: "DETR - Dotation d'Équipement des Territoires Ruraux",
      organisme: "Préfecture de la Sarthe",
      typeFinanceur: "État",
      description: "Subvention pour les projets d'équipement et d'infrastructures des communes rurales",
      montantMin: 5000,
      montantMax: 500000,
      tauxMax: 80,
      dateOuverture: new Date('2026-01-01'),
      dateCloture: new Date('2026-10-31'),
      typesProjets: ["équipement", "infrastructure", "voirie", "bâtiment public"],
      zonesEligibles: ["rural", "commune < 10000 hab"],
      urlOfficiel: "https://www.prefectures-regions.gouv.fr"
    }
  });

  const dispositif2 = await prisma.dispositif.create({
    data: {
      nom: "DSIL - Dotation de Soutien à l'Investissement Local",
      organisme: "Préfecture",
      typeFinanceur: "État",
      description: "Financement des projets d'investissement prioritaires",
      montantMin: 100000,
      montantMax: 3000000,
      tauxMax: 50,
      dateOuverture: new Date('2026-01-15'),
      dateCloture: new Date('2026-09-30'),
      typesProjets: ["transition écologique", "rénovation énergétique", "infrastructure"],
      zonesEligibles: ["toutes zones"],
      urlOfficiel: "https://www.prefectures-regions.gouv.fr"
    }
  });

  const dispositif3 = await prisma.dispositif.create({
    data: {
      nom: "France Relance - Rénovation énergétique",
      organisme: "ADEME",
      typeFinanceur: "État",
      description: "Aide à la rénovation énergétique des bâtiments publics",
      montantMin: 50000,
      montantMax: 2000000,
      tauxMax: 70,
      dateOuverture: new Date('2026-01-01'),
      dateCloture: new Date('2026-12-31'),
      typesProjets: ["rénovation énergétique", "transition écologique"],
      zonesEligibles: ["toutes zones"],
      urlOfficiel: "https://www.ademe.fr"
    }
  });

  console.log(`✅ ${dispositif1.nom}`);
  console.log(`✅ ${dispositif2.nom}`);
  console.log(`✅ ${dispositif3.nom}\n`);

  // 3. Créer des projets
  console.log('🏗️  Création des projets...');
  
  const projet1 = await prisma.projet.create({
    data: {
      collectiviteId: collectivite1.id,
      titre: "Rénovation énergétique de la salle polyvalente",
      description: "Isolation des murs et toiture, remplacement des menuiseries, installation d'une pompe à chaleur",
      typeProjet: "rénovation énergétique",
      montantHt: 180000,
      montantTtc: 216000,
      maturite: "études en cours",
      calendrierDebut: new Date('2026-06-01'),
      calendrierFin: new Date('2027-03-31'),
      objectifs: "Réduire la consommation énergétique de 60% et améliorer le confort",
      statut: "actif"
    }
  });

  const projet2 = await prisma.projet.create({
    data: {
      collectiviteId: collectivite1.id,
      titre: "Réfection de la voirie rue principale",
      description: "Réfection complète de 800m de voirie avec création d'un trottoir et d'une piste cyclable",
      typeProjet: "voirie",
      montantHt: 350000,
      montantTtc: 420000,
      maturite: "projet défini",
      calendrierDebut: new Date('2026-09-01'),
      calendrierFin: new Date('2026-11-30'),
      objectifs: "Améliorer la sécurité et les déplacements doux",
      statut: "actif"
    }
  });

  const projet3 = await prisma.projet.create({
    data: {
      collectiviteId: collectivite2.id,
      titre: "Construction d'une maison de santé pluridisciplinaire",
      description: "Construction d'un bâtiment BBC de 400m² pour accueillir médecins, infirmiers et kinésithérapeutes",
      typeProjet: "bâtiment public",
      montantHt: 850000,
      montantTtc: 1020000,
      maturite: "études préliminaires",
      calendrierDebut: new Date('2027-01-01'),
      calendrierFin: new Date('2027-12-31'),
      objectifs: "Maintenir l'offre de soins sur le territoire",
      statut: "brouillon"
    }
  });

  console.log(`✅ ${projet1.titre}`);
  console.log(`✅ ${projet2.titre}`);
  console.log(`✅ ${projet3.titre}\n`);

  // 4. Créer des dossiers de financement
  console.log('📁 Création des dossiers de financement...');
  
  const dossier1 = await prisma.dossier.create({
    data: {
      projetId: projet1.id,
      dispositifId: dispositif3.id,
      statut: "en_preparation",
      scoreEligibilite: 85,
      montantDemande: 126000
    }
  });

  const dossier2 = await prisma.dossier.create({
    data: {
      projetId: projet2.id,
      dispositifId: dispositif1.id,
      statut: "a_preparer",
      scoreEligibilite: 90,
      montantDemande: 280000
    }
  });

  const dossier3 = await prisma.dossier.create({
    data: {
      projetId: projet3.id,
      dispositifId: dispositif2.id,
      statut: "a_preparer",
      scoreEligibilite: 75,
      montantDemande: 425000
    }
  });

  console.log(`✅ Dossier créé pour "${projet1.titre}"`);
  console.log(`✅ Dossier créé pour "${projet2.titre}"`);
  console.log(`✅ Dossier créé pour "${projet3.titre}"\n`);

  console.log('🎉 Seeding terminé avec succès!');
  console.log('\n📊 Résumé:');
  console.log(`   - ${await prisma.collectivite.count()} collectivités`);
  console.log(`   - ${await prisma.dispositif.count()} dispositifs`);
  console.log(`   - ${await prisma.projet.count()} projets`);
  console.log(`   - ${await prisma.dossier.count()} dossiers`);
}

main()
  .catch((error) => {
    console.error('❌ Erreur lors du seeding:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
