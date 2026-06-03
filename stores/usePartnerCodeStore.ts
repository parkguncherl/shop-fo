import { create } from 'zustand';
import { PartnerCodeResponseLowerSelect } from '@/generated';

export interface PartnerCodeStore {
  /** P0001 카테고리 목록 */
  categories: PartnerCodeResponseLowerSelect[];
  /** P0001 카테고리 로드 완료 여부 */
  categoryReady: boolean;
  setCategories: (list: PartnerCodeResponseLowerSelect[]) => void;
}

export const usePartnerCodeStore = create<PartnerCodeStore>((set) => ({
  categories: [],
  categoryReady: false,
  setCategories: (list) => set({ categories: list, categoryReady: true }),
}));
