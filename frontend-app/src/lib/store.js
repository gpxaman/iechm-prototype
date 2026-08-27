import { create } from 'zustand';

// Global UI state that needs to survive route changes: current mode, cross-
// screen scratch data (the in-progress build-assistant chat, a custom
// request draft, etc.), and the toast/sheet singletons rendered by App.
export const useStore = create((set, get) => ({
  onboarded: false,
  intent: null,
  mode: 'buy',

  cartCount: 0,
  unreadCount: 0,
  setCartCount: (n) => set({ cartCount: n }),
  setUnreadCount: (n) => set({ unreadCount: n }),

  setMode: (mode) => set({ mode }),
  setIntent: (intent) => set({ intent }),
  setOnboarded: (v) => set({ onboarded: v }),

  // scratch space for in-flight multi-screen flows
  tmp: {
    chat: [],
    chatStarted: false,
    lastPrompt: '',
    lastScenario: null,
    crDraft: null, // { text, files: [], extracted, projectId }
  },
  setTmp: (patch) => set((s) => ({ tmp: { ...s.tmp, ...patch } })),
  resetChat: () => set((s) => ({ tmp: { ...s.tmp, chat: [], chatStarted: false } })),
  pushChat: (msg) => set((s) => ({ tmp: { ...s.tmp, chat: [...s.tmp.chat, msg] } })),
  popChat: () => set((s) => ({ tmp: { ...s.tmp, chat: s.tmp.chat.slice(0, -1) } })),

  toast: null,
  showToast: (message, icon = 'check') => {
    set({ toast: { message, icon, key: Date.now() } });
    setTimeout(() => {
      if (get().toast?.message === message) set({ toast: null });
    }, 2200);
  },

  sheet: null, // { content: ReactNode } | null
  openSheet: (content) => set({ sheet: content }),
  closeSheet: () => set({ sheet: null }),
}));

export const MODE_META = {
  buy: { label: 'Buy', icon: 'cart', desc: 'Find and purchase what you need.' },
  build: { label: 'Build', icon: 'wrench', desc: 'Turn an idea into sourced components.' },
  earn: { label: 'Earn', icon: 'handshake', desc: 'Bring opportunities, earn commission.' },
};

export const ROOT_SCREEN = { buy: '/buy', build: '/build', earn: '/earn' };
