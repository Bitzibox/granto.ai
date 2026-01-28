const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Démarrage du seed complet...\n');

  // 1. Créer une collectivité
  console.log('📍 Création de la collectivité...');
  const collectivite = await prisma.collectivite.create({
    data: {
      nom: "Mairie de Saint-Mars-la-Brière",
      type: "Commune",
      siret: "21720294900013",
      adresse: "Place de la Mairie",
      codePostal: "72470",
      ville: "Saint-Mars-la-Brière",
      email: "mairie@stmarslabri.fr",
      telephone: "02 43 XX XX XX"
    }
  });
  console.log(`✅ Collectivité créée: ${collectivite.nom}\n`);

  // 2. Créer des projets
  console.log('📁 Création des projets...');
  const projets = [
    {
      titre: "Rénovation de la salle des fêtes",
      description: "Rénovation énergétique et modernisation de la salle des fêtes communale",
      typeProjet: "Équipement public",
      montantHt: "120000",
      montantTtc: "150000",
      dateDebut: new Date("2026-03-01"),
      dateFin: new Date("2026-12-31"),
      statut: "en_cours",
      collectiviteId: collectivite.id
    },
    {
      titre: "Réfection de la voirie - Route de la Gare",
      description: "Travaux de réfection complète de la voirie sur 800m",
      typeProjet: "Voirie/Mobilité",
      montantHt: "200000",
      montantTtc: "240000",
      dateDebut: new Date("2026-04-15"),
      dateFin: new Date("2026-09-30"),
      statut: "brouillon",
      collectiviteId: collectivite.id
    },
    {
      titre: "Installation de panneaux solaires sur l'école",
      description: "Installation d'une centrale photovoltaïque sur le toit de l'école primaire",
      typeProjet: "Énergie/Climat",
      montantHt: "80000",
      montantTtc: "96000",
      dateDebut: new Date("2026-06-01"),
      dateFin: new Date("2026-10-31"),
      statut: "brouillon",
      collectiviteId: collectivite.id
    }
  ];

  const projetsCreated = [];
  for (const projet of projets) {
    const p = await prisma.projet.create({ data: projet });
    projetsCreated.push(p);
    console.log(`✅ Projet créé: ${p.titre}`);
  }
  console.log('');

  // 3. Créer des dispositifs
  console.log('💰 Création des dispositifs...');
  const dispositifs = [
    {
      nom: "DETR - Dotation d'Équipement des Territoires Ruraux",
      description: "Soutien financier de l'État pour les projets d'équipement des communes rurales et leurs groupements",
      organisme: "Préfecture",
      typesProjets: ["Équipement public", "Voirie/Mobilité", "Patrimoine"],
      tauxMin: "20",
      tauxMax: "80",
      montantMin: 5000,
      montantMax: 500000,
      zonesEligibles: ["Rural"],
      dateOuverture: new Date("2026-01-01"),
      dateCloture: new Date("2026-12-31"),
      url: "https://www.collectivites-locales.gouv.fr/dotation-dequipement-territoires-ruraux-detr",
      criteresEligibilite: "Communes de moins de 2000 habitants et leurs groupements",
      documentsRequis: ["Plan de financement", "Devis", "Délibération"]
    },
    {
      nom: "DSIL - Dotation de Soutien à l'Investissement Local",
      description: "Financement de projets d'investissement des collectivités territoriales",
      organisme: "Préfecture",
      typesProjets: ["Équipement public", "Énergie/Climat", "Numérique"],
      tauxMin: "20",
      tauxMax: "50",
      montantMin: 100000,
      montantMax: 2000000,
      zonesEligibles: ["toutes zones"],
      dateOuverture: new Date("2026-01-01"),
      dateCloture: new Date("2026-10-31"),
      url: "https://www.collectivites-locales.gouv.fr/dsil",
      criteresEligibilite: "Tous types de collectivités",
      documentsRequis: ["Plan de financement détaillé", "Étude de faisabilité"]
    },
    {
      nom: "Fonds Vert - Transition écologique",
      description: "Soutien aux projets de transition écologique",
      organisme: "Ministère de la Transition écologique",
      typesProjets: ["Énergie/Climat", "Environnement"],
      tauxMin: "40",
      tauxMax: "80",
      montantMin: 20000,
      montantMax: 5000000,
      zonesEligibles: ["toutes zones"],
      dateOuverture: new Date("2026-01-01"),
      dateCloture: new Date("2026-12-31"),
      url: "https://www.ecologie.gouv.fr/fonds-vert",
      criteresEligibilite: "Projets de transition écologique",
      documentsRequis: ["Diagnostic énergétique", "Plan d'actions"]
    },
    {
      nom: "Région - Aide aux équipements sportifs",
      description: "Subvention régionale pour équipements sportifs",
      organisme: "Région Pays de la Loire",
      typesProjets: ["Culture/Sport", "Équipement public"],
      tauxMin: "20",
      tauxMax: "50",
      montantMin: 30000,
      montantMax: 500000,
      zonesEligibles: ["Pays de la Loire"],
      dateOuverture: new Date("2026-02-01"),
      dateCloture: new Date("2026-11-30"),
      url: "https://www.paysdelaloire.fr",
      criteresEligibilite: "Équipements sportifs structurants",
      documentsRequis: ["Programme fonctionnel", "Étude de besoins"]
    },
    {
      nom: "Département - Programme voirie 2026",
      description: "Aide départementale pour travaux de voirie",
      organisme: "Département de la Sarthe",
      typesProjets: ["Voirie/Mobilité"],
      tauxMin: "30",
      tauxMax: "60",
      montantMin: 20000,
      montantMax: 300000,
      zonesEligibles: ["Sarthe"],
      dateOuverture: new Date("2026-01-01"),
      dateCloture: new Date("2026-06-30"),
      url: "https://www.sarthe.fr",
      criteresEligibilite: "Voirie communale ou intercommunale",
      documentsRequis: ["Diagnostic voirie", "Devis détaillés"]
    }
  ];

  const dispositifsCreated = [];
  for (const dispositif of dispositifs) {
    const d = await prisma.dispositif.create({ data: dispositif });
    dispositifsCreated.push(d);
    console.log(`✅ Dispositif créé: ${d.nom}`);
  }
  console.log('');

  // 4. Créer quelques dossiers de subvention
  console.log('📋 Création des dossiers de subvention...');
  
  // Dossier 1: Salle des fêtes + DETR
  const dossier1 = await prisma.dossierSubvention.create({
    data: {
      projetId: projetsCreated[0].id,
      dispositifId: dispositifsCreated[0].id,
      statut: "en_cours",
      montantDemande: 120000,
      tauxRetenu: 60,
      echeanceDepot: new Date("2026-06-30"),
      notes: "Dossier prioritaire - Rénovation énergétique"
    }
  });
  console.log(`✅ Dossier créé: ${projetsCreated[0].titre} + ${dispositifsCreated[0].nom}`);

  // Dossier 2: Voirie + Programme départemental
  const dossier2 = await prisma.dossierSubvention.create({
    data: {
      projetId: projetsCreated[1].id,
      dispositifId: dispositifsCreated[4].id,
      statut: "brouillon",
      montantDemande: 144000,
      tauxRetenu: 60,
      echeanceDepot: new Date("2026-06-30"),
      notes: "À compléter avec les devis"
    }
  });
  console.log(`✅ Dossier créé: ${projetsCreated[1].titre} + ${dispositifsCreated[4].nom}`);

  // Dossier 3: Panneaux solaires + Fonds Vert
  const dossier3 = await prisma.dossierSubvention.create({
    data: {
      projetId: projetsCreated[2].id,
      dispositifId: dispositifsCreated[2].id,
      statut: "brouillon",
      montantDemande: 76800,
      tauxRetenu: 80,
      echeanceDepot: new Date("2026-12-31"),
      notes: "Excellent dossier - fort taux de subvention"
    }
  });
  console.log(`✅ Dossier créé: ${projetsCreated[2].titre} + ${dispositifsCreated[2].nom}`);

  console.log('\n✨ Seed terminé avec succès !');
  console.log(`\n📊 Résumé:`);
  console.log(`   - 1 collectivité`);
  console.log(`   - ${projetsCreated.length} projets`);
  console.log(`   - ${dispositifsCreated.length} dispositifs`);
  console.log(`   - 3 dossiers de subvention`);
}

seed()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
