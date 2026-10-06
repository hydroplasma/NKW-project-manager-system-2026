"use client";

import { create } from "zustand";

type UiState = {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
}));
