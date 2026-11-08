export interface CountryInfo {
  name: string;
  code: string;
  flag: string;
  isEU: boolean;
  continent: 'Afrique' | 'Asie & Moyen-Orient' | 'Amériques' | 'Europe' | 'Océanie' | 'International';
  regimeNotes?: string;
  popular?: boolean;
}

export const COUNTRIES: CountryInfo[] = [
  // --- Afrique ---
  { name: 'Sénégal', code: 'SN', flag: '🇸🇳', isEU: false, continent: 'Afrique', popular: true, regimeNotes: 'Régime général CESEDA (964 h/an - ANEF)' },
  { name: 'Bénin', code: 'BJ', flag: '🇧🇯', isEU: false, continent: 'Afrique', popular: true, regimeNotes: 'Régime général CESEDA (964 h/an - ANEF)' },
  { name: 'Côte d’Ivoire', code: 'CI', flag: '🇨🇮', isEU: false, continent: 'Afrique', popular: true, regimeNotes: 'Régime général CESEDA (964 h/an - ANEF)' },
  { name: 'Maroc', code: 'MA', flag: '🇲🇦', isEU: false, continent: 'Afrique', popular: true, regimeNotes: 'Régime général CESEDA (964 h/an - ANEF)' },
  { name: 'Algérie', code: 'DZ', flag: '🇩🇿', isEU: false, continent: 'Afrique', popular: true, regimeNotes: 'Accord franco-algérien du 27 décembre 1968 (limite 822,5 h/an - CRA étudiant)' },
  { name: 'Cameroun', code: 'CM', flag: '🇨🇲', isEU: false, continent: 'Afrique', popular: true, regimeNotes: 'Régime général CESEDA (964 h/an - ANEF)' },
  { name: 'Tunisie', code: 'TN', flag: '🇹🇳', isEU: false, continent: 'Afrique', popular: true, regimeNotes: 'Régime général CESEDA (964 h/an - ANEF)' },
  { name: 'Togo', code: 'TG', flag: '🇹🇬', isEU: false, continent: 'Afrique', popular: true, regimeNotes: 'Régime général CESEDA (964 h/an - ANEF)' },
  { name: 'Mali', code: 'ML', flag: '🇲🇱', isEU: false, continent: 'Afrique', regimeNotes: 'Régime général CESEDA (964 h/an - ANEF)' },
  { name: 'Guinée', code: 'GN', flag: '🇬🇳', isEU: false, continent: 'Afrique', regimeNotes: 'Régime général CESEDA (964 h/an - ANEF)' },
  { name: 'Madagascar', code: 'MG', flag: '🇲🇬', isEU: false, continent: 'Afrique', regimeNotes: 'Régime général CESEDA (964 h/an - ANEF)' },
  { name: 'Gabon', code: 'GA', flag: '🇬🇦', isEU: false, continent: 'Afrique', regimeNotes: 'Régime général CESEDA (964 h/an - ANEF)' },
  { name: 'Congo', code: 'CG', flag: '🇨🇬', isEU: false, continent: 'Afrique', regimeNotes: 'Régime général CESEDA (964 h/an - ANEF)' },
  { name: 'RD Congo', code: 'CD', flag: '🇨🇩', isEU: false, continent: 'Afrique', regimeNotes: 'Régime général CESEDA (964 h/an - ANEF)' },
  { name: 'Comores', code: 'KM', flag: '🇰🇲', isEU: false, continent: 'Afrique', regimeNotes: 'Régime général CESEDA (964 h/an - ANEF)' },
  { name: 'Maurice', code: 'MU', flag: '🇲🇺', isEU: false, continent: 'Afrique', regimeNotes: 'Régime général CESEDA (964 h/an - ANEF)' },
  { name: 'Burkina Faso', code: 'BF', flag: '🇧🇫', isEU: false, continent: 'Afrique', regimeNotes: 'Régime général CESEDA (964 h/an - ANEF)' },
  { name: 'Niger', code: 'NE', flag: '🇳🇪', isEU: false, continent: 'Afrique', regimeNotes: 'Régime général CESEDA (964 h/an - ANEF)' },
  { name: 'Tchad', code: 'TD', flag: '🇹🇩', isEU: false, continent: 'Afrique', regimeNotes: 'Régime général CESEDA (964 h/an - ANEF)' },
  { name: 'Mauritanie', code: 'MR', flag: '🇲🇷', isEU: false, continent: 'Afrique', regimeNotes: 'Régime général CESEDA (964 h/an - ANEF)' },
  { name: 'Rwanda', code: 'RW', flag: '🇷🇼', isEU: false, continent: 'Afrique', regimeNotes: 'Régime général CESEDA (964 h/an - ANEF)' },
  { name: 'Égypte', code: 'EG', flag: '🇪🇬', isEU: false, continent: 'Afrique', regimeNotes: 'Régime général CESEDA (964 h/an - ANEF)' },

  // --- Asie & Moyen-Orient ---
  { name: 'Chine', code: 'CN', flag: '🇨🇳', isEU: false, continent: 'Asie & Moyen-Orient', popular: true, regimeNotes: 'Régime général CESEDA (964 h/an - visa étudiant ANEF)' },
  { name: 'Inde', code: 'IN', flag: '🇮🇳', isEU: false, continent: 'Asie & Moyen-Orient', popular: true, regimeNotes: 'Régime général CESEDA (964 h/an - accords mobilité France-Inde)' },
  { name: 'Liban', code: 'LB', flag: '🇱🇧', isEU: false, continent: 'Asie & Moyen-Orient', popular: true, regimeNotes: 'Régime général CESEDA (964 h/an - Campus France)' },
  { name: 'Vietnam', code: 'VN', flag: '🇻🇳', isEU: false, continent: 'Asie & Moyen-Orient', popular: true, regimeNotes: 'Régime général CESEDA (964 h/an)' },
  { name: 'Japon', code: 'JP', flag: '🇯🇵', isEU: false, continent: 'Asie & Moyen-Orient', regimeNotes: 'Régime général CESEDA (964 h/an)' },
  { name: 'Corée du Sud', code: 'KR', flag: '🇰🇷', isEU: false, continent: 'Asie & Moyen-Orient', regimeNotes: 'Régime général CESEDA (964 h/an)' },
  { name: 'Turquie', code: 'TR', flag: '🇹🇷', isEU: false, continent: 'Asie & Moyen-Orient', regimeNotes: 'Régime général CESEDA (964 h/an)' },
  { name: 'Iran', code: 'IR', flag: '🇮🇷', isEU: false, continent: 'Asie & Moyen-Orient', regimeNotes: 'Régime général CESEDA (964 h/an)' },
  { name: 'Syrie', code: 'SY', flag: '🇸🇾', isEU: false, continent: 'Asie & Moyen-Orient', regimeNotes: 'Régime général CESEDA (964 h/an)' },
  { name: 'Indonésie', code: 'ID', flag: '🇮🇩', isEU: false, continent: 'Asie & Moyen-Orient', regimeNotes: 'Régime général CESEDA (964 h/an)' },
  { name: 'Philippines', code: 'PH', flag: '🇵🇭', isEU: false, continent: 'Asie & Moyen-Orient', regimeNotes: 'Régime général CESEDA (964 h/an)' },
  { name: 'Pakistan', code: 'PK', flag: '🇵🇰', isEU: false, continent: 'Asie & Moyen-Orient', regimeNotes: 'Régime général CESEDA (964 h/an)' },
  { name: 'Émirats arabes unis', code: 'AE', flag: '🇦🇪', isEU: false, continent: 'Asie & Moyen-Orient', regimeNotes: 'Régime général CESEDA (964 h/an)' },

  // --- Amériques ---
  { name: 'Brésil', code: 'BR', flag: '🇧🇷', isEU: false, continent: 'Amériques', popular: true, regimeNotes: 'Régime général CESEDA (964 h/an - Campus France)' },
  { name: 'Canada', code: 'CA', flag: '🇨🇦', isEU: false, continent: 'Amériques', popular: true, regimeNotes: 'Régime général CESEDA (accords bilatéraux France-Québec/Canada)' },
  { name: 'États-Unis', code: 'US', flag: '🇺🇸', isEU: false, continent: 'Amériques', popular: true, regimeNotes: 'Régime général CESEDA (964 h/an)' },
  { name: 'Colombie', code: 'CO', flag: '🇨🇴', isEU: false, continent: 'Amériques', popular: true, regimeNotes: 'Régime général CESEDA (964 h/an)' },
  { name: 'Mexique', code: 'MX', flag: '🇲🇽', isEU: false, continent: 'Amériques', regimeNotes: 'Régime général CESEDA (964 h/an)' },
  { name: 'Haïti', code: 'HT', flag: '🇭🇹', isEU: false, continent: 'Amériques', regimeNotes: 'Régime général CESEDA (964 h/an)' },
  { name: 'Argentine', code: 'AR', flag: '🇦🇷', isEU: false, continent: 'Amériques', regimeNotes: 'Régime général CESEDA (964 h/an)' },
  { name: 'Pérou', code: 'PE', flag: '🇵🇪', isEU: false, continent: 'Amériques', regimeNotes: 'Régime général CESEDA (964 h/an)' },
  { name: 'Chili', code: 'CL', flag: '🇨🇱', isEU: false, continent: 'Amériques', regimeNotes: 'Régime général CESEDA (964 h/an)' },
  { name: 'Équateur', code: 'EC', flag: '🇪🇨', isEU: false, continent: 'Amériques', regimeNotes: 'Régime général CESEDA (964 h/an)' },

  // --- Europe ---
  { name: 'Allemagne', code: 'DE', flag: '🇩🇪', isEU: true, continent: 'Europe', popular: true, regimeNotes: 'Citoyen UE : dispense de visa et de titre de séjour, travail illimité (1607 h/an)' },
  { name: 'Italie', code: 'IT', flag: '🇮🇹', isEU: true, continent: 'Europe', popular: true, regimeNotes: 'Citoyen UE : dispense de visa et de titre de séjour, travail illimité (1607 h/an)' },
  { name: 'Espagne', code: 'ES', flag: '🇪🇸', isEU: true, continent: 'Europe', popular: true, regimeNotes: 'Citoyen UE : dispense de visa et de titre de séjour, travail illimité (1607 h/an)' },
  { name: 'Belgique', code: 'BE', flag: '🇧🇪', isEU: true, continent: 'Europe', popular: true, regimeNotes: 'Citoyen UE : dispense de visa et de titre de séjour, travail illimité (1607 h/an)' },
  { name: 'Portugal', code: 'PT', flag: '🇵🇹', isEU: true, continent: 'Europe', regimeNotes: 'Citoyen UE : dispense de visa et de titre de séjour, travail illimité' },
  { name: 'Royaume-Uni', code: 'GB', flag: '🇬🇧', isEU: false, continent: 'Europe', popular: true, regimeNotes: 'Post-Brexit : régime général CESEDA (964 h/an)' },
  { name: 'Suisse', code: 'CH', flag: '🇨🇭', isEU: true, continent: 'Europe', regimeNotes: 'Accord bilatéral AELE/Suisse : dispense de titre de séjour' },
  { name: 'Pologne', code: 'PL', flag: '🇵🇱', isEU: true, continent: 'Europe', regimeNotes: 'Citoyen UE : dispense de visa et de titre de séjour' },
  { name: 'Roumanie', code: 'RO', flag: '🇷🇴', isEU: true, continent: 'Europe', regimeNotes: 'Citoyen UE : dispense de visa et de titre de séjour' },
  { name: 'Pays-Bas', code: 'NL', flag: '🇳🇱', isEU: true, continent: 'Europe', regimeNotes: 'Citoyen UE : dispense de visa et de titre de séjour' },
  { name: 'Grèce', code: 'GR', flag: '🇬🇷', isEU: true, continent: 'Europe', regimeNotes: 'Citoyen UE : dispense de visa et de titre de séjour' },
  { name: 'Ukraine', code: 'UA', flag: '🇺🇦', isEU: false, continent: 'Europe', regimeNotes: 'Régime étudiant ou protection temporaire (APS)' },
  { name: 'Suède', code: 'SE', flag: '🇸🇪', isEU: true, continent: 'Europe', regimeNotes: 'Citoyen UE : dispense de visa et de titre de séjour' },

  // --- Océanie & Autre ---
  { name: 'Australie', code: 'AU', flag: '🇦🇺', isEU: false, continent: 'Océanie', regimeNotes: 'Régime général CESEDA (964 h/an)' },
  { name: 'Nouvelle-Zélande', code: 'NZ', flag: '🇳🇿', isEU: false, continent: 'Océanie', regimeNotes: 'Régime général CESEDA (964 h/an)' },
  { name: 'Autre pays', code: 'XX', flag: '🌍', isEU: false, continent: 'International', regimeNotes: 'Régime général des étudiants internationaux en France (CESEDA)' },
];

