import { StudentProfile, UserTask, TaskCategory, WorkLog } from '../types';
import { COUNTRIES } from '../data/referenceData';

export const WORK_HOURS_TASK_ID = 'task-suivi-heures-travail';

export function getCurrentYearWorkHours(workLogs: WorkLog[], referenceDate = new Date()): number {
  const year = referenceDate.getFullYear().toString();
  return workLogs
    .filter(log => log.date?.startsWith(`${year}-`))
    .reduce((total, log) => total + (Number.isFinite(log.hours) ? log.hours : 0), 0);
}

export interface PermitStatusDetails {
  daysRemaining: number;
  isExpired: boolean;
  isUrgent: boolean; // <= 60 days
  isCritical: boolean; // <= 30 days
  statusText: string;
  badgeColor: 'green' | 'blue' | 'amber' | 'red';
  renewalWindowOpen: boolean; // within 2 to 4 months before
  recommendedAction: string;
}

export function computePermitStatus(permitExpiryDateStr: string, isEU: boolean): PermitStatusDetails {
  if (isEU) {
    return {
      daysRemaining: 9999,
      isExpired: false,
      isUrgent: false,
      isCritical: false,
      statusText: 'Statut citoyen européen (dispensé de titre de séjour)',
      badgeColor: 'green',
      renewalWindowOpen: false,
      recommendedAction: 'Aucune démarche de renouvellement de titre requise.',
    };
  }

  if (!permitExpiryDateStr) {
    return {
      daysRemaining: 0,
      isExpired: false,
      isUrgent: false,
      isCritical: false,
      statusText: 'Échéance à renseigner',
      badgeColor: 'blue',
      renewalWindowOpen: false,
      recommendedAction: 'Ajoute la date d’expiration de ton titre de séjour dans ton profil.',
    };
  }

  const expiry = new Date(`${permitExpiryDateStr}T00:00:00`);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return {
      daysRemaining,
      isExpired: true,
      isUrgent: true,
      isCritical: true,
      statusText: `Titre expiré depuis ${Math.abs(daysRemaining)} jours`,
      badgeColor: 'red',
      renewalWindowOpen: false,
      recommendedAction: 'Démarche d’urgence : contacte ta préfecture via l’ANEF. Attention à la taxe de retard de 180 €.',
    };
  }

  if (daysRemaining <= 30) {
    return {
      daysRemaining,
      isExpired: false,
      isUrgent: true,
      isCritical: true,
      statusText: `Expire dans ${daysRemaining} jours (Urgence maximale)`,
      badgeColor: 'red',
      renewalWindowOpen: true,
      recommendedAction: 'Dépose immédiatement ton dossier sur l’ANEF pour éviter une rupture de tes droits au séjour.',
    };
  }

  if (daysRemaining <= 60) {
    return {
      daysRemaining,
      isExpired: false,
      isUrgent: true,
      isCritical: false,
      statusText: `Expire dans ${daysRemaining} jours (À préparer maintenant)`,
      badgeColor: 'amber',
      renewalWindowOpen: true,
      recommendedAction: 'Tu es dans la fenêtre idéale (2 à 4 mois avant). Rassemble tes relevés de notes et ressources.',
    };
  }

  if (daysRemaining <= 120) {
    return {
      daysRemaining,
      isExpired: false,
      isUrgent: false,
      isCritical: false,
      statusText: `Expire dans ${daysRemaining} jours`,
      badgeColor: 'blue',
      renewalWindowOpen: true,
      recommendedAction: 'La fenêtre de renouvellement ANEF est ouverte. Prépare tes justificatifs de scolarité.',
    };
  }

  return {
    daysRemaining,
    isExpired: false,
    isUrgent: false,
    isCritical: false,
    statusText: `Expire dans ${daysRemaining} jours (${Math.round(daysRemaining / 30)} mois restants)`,
    badgeColor: 'green',
    renewalWindowOpen: false,
    recommendedAction: 'Titre valide. Le renouvellement s’effectuera entre 2 et 4 mois avant l’échéance.',
  };
}

