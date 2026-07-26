import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import publicApi from '@/libs/publicApi';
import { FileDet } from '@/generated';

type ModalType = 'OPEN_WEB_MODAL'; // 언젠가 쓰겠지

interface WebCommonState {
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType, index?: number) => void;
  closeModal: (type: ModalType) => void;
  noticeVisible: boolean;
  showNotice: () => void;
  hideNotice: () => void;
}

interface WebCommonApiState {
  getFileUrl: (fileKey: string) => Promise<string>;
  /** 목록 화면용: 여러 파일키의 presigned url 을 한 번의 요청으로 조회 */
  getFileUrls: (fileKeys: string[]) => Promise<Record<string, string>>;
  selectFileList: (fileId: number) => Promise<FileDet[]>;
}

const initialStateCreator: StateCreator<WebCommonState & WebCommonApiState, any> = (set, get, api) => {
  return {
    modalType: { type: 'OPEN_WEB_MODAL', active: false },
    noticeVisible: false,
    showNotice: () => set({ noticeVisible: true }),
    hideNotice: () => set({ noticeVisible: false }),
    openModal: (type, index) => {
      set((state) => ({
        modalType: {
          type,
          active: true,
        },
        index: index,
      }));
    },
    closeModal: (type) => {
      set((state) => ({
        modalType: {
          type,
          active: false,
        },
      }));
    },
    getFileUrl: async (fileKey: string) => {
      if (!fileKey || fileKey.trim() === '') {
        return '';
      } else {
        return await publicApi.get('/frontWeb/webCommon/getFileUrl', { params: { fileKey: fileKey } }).then((res) => {
          if (res.data.resultCode === 200) {
            return res.data.body;
          } else {
            return '';
          }
        });
      }
    },
    getFileUrls: async (fileKeys: string[]) => {
      const keys = (fileKeys ?? []).filter((k) => k && k.trim() !== '');
      if (keys.length === 0) return {};
      return await publicApi.post('/frontWeb/webCommon/getFileUrls', { fileKeys: [...new Set(keys)] }).then((res) => {
        return res.data.resultCode === 200 ? (res.data.body as Record<string, string>) ?? {} : {};
      });
    },
    selectFileList: async (fileId: number) => {
      return publicApi.get(`/frontWeb/webCommon/fileList/${fileId}`).then((res): FileDet[] => {
        if (res.data.resultCode === 200) {
          return res.data.body;
        } else {
          console.error(res.data);
          return [];
        }
      });
    },
  };
};

export const useWebCommonStore = create<WebCommonState & WebCommonApiState>()(devtools(immer(initialStateCreator)));
