import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface LayoutState {
    isSidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
    toggleSidebar: () => void;
}

export const useLayoutStore = create<LayoutState>()(
    persist(
        (set) => ({
            isSidebarCollapsed: false,
            setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
            toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
        }),
        {
            name: 'axonrh-layout',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