export function generatePersonalizedTasks(profile: StudentProfile): UserTask[] {
  const isEU = COUNTRIES.some(country => country.name === profile.nationality && country.isEU)
    || profile.visaType === 'Passeport européen / citoyen UE';
  const isAlgerian = profile.nationality === 'Algérie';
  const tasks: UserTask[] = [];

  // ==================== AVANT L'ARRIVÉE ====================
  if (!isEU) {
    tasks.push({
      id: 'task-visa-francevisas',
      userId: profile.userId,
      category: 'before_arrival',
      title: 'Demande de visa étudiant sur France-Visas',
      shortDescription: 'Déposer le dossier officiel et prendre rendez-vous chez TLScontact ou VFS.',
      whyImportant: 'Sans le visa VLS-TS délivré par le consulat, tu ne pourras pas franchir la frontière ni t’inscrire.',
      whenToDo: '2 à 3 mois avant la date de départ prévue',
      requiredDocuments: ['Passeport valide', 'Attestation d’acceptation Campus France / Université', 'Justificatif de ressources financières (min. 615 €/mois)', 'Justificatif d’hébergement pour les 3 premiers mois'],
      officialLink: 'https://france-visas.gouv.fr/',
      officialSource: 'France-Visas (Ministère des Affaires Étrangères)',
      status: 'todo',
    });
  }

  tasks.push({
    id: 'task-cvec',
    userId: profile.userId,
    category: 'before_arrival',
    title: 'Payer ou s’exonérer de la CVEC (Contribution Vie Étudiante et de Campus)',
    shortDescription: 'Obtenir l’attestation CVEC obligatoire pour l’inscription administrative.',
    whyImportant: 'Indispensable : aucun établissement d’enseignement supérieur ne peut valider ton inscription sans cette attestation.',
    whenToDo: 'Dès que ton admission est confirmée et avant ton arrivée',
    requiredDocuments: ['Attestation d’admission', 'Moyen de paiement bancaire ou justificatif d’exonération boursier'],
    officialLink: 'https://cvec.etudiant.gouv.fr/',
    officialSource: 'CROUS / etudiant.gouv.fr',
    status: 'todo',
  });

  tasks.push({
    id: 'task-logement-garantme-visale',
    userId: profile.userId,
    category: 'before_arrival',
    title: 'Obtenir un garant locatif gratuit avec Visale (Action Logement)',
    shortDescription: 'Garantie d’État gratuite pour rassurer les propriétaires français.',
    whyImportant: 'En France, la quasi-totalité des bailleurs exigent un garant domicilié en France. Visale remplace ce garant gratuitement.',
    whenToDo: 'Avant de signer un bail ou réserver un logement privé',
    requiredDocuments: ['Passeport', 'Visa VLS-TS', 'Certificat d’admission ou de pré-inscription'],
    officialLink: 'https://www.visale.fr/',
    officialSource: 'Action Logement / Ministère du Logement',
    status: 'todo',
  });

  // ==================== À L'ARRIVÉE ====================
  if (!isEU && profile.visaType?.includes('VLS-TS')) {
    tasks.push({
      id: 'task-valider-vlsts',
      userId: profile.userId,
      category: 'on_arrival',
      title: 'Valider obligatoirement ton visa VLS-TS en ligne sur l’ANEF',
      shortDescription: 'Payer la taxe de séjour (50 €) et télécharger la confirmation de validation.',
      whyImportant: 'URGENT : À faire dans les 3 mois suivant ton arrivée. Sans cette validation, ton séjour devient illégal en France et tu ne peux ni voyager ni travailler.',
      whenToDo: 'Dans les 3 mois suivant ton atterrissage en France',
      requiredDocuments: ['Numéro de visa', 'Date d’entrée en France', 'Adresse en France', 'Carte bancaire pour la taxe de séjour de 50 €'],
      officialLink: 'https://administration-etrangers-en-france.interieur.gouv.fr/',
      officialSource: 'ANEF (Ministère de l’Intérieur)',
      status: 'todo',
      isUrgent: true,
    });
  }

  tasks.push({
    id: 'task-inscription-definitive',
    userId: profile.userId,
    category: 'on_arrival',
    title: `Finaliser l’inscription à ${profile.school || 'ton établissement'}`,
    shortDescription: 'Retirer ta carte d’étudiant et obtenir ton certificat de scolarité original.',
    whyImportant: 'Le certificat de scolarité est le document pivot exigé par la Sécurité Sociale, la CAF, la préfecture et les banques.',
    whenToDo: 'Dès les premiers jours de la rentrée universitaire',
    requiredDocuments: ['Attestation CVEC', 'Passeport et visa', 'Diplômes originaux et traductions assermentées', 'Photo d’identité'],
    officialLink: 'https://www.etudiant.gouv.fr/',
    officialSource: 'Ministère de l’Enseignement Supérieur',
    status: 'todo',
  });

  tasks.push({
    id: 'task-ameli-secu',
    userId: profile.userId,
    category: 'on_arrival',
    title: 'S’inscrire gratuitement à la Sécurité Sociale sur etudiant-etranger.ameli.fr',
    shortDescription: 'Obtenir ton numéro de sécurité sociale pour la prise en charge de tes frais médicaux.',
    whyImportant: 'C’est 100 % gratuit et indispensable pour être remboursé de tes consultations, soins et médicaments chez le médecin.',
    whenToDo: 'Dès l’obtention de ton certificat de scolarité',
    requiredDocuments: ['Certificat de scolarité de l’année en cours', 'Passeport et visa validé', 'Acte de naissance traduit', 'RIB français'],
    officialLink: 'https://etudiant-etranger.ameli.fr/',
    officialSource: 'Caisse Nationale de l’Assurance Maladie (Ameli)',
    status: 'todo',
  });

  tasks.push({
    id: 'task-compte-bancaire',
    userId: profile.userId,
    category: 'on_arrival',
    title: 'Ouvrir un compte bancaire avec IBAN français',
    shortDescription: 'Nécessaire pour percevoir l’APL de la CAF, payer le loyer et recevoir ton salaire étudiant.',
    whyImportant: 'La CAF et la plupart des employeurs français exigent un IBAN français (FR76...) pour les virements.',
    whenToDo: 'Dans les 2 premières semaines à l’arrivée',
    requiredDocuments: ['Passeport', 'Visa validé', 'Justificatif de domicile en France (attestation CROUS, quittance)', 'Certificat de scolarité'],
    officialLink: 'https://www.service-public.fr/particuliers/vosdroits/F2417',
    officialSource: 'Service-Public.fr / Banque de France',
    status: 'todo',
  });

  tasks.push({
    id: 'task-caf-apl',
    userId: profile.userId,
    category: 'on_arrival',
    title: 'Faire ta demande d’APL (Aide au Logement) sur le site de la CAF',
    shortDescription: 'Bénéficier de 100 € à 250 € / mois d’aide au loyer selon tes revenus et ton logement.',
    whyImportant: 'L’aide n’est pas rétroactive pour le premier mois ! Plus vite tu déposes ton dossier complet, plus vite tu perçois l’aide.',
    whenToDo: 'Dès la remise des clés et signature du bail de location',
    requiredDocuments: ['Bail de location signé', 'Attestation de loyer remplie par le bailleur', 'RIB français', 'Titre de séjour / Visa validé', 'Déclaration de ressources'],
    officialLink: 'https://www.caf.fr/allocataires/aides-et-demarches/droits-et-prestations/logement/les-aides-personnelles-au-logement',
    officialSource: 'Caisse d’Allocations Familiales (CAF)',
    status: 'todo',
  });

  tasks.push({
    id: 'task-transport-etudiant',
    userId: profile.userId,
    category: 'on_arrival',
    title: `Souscrire au forfait transport étudiant à ${profile.city || 'ta ville'}`,
    shortDescription: 'Bénéficier du tarif réduit étudiant (Navigo Imagine R à Paris, abonnement TCL à Lyon, TBM à Bordeaux...).',
    whyImportant: 'Économise jusqu’à 50 % sur tes déplacements quotidiens dans toute la métropole.',
    whenToDo: 'Dès la réception du certificat de scolarité',
    requiredDocuments: ['Certificat de scolarité', 'Justificatif de domicile', 'RIB français pour prélèvement mensuel', 'Photo d’identité'],
    officialLink: 'https://www.iledefrance-mobilites.fr/titres-et-tarifs/detail/forfait-imagine-r-etudiant',
    officialSource: `Réseau de transport urbain (${profile.city || 'France'})`,
    status: 'todo',
  });

  // ==================== PENDANT LES ÉTUDES ====================
  if (!isEU && profile.permitExpiryDate) {
    const permitStatus = computePermitStatus(profile.permitExpiryDate, false);
    tasks.push({
      id: 'task-renouvellement-titre',
      userId: profile.userId,
      category: 'during_studies',
      title: 'Renouveler ton titre de séjour étudiant sur l’ANEF',
      shortDescription: `Déposer ton dossier complet entre 2 et 4 mois avant l’échéance du ${profile.permitExpiryDate}.`,
      whyImportant: 'CRITIQUE : Ne dépasse jamais la date limite. Un dépôt tardif engendre 180 € de taxe et suspend ton droit au travail.',
      whenToDo: '2 à 4 mois avant la date d’expiration du titre actuel',
      requiredDocuments: [
        'Passeport en cours de validité',
        'Titre de séjour actuel ou visa validé',
        'Justificatif d’inscription pour l’année universitaire suivante',
        'Relevés de notes de l’année écoulée et assiduité (sérieux des études)',
        'Justificatif de ressources financières (minimum 615 € / mois)',
        'Justificatif de domicile de moins de 6 mois (quittance, facture électricité)',
        'e-Photo d’identité agréée ANTS'
      ],
      officialLink: 'https://administration-etrangers-en-france.interieur.gouv.fr/',
      officialSource: 'ANEF / Ministère de l’Intérieur',
      status: 'todo',
      isUrgent: permitStatus.isUrgent,
      dueDate: profile.permitExpiryDate,
    });
  }

  // ==================== FIN DES ÉTUDES ====================
  if (!isEU) {
    tasks.push({
      id: 'task-titre-rece',
      userId: profile.userId,
      category: 'end_of_studies',
      title: 'Demander le titre Recherche d’emploi ou Création d’entreprise (RECE)',
      shortDescription: 'Obtenir une carte de séjour d’1 an pour chercher un emploi qualifié ou lancer ta startup en France.',
      whyImportant: 'Permet de travailler à temps plein sans limite horaire en attendant un CDI ou une création d’entreprise rémunéré à au moins 1,5 x le SMIC.',
      whenToDo: 'Avant l’expiration de ton titre étudiant, une fois le diplôme de Master ou Licence Pro validé',
      requiredDocuments: [
        'Attestation de réussite au diplôme (Master, Mastère Spécialisé, ou Licence Pro)',
        'Titre de séjour étudiant en cours de validité',
        'Justificatif d’assurance maladie',
        'Justificatif de domicile récent'
      ],
      officialLink: 'https://www.service-public.fr/particuliers/vosdroits/F17319',
      officialSource: 'Service-Public.fr / Campus France',
      status: profile.studentStatus === 'finishing' ? 'todo' : 'todo',
    });

    tasks.push({
      id: 'task-changement-statut-salarie',
      userId: profile.userId,
      category: 'end_of_studies',
      title: 'Changement de statut vers Carte Salarié ou Passeport Talent',
      shortDescription: 'Transformer ton statut étudiant en titre de séjour travailleur après signature d’un contrat.',
      whyImportant: 'Permet de résider et travailler de manière pérenne en France en tant que professionnel étranger.',
      whenToDo: 'Dès la réception d’une promesse d’embauche ou d’un contrat CDI qualifié',
      requiredDocuments: [
        'Contrat de travail CDI ou CDD > 3 mois',
        'Demande d’autorisation de travail déposée par l’employeur sur le portail ANEF Travail',
        'Diplôme obtenu en France',
        'Curriculum Vitae et justificatifs de compétences'
      ],
      officialLink: 'https://administration-etrangers-en-france.interieur.gouv.fr/',
      officialSource: 'Ministère de l’Intérieur / France Travail',
      status: 'todo',
    });
  }

  const categoriesByStatus: Record<StudentProfile['studentStatus'], TaskCategory[]> = {
    preparing: ['before_arrival'],
    recent_arrival: ['on_arrival'],
    already_student: ['on_arrival', 'during_studies'],
    renewal: ['during_studies'],
    finishing: ['end_of_studies'],
    job_hunting: ['end_of_studies'],
    other: [],
  };
  return tasks.filter(task => categoriesByStatus[profile.studentStatus].includes(task.category));
}

