'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/libs/api';
import publicApi from '@/libs/publicApi';
import { toastError } from '@/components/common/Others/ToastMessage';
import { useWebCommonStore } from '@/stores/useWebCommonStore';
import { useConfirm } from '@/components/common/ConfirmModal/ConfirmProvider';
import styles from './ComuChat.module.scss';

const MAX_IMAGES = 5;

interface ComuType {
  codeCd: string;
  codeNm: string;
}

interface ComuMessage {
  id: number;
  comuId: number;
  reqYn: string;
  comuCntn: string;
  fileId?: number | null;
  creUser: string;
  creTm: string;
}

interface ComuThread {
  id: number;
  comuType: string;
  comuTypeName?: string;
  orderId: number;
  creTm: string;
  messages: ComuMessage[];
}

interface ComuSummary {
  id: number;
  comuType: string;
  comuTypeName?: string;
  orderId: number;
  lastMessage?: string;
  lastMessageTm?: string;
  creTm: string;
}

interface Props {
  orderId: number;
  orderNo: string;
  socialAccountId: number;
  onClose: () => void;
}

const formatTime = (value?: string | null) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(d);
};

function MessageBubble({
  msg,
  isMine,
  socialAccountId,
  onDelete,
}: {
  msg: ComuMessage;
  isMine: boolean;
  socialAccountId: number;
  onDelete: (id: number) => void;
}) {
  const { selectFileList, getFileUrl } = useWebCommonStore();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!msg.fileId) return;
    (async () => {
      const files = await selectFileList(msg.fileId!);
      const urls = await Promise.all(files.map((f) => f.sysFileNm ? getFileUrl(f.sysFileNm) : Promise.resolve('')));
      setImageUrls(urls.filter(Boolean));
    })();
  }, [msg.fileId]);

  return (
    <div className={`${styles.messageRow} ${isMine ? styles.mine : styles.theirs}`}>
      {!isMine && <div className={styles.avatar}>{msg.creUser?.slice(0, 1) ?? 'A'}</div>}
      <div className={styles.bubbleWrap}>
        {!isMine && <span className={styles.senderName}>{msg.creUser}</span>}
        <div className={styles.bubbleGroup}>
          {isMine && (
            <div className={styles.bubbleMeta}>
              {msg.reqYn === 'Y' && (
                <button type="button" className={styles.deleteBtn} onClick={() => onDelete(msg.id)} aria-label="삭제">
                  삭제
                </button>
              )}
              <span className={styles.time}>{formatTime(msg.creTm)}</span>
            </div>
          )}
          <div className={styles.bubble}>
            {msg.comuCntn && <p className={styles.bubbleText}>{msg.comuCntn}</p>}
            {imageUrls.length > 0 && (
              <div className={styles.imageGrid}>
                {imageUrls.map((url, i) => (
                  <img key={i} src={url} alt={`첨부 ${i + 1}`} className={styles.bubbleImg} onClick={() => setLightbox(url)} />
                ))}
              </div>
            )}
          </div>
          {!isMine && <span className={styles.time}>{formatTime(msg.creTm)}</span>}
        </div>
      </div>

      {lightbox && (
        <div className={styles.lightboxOverlay} onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="확대" className={styles.lightboxImg} />
        </div>
      )}
    </div>
  );
}

