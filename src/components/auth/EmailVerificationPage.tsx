import React, { useState } from 'react';
import { Mail, RefreshCw, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { sendEmailVerification } from 'firebase/auth';
import { useAuth } from '../../context/AuthContext';
import { AppLogo } from '../common/AppLogo';

export const EmailVerificationPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleResendEmail = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      if (user) {
        await sendEmailVerification(user);
        setMessage({ type: 'success', text: 'Email de vérification envoyé avec succès !' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erreur lors de l&apos;envoi de l&apos;email.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#EBF0FF] text-[#0045F9] mb-4">
            <Mail className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-[#17181C] mb-2">Vérifie ton email</h1>
          <p className="text-sm text-[#6B7280]">
            Nous avons envoyé un lien de vérification à <span className="font-semibold text-[#17181C]">{user?.email}</span>
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 mb-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
              <CheckCircle2 className="w-5 h-5 text-[#22A06B] flex-shrink-0 mt-0.5" />
              <div className="text-sm text-[#17181C]">
                <p className="font-semibold mb-1">Ouvre ta boîte de réception</p>
                <p className="text-[#6B7280]">Le lien de vérification arrive en quelques secondes.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-[#17181C]">
                <p className="font-semibold mb-1">Vérifie tes spams</p>
                <p className="text-[#6B7280]">Si tu ne vois pas l&apos;email, vérifie le dossier spam ou courrier indésirable.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-purple-50 border border-purple-100">
              <AppLogo size="xs" className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-[#17181C]">
                <p className="font-semibold mb-1">Clique sur le lien</p>
                <p className="text-[#6B7280]">Une fois cliqué, reviens ici et clique sur "J&apos;ai vérifié mon email".</p>
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-4 rounded-xl text-sm ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleResendEmail}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#0045F9] hover:bg-[#0036C8] text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Envoi en cours...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Renvoyer l&apos;email</span>
              </>
            )}
          </button>

          <button
            onClick={handleCheckVerification}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-gray-50 text-[#17181C] text-sm font-semibold border border-gray-200 transition"
          >
            J&apos;ai vérifié mon email
          </button>

          <button
            onClick={logout}
            className="w-full py-3 px-4 rounded-xl text-[#6B7280] text-sm font-medium hover:text-[#17181C] transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </button>
        </div>

        <p className="text-center text-xs text-[#6B7280] mt-6">
          Problème de vérification ? Contacte le support.
        </p>
      </div>
    </div>
  );
};
