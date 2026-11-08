export type StudentStatus = 
  | 'preparing'
  | 'recent_arrival'
  | 'already_student'
  | 'renewal'
  | 'finishing'
  | 'job_hunting'
  | 'other';

export type VisaType =
  | 'VLS-TS étudiant'
  | 'Carte de séjour étudiant'
  | 'Carte de séjour pluriannuelle'
  | 'Passeport européen / citoyen UE'
  | 'Autre'
  | 'Je ne sais pas';

export type StudyLevel =
  | 'Licence'
  | 'Bachelor'
  | 'Master'
  | 'Doctorat'
  | 'Classe Prépa / BTS'
  | 'Autre';

export type EmploymentGoal =
  | 'job_etudiant'
  | 'alternance'
  | 'cdi'
  | 'cdd'
  | 'creation_activite'
  | 'comprendre_titre'
  | 'trouver_logement'
  | 'droits'
  | 'caf'
  | 'assurance_maladie';

export interface StudentProfile {
  userId: string;
  username?: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  nationality: string;
  nationalityCode?: string;
  flag?: string;
  residenceCountry: string;
  city: string;
  postalCode?: string;
  arrivalDate: string; // YYYY-MM-DD
  visaType: VisaType;
  residencePermitType?: string;
  permitExpiryDate: string; // YYYY-MM-DD
  school: string;
  studyLevel: StudyLevel;
  studyField: string;
  formationType: 'initiale' | 'alternance';
  studyYear: string;
  employmentGoals: EmploymentGoal[];
  housingStatus?: string;
  healthInsuranceStatus?: string;
  studentStatus: StudentStatus;
  annualWorkHoursLimit: number; // typically 964, or 822 for Algeria
  languagePreference: 'fr' | 'en';
  onboardingCompleted: boolean;
  notificationPreferences?: Record<string, boolean>;
  updatedAt?: string;
}

export type TaskCategory = 'before_arrival' | 'on_arrival' | 'during_studies' | 'end_of_studies';

export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface UserTask {
  id: string;
  userId: string;
  category: TaskCategory;
  title: string;
  shortDescription: string;
  whyImportant: string;
  whenToDo: string;
  requiredDocuments: string[];
  officialLink: string;
  officialSource: string;
  status: TaskStatus;
  dueDate?: string;
  isUrgent?: boolean;
  isCustom?: boolean;
  completedAt?: string;
  completedSteps?: string[];
}

export interface WorkLog {
  id: string;
  userId: string;
  company: string;
  hours: number;
  month: string; // YYYY-MM
  date: string; // YYYY-MM-DD
  contractType: string;
  notes?: string;
  createdAt?: string;
}

export type DocumentStatus = 'ready' | 'expiring_soon' | 'missing';

export interface UserDocumentItem {
  id: string;
  userId: string;
  type: string;
  label: string;
  status: DocumentStatus;
  expiryDate?: string;
  notes?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  type: 'permit_expiry' | 'task_deadline' | 'work_limit' | 'news' | 'calendar';
  importance: 'info' | 'warning' | 'urgent';
  actionUrl?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  date: string;
  sourceName: string;
  sourceUrl: string;
  category: 'all' | 'titre_de_sejour' | 'travail' | 'etudes' | 'logement' | 'caf' | 'sante' | 'transport' | 'vie_etudiante';
  importance: 'info' | 'urgent' | 'recommended';
  lastVerified: string;
  applicableNationalities?: string[];
  applicableStatuses?: string[];
}

export interface JobOffer {
  id: string;
  title: string;
  company: string;
  city: string;
  contractType: 'job_etudiant' | 'alternance' | 'cdi' | 'cdd';
  workingHours: string;
  salary: string;
  date: string;
  applyUrl: string;
  compatibilityTag: 'Compatible avec ton profil' | 'Vérification nécessaire' | 'Attention : vérifie ton autorisation de travail';
  compatibilityReason: string;
  sector: string;
  remote: string;
  description: string;
}

export type JobApplicationStatus = 'saved' | 'applied' | 'interview' | 'rejected' | 'offer';

export interface JobApplication {
  id: string;
  jobId: string;
  status: JobApplicationStatus;
  updatedAt: string;
}

export interface AdministrativeRule {
  id: string;
  code: string;
  title: string;
  category: string;
  sourceName: string;
  sourceUrl: string;
  lastVerified: string;
  summary: string;
  workHourLimit: number;
  renewalWindowDaysBefore: number;
  applicableNationalities: string[];
  applicablePermitTypes: string[];
}
