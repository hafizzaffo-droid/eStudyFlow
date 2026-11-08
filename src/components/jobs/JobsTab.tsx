import React, { useEffect, useState } from 'react';
import { 
  Briefcase, 
  Clock, 
  MapPin, 
  Search, 
  Coffee, 
  Megaphone, 
  BookOpen, 
  Laptop, 
  Building, 
  ChevronRight, 
  ChevronDown, 
  ExternalLink,
  Plus,
  Trash2,
  X,
  ShieldCheck,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getCurrentYearWorkHours } from '../../services/rulesEngine';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { COUNTRIES } from '../../data/referenceData';
import { JobOffer } from '../../types';

interface JobsTabProps {
  onOpenCalendar?: () => void;
}

export const JobsTab: React.FC<JobsTabProps> = () => {
  const { profile, workLogs, addWorkLog, deleteWorkLog, applications, toggleSavedJob, markJobApplied } = useAuth();
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [offerView, setOfferView] = useState<'all' | 'saved' | 'applied'>('all');
  
  // Type filter pills: 'all' | 'job_etudiant' | 'alternance' | 'cdi'
  const [contractFilter, setContractFilter] = useState<'job_etudiant' | 'alternance' | 'cdi' | 'all'>('job_etudiant');
  const contractOptions: Array<{ id: 'all' | 'job_etudiant' | 'alternance' | 'cdi'; label: string }> = [
    { id: 'all', label: 'Tous les contrats' },
    { id: 'job_etudiant', label: 'Job étudiant' },
    { id: 'alternance', label: 'Alternance' },
    { id: 'cdi', label: 'CDI / CDD' },
  ];
  
  // Search and dropdown filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedSector, setSelectedSector] = useState<string>('all');

  // Dropdown open states
  const [openDropdown, setOpenDropdown] = useState<'city' | 'contract' | 'sector' | null>(null);

  // Job Detail modal state
  const [selectedJob, setSelectedJob] = useState<JobOffer | null>(null);

  // Hours tracker modal state
  const [showHoursTracker, setShowHoursTracker] = useState(false);
  const [showAddHoursModal, setShowAddHoursModal] = useState(false);
  const [logHours, setLogHours] = useState('15');
  const [logCompany, setLogCompany] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logContract, setLogContract] = useState('Temps partiel');

  useEffect(() => onSnapshot(collection(db, 'jobs'), snapshot => {
    setJobs(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as JobOffer)));
    setJobsLoading(false);
    setJobsError(null);
  }, error => {
    console.error('Jobs listener error:', error);
    setJobsLoading(false);
    setJobsError('Impossible de charger les offres.');
  }), []);

  const isEU = Boolean(profile && (
    COUNTRIES.some(country => country.name === profile.nationality && country.isEU)
    || profile.visaType === 'Passeport européen / citoyen UE'
  ));
  const isAlgerian = profile?.nationality === 'Algérie';
  const maxHours = isEU ? Number.POSITIVE_INFINITY : isAlgerian ? 822.5 : (profile?.annualWorkHoursLimit || 964);
  const totalHoursWorked = getCurrentYearWorkHours(workLogs);
  const remainingHours = Math.max(0, maxHours - totalHoursWorked);
  const percentWorked = isEU ? 0 : Math.min(100, Math.round((totalHoursWorked / maxHours) * 100));

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    const application = applications.find(item => item.jobId === job.id);
    if (offerView === 'saved' && application?.status !== 'saved') return false;
    if (offerView === 'applied' && application?.status !== 'applied') return false;
    if (contractFilter !== 'all' && contractFilter !== 'cdi' && job.contractType !== contractFilter) return false;
    if (contractFilter === 'cdi' && !['cdi', 'cdd'].includes(job.contractType)) return false;
    if (selectedCity !== 'all' && !job.city.toLowerCase().includes(selectedCity.toLowerCase())) return false;
    if (selectedSector !== 'all' && !job.sector.toLowerCase().includes(selectedSector.toLowerCase())) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getJobIcon = (job: JobOffer) => {
    const title = job.title.toLowerCase();
    const company = job.company.toLowerCase();
    
    if (title.includes('polyvalent') || title.includes('barista') || company.includes('café') || company.includes('restaur')) {
      return {
        icon: <Coffee className="w-5 h-5 text-amber-700" />,
        bg: 'bg-amber-100/70'
      };
    }
    if (title.includes('marketing') || title.includes('communication') || company.includes('nova')) {
      return {
        icon: <Megaphone className="w-5 h-5 text-purple-600" />,
        bg: 'bg-purple-100/70'
      };
    }
    if (title.includes('bibliothécaire') || title.includes('tuteur') || company.includes('médiathèque') || company.includes('livre')) {
      return {
        icon: <BookOpen className="w-5 h-5 text-emerald-600" />,
        bg: 'bg-emerald-100/70'
      };
    }
    if (title.includes('développeur') || title.includes('ingénieur') || title.includes('data')) {
      return {
        icon: <Laptop className="w-5 h-5 text-[#0045F9]" />,
        bg: 'bg-[#EBF0FF]'
      };
    }
    return {
      icon: <Briefcase className="w-5 h-5 text-[#0045F9]" />,
      bg: 'bg-[#EBF0FF]'
    };
  };

  const handleAddWorkHours = async (e: React.FormEvent) => {
    e.preventDefault();
    const hoursNum = parseFloat(logHours);
    if (!Number.isFinite(hoursNum) || hoursNum <= 0 || hoursNum > 24 || (!isEU && hoursNum > remainingHours)) {
      setActionError(isEU
        ? 'Saisis un nombre d’heures positif, inférieur ou égal à 24 h par entrée.'
        : `Saisis un nombre d’heures positif, inférieur ou égal à 24 h par entrée et au quota restant (${remainingHours} h).`);
      return;
    }
    try {
      await addWorkLog({
        hours: hoursNum,
        company: logCompany.trim(),
        date: logDate,
        month: logDate.substring(0, 7),
        contractType: logContract,
      });
      setActionError(null);
      setLogHours('15');
      setLogCompany('');
      setShowAddHoursModal(false);
    } catch (error) {
      console.error('Could not save work hours:', error);
      setActionError('Impossible d’enregistrer ces heures. Réessaie.');
    }
  };

  const saveOffer = async (jobId: string) => {
    try {
      await toggleSavedJob(jobId);
      setActionError(null);
    } catch (error) {
      console.error('Could not save job offer:', error);
      setActionError('Impossible de mettre à jour les offres sauvegardées.');
    }
  };

  const recordApplication = async (jobId: string) => {
    try {
      await markJobApplied(jobId);
      setActionError(null);
    } catch (error) {
      console.error('Could not track job application:', error);
      setActionError('Impossible d’enregistrer cette candidature.');
    }
  };

  const handleDeleteWorkLog = async (logId: string) => {
    try {
      await deleteWorkLog(logId);
      setActionError(null);
    } catch (error) {
      console.error('Could not delete work log:', error);
      setActionError('Impossible de supprimer ces heures.');
    }
  };

  const citiesList = ['all', 'Paris', 'Lyon', 'Lille', 'Toulouse', 'Bordeaux'];
  const sectorsList = ['all', 'Restauration', 'Marketing', 'Culture', 'Informatique'];

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200 max-w-lg mx-auto">
      
      {/* Title */}
      <div className="pt-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17181C] tracking-tight">
          Trouver un emploi
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
          Offres publiées dans la base eStudyFlow. Les candidatures restent suivies dans ton compte.
        </p>
      </div>
      {actionError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{actionError}</p>}

      {/* Segmented Type Filters (Pills) */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setContractFilter('job_etudiant')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
            contractFilter === 'job_etudiant'
              ? 'bg-[#0045F9] text-white shadow-xs'
              : 'bg-gray-100 text-[#6B7280] hover:bg-gray-200'
          }`}
        >
          Job étudiant
        </button>

        <button
          onClick={() => setContractFilter('alternance')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
            contractFilter === 'alternance'
              ? 'bg-[#0045F9] text-white shadow-xs'
              : 'bg-gray-100 text-[#6B7280] hover:bg-gray-200'
          }`}
        >
          Alternance
        </button>

        <button
          onClick={() => setContractFilter('cdi')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
            contractFilter === 'cdi'
              ? 'bg-[#0045F9] text-white shadow-xs'
              : 'bg-gray-100 text-[#6B7280] hover:bg-gray-200'
          }`}
        >
          CDI / CDD
        </button>
      </div>

      <div className="flex items-center gap-2">
        {(['all', 'saved', 'applied'] as const).map(view => (
          <button
            key={view}
            onClick={() => setOfferView(view)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${offerView === view ? 'bg-gray-800 text-white' : 'bg-white text-gray-600'}`}
          >
            {view === 'all' ? 'Toutes' : view === 'saved' ? 'Sauvegardées' : 'Candidatures'}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Rechercher"
          className="w-full pl-9 pr-9 py-2.5 rounded-2xl border border-gray-200 text-xs focus:outline-hidden focus:border-[#0045F9] bg-white shadow-2xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Dropdowns Row */}
      <div className="flex items-center gap-2 relative">
        {/* Ville dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'city' ? null : 'city')}
            className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              selectedCity !== 'all'
                ? 'border-[#0045F9] bg-[#EBF0FF] text-[#0045F9]'
                : 'border-gray-200 bg-white text-[#17181C] hover:bg-gray-50'
            }`}
          >
            <MapPin className="w-3 h-3 text-gray-400" />
            <span>{selectedCity === 'all' ? 'Ville' : selectedCity}</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          {openDropdown === 'city' && (
            <div className="absolute left-0 mt-1.5 w-36 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-30 animate-in fade-in text-xs">
              {citiesList.map(city => (
                <button
                  key={city}
                  onClick={() => {
                    setSelectedCity(city);
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-gray-50 font-medium ${
                    selectedCity === city ? 'text-[#0045F9] font-bold' : 'text-[#17181C]'
                  }`}
                >
                  {city === 'all' ? 'Toutes les villes' : city}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Contrat dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'contract' ? null : 'contract')}
            className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              contractFilter !== 'all'
                ? 'border-[#0045F9] bg-[#EBF0FF] text-[#0045F9]'
                : 'border-gray-200 bg-white text-[#17181C] hover:bg-gray-50'
            }`}
          >
            <Briefcase className="w-3 h-3 text-gray-400" />
            <span>{contractFilter === 'all' ? 'Contrat' : contractFilter === 'job_etudiant' ? 'Job étudiant' : contractFilter === 'alternance' ? 'Alternance' : 'CDI / CDD'}</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          {openDropdown === 'contract' && (
            <div className="absolute left-0 mt-1.5 w-40 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-30 animate-in fade-in text-xs">
              {contractOptions.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    setContractFilter(c.id);
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-gray-50 font-medium ${
                    contractFilter === c.id ? 'text-[#0045F9] font-bold' : 'text-[#17181C]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Secteur dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'sector' ? null : 'sector')}
            className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              selectedSector !== 'all'
                ? 'border-[#0045F9] bg-[#EBF0FF] text-[#0045F9]'
                : 'border-gray-200 bg-white text-[#17181C] hover:bg-gray-50'
            }`}
          >
            <Filter className="w-3 h-3 text-gray-400" />
            <span>{selectedSector === 'all' ? 'Secteur' : selectedSector}</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          {openDropdown === 'sector' && (
            <div className="absolute left-0 mt-1.5 w-40 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-30 animate-in fade-in text-xs">
              {sectorsList.map(s => (
                <button
                  key={s}
                  onClick={() => {
                    setSelectedSector(s);
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-gray-50 font-medium ${
                    selectedSector === s ? 'text-[#0045F9] font-bold' : 'text-[#17181C]'
                  }`}
                >
                  {s === 'all' ? 'Tous les secteurs' : s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Job Cards List (Screen 4) */}
      <div className="space-y-3">
        {jobsLoading ? (
          <p className="rounded-3xl bg-white p-8 text-center text-xs text-[#6B7280]">Chargement des offres…</p>
        ) : jobsError ? (
          <p role="alert" className="rounded-3xl bg-white p-8 text-center text-xs text-red-700">{jobsError}</p>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-xs">
            <Briefcase className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-[#17181C]">{jobs.length ? 'Aucune offre trouvée' : 'Aucune offre publiée'}</h3>
            <p className="text-xs text-[#6B7280] mt-1">
              {jobs.length ? 'Essaie d’élargir tes filtres.' : 'Les offres apparaîtront ici dès qu’elles seront publiées.'}
            </p>
          </div>
        ) : (
          filteredJobs.map(job => {
            const { icon, bg } = getJobIcon(job);
            const contractLabel = job.contractType === 'job_etudiant' 
              ? 'Job étudiant' 
              : job.contractType === 'alternance' 
              ? 'Alternance' 
              : 'CDI / CDD';

            return (
              <div
                key={job.id}
                className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-xs hover:border-gray-200 transition"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl ${bg} flex items-center justify-center shrink-0`}>
                      {icon}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-extrabold text-[#17181C] leading-snug truncate">
                        {job.title}
                      </h3>
                      <div className="text-xs text-[#6B7280] font-medium mt-0.5">
                        {job.company}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[11px] text-[#6B7280] flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{job.city}</span>
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF0FF] text-[#0045F9]">
                          {contractLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedJob(job)}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => setSelectedJob(job)}
                  className="w-full py-2.5 px-4 rounded-xl bg-gray-50 hover:bg-[#EBF0FF] hover:text-[#0045F9] text-[#0045F9] text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Voir l'offre</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Annual work-hours tracker belongs to the employment section. */}
      <div className="pt-2">
        <button
          onClick={() => setShowHoursTracker(true)}
          className="w-full rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-[#0045F9] p-4 text-left transition cursor-pointer active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EBF0FF] text-[#0045F9] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-extrabold text-[#17181C]">Suivre ton quota d’heures de travail</span>
              <span className="mt-1 block text-[11px] text-[#6B7280]">
                {totalHoursWorked} h déclarées cette année
                {isEU ? ' • Aucun plafond étudiant lié au titre' : ` • ${remainingHours} h restantes sur ${maxHours} h`}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#0045F9] shrink-0" />
          </div>
          {!isEU && (
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all ${percentWorked >= 90 ? 'bg-red-500' : percentWorked >= 70 ? 'bg-amber-500' : 'bg-[#0045F9]'}`}
                style={{ width: `${percentWorked}%` }}
              />
            </div>
          )}
        </button>
      </div>

      {/* Modal: Job Offer Detail */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF0FF] text-[#0045F9]">
                  {selectedJob.contractType === 'job_etudiant' ? 'Job étudiant' : selectedJob.contractType === 'alternance' ? 'Alternance' : 'CDI / CDD'}
                </span>
                <h3 className="text-lg font-extrabold text-[#17181C] mt-1">
                  {selectedJob.title}
                </h3>
                <p className="text-xs text-[#6B7280]">
                  {selectedJob.company} • {selectedJob.city}
                </p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Rémunération :</span>
                <span className="font-bold text-[#17181C]">{selectedJob.salary}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Horaires / Rythme :</span>
                <span className="font-bold text-[#17181C]">{selectedJob.workingHours}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Mode de travail :</span>
                <span className="font-bold text-[#17181C]">{selectedJob.remote}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#17181C] mb-1">Description du poste :</h4>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                {selectedJob.description}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-[#EBF0FF] text-[#0045F9] text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{selectedJob.compatibilityReason || 'Compatible avec le quota annuel de travail étudiant en France.'}</span>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => setSelectedJob(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Fermer
              </button>
              <a
                href={selectedJob.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-[#0045F9] hover:bg-[#0036C8] text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <span>Postuler</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => void saveOffer(selectedJob.id)}
                className="rounded-xl border border-gray-200 py-2.5 text-xs font-bold text-[#0045F9]"
              >
                {applications.some(item => item.jobId === selectedJob.id && item.status === 'saved')
                  ? 'Retirer des sauvegardées'
                  : 'Sauvegarder'}
              </button>
              <button
                type="button"
                onClick={() => void recordApplication(selectedJob.id)}
                className="rounded-xl border border-gray-200 py-2.5 text-xs font-bold text-[#0045F9]"
              >
                {applications.some(item => item.jobId === selectedJob.id && item.status === 'applied')
                  ? 'Candidature enregistrée'
                  : 'J’ai candidaté'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Suivi de mes heures (Legal quota 964h / 822.5h) */}
      {showHoursTracker && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-[#17181C]">Suivi de mes heures légales</h3>
                <p className="text-xs text-[#6B7280]">
                  {isEU
                    ? 'Aucun plafond étudiant lié au titre de séjour ne s’applique aux citoyens UE.'
                    : `Quota annuel indicatif : ${maxHours} h (${isAlgerian ? 'régime franco-algérien' : 'régime général'})`}
                </p>
              </div>
              <button
                onClick={() => setShowHoursTracker(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Card */}
            <div className="p-4 rounded-2xl bg-gray-50 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-[#17181C]">{totalHoursWorked} h déclarées</span>
                <span className="text-[#0045F9]">{isEU ? 'Sans plafond lié au titre' : `${remainingHours} h restantes`}</span>
              </div>

              <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    percentWorked >= 90 ? 'bg-red-500' : percentWorked >= 70 ? 'bg-amber-500' : 'bg-[#0045F9]'
                  }`}
                  style={{ width: `${percentWorked}%` }}
                />
              </div>

              <p className="text-[11px] text-[#6B7280]">
                {isEU
                  ? 'Ce suivi enregistre tes heures déclarées ; vérifie les règles applicables à ta situation.'
                  : percentWorked >= 80
                  ? 'Tu approches du plafond annuel indicatif : vérifie les conditions officielles correspondant à ton titre.'
                  : 'Le compteur est indicatif. Vérifie les règles actuelles auprès des sources officielles.'}
              </p>
            </div>

            {/* Work logs list */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#17181C]">Historique des déclarations</span>
                <button
                  onClick={() => setShowAddHoursModal(true)}
                  className="text-xs font-bold text-[#0045F9] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter</span>
                </button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {workLogs.length === 0 ? (
                  <p className="text-xs text-gray-400 py-3 text-center">Aucune heure enregistrée pour le moment.</p>
                ) : (
                  workLogs.map(log => (
                    <div key={log.id} className="p-2.5 rounded-xl border border-gray-100 bg-white flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-[#17181C]">{log.company}</div>
                        <div className="text-[10px] text-gray-500">{log.date} • {log.contractType}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#0045F9]">{log.hours} h</span>
                        <button
                          onClick={() => void handleDeleteWorkLog(log.id)}
                          className="text-gray-300 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={() => setShowAddHoursModal(true)}
              className="w-full py-3 rounded-xl bg-[#0045F9] text-white text-xs font-bold hover:bg-[#0036C8] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Déclarer des heures travaillées</span>
            </button>
          </div>
        </div>
      )}

      {/* Sub-Modal: Add Work Hours */}
      {showAddHoursModal && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#17181C]">Ajouter des heures</h3>
              <button
                onClick={() => setShowAddHoursModal(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddWorkHours} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#17181C] mb-1">Nombre d'heures</label>
                <input
                  type="number"
                  min="0.5"
                  max={isEU ? undefined : remainingHours}
                  step="0.5"
                  required
                  value={logHours}
                  onChange={e => setLogHours(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-[#0045F9]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#17181C] mb-1">Employeur / Entreprise</label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  placeholder="Nom de l’employeur"
                  value={logCompany}
                  onChange={e => setLogCompany(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-[#0045F9]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#17181C] mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={logDate}
                  onChange={e => setLogDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-[#0045F9]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddHoursModal(false)}
                  className="px-3 py-2 rounded-xl font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0045F9] text-white font-bold hover:bg-[#0036C8]"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
