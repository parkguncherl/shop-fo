'use client';
import { useEffect } from 'react';
import { initGuestToken } from '@/libs/guestToken';
import { useUiStore } from '@/stores/uiStore';

export default function GuestTokenInit() {
  const setGuestReady = useUiStore((s) => s.setGuestReady);

  useEffect(() => {
    console.log('GuestTokenInit====>');
    initGuestToken().then(() => {
      setGuestReady(true);
    });
  }, []);

  return null; // UI 없음
}
