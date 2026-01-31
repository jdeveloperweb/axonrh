import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface LayoutState {
    isSidebarCollapsed: boolean;
    isMobileMenuOpen: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
    setMobileMenuOpen: (open: boolean) => void;
    toggleSidebar: () => void;
    toggleMobileMenu: () => void;
}

export const useLayoutStore = create<LayoutState>()(
    persist(
        (set) => ({
            isSidebarCollapsed: false,
            isMobileMenuOpen: false,
            setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
            setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
            toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
            toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
        }),
        {
            name: 'axonrh-layout',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
