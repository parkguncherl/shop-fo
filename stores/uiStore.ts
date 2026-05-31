import { create } from 'zustand';

interface UiStore {
  guestReady: boolean;
  setGuestReady: (ready: boolean) => void; // 토큰이 발행되었는지 (발행후 모든 인터페이스가 가능)
  cartDrawerOpen: boolean;
  setCartDrawerOpen: (open: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  guestReady: false,
  setGuestReady: (ready) => set({ guestReady: ready }),
  cartDrawerOpen: false,
  setCartDrawerOpen: (open) => set({ cartDrawerOpen: open }),
  searchOpen: false,
  setSearchOpen: (open) => set({ searchOpen: open }),
}));
