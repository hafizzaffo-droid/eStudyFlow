import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  ExternalLink, 
  FileText, 
  Plus, 
  ChevronRight, 
  ChevronLeft,
  MoreHorizontal,
  Calendar,
  Building,
  Home,
  GraduationCap,
  Globe2,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { UserTask, TaskCategory, TaskStatus } from '../../types';

interface TasksTabProps {
  onOpenCalendar?: () => void;
  onOpenDocuments?: () => void;
}

export const TasksTab: React.FC<TasksTabProps> = ({ onOpenCalendar, onOpenDocuments }) => {
  const { tasks, toggleTaskStatus, updateTaskSteps, addTask, profile } = useAuth();
  
  // Detail view state: if non-null, shows Screen 3
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<UserTask | null>(null);

  // Status Filter for Screen 2: 'todo' | 'in_progress' | 'completed'
  const [statusFilter, setStatusFilter] = useState<'todo' | 'in_progress' | 'completed'>('todo');

  // Add custom task modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TaskCategory>('on_arrival');
  const [newDescription, setNewDescription] = useState('');
  const [newWhen, setNewWhen] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Calculate totals
  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasksCount = tasks.filter(t => t.status === 'in_progress').length;
  const todoTasksCount = tasks.filter(t => t.status === 'todo').length;
  const totalTasksCount = tasks.length;
  const remainingCount = totalTasksCount - completedTasksCount;

  // Filter tasks based on statusFilter
  const filteredTasks = tasks.filter(task => {
    if (statusFilter === 'todo') return task.status === 'todo';
    if (statusFilter === 'in_progress') return task.status === 'in_progress';
    if (statusFilter === 'completed') return task.status === 'completed';
    return true;
  });

  // Group into categories for Screen 2: "Installation", "Études", "Séjour & Titre"
  const installationTasks = filteredTasks.filter(t => t.category === 'before_arrival' || t.category === 'on_arrival');
  const studyTasks = filteredTasks.filter(t => t.category === 'during_studies');
  const permitTasks = filteredTasks.filter(t => t.category === 'end_of_studies');
  const otherTasks = filteredTasks.filter(t => !['before_arrival', 'on_arrival', 'during_studies', 'end_of_studies'].includes(t.category));

  const handleToggle = async (taskId: string, currentStatus: TaskStatus) => {
    if (currentStatus !== 'completed') {
      try {
        confetti({
          particleCount: 55,
          spread: 70,
          origin: { y: 0.8 }
        });
      } catch (e) {
        // canvas ignore
      }
    }
    try {
      await toggleTaskStatus(taskId);
      setActionError(null);
    } catch (error) {
      console.error('Could not update task:', error);
      setActionError('Impossible de sauvegarder cette démarche.');
    }
  };

  const handleToggleStep = async (task: UserTask, stepKey: string) => {
    const currentSteps = task.completedSteps || [];
    const completedSteps = currentSteps.includes(stepKey)
      ? currentSteps.filter(key => key !== stepKey)
      : [...currentSteps, stepKey];
    try {
      await updateTaskSteps(task.id, completedSteps);
      setActionError(null);
    } catch (error) {
      console.error('Could not update task steps:', error);
      setActionError('Impossible de sauvegarder la progression des étapes.');
    }
  };

  const handleCreateCustomTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await addTask({
      title: newTitle.trim(),
      category: newCategory,
      shortDescription: newDescription.trim(),
      whyImportant: 'Démarche ajoutée par toi.',
      whenToDo: newWhen.trim(),
      requiredDocuments: [],
      officialLink: '',
      officialSource: '',
      status: 'todo',
      });
      setActionError(null);
    } catch (error) {
      console.error('Could not add task:', error);
      setActionError('Impossible d’ajouter cette démarche.');
      return;
    }

    setNewTitle('');
    setNewDescription('');
    setNewWhen('');
    setShowAddModal(false);
  };

  // Helper for task icon and box color
  const getTaskIcon = (task: UserTask) => {
    const t = task.title.toLowerCase();
    if (t.includes('vls-ts') || t.includes('visa') || t.includes('titre') || t.includes('renouvellement')) {
      return {
        icon: <FileText className="w-5 h-5 text-red-500" />,
        bg: 'bg-red-50'
      };
    }
    if (t.includes('banque') || t.includes('compte')) {
      return {
        icon: <Building className="w-5 h-5 text-[#0045F9]" />,
        bg: 'bg-[#EBF0FF]'
      };
    }
    if (t.includes('logement') || t.includes('assurance')) {
      return {
        icon: <Home className="w-5 h-5 text-red-500" />,
        bg: 'bg-red-50'
      };
    }
    if (t.includes('université') || t.includes('inscription') || t.includes('cours')) {
      return {
        icon: <GraduationCap className="w-5 h-5 text-emerald-600" />,
        bg: 'bg-emerald-50'
      };
    }
    return {
      icon: <FileText className="w-5 h-5 text-[#0045F9]" />,
      bg: 'bg-[#EBF0FF]'
    };
  };

  // Default steps for the task detail view
  const getTaskSteps = (task: UserTask) => {
    const t = task.title.toLowerCase();
    if (t.includes('vls-ts') || t.includes('validation')) {
      return [
        { key: 'step-1', label: 'Créer ton compte en ligne sur l’ANEF' },
        { key: 'step-2', label: 'Saisir ta date d’arrivée en France' },
        { key: 'step-3', label: 'Payer la taxe de séjour (timbre fiscal)' },
        { key: 'step-4', label: 'Télécharger la confirmation de validation' }
      ];
    }
    if (t.includes('banque')) {
      return [
        { key: 'step-1', label: 'Choisir une banque partenaire ou en ligne' },
        { key: 'step-2', label: 'Transmettre ton passeport et attestation de scolarité' },
        { key: 'step-3', label: 'Signer la convention d’ouverture' },
        { key: 'step-4', label: 'Récupérer ton RIB pour la CAF et le salaire' }
      ];
    }
    if (t.includes('logement') || t.includes('assurance')) {
      return [
        { key: 'step-1', label: 'Vérifier les garanties de responsabilité civile' },
        { key: 'step-2', label: 'Souscrire en ligne auprès d’un assureur' },
        { key: 'step-3', label: 'Transmettre l’attestation au propriétaire ou CROUS' }
      ];
    }
    if (t.includes('université') || t.includes('inscription')) {
      return [
        { key: 'step-1', label: 'Régler la CVEC sur messervices.etudiant.gouv.fr' },
        { key: 'step-2', label: 'Finaliser l’inscription administrative en ligne' },
        { key: 'step-3', label: 'Récupérer le certificat de scolarité et la carte étudiante' }
      ];
    }
    return [
      { key: 'step-1', label: 'Rassembler les pièces justificatives' },
      { key: 'step-2', label: 'Déposer la demande sur la plateforme officielle' },
      { key: 'step-3', label: 'Suivre l’état d’avancement jusqu’à confirmation' }
    ];
  };

  // =========================================================================
  // SCREEN 3: DÉTAIL DÉMARCHE (e.g. "Valider mon VLS-TS")
  // =========================================================================
  if (selectedTaskDetail) {
    const currentTask = tasks.find(t => t.id === selectedTaskDetail.id) || selectedTaskDetail;
    const isCompleted = currentTask.status === 'completed';
    const steps = getTaskSteps(currentTask);
    const requiredDocs = currentTask.requiredDocuments && currentTask.requiredDocuments.length > 0 
      ? currentTask.requiredDocuments 
      : ['Passeport en cours de validité', 'Visa VLS-TS', 'Justificatif de domicile en France'];

    return (
      <div className="space-y-4 pb-28 animate-in fade-in duration-200 max-w-lg mx-auto">
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setSelectedTaskDetail(null)}
            className="flex items-center gap-1.5 text-xs font-bold text-[#0045F9] hover:underline cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Mes démarches</span>
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition cursor-pointer"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-30 animate-in fade-in text-xs">
                <button
                  onClick={() => {
                    void handleToggle(currentTask.id, currentTask.status);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-gray-50 font-semibold text-[#17181C]"
                >
                  {isCompleted ? 'Marquer comme à faire' : 'Marquer comme terminée'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17181C] tracking-tight break-words">
          {currentTask.title}
        </h1>
        {actionError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{actionError}</p>}

        {currentTask.shortDescription && (
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs">
            <h2 className="text-sm font-extrabold text-[#17181C] mb-2">En bref</h2>
            <p className="text-xs text-[#6B7280] leading-relaxed whitespace-pre-wrap break-words">
              {currentTask.shortDescription}
            </p>
          </div>
        )}

        {(currentTask.whenToDo || currentTask.dueDate) && (
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs">
            <h2 className="text-sm font-extrabold text-[#17181C] mb-2">Quand faire cette démarche</h2>
            {currentTask.whenToDo && (
              <p className="text-xs text-[#6B7280] leading-relaxed whitespace-pre-wrap break-words">
                {currentTask.whenToDo}
              </p>
            )}
            {currentTask.dueDate && (
              <p className="mt-2 text-xs font-semibold text-[#17181C]">
                Échéance : {currentTask.dueDate}
              </p>
            )}
          </div>
        )}

        {/* Card: Pourquoi pour toi */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#EBF0FF] text-[#0045F9] flex items-center justify-center shrink-0">
                <Globe2 className="w-4 h-4" />
              </div>
              <span className="text-sm font-extrabold text-[#17181C]">
                Pourquoi pour toi
              </span>
            </div>

            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
              isCompleted
                ? 'bg-emerald-50 text-emerald-700'
                : currentTask.status === 'in_progress'
                ? 'bg-blue-50 text-[#0045F9]'
                : 'bg-amber-50 text-amber-700'
            }`}>
              <Clock className="w-3 h-3" />
              {isCompleted ? 'Terminée' : currentTask.status === 'in_progress' ? 'En cours' : 'À faire'}
            </span>
          </div>

          <p className="text-xs text-[#6B7280] leading-relaxed whitespace-pre-wrap break-words">
            {currentTask.whyImportant || `Tu as un profil ${profile?.nationality || 'étudiant'} avec un visa ${profile?.visaType || 'étudiant'} : cette formalité est requise après ton arrivée en France.`}
          </p>
          {currentTask.officialSource && (
            <p className="mt-2 text-[11px] font-semibold text-[#6B7280] break-words">
              Source : {currentTask.officialSource}
            </p>
          )}
        </div>

        {/* Section: Étapes à suivre */}
        <div>
          <h2 className="text-sm font-extrabold text-[#17181C] mb-2.5">
            Étapes à suivre
          </h2>
          <div className="space-y-2">
            {steps.map((st) => {
              const isChecked = currentTask.completedSteps?.includes(st.key) || isCompleted;
              return (
                <div
                  key={st.key}
                  onClick={() => void handleToggleStep(currentTask, st.key)}
                  className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-xs flex items-center justify-between gap-3 cursor-pointer hover:border-gray-200 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition ${
                      isChecked
                        ? 'bg-[#0045F9] border-[#0045F9] text-white'
                        : 'border-gray-300 bg-white'
                    }`}>
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className={`min-w-0 flex-1 text-xs font-semibold whitespace-normal break-words ${
                      isChecked ? 'line-through text-gray-400' : 'text-[#17181C]'
                    }`}>
                      {st.label}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Section: Documents nécessaires */}
        <div>
          <h2 className="text-sm font-extrabold text-[#17181C] mb-2.5">
            Documents nécessaires
          </h2>
          <div className="space-y-2">
            {requiredDocs.map((doc, idx) => (
              <div
                key={idx}
                onClick={onOpenDocuments}
                className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-xs flex items-center justify-between gap-3 cursor-pointer hover:border-gray-200 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#EBF0FF] text-[#0045F9] flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="min-w-0 flex-1 text-xs font-bold text-[#17181C] whitespace-normal break-words">
                    {doc}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="pt-2 space-y-2.5">
          <button
            onClick={() => void handleToggle(currentTask.id, currentTask.status)}
            className={`w-full py-3.5 px-4 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${
              isCompleted
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-[#0045F9] hover:bg-[#0036C8] text-white shadow-blue-500/20 active:scale-[0.99]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isCompleted ? 'Marquer comme à faire' : 'Marquer comme terminée'}</span>
          </button>

          {currentTask.officialLink && (
            <a
              href={currentTask.officialLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-2xl bg-[#EBF0FF] text-[#0045F9] hover:bg-blue-100 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Consulter la source officielle</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // SCREEN 2: MES DÉMARCHES (LIST VIEW)
  // =========================================================================
  const circleCircumference = 2 * Math.PI * 30; // r = 30
  const progressRatio = totalTasksCount > 0 ? completedTasksCount / totalTasksCount : 0;
  const circleOffset = circleCircumference - (circleCircumference * progressRatio);

  const renderTaskCard = (task: UserTask) => {
    const isCompleted = task.status === 'completed';
    const isInProgress = task.status === 'in_progress';
    const { icon, bg } = getTaskIcon(task);

    return (
      <div
        key={task.id}
        onClick={() => setSelectedTaskDetail(task)}
        className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-xs flex items-center justify-between gap-3 cursor-pointer hover:border-gray-200 transition active:scale-[0.99]"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`w-10 h-10 rounded-2xl ${bg} flex items-center justify-center shrink-0`}>
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={`text-xs sm:text-sm font-bold truncate ${
              isCompleted ? 'line-through text-[#6B7280]' : 'text-[#17181C]'
            }`}>
              {task.title}
            </h3>
            {task.isUrgent && !isCompleted ? (
              <span className="text-[11px] font-bold text-[#E5484D] block mt-0.5">
                À traiter en priorité
              </span>
            ) : task.whenToDo ? (
              <span className="text-[11px] text-[#6B7280] truncate block mt-0.5">
                {task.whenToDo}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isCompleted
              ? 'bg-emerald-50 text-emerald-700'
              : isInProgress
              ? 'bg-blue-50 text-[#0045F9]'
              : 'bg-red-50 text-[#E5484D]'
          }`}>
            {isCompleted ? 'Terminée' : isInProgress ? 'En cours' : 'À faire'}
          </span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200 max-w-lg mx-auto">
      {actionError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{actionError}</p>}
      
      {/* Title */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17181C] tracking-tight">
            Mes démarches
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
            Avance étape par étape.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#17181C] transition cursor-pointer"
          title="Ajouter une démarche"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Card */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs">
        <div className="flex items-center gap-5">
          {/* Ring */}
          <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 76 76">
              <circle cx="38" cy="38" r="30" stroke="#E5E7EB" strokeWidth="6" fill="none" />
              <circle
                cx="38"
                cy="38"
                r="30"
                stroke="#0045F9"
                strokeWidth="6"
                strokeDasharray={circleCircumference}
                strokeDashoffset={circleOffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-sm font-extrabold text-[#17181C] leading-none">
                {completedTasksCount} sur {totalTasksCount}
              </span>
              <span className="text-[9px] text-[#6B7280] mt-0.5">terminées</span>
            </div>
          </div>

          {/* Right Info */}
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-[#17181C] text-sm sm:text-base leading-snug">
              {totalTasksCount === 0
                ? 'Aucune démarche personnalisée pour le moment.'
                : remainingCount > 0
                ? `Encore ${remainingCount} démarches à terminer.`
                : 'Toutes les démarches sont terminées.'}
            </div>
            <p className="text-xs text-[#6B7280] mt-1">
              {totalTasksCount === 0 ? 'Complète ton profil ou ajoute une démarche.' : 'La progression reflète tes démarches enregistrées.'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs (Pills) */}
      <div className="flex items-center gap-2">
        {(['todo', 'in_progress', 'completed'] as const).map(tabKey => {
          const isActive = statusFilter === tabKey;
          const label = tabKey === 'todo' ? 'À faire' : tabKey === 'in_progress' ? 'En cours' : 'Terminées';
          return (
            <button
              key={tabKey}
              onClick={() => setStatusFilter(tabKey)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer text-center ${
                isActive
                  ? 'bg-[#EBF0FF] text-[#0045F9] shadow-xs'
                  : 'bg-white text-[#6B7280] hover:bg-gray-50 border border-gray-100'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Categorized Tasks Sections */}
      <div className="space-y-4">
        {installationTasks.length > 0 && (
          <div>
            <h2 className="text-xs font-bold text-[#6B7280] mb-2 px-1">
              Installation
            </h2>
            <div className="space-y-2">
              {installationTasks.map(renderTaskCard)}
            </div>
          </div>
        )}

        {studyTasks.length > 0 && (
          <div>
            <h2 className="text-xs font-bold text-[#6B7280] mb-2 px-1">
              Études
            </h2>
            <div className="space-y-2">
              {studyTasks.map(renderTaskCard)}
            </div>
          </div>
        )}

        {permitTasks.length > 0 && (
          <div>
            <h2 className="text-xs font-bold text-[#6B7280] mb-2 px-1">
              Séjour & Titre
            </h2>
            <div className="space-y-2">
              {permitTasks.map(renderTaskCard)}
            </div>
          </div>
        )}

        {otherTasks.length > 0 && (
          <div>
            <h2 className="text-xs font-bold text-[#6B7280] mb-2 px-1">
              Autres démarches
            </h2>
            <div className="space-y-2">
              {otherTasks.map(renderTaskCard)}
            </div>
          </div>
        )}

        {filteredTasks.length === 0 && (
          <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-xs">
            <CheckCircle2 className="w-10 h-10 text-[#0045F9] mx-auto mb-2" />
            <h3 className="text-sm font-bold text-[#17181C]">Aucune démarche ici</h3>
            <p className="text-xs text-[#6B7280] mt-1">
              {tasks.length === 0 ? 'Complète ton profil pour générer ton parcours.' : 'Aucune démarche ne correspond à ce filtre actuellement.'}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Quick Action Shortcuts */}
      <div className="grid grid-cols-2 gap-2.5 pt-2">
        <button
          onClick={onOpenCalendar}
          className="p-3.5 rounded-2xl bg-white border border-gray-100 shadow-xs flex items-center justify-center gap-2 text-xs font-bold text-[#17181C] hover:bg-gray-50 transition cursor-pointer"
        >
          <Calendar className="w-4 h-4 text-[#0045F9]" />
          <span>Calendrier</span>
        </button>

        <button
          onClick={onOpenDocuments}
          className="p-3.5 rounded-2xl bg-white border border-gray-100 shadow-xs flex items-center justify-center gap-2 text-xs font-bold text-[#17181C] hover:bg-gray-50 transition cursor-pointer"
        >
          <FileText className="w-4 h-4 text-[#0045F9]" />
          <span>Documents</span>
        </button>
      </div>

      {/* Modal: Add custom task */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-[#17181C]">Nouvelle démarche</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomTask} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#17181C] mb-1">Titre</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Ex: Demander mon attestation CAF"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-[#0045F9]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#17181C] mb-1">Catégorie</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as TaskCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-[#0045F9]"
                >
                  <option value="on_arrival">Installation / À l'arrivée</option>
                  <option value="during_studies">Études</option>
                  <option value="end_of_studies">Séjour & Titre</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#17181C] mb-1">Délai / Échéance</label>
                <input
                  type="text"
                  value={newWhen}
                  onChange={e => setNewWhen(e.target.value)}
                  placeholder="Ex: avant le 30 novembre"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-[#0045F9]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0045F9] text-white text-xs font-bold hover:bg-[#0036C8]"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
