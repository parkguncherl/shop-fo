import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ApiResponse, CommonRequestFileDownload, CommonRequestFileRearrangementRequest, CommonRequestFileUploads, FileDet } from '@/generated';
import { AxiosPromise } from 'axios';
import publicApi from '@/libs/publicApi';

type ModalType = 'UPLOAD' | 'UPLOADS' | 'IMAGES' | 'PRIVACY' | 'FILES';

export interface HistoryType {
  histMenuNm: string;
  histMenuUri: string;
}

interface CommonState {
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType, index?: number) => void;
  closeModal: (type: ModalType) => void;
  upMenuNm: string | undefined;
  setUpMenuNm: (upMenuNm: string) => void;
  menuNm: string | undefined;
  setMenuNm: (menuNm: string) => void;
  menuUpdYn: boolean;
  setMenuUpdYn: (menuUpdYn: boolean) => void;
  menuExcelYn: boolean;
  setMenuExcelYn: (menuExcelYn: boolean) => void;
  historyList: HistoryType[];
  setHistoryList: (historyList: HistoryType[]) => void;
}

interface CommonApiState {
  selectFileList: (fileId: number) => Promise<FileDet[]>;
  fileDownload: (commonRequest: CommonRequestFileDownload) => void;
  fileDownloadBlob: (commonRequest: CommonRequestFileDownload) => any;
  deleteFile: (commonRequest: any) => AxiosPromise<ApiResponse>;
  getFileUrl: (fileKey: string) => Promise<string>;
  getFileList: (fileId: number) => AxiosPromise<ApiResponse>;
  rearrangeFilesByStepsToMove: (commonRequestFileRearrangementRequest: CommonRequestFileRearrangementRequest) => AxiosPromise<ApiResponse>;
  uploadImageFiles: (commonRequestFileUploads: { fileId: number; uploadFiles: Array<File> }) => AxiosPromise<ApiResponse>;
  updateImageFile: (commonRequestFileUpdate: { fileId: number; fileSeq: number; uploadFile: File }) => AxiosPromise<ApiResponse>;
}

const initialStateCreator: StateCreator<CommonState & CommonApiState, any> = (set, get, api) => {
  return {
    modalType: { type: 'UPLOAD', active: false },
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
    upMenuNm: undefined,
    setUpMenuNm: (upMenuNm: string) => {
      set((state) => ({
        upMenuNm: upMenuNm,
      }));
    },
    menuNm: undefined,
    setMenuNm: (menuNm: string) => {
      set((state) => ({
        menuNm: menuNm,
      }));
    },
    menuUpdYn: false,
    setMenuUpdYn: (menuUpdYn: boolean) => {
      set((state) => ({
        menuUpdYn: menuUpdYn,
      }));
    },
    menuExcelYn: false,
    setMenuExcelYn: (menuExcelYn: boolean) => {
      set((state) => ({
        menuExcelYn: menuExcelYn,
      }));
    },
    historyList: [],
    setHistoryList: (historyList: HistoryType[]) => {
      set((state) => ({
        historyList: historyList,
      }));
    },
    selectFileList: async (fileId: number) => {
      return publicApi.get(`/common/file/${fileId}`).then((res): FileDet[] => {
        if (res.data.resultCode === 200) {
          return res.data.body;
        } else {
          console.error(res.data);
          return [];
        }
      });
    },
    fileDownload: async (commonRequest) => {
      const params = '?id=' + commonRequest.id + '&fileSeq=' + commonRequest.fileSeq;

      const res = await publicApi.get('/common/file/download' + params.replaceAll('undefined', ''));
      const blob = res.data;

      if (typeof window !== 'undefined') {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.target = '_self';
        link.download = commonRequest.fileNm!;
        link.click();
      }
    },
    fileDownloadBlob: async (commonRequest) => {
      const params = '?id=' + commonRequest.id + '&fileSeq=' + commonRequest.fileSeq;

      const res = await publicApi.get('/common/file/download' + params.replaceAll('undefined', ''));
      return res.data;
    },

    deleteFile: (commonRequest) => {
      return publicApi.delete('/common/fileDeleteBySeq/' + commonRequest.fileId + '/' + commonRequest.fileSeq, {});
    },
    getFileUrl: async (fileKey: string) => {
      if (!fileKey || fileKey.trim() === '') {
        return '';
      } else {
        return await publicApi.get('/common/getFileUrl', { params: { fileKey: fileKey } }).then((res) => {
          if (res.data.resultCode === 200) {
            return res.data.body;
          } else {
            return '';
          }
        });
      }
    },
    getFileList: (fileId: number) => {
      return publicApi.get(`/common/file/${fileId}`);
    },
    rearrangeFilesByStepsToMove: (commonRequestFileRearrangementRequest) => {
      return publicApi.patch('/common/rearrangeFilesByStepsToMove', commonRequestFileRearrangementRequest);
    },
    uploadImageFiles: (commonRequestFileUploads) => {
      const formData = new FormData();
      commonRequestFileUploads.uploadFiles.forEach((f) => {
        formData.append('uploadFiles', f); // 멀티 파일 추가
      });

      formData.append('fileId', commonRequestFileUploads.fileId.toString());

      return publicApi.post('/common/imgfile/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    updateImageFile: (commonRequestFileUpdate) => {
      const formData = new FormData();
      formData.append('fileId', commonRequestFileUpdate.fileId.toString());
      formData.append('fileSeq', commonRequestFileUpdate.fileSeq.toString());
      formData.append('uploadFile', commonRequestFileUpdate.uploadFile);

      return publicApi.patch('/common/imgfile/update', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
  };
};

export const useCommonStore = create<CommonState & CommonApiState>()(devtools(immer(initialStateCreator)));
