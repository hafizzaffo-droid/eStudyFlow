import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import {
  StudentProfile,
  UserTask,
  WorkLog,
  UserDocumentItem,
  AppNotification,
  JobApplication,
} from '../types';
import { generatePersonalizedTasks, WORK_HOURS_TASK_ID } from '../services/rulesEngine';
import { getStoredLanguage } from '../i18n';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: StudentProfile | null;
  tasks: UserTask[];
  workLogs: WorkLog[];
  documents: UserDocumentItem[];
  notifications: AppNotification[];
  applications: JobApplication[];
  isLoading: boolean;
  dataError: string | null;
  loginWithUsername: (username: string, pass: string) => Promise<void>;
  registerWithUsername: (username: string, pass: string) => Promise<void>;
  continueWithGoogleMvp: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updated: Partial<StudentProfile>) => Promise<void>;
  toggleTaskStatus: (taskId: string) => Promise<void>;
  updateTaskSteps: (taskId: string, completedSteps: string[]) => Promise<void>;
  addTask: (task: Omit<UserTask, 'id' | 'userId'>) => Promise<void>;
  addWorkLog: (log: Omit<WorkLog, 'id' | 'userId'>) => Promise<void>;
  deleteWorkLog: (logId: string) => Promise<void>;
  updateDocumentStatus: (docId: string, status: 'ready' | 'expiring_soon' | 'missing', expiryDate?: string) => Promise<void>;
  addDocument: (label: string, expiryDate?: string) => Promise<void>;
  markNotificationAsRead: (notifId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  toggleSavedJob: (jobId: string) => Promise<void>;
  markJobApplied: (jobId: string) => Promise<void>;
  exportAccountData: () => Promise<Record<string, unknown>>;
  deleteAccount: (password: string) => Promise<void>;
  submitFeedback: (message: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const normalizeUsername = (username: string) => username.normalize('NFKC').trim();

const authEmailForUsername = (username: string) => {
  const bytes = new TextEncoder().encode(normalizeUsername(username).toLocaleLowerCase('fr'));
  let firstHash = 0xcbf29ce484222325n;
  let secondHash = 0x84222325cbf29ce4n;
  for (const byte of bytes) {
    firstHash = BigInt.asUintN(64, (firstHash ^ BigInt(byte)) * 0x100000001b3n);
    secondHash = BigInt.asUintN(64, (secondHash ^ BigInt(byte)) * 0x100000001b3n);
  }
  const identifier = `${firstHash.toString(16).padStart(16, '0')}${secondHash.toString(16).padStart(16, '0')}`;
  return `u-${identifier}@accounts.estudyflow.invalid`;
};

const legacyAuthEmailForUsername = (username: string) =>
  `${normalizeUsername(username).toLowerCase()}@accounts.estudyflow.invalid`;

const canUseMvpGuestFallback = (error: unknown) =>
  Boolean(error && typeof error === 'object' && 'code' in error && [
    'auth/operation-not-allowed',
    'auth/admin-restricted-operation',
    'auth/invalid-credential',
    'auth/invalid-login-credentials',
    'auth/user-not-found',
    'auth/wrong-password',
    'auth/email-already-in-use',
    'auth/weak-password',
  ].includes(String(error.code)));

const createDefaultProfile = (
  currentUser: FirebaseUser,
  username: string,
  displayName = currentUser.isAnonymous ? 'Compte invité' : username,
): StudentProfile => ({
  userId: currentUser.uid,
  username,
  displayName,
  nationality: '',
  residenceCountry: '',
  city: '',
  arrivalDate: '',
  visaType: 'Je ne sais pas',
  permitExpiryDate: '',
  school: '',
  studyLevel: 'Autre',
  studyField: '',
  formationType: 'initiale',
  studyYear: '',
  employmentGoals: [],
  studentStatus: 'other',
  annualWorkHoursLimit: 964,
  languagePreference: getStoredLanguage(),
  onboardingCompleted: true,
});

const isProfileReady = (profile: StudentProfile) =>
  Boolean(profile.nationality && profile.city && profile.visaType !== 'Je ne sais pas');

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [documents, setDocuments] = useState<UserDocumentItem[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const listenersRef = useRef<Array<() => void>>([]);
  const authGenerationRef = useRef(0);
  const pendingRegistrationUsernameRef = useRef<string | null>(null);

  useEffect(() => {
    const clearListeners = () => {
      listenersRef.current.forEach(unsubscribe => unsubscribe());
      listenersRef.current = [];
    };

    const unsubscribeAuth = onAuthStateChanged(auth, async currentUser => {
      const generation = ++authGenerationRef.current;
      const isCurrentSession = () => authGenerationRef.current === generation;
      clearListeners();
      setUser(currentUser);
      setProfile(null);
      setTasks([]);
      setWorkLogs([]);
      setDocuments([]);
      setNotifications([]);
      setApplications([]);
      setDataError(null);
      setIsLoading(true);

      try {
        if (currentUser) {
          const profileRef = doc(db, 'users', currentUser.uid, 'profile', 'main');
          const snapshot = await getDoc(profileRef);
          if (!isCurrentSession()) return;

          let userProfile: StudentProfile;
          if (snapshot.exists()) {
            userProfile = snapshot.data() as StudentProfile;
          } else {
            const pendingUsername = pendingRegistrationUsernameRef.current;
            const username = pendingUsername
              || (currentUser.isAnonymous
                ? `invite-${currentUser.uid.slice(0, 8)}`
                : currentUser.displayName
                  || currentUser.email?.split('@')[0]
                  || currentUser.uid);
            userProfile = createDefaultProfile(
              currentUser,
              username,
              currentUser.isAnonymous && pendingUsername ? username : undefined,
            );
            await setDoc(profileRef, userProfile);
          }
          if (!isCurrentSession()) return;
          setProfile(userProfile);

          const userCollection = (name: string) => collection(db, 'users', currentUser.uid, name);
          const subscriptions = [
            onSnapshot(userCollection('tasks'), snapshot => {
              if (!isCurrentSession()) return;
              if (snapshot.empty && isProfileReady(userProfile)) {
                const generated = generatePersonalizedTasks(userProfile);
                setTasks(generated);
                void Promise.all(generated.map(task =>
                  setDoc(doc(db, 'users', currentUser.uid, 'tasks', task.id), task)
                )).catch(error => {
                  if (!isCurrentSession()) return;
                  console.error('Could not initialize user tasks:', error);
                  setDataError('Impossible d’enregistrer les démarches personnalisées.');
                });
              } else {
                const legacyHoursTask = snapshot.docs.find(item => item.id === WORK_HOURS_TASK_ID);
                if (legacyHoursTask) {
                  void deleteDoc(legacyHoursTask.ref).catch(error => {
                    console.error('Could not remove the work-hours task from démarches:', error);
                    setDataError('Impossible de déplacer le suivi des heures vers la section Emploi.');
                  });
                }
                setTasks(snapshot.docs
                  .filter(item => item.id !== WORK_HOURS_TASK_ID)
                  .map(item => ({ id: item.id, ...item.data() } as UserTask)));
              }
            }, error => {
              if (!isCurrentSession()) return;
              console.error('Tasks listener error:', error);
              setDataError('Impossible de charger les démarches enregistrées.');
            }),
            onSnapshot(userCollection('workLogs'), snapshot => {
              if (isCurrentSession()) {
                setWorkLogs(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as WorkLog)));
              }
            }, error => {
              if (!isCurrentSession()) return;
              console.error('Work logs listener error:', error);
              setDataError('Impossible de charger les heures de travail.');
            }),
            onSnapshot(userCollection('documents'), snapshot => {
              if (isCurrentSession()) {
                setDocuments(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as UserDocumentItem)));
              }
            }, error => {
              if (!isCurrentSession()) return;
              console.error('Documents listener error:', error);
              setDataError('Impossible de charger les documents.');
            }),
            onSnapshot(userCollection('notifications'), snapshot => {
              if (isCurrentSession()) {
                setNotifications(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as AppNotification)));
              }
            }, error => {
              if (!isCurrentSession()) return;
              console.error('Notifications listener error:', error);
              setDataError('Impossible de charger les notifications.');
            }),
            onSnapshot(userCollection('applications'), snapshot => {
              if (isCurrentSession()) {
                setApplications(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as JobApplication)));
              }
            }, error => {
              if (!isCurrentSession()) return;
              console.error('Applications listener error:', error);
              setDataError('Impossible de charger le suivi des candidatures.');
            }),
          ];
          listenersRef.current = subscriptions;
        }
      } catch (error) {
        if (isCurrentSession()) {
          console.error('Could not load account data:', error);
          setDataError('Impossible de charger les données du compte. Vérifie ta connexion et réessaie.');
        }
      } finally {
        if (isCurrentSession()) setIsLoading(false);
      }
    });

    return () => {
      authGenerationRef.current += 1;
      unsubscribeAuth();
      clearListeners();
    };
  }, []);

  const loginWithUsername = async (username: string, pass: string) => {
    const normalizedUsername = normalizeUsername(username);
    try {
      await signInWithEmailAndPassword(auth, authEmailForUsername(normalizedUsername), pass);
    } catch (error) {
      if (['auth/operation-not-allowed', 'auth/admin-restricted-operation'].includes(
        String((error as { code?: string }).code),
      )) {
        await continueAsMvpGuest(normalizedUsername);
        return;
      }
      const code = (error as { code?: string }).code;
      if (!canUseMvpGuestFallback(error)) throw error;
      if (!['auth/invalid-credential', 'auth/invalid-login-credentials', 'auth/user-not-found', 'auth/wrong-password'].includes(code || '')) {
        await continueAsMvpGuest(normalizedUsername);
        return;
      }
      try {
        await signInWithEmailAndPassword(auth, legacyAuthEmailForUsername(normalizedUsername), pass);
      } catch (legacyError) {
        if (!canUseMvpGuestFallback(legacyError)) throw legacyError;
        await continueAsMvpGuest(normalizedUsername);
      }
    }
  };

  const registerWithUsername = async (username: string, pass: string) => {
    const normalizedUsername = normalizeUsername(username);
    pendingRegistrationUsernameRef.current = normalizedUsername;
    try {
      let credential;
      try {
        credential = await createUserWithEmailAndPassword(auth, authEmailForUsername(normalizedUsername), pass);
      } catch (error) {
        if (!canUseMvpGuestFallback(error)) throw error;
        if ((error as { code?: string }).code === 'auth/email-already-in-use') {
          try {
            credential = await signInWithEmailAndPassword(auth, authEmailForUsername(normalizedUsername), pass);
          } catch (signInError) {
            if (!canUseMvpGuestFallback(signInError)) throw signInError;
            await continueAsMvpGuest(normalizedUsername);
            return;
          }
        } else {
          await continueAsMvpGuest(normalizedUsername);
          return;
        }
      }
      await setDoc(
        doc(db, 'users', credential.user.uid, 'profile', 'main'),
        createDefaultProfile(credential.user, normalizedUsername),
      );
    } finally {
      pendingRegistrationUsernameRef.current = null;
    }
  };

  const continueWithGoogleMvp = async () => {
    await continueAsMvpGuest();
  };

  const continueAsMvpGuest = async (username?: string) => {
    pendingRegistrationUsernameRef.current = username || null;
    try {
      const credential = await signInAnonymously(auth);
      if (username) {
        const guestProfile = createDefaultProfile(credential.user, username, username);
        await setDoc(doc(db, 'users', credential.user.uid, 'profile', 'main'), guestProfile);
        setProfile(guestProfile);
      }
    } finally {
      pendingRegistrationUsernameRef.current = null;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateProfile = async (updated: Partial<StudentProfile>) => {
    if (!user || !profile) throw new Error('Une session utilisateur est requise.');
    const merged = { ...profile, ...updated, updatedAt: new Date().toISOString() };
    await setDoc(doc(db, 'users', user.uid, 'profile', 'main'), merged, { merge: true });
    setProfile(merged);

    if (
      updated.nationality || updated.visaType || updated.studentStatus || updated.city ||
      updated.permitExpiryDate || updated.school
    ) {
      const taskCollection = collection(db, 'users', user.uid, 'tasks');
      const existingSnapshot = await getDocs(taskCollection);
      const existingTasks = existingSnapshot.docs.map(item => ({ id: item.id, ...item.data() } as UserTask));
      const customTasks = existingTasks.filter(task => task.isCustom);
      const generated = isProfileReady(merged) ? generatePersonalizedTasks(merged) : [];
      const existingById = new Map(existingTasks.map(task => [task.id, task]));
      const personalized = generated.map(task => {
        const savedTask = existingById.get(task.id);
        return savedTask ? { ...task, status: savedTask.status, completedAt: savedTask.completedAt, completedSteps: savedTask.completedSteps } : task;
      });
      const generatedIds = new Set(personalized.map(task => task.id));
      await Promise.all([
        ...personalized.map(task => setDoc(doc(taskCollection, task.id), task)),
        ...existingTasks
          .filter(task => !task.isCustom && !generatedIds.has(task.id))
          .map(task => deleteDoc(doc(taskCollection, task.id))),
      ]);
      setTasks([...personalized, ...customTasks]);
    }
  };

  const toggleTaskStatus = async (taskId: string) => {
    if (!user) throw new Error('Une session utilisateur est requise.');
    const task = tasks.find(item => item.id === taskId);
    if (!task) return;
    const status = task.status === 'completed' ? 'todo' : 'completed';
    const completedAt = status === 'completed' ? new Date().toISOString() : null;
    await updateDoc(doc(db, 'users', user.uid, 'tasks', taskId), { status, completedAt });
    setTasks(current => current.map(item =>
      item.id === taskId ? { ...item, status, completedAt: completedAt || undefined } : item
    ));
  };

  const updateTaskSteps = async (taskId: string, completedSteps: string[]) => {
    if (!user) throw new Error('Une session utilisateur est requise.');
    await updateDoc(doc(db, 'users', user.uid, 'tasks', taskId), { completedSteps });
    setTasks(current => current.map(task => task.id === taskId ? { ...task, completedSteps } : task));
  };

  const addTask = async (task: Omit<UserTask, 'id' | 'userId'>) => {
    if (!user) throw new Error('Une session utilisateur est requise.');
    const id = crypto.randomUUID();
    const newTask: UserTask = { ...task, id, userId: user.uid, isCustom: true };
    await setDoc(doc(db, 'users', user.uid, 'tasks', id), newTask);
    setTasks(current => [newTask, ...current]);
  };

  const addWorkLog = async (log: Omit<WorkLog, 'id' | 'userId'>) => {
    if (!user) throw new Error('Une session utilisateur est requise.');
    const id = crypto.randomUUID();
    const newLog: WorkLog = { ...log, id, userId: user.uid, createdAt: new Date().toISOString() };
    await setDoc(doc(db, 'users', user.uid, 'workLogs', id), newLog);
    setWorkLogs(current => [newLog, ...current]);
  };

  const deleteWorkLog = async (logId: string) => {
    if (!user) throw new Error('Une session utilisateur est requise.');
    await deleteDoc(doc(db, 'users', user.uid, 'workLogs', logId));
    setWorkLogs(current => current.filter(log => log.id !== logId));
  };

  const updateDocumentStatus = async (
    docId: string,
    status: 'ready' | 'expiring_soon' | 'missing',
    expiryDate?: string,
  ) => {
    if (!user) throw new Error('Une session utilisateur est requise.');
    const changes = { status, ...(expiryDate ? { expiryDate } : {}) };
    await updateDoc(doc(db, 'users', user.uid, 'documents', docId), changes);
    setDocuments(current => current.map(item => item.id === docId ? { ...item, ...changes } : item));
  };

  const addDocument = async (label: string, expiryDate?: string) => {
    if (!user) throw new Error('Une session utilisateur est requise.');
    const id = crypto.randomUUID();
    const document: UserDocumentItem = {
      id,
      userId: user.uid,
      type: 'user_document',
      label: label.trim(),
      status: 'missing',
      ...(expiryDate ? { expiryDate } : {}),
    };
    await setDoc(doc(db, 'users', user.uid, 'documents', id), document);
    setDocuments(current => [document, ...current]);
  };

  const markNotificationAsRead = async (notifId: string) => {
    if (!user) throw new Error('Une session utilisateur est requise.');
    await updateDoc(doc(db, 'users', user.uid, 'notifications', notifId), { isRead: true });
    setNotifications(current => current.map(item => item.id === notifId ? { ...item, isRead: true } : item));
  };

  const clearAllNotifications = async () => {
    if (!user) throw new Error('Une session utilisateur est requise.');
    await Promise.all(notifications.filter(item => !item.isRead).map(item =>
      updateDoc(doc(db, 'users', user.uid, 'notifications', item.id), { isRead: true })
    ));
    setNotifications(current => current.map(item => ({ ...item, isRead: true })));
  };

  const toggleSavedJob = async (jobId: string) => {
    if (!user) throw new Error('Une session utilisateur est requise.');
    const existing = applications.find(item => item.jobId === jobId && item.status === 'saved');
    if (existing) {
      await deleteDoc(doc(db, 'users', user.uid, 'applications', existing.id));
      setApplications(current => current.filter(item => item.id !== existing.id));
      return;
    }
    const id = crypto.randomUUID();
    const application: JobApplication = { id, jobId, status: 'saved', updatedAt: new Date().toISOString() };
    await setDoc(doc(db, 'users', user.uid, 'applications', id), application);
    setApplications(current => [...current, application]);
  };

  const markJobApplied = async (jobId: string) => {
    if (!user) throw new Error('Une session utilisateur est requise.');
    const existing = applications.find(item => item.jobId === jobId);
    const id = existing?.id || crypto.randomUUID();
    const application: JobApplication = { id, jobId, status: 'applied', updatedAt: new Date().toISOString() };
    await setDoc(doc(db, 'users', user.uid, 'applications', id), application);
    setApplications(current => [...current.filter(item => item.id !== id), application]);
  };

  const exportAccountData = async () => {
    if (!user) throw new Error('Une session utilisateur est requise.');
    const names = ['tasks', 'workLogs', 'documents', 'notifications', 'applications', 'feedback', 'assistantMessages'];
    const [profileSnapshot, ...snapshots] = await Promise.all([
      getDoc(doc(db, 'users', user.uid, 'profile', 'main')),
      ...names.map(name => getDocs(collection(db, 'users', user.uid, name))),
    ]);
    return {
      exportedAt: new Date().toISOString(),
      profile: profileSnapshot.exists() ? profileSnapshot.data() : null,
      ...Object.fromEntries(names.map((name, index) => [
        name,
        snapshots[index].docs.map(item => ({ id: item.id, ...item.data() })),
      ])),
    };
  };

  const deleteAccount = async (password: string) => {
    if (!user) throw new Error('Impossible de vérifier le compte.');
    if (!user.isAnonymous) {
      if (!profile?.username || !user.email) throw new Error('Impossible de vérifier le compte.');
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
    }

    const collections = ['tasks', 'workLogs', 'documents', 'notifications', 'applications', 'feedback', 'assistantMessages'];
    for (const name of collections) {
      const snapshot = await getDocs(collection(db, 'users', user.uid, name));
      await Promise.all(snapshot.docs.map(item => deleteDoc(item.ref)));
    }
    await deleteDoc(doc(db, 'users', user.uid, 'profile', 'main'));
    await deleteDoc(doc(db, 'users', user.uid));
    await deleteUser(user);
  };

  const submitFeedback = async (message: string) => {
    if (!user || !profile) throw new Error('Une session utilisateur est requise.');
    const normalizedMessage = message.trim();
    if (!normalizedMessage || normalizedMessage.length > 2000) {
      throw new Error('Le message doit contenir entre 1 et 2 000 caractères.');
    }
    await setDoc(doc(collection(db, 'users', user.uid, 'feedback')), {
      uid: user.uid,
      username: profile.username || '',
      message: normalizedMessage,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      tasks,
      workLogs,
      documents,
      notifications,
      applications,
      isLoading,
      dataError,
      loginWithUsername,
      registerWithUsername,
      continueWithGoogleMvp,
      logout,
      updateProfile,
      toggleTaskStatus,
      updateTaskSteps,
      addTask,
      addWorkLog,
      deleteWorkLog,
      updateDocumentStatus,
      addDocument,
      markNotificationAsRead,
      clearAllNotifications,
      toggleSavedJob,
      markJobApplied,
      exportAccountData,
      deleteAccount,
      submitFeedback,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
