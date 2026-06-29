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
          🤖 AI에게 상품 질문하기
        </button>
      ) : (
        <div className={styles.chatBox}>
          <div className={styles.chatHeader}>
            <span>🤖 AI 상품 안내</span>
            <button className={styles.closeBtn} onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className={styles.messages}>
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? styles.userMsg : styles.assistantMsg}>
                {m.content}
              </div>
            ))}
            {loading && (
              <div className={styles.assistantMsg}>
                <span className={styles.typing}>●●●</span>
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
              placeholder="질문을 입력하세요"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              disabled={loading}
            />
            <button className={styles.sendBtn} onClick={() => send()} disabled={loading || !input.trim()}>
              전송
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
