import { create } from 'zustand';

interface BlockState {
  isBlocked: boolean;
  timeLeft: number; // 남은 차단 시간 (초)
  startBlock: (seconds: number) => void;
}

let timerId: NodeJS.Timeout | null = null;

export const useBlockStore = create<BlockState>((set, get) => ({
  isBlocked: false,
  timeLeft: 0,

  startBlock: (seconds) => {
    // 기존에 돌고 있던 타이머가 있다면 초기화
    if (timerId) clearInterval(timerId);

    set({ isBlocked: true, timeLeft: seconds });

    // 1초마다 남은 시간을 감소시키는 타이머 작동
    timerId = setInterval(() => {
      const nextTime = get().timeLeft - 1;

      if (nextTime <= 0) {
        clearInterval(timerId!);
        set({ isBlocked: false, timeLeft: 0 }); // 락 자동 해제!
      } else {
        set({ timeLeft: nextTime });
      }
    }, 1000);
  },
}));
