// Module-level callback so any component can imperatively open the quiz
let opener: (() => void) | null = null;

export const registerQuizOpener = (fn: () => void) => {
  opener = fn;
};

export const openQuiz = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('quiz_dismissed');
  }
  opener?.();
};
