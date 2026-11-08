import React, { useEffect, useState } from 'react';
import { X, Lock, User, UserRoundPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { loginWithUsername, registerWithUsername, continueWithGoogleMvp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const normalizedUsername = username.normalize('NFKC').trim();
    if (!normalizedUsername || Array.from(normalizedUsername).length > 64 || /[\u0000-\u001F\u007F]/.test(normalizedUsername)) {
      setError('Saisis un nom d’utilisateur de 1 à 64 caractères.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (mode === 'register' && password !== confirmation) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        await registerWithUsername(normalizedUsername, password);
      } else {
        await loginWithUsername(normalizedUsername, password);
      }
      onClose();
    } catch (cause) {
      const code = (cause as { code?: string }).code;
      if (code === 'auth/email-already-in-use') {
        setError('Ce nom d’utilisateur est déjà utilisé.');
      } else if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        setError('Nom d’utilisateur ou mot de passe incorrect.');
      } else if (code === 'auth/weak-password') {
        setError('Choisis un mot de passe plus robuste.');
      } else if (code === 'auth/operation-not-allowed' || code === 'auth/admin-restricted-operation') {
        setError('Firebase refuse aussi l’accès invité. Active le fournisseur Anonymous dans Firebase Console.');
      } else if (code === 'auth/network-request-failed') {
        setError('Impossible de joindre Firebase. Vérifie que le téléphone et l’ordinateur sont sur le même Wi-Fi et que les émulateurs sont démarrés.');
      } else {
        console.error('Authentication failed:', cause);
        setError('La connexion a échoué. Vérifie la configuration Firebase et réessaie.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleMvp = async () => {
    setError(null);
    setLoading(true);
    try {
      await continueWithGoogleMvp();
      onClose();
    } catch (cause) {
      const code = (cause as { code?: string }).code;
      if (code === 'auth/operation-not-allowed') {
        setError('L’accès invité MVP n’est pas activé dans la configuration Firebase.');
      } else if (code === 'auth/network-request-failed') {
        setError('Impossible de joindre Firebase. Vérifie que le téléphone et l’ordinateur sont sur le même Wi-Fi et que les émulateurs sont démarrés.');
      } else {
        console.error('MVP guest sign-in failed:', cause);
        setError('Impossible d’ouvrir un compte invité. Vérifie ta connexion puis réessaie.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3.5 sm:p-4">
      <div className="relative my-auto w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl sm:p-8">
        <button onClick={onClose} aria-label="Fermer" className="absolute right-5 top-5 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-[#17181C]">
            {mode === 'register' ? 'Créer mon compte' : 'Connexion à eStudyFlow'}
          </h2>
          <p className="mt-1 text-xs text-[#6B7280]">
            Tes données sont sauvegardées dans ton compte.
          </p>
        </div>

        {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-xs font-semibold text-[#17181C]">
            Nom d’utilisateur
            <span className="relative mt-1 block">
              <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
              <input
                required
                autoComplete="username"
                maxLength={64}
                value={username}
                onChange={event => setUsername(event.target.value)}
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm focus:border-[#0045F9] focus:outline-hidden"
              />
            </span>
          </label>

          <label className="block text-xs font-semibold text-[#17181C]">
            Mot de passe
            <span className="relative mt-1 block">
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                value={password}
                onChange={event => setPassword(event.target.value)}
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm focus:border-[#0045F9] focus:outline-hidden"
              />
            </span>
          </label>

          {mode === 'register' && (
            <label className="block text-xs font-semibold text-[#17181C]">
              Confirmer le mot de passe
              <span className="relative mt-1 block">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={event => setConfirmation(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm focus:border-[#0045F9] focus:outline-hidden"
                />
              </span>
            </label>
          )}

          <p className="text-[11px] leading-relaxed text-amber-700">
            Mode MVP : si Firebase refuse la connexion par mot de passe, tu accèdes quand même en invité. Ton nom est conservé, mais le mot de passe n’est alors ni vérifié ni enregistré ; cette session ne pourra pas être récupérée après déconnexion.
          </p>
          <button type="submit" disabled={loading} className="mt-2 w-full rounded-xl bg-[#0045F9] px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#0036C8] disabled:opacity-50">
            {loading ? (mode === 'register' ? 'Création du compte...' : 'Connexion...') : mode === 'register' ? 'Créer mon compte' : 'Me connecter'}
          </button>
        </form>

        <div className="relative my-4 flex items-center">
          <div className="flex-1 border-t border-gray-200" />
          <span className="px-3 text-[11px] text-gray-400">ou</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>
        <button
          type="button"
          onClick={() => void handleGoogleMvp()}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-[#3C4043] transition hover:bg-gray-50 disabled:opacity-50"
        >
          <UserRoundPlus aria-hidden="true" className="h-5 w-5" />
          Continuer en invité
        </button>
        <p className="mt-2 text-center text-[10px] leading-relaxed text-[#6B7280]">
          Accès invité MVP, sans connexion Google. Les données restent liées à ce navigateur et ne sont pas récupérables après déconnexion.
        </p>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
            className="text-xs font-medium text-[#0045F9] hover:underline"
          >
            {mode === 'login' ? 'Créer un compte' : 'Déjà un compte ? Me connecter'}
          </button>
        </div>
      </div>
    </div>
  );
};
