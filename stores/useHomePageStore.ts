import { PageObject } from '@/generated';
import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

type ModalType = 'SHOW' | 'ADD';

interface ModalState {
  type: ModalType;
  active: boolean;
  stored_temporary?: unknown;
}

interface ProductContentListState {
  paging: PageObject;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  modals: ModalState;
  openModal: (type: ModalType, stored_temp?: unknown) => void;
  closeModal: (type: ModalType) => void;
}

const initialStateCreator: StateCreator<ProductContentListState> = (set, get, api) => {
  return {
    paging: {
      curPage: 1,
      pageRowCount: 50,
    },
    setPaging: (pageObject) => {
      set((state) => ({
        paging: {
          ...state.paging,
          ...pageObject,
        },
      }));
    },
    modals: { type: 'SHOW', active: false, stored_temporary: undefined },
    openModal: (type, stored_temp) => {
      set((state) => ({
        modals: {
          type,
          active: true,
          stored_temporary: stored_temp,
        },
      }));
    },
    closeModal: (type) => {
      set((state) => ({
        modals: {
          type,
          active: false,
          stored_temporary: undefined,
        },
      }));
    },
  };
};

export const useHomePageStore = create<ProductContentListState>()(devtools(immer(initialStateCreator)));