export interface TimelineMilestone {
  id: string;
  stepNumber: number;
  label: string;
  subtitle: string;
  status: 'completed' | 'current' | 'upcoming';
  category: TaskCategory;
  iconName: string;
}

export function generateTimelineMilestones(profile: StudentProfile, tasks: UserTask[]): TimelineMilestone[] {
  const getCategoryStatus = (cat: TaskCategory) => {
    const catTasks = tasks.filter(t => t.category === cat);
    if (catTasks.length === 0) return 'upcoming';
    const allDone = catTasks.every(t => t.status === 'completed');
    if (allDone) return 'completed';
    const anyDoneOrProgress = catTasks.some(t => t.status === 'completed' || t.status === 'in_progress');
    if (anyDoneOrProgress) return 'current';
    return 'upcoming';
  };

  return [
    {
      id: 'milestone-1',
      stepNumber: 1,
      label: 'Avant le départ',
      subtitle: 'Visa, CVEC et garantie de logement',
      status: getCategoryStatus('before_arrival'),
      category: 'before_arrival',
      iconName: 'PlaneTakeoff',
    },
    {
      id: 'milestone-2',
      stepNumber: 2,
      label: 'Arrivée & Installation',
      subtitle: 'VLS-TS, Sécu Ameli, CAF, compte bancaire',
      status: getCategoryStatus('on_arrival'),
      category: 'on_arrival',
      iconName: 'Home',
    },
    {
      id: 'milestone-3',
      stepNumber: 3,
      label: 'Vie étudiante & Travail',
      subtitle: 'Études, suivi des 964h et assiduité',
      status: getCategoryStatus('during_studies'),
      category: 'during_studies',
      iconName: 'GraduationCap',
    },
    {
      id: 'milestone-4',
      stepNumber: 4,
      label: 'Renouvellement du titre',
      subtitle: 'Dépôt ANEF 2 à 4 mois avant la date',
      status: profile.studentStatus === 'renewal' ? 'current' : 'upcoming',
      category: 'during_studies',
      iconName: 'RefreshCw',
    },
    {
      id: 'milestone-5',
      stepNumber: 5,
      label: 'Après les études',
      subtitle: 'Titre RECE, alternance ou CDI',
      status: getCategoryStatus('end_of_studies'),
      category: 'end_of_studies',
      iconName: 'Briefcase',
    },
  ];
}
