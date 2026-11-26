import React, { createContext, useContext, useState, useCallback } from 'react';

interface DrawerContextValue {
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  privacyModal: { isOpen: boolean; tab: 'privacy' | 'terms' };
  openPrivacyModal: (tab?: 'privacy' | 'terms') => void;
  closePrivacyModal: () => void;
}

const DrawerContext = createContext<DrawerContextValue>({
  isOpen: false,
  openDrawer: () => {},
  closeDrawer: () => {},
  privacyModal: { isOpen: false, tab: 'privacy' },
  openPrivacyModal: () => {},
  closePrivacyModal: () => {},
});

export const DrawerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [privacyModal, setPrivacyModal] = useState<{
    isOpen: boolean;
    tab: 'privacy' | 'terms';
  }>({ isOpen: false, tab: 'privacy' });

  const openDrawer = useCallback(() => setIsOpen(true), []);
  const closeDrawer = useCallback(() => setIsOpen(false), []);

  const openPrivacyModal = useCallback((tab: 'privacy' | 'terms' = 'privacy') => {
    setPrivacyModal({ isOpen: true, tab });
  }, []);

  const closePrivacyModal = useCallback(() => {
    setPrivacyModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <DrawerContext.Provider
      value={{
        isOpen,
        openDrawer,
        closeDrawer,
        privacyModal,
        openPrivacyModal,
        closePrivacyModal,
      }}
    >
      {children}
    </DrawerContext.Provider>
  );
};

export function useDrawer(): DrawerContextValue {
  return useContext(DrawerContext);
}
