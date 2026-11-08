import React, {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import {
  DEFAULT_LANGUAGE,
  getStoredLanguage,
  LANGUAGE_STORAGE_KEY,
  Language,
  translateText,
} from '../i18n';

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  languageError: string | null;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);
const translatableProps = new Set(['alt', 'aria-label', 'description', 'desc', 'label', 'placeholder', 'title']);
const localizedComponents = new WeakMap<React.ComponentType<object>, React.ComponentType<object>>();

function localizeNode(node: React.ReactNode, language: Language): React.ReactNode {
  if (typeof node === 'string') return translateText(node, language);
  if (Array.isArray(node)) return Children.map(node, child => localizeNode(child, language));
  if (!isValidElement(node)) return node;
  const element = node as React.ReactElement<Record<string, unknown>>;

  const props: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(element.props)) {
    if (key === 'children') {
      props.children = localizeNode(value as React.ReactNode, language);
    } else if (translatableProps.has(key) && typeof value === 'string') {
      props[key] = translateText(value, language);
    } else {
      props[key] = value;
    }
  }

  if (typeof element.type === 'function' && !element.type.prototype?.isReactComponent) {
    const LocalizedComponent = withI18n(element.type as React.ComponentType<object>);
    return React.createElement(
      LocalizedComponent as React.ComponentType<Record<string, unknown>>,
      { ...props, key: element.key ?? undefined },
    );
  }
  return cloneElement(element, props);
}

export function withI18n<P extends object>(Component: React.ComponentType<P>): React.ComponentType<P> {
  const cached = localizedComponents.get(Component as React.ComponentType<object>);
  if (cached) return cached as React.ComponentType<P>;

  const LocalizedComponent: React.FC<P> = props => {
    const context = useLanguage();
    const renderComponent = Component as unknown as (componentProps: P) => React.ReactNode;
    return <>{localizeNode(renderComponent(props), context.language)}</>;
  };
  LocalizedComponent.displayName = `withI18n(${Component.displayName || Component.name || 'Component'})`;
  localizedComponents.set(Component as React.ComponentType<object>, LocalizedComponent as React.ComponentType<object>);
  return LocalizedComponent;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, updateProfile } = useAuth();
  const [language, setLanguageState] = useState<Language>(getStoredLanguage);
  const [languageError, setLanguageError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile || !user) return;
    const preferredLanguage = profile.languagePreference || DEFAULT_LANGUAGE;
    if (preferredLanguage !== language) setLanguageState(preferredLanguage);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, preferredLanguage);
    } catch (error) {
      console.error('Could not cache language preference:', error);
    }
    if (!profile.languagePreference) {
      void updateProfile({ languagePreference: preferredLanguage }).catch(error => {
        console.error('Could not save default language preference:', error);
        setLanguageError('Impossible d’enregistrer la langue choisie.');
      });
    }
  }, [profile?.userId, profile?.languagePreference, user?.uid, updateProfile]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback(async (nextLanguage: Language) => {
    const previousLanguage = language;
    setLanguageError(null);
    setLanguageState(nextLanguage);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    } catch (error) {
      console.error('Could not cache language preference:', error);
    }
    if (!user || !profile) return;
    try {
      await updateProfile({ languagePreference: nextLanguage });
    } catch (error) {
      console.error('Could not save language preference:', error);
      setLanguageState(previousLanguage);
      try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, previousLanguage);
      } catch (storageError) {
        console.error('Could not restore cached language preference:', storageError);
      }
      setLanguageError('Impossible d’enregistrer la langue choisie. Réessaie.');
    }
  }, [language, profile, updateProfile, user]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, languageError }}>
      {withI18nChildren(children, language)}
    </LanguageContext.Provider>
  );
}

function withI18nChildren(children: React.ReactNode, language: Language): React.ReactNode {
  return localizeNode(children, language);
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider.');
  return context;
}
