import React, { useState } from 'react';
import { X, FileText, CheckCircle2, AlertTriangle, XCircle, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DocumentStatus } from '../../types';

interface DocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentsModal: React.FC<DocumentsModalProps> = ({ isOpen, onClose }) => {
  const { documents, updateDocumentStatus, addDocument } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const cycleStatus = async (docId: string, current: DocumentStatus) => {
    const next: DocumentStatus = 
      current === 'ready' ? 'expiring_soon' : 
      current === 'expiring_soon' ? 'missing' : 'ready';
    try {
      await updateDocumentStatus(docId, next);
      setError(null);
    } catch (cause) {
      console.error('Could not update document status:', cause);
      setError('Impossible de sauvegarder le statut du document.');
    }
  };

  const handleAddDocument = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!label.trim()) return;
    setSaving(true);
    try {
      await addDocument(label, expiryDate || undefined);
      setLabel('');
      setExpiryDate('');
      setShowForm(false);
      setError(null);
    } catch (cause) {
      console.error('Could not add document:', cause);
      setError('Impossible d’ajouter ce document.');
    } finally {
      setSaving(false);
    }
  };

  const readyCount = documents.filter(d => d.status === 'ready').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3.5 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-8 shadow-2xl relative my-auto max-h-[92dvh] overflow-y-auto ios-scroll animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-[#EBF0FF] text-[#0045F9] flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#17181C]">Mes documents</h2>
            <p className="text-xs text-[#6B7280]">
              {readyCount} sur {documents.length} documents prêts
            </p>
          </div>
        </div>

        <div className="my-3 rounded-2xl border border-gray-100 bg-[#F8F9FB] p-3 text-xs leading-relaxed text-[#6B7280]">
          Suis les statuts et échéances de tes documents. Les fichiers eux-mêmes ne sont pas téléversés ni stockés.
        </div>

        <button type="button" onClick={() => setShowForm(value => !value)} className="mb-3 inline-flex items-center gap-1.5 rounded-xl bg-[#0045F9] px-3 py-2 text-xs font-bold text-white">
          <Plus className="h-3.5 w-3.5" />
          Ajouter un document
        </button>
        {showForm && (
          <form onSubmit={handleAddDocument} className="mb-3 space-y-2 rounded-2xl border border-gray-100 p-3">
            <label className="block text-xs font-bold">Nom du document
              <input required maxLength={100} value={label} onChange={event => setLabel(event.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 font-normal" />
            </label>
            <label className="block text-xs font-bold">Date d’expiration (facultative)
              <input type="date" value={expiryDate} onChange={event => setExpiryDate(event.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 font-normal" />
            </label>
            <button disabled={saving} className="rounded-xl bg-[#0045F9] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </form>
        )}
        {error && <p role="alert" className="mb-3 text-xs text-red-700">{error}</p>}

        {/* Documents List */}
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {documents.length === 0 ? (
            <p className="rounded-2xl bg-[#F8F9FB] p-5 text-center text-xs text-[#6B7280]">
              Tu n’as pas encore ajouté de document à suivre.
            </p>
          ) : documents.map((doc) => {
            return (
              <div
                key={doc.id}
                className="p-3.5 rounded-2xl border border-gray-100 bg-white shadow-2xs flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <h4 className="font-bold text-[#17181C]">{doc.label}</h4>
                  {doc.expiryDate && (
                    <p className="text-[11px] text-[#6B7280]">Expire le : {doc.expiryDate}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => cycleStatus(doc.id, doc.status)}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition text-xs ${
                    doc.status === 'ready'
                      ? 'bg-green-100 text-[#22A06B] hover:bg-green-200'
                      : doc.status === 'expiring_soon'
                      ? 'bg-amber-100 text-[#F59E0B] hover:bg-amber-200'
                      : 'bg-red-100 text-[#E5484D] hover:bg-red-200'
                  }`}
                  title="Changer le statut"
                >
                  {doc.status === 'ready' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {doc.status === 'expiring_soon' && <AlertTriangle className="w-3.5 h-3.5" />}
                  {doc.status === 'missing' && <XCircle className="w-3.5 h-3.5" />}
                  <span>
                    {doc.status === 'ready' ? 'Prêt' : doc.status === 'expiring_soon' ? 'Bientôt expiré' : 'Manquant'}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
          <span className="text-[11px] text-[#6B7280]">Les statuts sont sauvegardés dans ton compte.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#17181C] font-semibold"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