export default function ComuChat({ orderId, orderNo, socialAccountId, onClose }: Props) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { selectFileList, getFileUrl } = useWebCommonStore();

  // step: 'list' | 'type-select' | 'chat'
  const [step, setStep] = useState<'list' | 'type-select' | 'chat'>('list');
  const [selectedThread, setSelectedThread] = useState<ComuThread | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // 신규 상담 시 메시지 순차 공개 (null = 모두 표시)
  const [revealedCount, setRevealedCount] = useState<number | null>(null);
  const [showTyping, setShowTyping] = useState(false);

  // 고객 메시지 없이 닫으면 tb_comu 삭제
  const handleClose = async () => {
    if (
      step === 'chat' &&
      selectedThread &&
      revealedCount !== null && // 신규 생성된 스레드
      !selectedThread.messages.some((m) => m.reqYn === 'Y')
    ) {
      try {
        await authApi.delete(`/frontWeb/comu/${selectedThread.id}`);
        queryClient.invalidateQueries({ queryKey: ['comuList', orderId] });
      } catch { /* 삭제 실패해도 모달은 닫음 */ }
    }
    onClose();
  };

  // 배경 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // 신규 이미지 미리보기 정리
  useEffect(() => {
    return () => { previewUrls.forEach((url) => URL.revokeObjectURL(url)); };
  }, [previewUrls]);

  // 상담 유형 코드 목록
  const { data: comuTypes = [] } = useQuery<ComuType[]>({
    queryKey: ['comuTypes'],
    queryFn: async () => {
      const res = await publicApi.get('/frontWeb/webCommon/lower/10130');
      return (res.data?.body ?? [])
        .filter((c: any) => String(c.codeCd ?? '').startsWith('A'))
        .map((c: any) => ({ codeCd: c.codeCd, codeNm: c.codeNm }));
    },
    staleTime: 1000 * 60 * 10,
  });

  // 주문별 상담 목록
  const { data: summaries = [], isLoading: summariesLoading } = useQuery<ComuSummary[]>({
    queryKey: ['comuList', orderId],
    queryFn: async () => {
      const res = await authApi.get(`/frontWeb/comu/order/${orderId}`);
      return res.data?.body ?? [];
    },
  });

  // 스레드 상세 조회
  const loadThread = async (comuId: number) => {
    const res = await authApi.get(`/frontWeb/comu/${comuId}`);
    const thread: ComuThread = res.data?.body;
    setSelectedThread(thread);
    setStep('chat');
  };

  // 신규 상담 메시지 순차 공개 애니메이션
  useEffect(() => {
    if (revealedCount === null) return;
    const total = selectedThread?.messages?.length ?? 0;
    if (revealedCount >= total) { setShowTyping(false); return; }

    // typing indicator 표시 후 메시지 공개
    setShowTyping(true);
    const typingTimer = setTimeout(() => {
      setShowTyping(false);
      setRevealedCount((prev) => (prev ?? 0) + 1);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }, 900);

    return () => clearTimeout(typingTimer);
  }, [revealedCount, selectedThread?.messages?.length]);

  // 유형 선택 → 즉시 comu 생성 + 자동 메시지 2건
  const createComuMutation = useMutation({
    mutationFn: async (comuType: string) => {
      const res = await authApi.post('/frontWeb/comu', { socialAccountId, comuType, orderId });
      return res.data?.body as ComuThread;
    },
    onSuccess: (thread) => {
      setSelectedThread(thread);
      setStep('chat');
      setRevealedCount(0); // 순차 공개 시작
      queryClient.invalidateQueries({ queryKey: ['comuList', orderId] });
    },
    onError: () => toastError('상담 시작 중 오류가 발생했습니다.'),
  });

  // 메시지 전송 (addMessage만 사용)
  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!selectedThread) return;
      let fileId: number | undefined;
      if (imageFiles.length > 0) {
        const form = new FormData();
        form.append('fileId', '0');
        imageFiles.forEach((f) => form.append('uploadFiles', f));
        const up = await authApi.post('/frontWeb/webCommon/imgfile/uploads', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 30000,
        });
        fileId = up.data?.body;
      }
      const res = await authApi.post(`/frontWeb/comu/${selectedThread.id}/message`, {
        socialAccountId,
        content: inputText,
        fileId,
      });
      return res.data?.body as ComuThread;
    },
    onSuccess: (thread) => {
      if (thread) setSelectedThread(thread);
      setInputText('');
      setImageFiles([]);
      setPreviewUrls([]);
      queryClient.invalidateQueries({ queryKey: ['comuList', orderId] });
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    },
    onError: () => toastError('전송 중 오류가 발생했습니다.'),
  });

  // 메시지 삭제
  const deleteMutation = useMutation({
    mutationFn: async (comuDetId: number) => {
      await authApi.delete(`/frontWeb/comu/message/${comuDetId}`, { params: { socialAccountId } });
    },
    onSuccess: async () => {
      if (selectedThread) {
        const res = await authApi.get(`/frontWeb/comu/${selectedThread.id}`);
        setSelectedThread(res.data?.body);
      }
      queryClient.invalidateQueries({ queryKey: ['comuList', orderId] });
    },
    onError: () => toastError('삭제 중 오류가 발생했습니다.'),
  });

  const handleDelete = async (comuDetId: number) => {
    const ok = await confirm({ title: '메시지 삭제', message: '이 메시지를 삭제하시겠습니까?', confirmText: '삭제', tone: 'danger' });
    if (ok) deleteMutation.mutate(comuDetId);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = MAX_IMAGES - imageFiles.length;
    const accepted = files.slice(0, remaining);
    setImageFiles((prev) => [...prev, ...accepted]);
    setPreviewUrls((prev) => [...prev, ...accepted.map((f) => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const canSend = inputText.trim().length > 0 || imageFiles.length > 0;

  const handleSend = () => {
    if (!canSend || sendMutation.isPending) return;
    sendMutation.mutate();
  };

  // ── 스크롤 하단 유지
  useEffect(() => {
    if (step === 'chat') {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'auto' }), 50);
    }
  }, [step, selectedThread?.messages?.length]);

  // ═══════════════════════ RENDER ═══════════════════════

  const renderHeader = () => (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        {(step === 'type-select' || (step === 'chat' && !selectedThread)) && (
          <button type="button" className={styles.backBtn} onClick={() => setStep('list')}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        {step === 'chat' && selectedThread && (
          <button type="button" className={styles.backBtn} onClick={() => { setSelectedThread(null); setStep('list'); }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        <div>
          <h2>
            {step === 'list' && '문의 내역'}
            {step === 'type-select' && '문의 유형 선택'}
            {step === 'chat' && (selectedThread?.comuTypeName ?? selectedThread?.comuType ?? '상담')}
          </h2>
          <span className={styles.orderNo}>{orderNo}</span>
        </div>
      </div>
      <button type="button" className={styles.closeBtn} onClick={handleClose} aria-label="닫기">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );

  // ── 목록 화면
  if (step === 'list') {
    return (
      <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && handleClose()}>
        <div className={styles.modal}>
          {renderHeader()}
          <div className={styles.listBody}>
            {summariesLoading ? (
              <div className={styles.skeleton} />
            ) : summaries.length === 0 ? (
              <div className={styles.empty}>
                <p>등록된 문의가 없습니다.</p>
                <span>아래 버튼을 눌러 문의를 시작하세요.</span>
              </div>
            ) : (
              <ul className={styles.threadList}>
                {summaries.map((s) => (
                  <li key={s.id} className={styles.threadItem} onClick={() => loadThread(s.id)}>
                    <div className={styles.threadTop}>
                      <span className={styles.typeBadge}>{s.comuTypeName ?? s.comuType}</span>
                      <span className={styles.threadDate}>{formatTime(s.lastMessageTm ?? s.creTm)}</span>
                    </div>
                    <p className={styles.threadPreview}>{s.lastMessage ?? '메시지 없음'}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className={styles.listFooter}>
            <button type="button" className={styles.newBtn} onClick={() => setStep('type-select')}>
              + 새 문의하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── 유형 선택 팝업
  if (step === 'type-select') {
    const usedTypes = new Set(summaries.map((s) => s.comuType));
    return (
      <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && handleClose()}>
        <div className={`${styles.modal} ${styles.typeSelectModal}`}>
          {renderHeader()}
          <div className={styles.typeGrid}>
            {comuTypes.map((t) => {
              const used = usedTypes.has(t.codeCd);
              return (
                <button
                  key={t.codeCd}
                  type="button"
                  className={`${styles.typeBtn} ${selectedType === t.codeCd ? styles.typeBtnActive : ''} ${used ? styles.typeBtnUsed : ''}`}
                  disabled={used || createComuMutation.isPending}
                  onClick={() => { setSelectedType(t.codeCd); createComuMutation.mutate(t.codeCd); }}
                >
                  {t.codeNm}
                  {used && <span className={styles.usedLabel}>문의완료</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── 채팅 화면
  const messages = selectedThread?.messages ?? [];
  // revealedCount가 null이면 전체 표시, 아니면 순차 공개
  const visibleMessages = revealedCount === null ? messages : messages.slice(0, revealedCount);
  const isAnimating = revealedCount !== null && revealedCount < messages.length;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className={`${styles.modal} ${styles.chatModal}`}>
        {renderHeader()}

        <div className={styles.chatBody}>
          {visibleMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isMine={msg.reqYn === 'Y'}
              socialAccountId={socialAccountId}
              onDelete={handleDelete}
            />
          ))}
          {/* 타이핑 인디케이터 */}
          {showTyping && (
            <div className={`${styles.messageRow} ${styles.theirs}`}>
              <div className={styles.avatar}>s</div>
              <div className={styles.bubbleWrap}>
                <div className={styles.bubbleGroup}>
                  <div className={`${styles.bubble} ${styles.typingBubble}`}>
                    <span className={styles.typingDot} />
                    <span className={styles.typingDot} />
                    <span className={styles.typingDot} />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className={styles.inputArea}>
          {previewUrls.length > 0 && (
            <div className={styles.previewRow}>
              {previewUrls.map((url, i) => (
                <div key={i} className={styles.previewThumb}>
                  <img src={url} alt={`첨부 ${i + 1}`} />
                  <button type="button" className={styles.thumbRemove} onClick={() => removeImage(i)}>×</button>
                </div>
              ))}
            </div>
          )}
          <div className={styles.inputRow}>
            <button type="button" className={styles.imageBtn} onClick={() => fileInputRef.current?.click()} disabled={imageFiles.length >= MAX_IMAGES}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="7" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M2 14l4-4 3 3 3-3 4 4" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
              </svg>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className={styles.hiddenInput} onChange={handleImageChange} />
            <textarea
              className={styles.inputBox}
              placeholder="메시지를 입력하세요"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
            />
            <button
              type="button"
              className={`${styles.sendBtn} ${canSend ? styles.sendBtnActive : ''}`}
              onClick={handleSend}
              disabled={!canSend || sendMutation.isPending}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 9l14-7-7 14V9H2z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
