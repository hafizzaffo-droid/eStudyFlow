import React, { useState } from 'react';
import { 
  X, 
  User, 
  Globe2, 
  MapPin, 
  GraduationCap, 
  Calendar, 
  ShieldCheck, 
  LogOut, 
  Edit3, 
  Check,
  Pencil,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { FRENCH_CITIES, COUNTRIES } from '../../data/referenceData';
import { StudyLevel, StudentStatus, VisaType } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, updateProfile, logout, exportAccountData, deleteAccount, submitFeedback } = useAuth();
  const { language, setLanguage, languageError } = useLanguage();
  const photoInputRef = React.useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [idea, setIdea] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [feedbackState, setFeedbackState] = useState<string | null>(null);
  const [feedbackSaving, setFeedbackSaving] = useState(false);
  const [confirmDeletion, setConfirmDeletion] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState(profile?.displayName || '');
  const [editNationality, setEditNationality] = useState(profile?.nationality || '');
  const [editCity, setEditCity] = useState(profile?.city || '');
  const [editSchool, setEditSchool] = useState(profile?.school || '');
  const [editExpiry, setEditExpiry] = useState(profile?.permitExpiryDate || '');
  const [editVisa, setEditVisa] = useState<VisaType>(profile?.visaType || 'Je ne sais pas');
  const [editStatus, setEditStatus] = useState<StudentStatus>(profile?.studentStatus || 'other');
  const [editStudyLevel, setEditStudyLevel] = useState<StudyLevel>(profile?.studyLevel || 'Autre');
  const [editStudyField, setEditStudyField] = useState(profile?.studyField || '');

  if (!isOpen || !profile) return null;

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError('Choisis une image au format JPG, PNG ou WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('La photo doit faire 5 Mo maximum.');
      return;
    }

    setPhotoSaving(true);
    setPhotoError(null);
    try {
      const photoDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('photo_read_failed'));
        reader.onload = () => {
          const image = new Image();
          image.onerror = () => reject(new Error('photo_decode_failed'));
          image.onload = () => {
            const canvas = document.createElement('canvas');
            const maxDimension = 320;
            const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
            canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
            canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
            const context = canvas.getContext('2d');
            if (!context) {
              reject(new Error('photo_canvas_unavailable'));
              return;
            }
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.78));
          };
          image.src = String(reader.result);
        };
        reader.readAsDataURL(file);
      });

      if (photoDataUrl.length > 350_000) {
        throw new Error('photo_too_large_after_compression');
      }
      await updateProfile({ photoURL: photoDataUrl });
    } catch (error) {
      console.error('Could not save profile photo:', error);
      setPhotoError('Impossible d’enregistrer la photo. Choisis une autre image et réessaie.');
    } finally {
      setPhotoSaving(false);
    }
  };

  const handleRemovePhoto = async () => {
    setPhotoSaving(true);
    setPhotoError(null);
    try {
      await updateProfile({ photoURL: '' });
    } catch (error) {
      console.error('Could not remove profile photo:', error);
      setPhotoError('Impossible de retirer la photo. Réessaie.');
    } finally {
      setPhotoSaving(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    const matchedCountry = COUNTRIES.find(c => c.name === editNationality);
    setSaving(true);
    setSaveError(null);
    try {
      await updateProfile({
        displayName: editName.trim(),
        nationality: editNationality,
        nationalityCode: matchedCountry?.code || profile.nationalityCode,
        flag: matchedCountry?.flag || profile.flag,
        annualWorkHoursLimit: editNationality === 'Algérie' ? 822.5 : matchedCountry?.isEU ? 0 : 964,
        city: editCity,
        school: editSchool.trim(),
        permitExpiryDate: editExpiry,
        visaType: editVisa,
        studentStatus: editStatus,
        studyLevel: editStudyLevel,
        studyField: editStudyField.trim(),
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Could not save profile:', error);
      setSaveError('Impossible d’enregistrer le profil. Vérifie ta connexion puis réessaie.');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const data = await exportAccountData();
      const file = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'estudyflow-export.json';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
      console.error('Could not export account data:', error);
      setExportError('Impossible de préparer l’export. Vérifie ta connexion puis réessaie.');
    } finally {
      setExporting(false);
    }
  };

  const handleFeedback = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedbackSaving(true);
    setFeedbackState(null);
    try {
      await submitFeedback(idea);
      setIdea('');
      setFeedbackState('Merci, ton idée a été enregistrée.');
    } catch (error) {
      console.error('Could not submit feedback:', error);
      setFeedbackState('Impossible d’enregistrer ton idée. Réessaie.');
    } finally {
      setFeedbackSaving(false);
    }
  };

  const handleDeleteAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount(deletePassword);
      onClose();
    } catch (error) {
      console.error('Could not delete account:', error);
      setDeleteError('Suppression impossible. Vérifie ton mot de passe, puis réessaie.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3.5 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-8 shadow-2xl relative my-auto max-h-[92dvh] overflow-y-auto ios-scroll animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="relative h-14 w-14 shrink-0">
            <div className="h-full w-full overflow-hidden rounded-2xl border border-blue-200 bg-[#EBF0FF] text-xl font-black text-[#0045F9] shadow-xs flex items-center justify-center">
              {profile.photoURL ? (
                <img src={profile.photoURL} alt="Photo de profil" className="h-full w-full object-cover" />
              ) : (
                profile.flag || '🇫🇷'
              )}
            </div>
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={photoSaving}
              aria-label={profile.photoURL ? 'Modifier la photo de profil' : 'Ajouter une photo de profil'}
              title={profile.photoURL ? 'Modifier la photo' : 'Ajouter une photo'}
              className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#0045F9] text-white shadow-sm transition hover:bg-[#0036C8] disabled:opacity-60"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={event => void handlePhotoChange(event)}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#17181C]">
                {profile.displayName || 'Mon Profil Étudiant'}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#EBF0FF] text-[#0045F9] text-[10px] font-bold">
                {profile.nationality}
              </span>
            </div>
            <p className="text-xs text-[#6B7280]">@{profile.username || 'utilisateur'}</p>
            {photoSaving && <p role="status" className="text-[11px] text-[#6B7280]">Enregistrement de la photo…</p>}
            {profile.photoURL && (
              <button
                type="button"
                onClick={() => void handleRemovePhoto()}
                disabled={photoSaving}
                className="mt-1 text-[11px] font-medium text-[#0045F9] hover:underline disabled:opacity-50"
              >
                Retirer la photo
              </button>
            )}
          </div>
        </div>
        {photoError && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{photoError}</p>}

        <section className="mb-5 rounded-2xl border border-gray-100 bg-[#F8F9FB] p-3.5">
          <h3 className="mb-2 text-xs font-bold text-[#17181C]">Langue de l’application</h3>
          <div className="flex gap-2">
            {(['fr', 'en'] as const).map(option => (
              <button
                key={option}
                type="button"
                aria-pressed={language === option}
                onClick={() => void setLanguage(option)}
                className={`min-h-10 flex-1 rounded-xl border px-3 text-xs font-bold transition ${
                  language === option
                    ? 'border-[#0045F9] bg-[#EBF0FF] text-[#0045F9]'
                    : 'border-gray-200 bg-white text-[#6B7280] hover:bg-gray-50'
                }`}
              >
                {option === 'fr' ? '🇫🇷 Français' : '🇬🇧 English'}
              </button>
            ))}
          </div>
          {languageError && <p role="alert" className="mt-2 text-xs text-red-700">{languageError}</p>}
        </section>

        {/* Info Grid */}
        {!isEditing ? (
          <div className="space-y-3 mb-6">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-[#F8F9FB] rounded-2xl border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Nationalité</span>
                <span className="font-bold text-[#17181C] flex items-center gap-1.5">
                  <span className="text-sm">{profile.flag}</span>
                  {profile.nationality}
                </span>
              </div>

              <div className="p-3 bg-[#F8F9FB] rounded-2xl border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Ville & Préfecture</span>
                <span className="font-bold text-[#17181C] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#0045F9]" />
                  {profile.city}
                </span>
              </div>

              <div className="p-3 bg-[#F8F9FB] rounded-2xl border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Titre / Visa</span>
                <span className="font-bold text-[#17181C] truncate block">
                  {profile.visaType}
                </span>
              </div>

              <div className="p-3 bg-[#F8F9FB] rounded-2xl border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Expiration titre</span>
                <span className="font-bold text-[#17181C] flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#0045F9]" />
                  {profile.permitExpiryDate}
                </span>
              </div>

              <div className="p-3 bg-[#F8F9FB] rounded-2xl border border-gray-100 col-span-2">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Formation & Établissement</span>
                <span className="font-bold text-[#17181C] flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-[#0045F9]" />
                  {profile.school} • {profile.studyLevel} ({profile.studyField})
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setEditName(profile.displayName || '');
                setEditNationality(profile.nationality);
                setEditCity(profile.city);
                setEditSchool(profile.school);
                setEditExpiry(profile.permitExpiryDate);
                setEditVisa(profile.visaType);
                setEditStatus(profile.studentStatus);
                setEditStudyLevel(profile.studyLevel);
                setEditStudyField(profile.studyField);
                setIsEditing(true);
              }}
              className="w-full py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-[#17181C] hover:bg-gray-50 transition flex items-center justify-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Modifier mes informations</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3 mb-6 text-xs">
            {saveError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">{saveError}</p>}
            <div>
              <label className="block font-bold text-[#17181C] mb-1">Nom / Prénom</label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-[#0045F9]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#17181C] mb-1">Pays d'origine & nationalité</label>
              <select
                value={editNationality}
                onChange={e => setEditNationality(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-[#0045F9]"
              >
                <option value="">Choisir un pays</option>
                {COUNTRIES.map(c => (
                  <option key={c.code + c.name} value={c.name}>
                    {c.flag} {c.name} ({c.continent})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-[#17181C] mb-1">Statut actuel</label>
              <select
                value={editStatus}
                onChange={e => setEditStatus(e.target.value as StudentStatus)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-[#0045F9]"
              >
                <option value="preparing">Préparation du départ</option>
                <option value="recent_arrival">Arrivée récente</option>
                <option value="already_student">Étudiant en France</option>
                <option value="renewal">Renouvellement du titre</option>
                <option value="finishing">Fin d’études</option>
                <option value="job_hunting">Recherche d’emploi</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-[#17181C] mb-1">Titre ou visa</label>
              <select
                value={editVisa}
                onChange={e => setEditVisa(e.target.value as VisaType)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-[#0045F9]"
              >
                <option>VLS-TS étudiant</option>
                <option>Carte de séjour étudiant</option>
                <option>Carte de séjour pluriannuelle</option>
                <option>Passeport européen / citoyen UE</option>
                <option>Autre</option>
                <option>Je ne sais pas</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-[#17181C] mb-1">Ville</label>
              <select
                value={editCity}
                onChange={e => setEditCity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-[#0045F9]"
              >
                <option value="">Choisir une ville</option>
                {FRENCH_CITIES.map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-[#17181C] mb-1">Établissement</label>
              <input
                type="text"
                value={editSchool}
                onChange={e => setEditSchool(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-[#0045F9]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#17181C] mb-1">Niveau d’études</label>
              <select
                value={editStudyLevel}
                onChange={e => setEditStudyLevel(e.target.value as StudyLevel)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-[#0045F9]"
              >
                <option>Licence</option>
                <option>Bachelor</option>
                <option>Master</option>
                <option>Doctorat</option>
                <option>Classe Prépa / BTS</option>
                <option>Autre</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-[#17181C] mb-1">Domaine d’études</label>
              <input
                type="text"
                value={editStudyField}
                onChange={e => setEditStudyField(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-[#0045F9]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#17181C] mb-1">Date d'expiration du titre</label>
              <input
                type="date"
                value={editExpiry}
                onChange={e => setEditExpiry(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-[#0045F9]"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2 rounded-xl border border-gray-200 font-bold text-gray-700"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2 rounded-xl bg-[#0045F9] text-white font-bold disabled:opacity-50"
              >
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          {user ? (
            <button
              type="button"
              onClick={async () => {
                await logout();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl border border-red-200 text-xs font-bold text-[#E5484D] hover:bg-red-50 transition flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Se déconnecter</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-[#0045F9] text-white text-xs font-bold shadow-xs hover:bg-[#0036C8] transition"
            >
              Fermer
            </button>
          )}
        </div>

        {user && (
          <div className="mt-5 space-y-4 border-t border-gray-100 pt-4">
            <section>
              <h3 className="mb-2 text-xs font-bold text-[#17181C]">Confidentialité</h3>
              <button type="button" onClick={() => void handleExport()} disabled={exporting} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-[#0045F9] disabled:opacity-50">
                {exporting ? 'Préparation…' : 'Télécharger mes données'}
              </button>
              <p className="mt-1 text-[10px] text-[#6B7280]">Export JSON des informations et suivis chargés depuis ton compte.</p>
              {exportError && <p role="alert" className="mt-1 text-xs text-red-700">{exportError}</p>}
            </section>

            <form onSubmit={handleFeedback} className="space-y-2">
              <label className="block text-xs font-bold text-[#17181C]">Une suggestion pour améliorer eStudyFlow ?
                <textarea
                  required
                  maxLength={2000}
                  rows={3}
                  value={idea}
                  onChange={event => setIdea(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-normal placeholder:text-gray-400"
                />
              </label>
              <button disabled={feedbackSaving} className="rounded-xl bg-[#0045F9] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
                {feedbackSaving ? 'Envoi…' : 'Envoyer mon idée'}
              </button>
              {feedbackState && <p role="status" className="text-xs text-[#6B7280]">{feedbackState}</p>}
            </form>

            <section className="border-t border-gray-100 pt-3">
              {!confirmDeletion ? (
                <button type="button" onClick={() => setConfirmDeletion(true)} className="text-xs font-bold text-red-600 hover:underline">
                  Supprimer mon compte et mes données
                </button>
              ) : (
                <form onSubmit={handleDeleteAccount} className="space-y-2">
                  <p className="text-xs text-red-700">
                    Cette action supprime définitivement ton compte et ses données.
                    {user.isAnonymous ? '' : ' Confirme avec ton mot de passe.'}
                  </p>
                  {!user.isAnonymous && (
                    <label className="block text-xs font-bold">Mot de passe
                      <input
                        required
                        type="password"
                        autoComplete="current-password"
                        value={deletePassword}
                        onChange={event => setDeletePassword(event.target.value)}
                        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 font-normal"
                      />
                    </label>
                  )}
                  {deleteError && <p role="alert" className="text-xs text-red-700">{deleteError}</p>}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setConfirmDeletion(false)} className="flex-1 rounded-xl border border-gray-200 py-2 text-xs font-bold">
                      Annuler
                    </button>
                    <button disabled={deleting} className="flex-1 rounded-xl bg-red-600 py-2 text-xs font-bold text-white disabled:opacity-50">
                      {deleting ? 'Suppression…' : 'Confirmer'}
                    </button>
                  </div>
                </form>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
