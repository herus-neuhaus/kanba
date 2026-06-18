import { create } from 'zustand';

interface AppState {
  isSidebarOpen: boolean;
  searchQuery: string;
  toggleSidebar: () => void;
  setSearchQuery: (query: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isSidebarOpen: true,
  searchQuery: '',
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
