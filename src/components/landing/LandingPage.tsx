import React from 'react';
import { ArrowRight, CheckCircle2, Globe2, ShieldCheck, Users, Target, BookOpen, Calendar, Bell } from 'lucide-react';
import { AppLogo } from '../common/AppLogo';
import { useLanguage } from '../../context/LanguageContext';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRegister }) => {
  const { language, setLanguage } = useLanguage();
  return (
    <div className="min-h-screen bg-[#F8F9FB] text-[#17181C]">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AppLogo size="sm" />
            <span className="text-lg font-bold text-[#17181C]">eStudyFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-gray-200 p-0.5" aria-label="App language">
              {(['fr', 'en'] as const).map(option => (
                <button
                  key={option}
                  type="button"
                  aria-label={option === 'fr' ? 'Français' : 'English'}
                  aria-pressed={language === option}
                  onClick={() => void setLanguage(option)}
                  className={`min-h-8 rounded-md px-2 text-[10px] font-bold transition ${
                    language === option ? 'bg-[#EBF0FF] text-[#0045F9]' : 'text-[#6B7280] hover:bg-gray-50'
                  }`}
                >
                  {option.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              onClick={onLogin}
              className="px-4 py-2 rounded-xl bg-[#0045F9] hover:bg-[#0036C8] text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/20 transition"
            >
              Se connecter
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-[clamp(1.25rem,7vw,3rem)] sm:text-4xl md:text-5xl font-extrabold text-[#17181C] mb-4 sm:mb-6 leading-tight">
            <span className="block whitespace-nowrap">Ton parcours étudiant</span>
            <span className="block whitespace-nowrap">en France, <span className="text-[#0045F9]">simplifié</span></span>
          </h1>
          
          <p className="text-base sm:text-lg text-[#6B7280] max-w-2xl mx-auto mb-8 sm:mb-10">
            Les bonnes démarches, au bon moment, selon ta situation.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={onRegister}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#0045F9] hover:bg-[#0036C8] text-white text-sm font-semibold shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2"
            >
              Créer mon compte
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onLogin}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-gray-50 text-[#17181C] text-sm font-semibold border border-gray-200 transition"
            >
              Se connecter
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#17181C] mb-10 sm:mb-12">
            Tout ce dont tu as besoin
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<ShieldCheck className="w-6 h-6" />}
              title="Titre de séjour & Visa"
              description="Échéances de renouvellement ANEF et suivi des démarches administratives dans ton espace"
            />
            <FeatureCard
              icon={<BookOpen className="w-6 h-6" />}
              title="CAF & Logement"
              description="Guide pour ton APL et toutes les démarches liées à ton logement"
            />
            <FeatureCard
              icon={<Globe2 className="w-6 h-6" />}
              title="Sécurité Sociale"
              description="Affiliation Ameli 100% gratuite et suivi de ta Carte Vitale"
            />
            <FeatureCard
              icon={<Target className="w-6 h-6" />}
              title="Travail étudiant"
              description="Suivi des 964h/an, contrats compatibles et autorisation de travail"
            />
            <FeatureCard
              icon={<Calendar className="w-6 h-6" />}
              title="Calendrier personnalisé"
              description="Toutes tes échéances administratives en un seul endroit"
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Assistant IA"
              description="eStudy AI répond à tes questions sur les démarches en France"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#17181C] mb-10 sm:mb-12">
            Comment ça marche ?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title="Crée ton compte"
              description="Crée un compte avec un nom d’utilisateur et un mot de passe"
            />
            <StepCard
              number="2"
              title="Renseigne ta situation"
              description="Saisis tes informations réelles pour obtenir un parcours adapté"
            />
            <StepCard
              number="3"
              title="Suis tes démarches"
              description="Retrouve tes échéances et complète tes tâches"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-[#0045F9] to-[#0036C8] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Prêt à simplifier ta vie étudiante en France ?
          </h2>
          <p className="text-blue-100 mb-8 text-base sm:text-lg">
            Crée ton compte et garde tes informations dans ton espace personnel
          </p>
          <button
            onClick={onRegister}
            className="px-8 py-3.5 rounded-xl bg-white hover:bg-gray-50 text-[#0045F9] text-sm font-semibold shadow-lg transition inline-flex items-center gap-2"
          >
            Commencer gratuitement
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <AppLogo size="xs" />
            <span className="text-sm font-semibold text-[#17181C]">eStudyFlow</span>
          </div>
          <div className="text-xs text-[#6B7280]">
            © 2026 eStudyFlow. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <div className="p-6 rounded-2xl bg-[#F8F9FB] border border-gray-100 hover:border-[#0045F9] hover:shadow-md transition group">
      <div className="w-12 h-12 rounded-xl bg-[#EBF0FF] text-[#0045F9] flex items-center justify-center mb-4 group-hover:bg-[#0045F9] group-hover:text-white transition">
        {icon}
      </div>
      <h3 className="text-base font-bold text-[#17181C] mb-2">{title}</h3>
      <p className="text-sm text-[#6B7280]">{description}</p>
    </div>
  );
};

interface StepCardProps {
  number: string;
  title: string;
  description: string;
}

const StepCard: React.FC<StepCardProps> = ({ number, title, description }) => {
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-[#EBF0FF] text-[#0045F9] flex items-center justify-center text-2xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-lg font-bold text-[#17181C] mb-2">{title}</h3>
      <p className="text-sm text-[#6B7280]">{description}</p>
    </div>
  );
};
