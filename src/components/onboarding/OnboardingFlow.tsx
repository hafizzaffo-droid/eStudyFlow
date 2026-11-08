import React, { useState, useEffect } from 'react';
import { 
  Globe2, 
  MapPin, 
  Calendar, 
  GraduationCap, 
  Target, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  CheckCircle2,
  Search,
  User,
  X,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { COUNTRIES, FRENCH_CITIES, CountryInfo } from '../../data/referenceData';
import { StudentProfile, StudentStatus, VisaType, StudyLevel, EmploymentGoal } from '../../types';
import { AppLogo } from '../common/AppLogo';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const CONTINENTS = ['Tous', 'Afrique', 'Asie & Moyen-Orient', 'Amériques', 'Europe', 'Océanie'] as const;

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const { profile, updateProfile } = useAuth();

  // 7 étapes progressives
  const [step, setStep] = useState(1);
  const totalSteps = 7;

  // Étape 1: Identité & Pays d'origine
  const senegalCountry = COUNTRIES.find(c => c.name === 'Sénégal') || COUNTRIES[0];
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(
    profile?.nationality ? (COUNTRIES.find(c => c.name === profile.nationality) || senegalCountry) : senegalCountry
  );
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [searchCountry, setSearchCountry] = useState('');
  const [selectedContinent, setSelectedContinent] = useState<string>('Tous');

  const filteredCountries = COUNTRIES.filter((c) => {
    const query = searchCountry.trim().toLowerCase();
    const matchesSearch = !query || 
      c.name.toLowerCase().includes(query) || 
      c.continent.toLowerCase().includes(query) ||
      c.code.toLowerCase().includes(query);
    const matchesContinent = selectedContinent === 'Tous' || c.continent === selectedContinent;
    return matchesSearch && matchesContinent;
  });

  // Étape 2: Situation actuelle
  const [studentStatus, setStudentStatus] = useState<StudentStatus>(profile?.studentStatus || 'already_student');

  // Étape 3: Ville de résidence
  const [selectedCity, setSelectedCity] = useState(
    FRENCH_CITIES.find(c => c.name === profile?.city) || FRENCH_CITIES[0]
  );

  // Étape 4: Études & Établissement
  const [school, setSchool] = useState(profile?.school || '');
  const [studyLevel, setStudyLevel] = useState<StudyLevel>(profile?.studyLevel || 'Autre');
  const [studyField, setStudyField] = useState(profile?.studyField || '');
  const [formationType, setFormationType] = useState<'initiale' | 'alternance'>(profile?.formationType || 'initiale');

  // Étape 5: Statut administratif
  const [visaType, setVisaType] = useState<VisaType>(profile?.visaType || 'Je ne sais pas');

  // Étape 6: Dates importantes
  const [arrivalDate, setArrivalDate] = useState(profile?.arrivalDate || '');
  const [permitExpiryDate, setPermitExpiryDate] = useState(profile?.permitExpiryDate || '');

  // Étape 7: Objectifs prioritaires
  const [goals, setGoals] = useState<EmploymentGoal[]>(
    profile?.employmentGoals || []
  );

  const [isFinishing, setIsFinishing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sauvegarde progressive avec debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (profile && step > 1) {
        try {
          setSaving(true);
          await updateProfile(getCurrentStepData());
        } catch (e) {
          console.warn('Auto-save failed:', e);
        } finally {
          setSaving(false);
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [selectedCountry, studentStatus, selectedCity, school, studyLevel, studyField, formationType, visaType, arrivalDate, permitExpiryDate, goals]);

  const getCurrentStepData = (): Partial<StudentProfile> => {
    return {
      displayName,
      nationality: selectedCountry.name,
      nationalityCode: selectedCountry.code,
      flag: selectedCountry.flag,
      residenceCountry: selectedCountry.name,
      studentStatus,
      city: selectedCity.name,
      postalCode: selectedCity.postalCode,
      school,
      studyLevel,
      studyField,
      formationType,
      visaType,
      arrivalDate,
      permitExpiryDate,
      employmentGoals: goals,
      annualWorkHoursLimit: selectedCountry.name === 'Algérie' ? 822.5 : selectedCountry.isEU ? 1607 : 964,
    };
  };

  const getDaysUntilExpiry = () => {
    if (!permitExpiryDate || selectedCountry.isEU) return null;
    const diff = new Date(permitExpiryDate).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const toggleGoal = (goal: EmploymentGoal) => {
    if (goals.includes(goal)) {
      setGoals(goals.filter(g => g !== goal));
    } else {
      setGoals([...goals, goal]);
    }
  };

  const handleFinish = async () => {
    setIsFinishing(true);
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }

    const updatedData: Partial<StudentProfile> = {
      ...getCurrentStepData(),
      studyYear: studyLevel === 'Master' ? 'Master 1' : 'Année 1',
      onboardingCompleted: true,
    };

    await updateProfile(updatedData);

    setTimeout(() => {
      setIsFinishing(false);
      onComplete();
    }, 1100);
  };

  const stepLabels = [
    { num: 1, title: 'Provenance', desc: 'Identité & pays' },
    { num: 2, title: 'Situation', desc: 'Ton statut actuel' },
    { num: 3, title: 'Ville', desc: 'Résidence en France' },
    { num: 4, title: 'Études', desc: 'Établissement & cursus' },
    { num: 5, title: 'Séjour', desc: 'Titre administratif' },
    { num: 6, title: 'Dates', desc: 'Arrivée & expiration' },
    { num: 7, title: 'Objectifs', desc: 'Tes priorités' },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#F8F9FB] flex flex-col justify-between pt-safe pb-safe py-4 sm:py-6 px-3.5 sm:px-4 max-w-xl mx-auto">
      
      {/* Ligne de progression */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-2 gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <AppLogo size="xs" className="w-5 h-5 rounded-md" />
            <span className="text-[11px] sm:text-xs font-extrabold text-[#17181C] whitespace-nowrap">eStudyFlow • Parcours France</span>
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-[#0045F9] shrink-0">Étape {step} sur {totalSteps}</span>
        </div>

        <div className="relative py-2">
          <div className="absolute top-1/2 left-4 right-4 h-1 -translate-y-1/2 bg-gray-200 rounded-full" />
          <div
            className="absolute top-1/2 left-4 h-1 -translate-y-1/2 bg-[#0045F9] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${((step - 1) / (totalSteps - 1)) * 92}%` }}
          />

          <div className="relative flex justify-between items-center px-1">
            {stepLabels.map((s) => {
              const isPast = step > s.num;
              const isCurrent = step === s.num;

              return (
                <div key={s.num} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isPast
                        ? 'bg-[#22A06B] text-white ring-4 ring-green-100'
                        : isCurrent
                        ? 'bg-[#0045F9] text-white ring-4 ring-blue-100 scale-110 shadow-md'
                        : 'bg-white text-gray-400 border-2 border-gray-200'
                    }`}
                  >
                    {isPast ? <Check className="w-4 h-4" /> : s.num}
                  </div>
                  <span className={`text-[10px] font-bold mt-1 hidden sm:block ${
                    isCurrent ? 'text-[#0045F9]' : 'text-gray-400'
                  }`}>
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        {saving && (
          <div className="text-center text-[10px] text-[#6B7280] flex items-center justify-center gap-1">
            <Clock className="w-3 h-3 animate-spin" />
            <span>Sauvegarde en cours...</span>
          </div>
        )}
      </div>

      {/* Contenu principal par étape */}
      <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-xs border border-gray-100 flex-1 flex flex-col justify-between mb-3 sm:mb-4 animate-in fade-in slide-in-from-right-4 duration-200">
        
        {/* ÉTAPE 1 : Provenance */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EBF0FF] text-[#0045F9] flex items-center justify-center shrink-0">
                <Globe2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-[#17181C]">D'où viens-tu ?</h2>
                <p className="text-xs text-[#6B7280]">
                  Cela nous permet d'adapter les démarches administratives selon ton pays.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17181C] mb-1">Ton prénom (facultatif)</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Ex: Alex"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:border-[#0045F9]"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#17181C]">
                  Pays d'origine
                </label>
                <span className="text-[11px] text-[#6B7280]">
                  {filteredCountries.length} pays
                </span>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchCountry}
                  onChange={(e) => setSearchCountry(e.target.value)}
                  placeholder="Rechercher ton pays..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-[#0045F9] bg-gray-50/50"
                />
                {searchCountry && (
                  <button
                    type="button"
                    onClick={() => setSearchCountry('')}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 p-0.5 rounded-full"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
                {CONTINENTS.map((cont) => {
                  const isActive = selectedContinent === cont;
                  return (
                    <button
                      key={cont}
                      type="button"
                      onClick={() => setSelectedContinent(cont)}
                      className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                        isActive
                          ? 'bg-[#0045F9] text-white shadow-xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cont}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 sm:max-h-56 overflow-y-auto pr-1 ios-scroll">
                {filteredCountries.map((c) => {
                  const isSelected = selectedCountry.name === c.name;
                  return (
                    <button
                      key={c.code + c.name}
                      type="button"
                      onClick={() => setSelectedCountry(c)}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition group ${
                        isSelected
                          ? 'border-[#0045F9] bg-[#EBF0FF] font-bold text-[#0045F9] shadow-xs ring-1 ring-[#0045F9]'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl shrink-0">{c.flag}</span>
                        <div className="min-w-0">
                          <div className="text-xs truncate">{c.name}</div>
                          <div className="text-[10px] text-gray-500 truncate flex items-center gap-1">
                            <span>{c.continent}</span>
                            {c.isEU && (
                              <span className="px-1 py-0.2 rounded bg-blue-100 text-blue-700 font-bold text-[9px]">
                                UE
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#0045F9] shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 transition-all ${
              selectedCountry.isEU
                ? 'bg-blue-50 border-blue-200 text-blue-900'
                : selectedCountry.name === 'Algérie'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <ShieldCheck className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                selectedCountry.isEU ? 'text-[#0045F9]' : selectedCountry.name === 'Algérie' ? 'text-amber-600' : 'text-[#22A06B]'
              }`} />
              <div className="leading-relaxed">
                <span className="font-bold">
                  {selectedCountry.flag} {selectedCountry.name} :{' '}
                </span>
                {selectedCountry.name === 'Sénégal' ? (
                  <span>Régime général CESEDA (964h/an, ANEF)</span>
                ) : selectedCountry.name === 'Algérie' ? (
                  <span>Accord franco-algérien (822,5h/an, CRA)</span>
                ) : selectedCountry.isEU ? (
                  <span>Citoyen UE : Dispense de visa, travail libre (1607h/an)</span>
                ) : (
                  <span>Régime général CESEDA (964h/an, ANEF)</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ÉTAPE 2 : Situation actuelle */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EBF0FF] text-[#0045F9] flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-[#17181C]">Quelle est ta situation ?</h2>
                <p className="text-xs text-[#6B7280]">
                  Cela nous aide à prioriser les démarches importantes pour toi.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { id: 'preparing' as StudentStatus, title: 'Préparation du départ', desc: 'Tu prépares ton arrivée en France' },
                { id: 'recent_arrival' as StudentStatus, title: 'Arrivée récente', desc: 'Tu viens d&apos;arriver en France' },
                { id: 'already_student' as StudentStatus, title: 'Études en cours', desc: 'Tu suis déjà tes études' },
                { id: 'renewal' as StudentStatus, title: 'Renouvellement', desc: 'Tu dois renouveler ton titre' },
                { id: 'finishing' as StudentStatus, title: 'Fin d&apos;études', desc: 'Tu termines tes études' },
                { id: 'job_hunting' as StudentStatus, title: 'Recherche d&apos;emploi', desc: 'Tu cherches un emploi' },
                { id: 'other' as StudentStatus, title: 'Autre', desc: 'Autre situation' },
              ].map(option => {
                const isSelected = studentStatus === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setStudentStatus(option.id)}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition ${
                      isSelected
                        ? 'border-[#0045F9] bg-[#EBF0FF] text-[#0045F9]'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-800'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{option.title}</div>
                      <div className="text-[11px] text-[#6B7280]">{option.desc}</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#0045F9] flex-shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ÉTAPE 3 : Ville */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EBF0FF] text-[#0045F9] flex items-center justify-center">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-[#17181C]">Où vis-tu en France ?</h2>
                <p className="text-xs text-[#6B7280]">
                  Pour rattacher ton dossier à la bonne préfecture.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17181C] mb-1">Ville d&apos;études</label>
              <div className="grid grid-cols-3 gap-2">
                {FRENCH_CITIES.slice(0, 6).map(city => {
                  const isSelected = selectedCity.name === city.name;
                  return (
                    <button
                      key={city.name}
                      type="button"
                      onClick={() => setSelectedCity(city)}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs transition ${
                        isSelected
                          ? 'border-[#0045F9] bg-[#EBF0FF] text-[#0045F9]'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {city.name}
                    </button>
                  );
                })}
              </div>
              <div className="mt-1.5 text-[11px] text-[#6B7280]">
                Préfecture : <span className="font-semibold text-gray-800">{selectedCity.prefecture}</span>
              </div>
            </div>
          </div>
        )}

        {/* ÉTAPE 4 : Études */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EBF0FF] text-[#0045F9] flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-[#17181C]">Tes études</h2>
                <p className="text-xs text-[#6B7280]">
                  Ces informations sont facultatives mais utiles pour personnaliser ton expérience.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-[#17181C] mb-1">Établissement (facultatif)</label>
                <input
                  type="text"
                  value={school}
                  onChange={e => setSchool(e.target.value)}
                  placeholder="Ex: Sorbonne Université"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-[#0045F9]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#17181C] mb-1">Niveau d&apos;études</label>
                  <select
                    value={studyLevel}
                    onChange={e => setStudyLevel(e.target.value as StudyLevel)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-[#0045F9]"
                  >
                    <option value="Autre">Non déterminé</option>
                    <option value="Licence">Licence</option>
                    <option value="Bachelor">Bachelor</option>
                    <option value="Master">Master</option>
                    <option value="Doctorat">Doctorat</option>
                    <option value="Classe Prépa / BTS">Prépa / BTS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17181C] mb-1">Formation</label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFormationType('initiale')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                        formationType === 'initiale' ? 'bg-[#EBF0FF] border-[#0045F9] text-[#0045F9]' : 'border-gray-200 text-gray-700'
                      }`}
                    >
                      Initiale
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormationType('alternance')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                        formationType === 'alternance' ? 'bg-[#EBF0FF] border-[#0045F9] text-[#0045F9]' : 'border-gray-200 text-gray-700'
                      }`}
                    >
                      Alternance
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17181C] mb-1">Domaine d&apos;études (facultatif)</label>
                <input
                  type="text"
                  value={studyField}
                  onChange={e => setStudyField(e.target.value)}
                  placeholder="Ex: Informatique, Droit, Commerce..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-[#0045F9]"
                />
              </div>
            </div>
          </div>
        )}

        {/* ÉTAPE 5 : Statut administratif */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EBF0FF] text-[#0045F9] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-[#17181C]">Ton titre de séjour</h2>
                <p className="text-xs text-[#6B7280]">
                  Si tu ne connais pas encore ton statut, tu pourras le modifier plus tard.
                </p>
              </div>
            </div>

            {selectedCountry.isEU ? (
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-[#22A06B]" />
                  <span className="font-bold text-blue-900">Citoyen de l&apos;Union Européenne</span>
                </div>
                <p className="text-blue-800 text-xs">
                  Tu n&apos;as pas besoin de visa ni de titre de séjour pour étudier en France. Tu as le droit de travailler à temps plein.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {[
                  { id: 'VLS-TS étudiant' as VisaType, title: 'VLS-TS étudiant', desc: 'Visa long séjour (vignette dans passeport)' },
                  { id: 'Carte de séjour étudiant' as VisaType, title: 'Carte 1 an', desc: 'Carte plastique délivrée par préfecture' },
                  { id: 'Carte de séjour pluriannuelle' as VisaType, title: 'Carte pluriannuelle', desc: 'Valable 2 à 4 ans' },
                  { id: 'Je ne sais pas' as VisaType, title: 'Je ne sais pas encore', desc: 'Je découvrirai mon statut plus tard' },
                ].map(opt => {
                  const isSelected = visaType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setVisaType(opt.id)}
                      className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition ${
                        isSelected
                          ? 'border-[#0045F9] bg-[#EBF0FF] text-[#0045F9]'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-800'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold">{opt.title}</div>
                        <div className="text-[11px] text-[#6B7280]">{opt.desc}</div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#0045F9] flex-shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ÉTAPE 6 : Dates */}
        {step === 6 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EBF0FF] text-[#0045F9] flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-[#17181C]">Dates importantes</h2>
                <p className="text-xs text-[#6B7280]">
                  Ces dates sont facultatives mais utiles pour te rappeler les échéances.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-[#17181C] mb-1">Date d&apos;arrivée (facultatif)</label>
                <input
                  type="date"
                  value={arrivalDate}
                  onChange={e => setArrivalDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-[#0045F9]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#17181C] mb-1">Expiration titre (facultatif)</label>
                <input
                  type="date"
                  value={permitExpiryDate}
                  onChange={e => setPermitExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-[#0045F9]"
                />
              </div>
            </div>

            {getDaysUntilExpiry() !== null && permitExpiryDate && (
              <div className="p-3.5 rounded-2xl bg-[#EBF0FF]/70 border border-blue-200 text-xs flex items-center gap-3 text-[#17181C]">
                <Clock className="w-5 h-5 text-[#0045F9] flex-shrink-0" />
                <div>
                  <div className="font-extrabold text-sm">
                    {getDaysUntilExpiry()! > 0 ? `Expiration dans ${getDaysUntilExpiry()} jours` : 'Titre expiré'}
                  </div>
                  <div className="text-[11px] text-[#6B7280]">
                    eStudyFlow te préviendra 2 à 4 mois avant l&apos;échéance.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ÉTAPE 7 : Objectifs */}
        {step === 7 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EBF0FF] text-[#0045F9] flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-[#17181C]">Tes priorités</h2>
                <p className="text-xs text-[#6B7280]">
                  Choisis ce qui est important pour toi. Tu pourras modifier ça plus tard.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { id: 'job_etudiant' as EmploymentGoal, label: 'Trouver un job étudiant', desc: 'Contrats compatibles et suivi d&apos;heures' },
                { id: 'caf' as EmploymentGoal, label: 'Aide au logement CAF', desc: 'Demande APL dès signature du bail' },
                { id: 'assurance_maladie' as EmploymentGoal, label: 'Sécurité Sociale', desc: 'Affiliation Ameli et Carte Vitale' },
                { id: 'comprendre_titre' as EmploymentGoal, label: 'Renouvellement titre', desc: 'Dépôt ANEF 2 à 4 mois avant' },
                { id: 'alternance' as EmploymentGoal, label: 'Alternance', desc: 'Règles APT et démarches employeur' },
                { id: 'cdi' as EmploymentGoal, label: 'Après le diplôme', desc: 'Changement de statut salarié' },
              ].map(item => {
                const isSelected = goals.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleGoal(item.id)}
                    className={`p-3 rounded-2xl border text-left transition flex items-start justify-between ${
                      isSelected
                        ? 'border-[#0045F9] bg-[#EBF0FF] text-[#17181C]'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-[#17181C]">{item.label}</div>
                      <div className="text-[10px] text-[#6B7280]">{item.desc}</div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-[#0045F9] flex-shrink-0 ml-1.5 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Boutons de navigation */}
        <div className="pt-6 border-t border-gray-100 flex items-center justify-between mt-auto">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-[#6B7280] hover:bg-gray-100 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour</span>
            </button>
          ) : <div />}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0045F9] hover:bg-[#0036C8] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition active:scale-95"
            >
              <span>Continuer</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={isFinishing}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0038D1] to-[#0045F9] hover:from-[#002699] hover:to-[#0036C8] text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isFinishing ? 'Finalisation...' : 'Découvrir eStudyFlow'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
