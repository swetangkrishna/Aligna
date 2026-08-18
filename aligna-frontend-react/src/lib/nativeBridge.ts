declare global {
  interface Window {
    Android?: Record<string, (...args: any[]) => any>;
    AlignaAI?: Record<string, (...args: any[]) => any>;
    AlignaAuth?: Record<string, (...args: any[]) => any>;
    AlignaActions?: {
      executeConfirmedAction?: (action: unknown) => Promise<unknown>;
    };
  }
}

export const nativeBridge = {
  isAndroid() {
    return Boolean(window.Android);
  },

  askAI(prompt: string) {
    const ai = window.AlignaAI;
    if (!ai) return false;

    const fn =
      ai.ask ??
      ai.sendMessage ??
      ai.generate;

    if (typeof fn !== "function") return false;
    fn(prompt);
    return true;
  },

  logout() {
    window.AlignaAuth?.logout?.();
  },

  executeAction(action: unknown) {
    return window.AlignaActions?.executeConfirmedAction?.(action);
  }
};