export const FRENCH_CITIES = [
  { name: 'Paris', postalCode: '75000', prefecture: 'Préfecture de Police de Paris (Plateforme ANEF)' },
  { name: 'Lyon', postalCode: '69000', prefecture: 'Préfecture du Rhône' },
  { name: 'Marseille', postalCode: '13000', prefecture: 'Préfecture des Bouches-du-Rhône' },
  { name: 'Toulouse', postalCode: '31000', prefecture: 'Préfecture de Haute-Garonne' },
  { name: 'Lille', postalCode: '59000', prefecture: 'Préfecture du Nord' },
  { name: 'Bordeaux', postalCode: '33000', prefecture: 'Préfecture de la Gironde' },
  { name: 'Nantes', postalCode: '44000', prefecture: 'Préfecture de la Loire-Atlantique' },
  { name: 'Strasbourg', postalCode: '67000', prefecture: 'Préfecture du Bas-Rhin' },
  { name: 'Rennes', postalCode: '35000', prefecture: 'Préfecture d’Ille-et-Vilaine' },
  { name: 'Montpellier', postalCode: '34000', prefecture: 'Préfecture de l’Hérault' },
  { name: 'Nice', postalCode: '06000', prefecture: 'Préfecture des Alpes-Maritimes' },
  { name: 'Grenoble', postalCode: '38000', prefecture: 'Préfecture de l’Isère' },
];

