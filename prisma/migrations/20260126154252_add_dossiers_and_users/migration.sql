-- CreateTable
CREATE TABLE "Collectivite" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "siret" TEXT,
    "adresse" TEXT,
    "codePostal" TEXT,
    "ville" TEXT,
    "email" TEXT,
    "telephone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collectivite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Projet" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "typeProjet" TEXT,
    "montantHt" TEXT,
    "montantTtc" TEXT,
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "statut" TEXT NOT NULL DEFAULT 'brouillon',
    "collectiviteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Projet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispositif" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "organisme" TEXT,
    "typesProjets" TEXT[],
    "tauxMin" TEXT,
    "tauxMax" TEXT,
    "montantMin" INTEGER,
    "montantMax" INTEGER,
    "zonesEligibles" TEXT[],
    "dateOuverture" TIMESTAMP(3),
    "dateCloture" TIMESTAMP(3),
    "url" TEXT,
    "criteresEligibilite" TEXT,
    "documentsRequis" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispositif_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DossierSubvention" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "dispositifId" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'brouillon',
    "montantDemande" DOUBLE PRECISION,
    "montantAccorde" DOUBLE PRECISION,
    "tauxRetenu" DOUBLE PRECISION,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateDepot" TIMESTAMP(3),
    "dateDecision" TIMESTAMP(3),
    "echeanceDepot" TIMESTAMP(3),
    "notes" TEXT,
    "documentsJoints" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DossierSubvention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "collectiviteId" TEXT,
    "lastLogin" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DossierSubvention_projetId_dispositifId_key" ON "DossierSubvention"("projetId", "dispositifId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Projet" ADD CONSTRAINT "Projet_collectiviteId_fkey" FOREIGN KEY ("collectiviteId") REFERENCES "Collectivite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DossierSubvention" ADD CONSTRAINT "DossierSubvention_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DossierSubvention" ADD CONSTRAINT "DossierSubvention_dispositifId_fkey" FOREIGN KEY ("dispositifId") REFERENCES "Dispositif"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_collectiviteId_fkey" FOREIGN KEY ("collectiviteId") REFERENCES "Collectivite"("id") ON DELETE SET NULL ON UPDATE CASCADE;
