'use client';

import React, { useEffect, useRef, useState } from 'react';
import publicApi from '@/libs/publicApi';
import styles from './ProductAiChat.module.scss';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  productId: number;
}

const SUGGESTED = ['어떤 소재인가요?', '사이즈 추천 부탁드려요', '재고가 있는 옵션은?', '세탁 방법이 궁금해요'];

export default function ProductAiChat({ productId }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'assistant', content: '안녕하세요! 상품에 대해 궁금한 점을 물어보세요 😊' }]);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: Message = { role: 'user', content };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const { data } = await publicApi.post('/frontWeb/ai/productChat', {
        productId,
        messages: nextMessages,
      });
      const reply = data?.body?.content ?? '죄송합니다, 응답을 가져오지 못했습니다.';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: '오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      {!open ? (
        <button className={styles.openBtn} onClick={() => setOpen(true)}>
          <span className={styles.openBtnIcon}>✦</span>
          <span>AI에게 상품 질문하기</span>
          <span className={styles.openBtnArrow}>›</span>
        </button>
      ) : (
        <div className={styles.chatBox}>
          <div className={styles.chatHeader}>
            <div className={styles.headerLeft}>
              <div className={styles.aiAvatar}>✦</div>
              <div>
                <div className={styles.headerTitle}>AI 상품 안내</div>
                <div className={styles.headerSub}>상품 관련 질문에 답변드려요</div>
              </div>
            </div>
            <button className={styles.closeBtn} onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className={styles.messages}>
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? styles.userRow : styles.assistantRow}>
                {m.role === 'assistant' && <div className={styles.avatarSmall}>✦</div>}
                <div className={m.role === 'user' ? styles.userBubble : styles.assistantBubble}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className={styles.assistantRow}>
                <div className={styles.avatarSmall}>✦</div>
                <div className={styles.assistantBubble}>
                  <span className={styles.typingDots}>
                    <span /><span /><span />
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {messages.length <= 1 && (
            <div className={styles.suggested}>
              {SUGGESTED.map((q) => (
                <button key={q} className={styles.suggestBtn} onClick={() => send(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className={styles.inputRow}>
            <input
              className={styles.input}
              placeholder="궁금한 점을 입력하세요..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              disabled={loading}
            />
            <button className={styles.sendBtn} onClick={() => send()} disabled={loading || !input.trim()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
