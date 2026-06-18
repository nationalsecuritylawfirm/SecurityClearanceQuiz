// localStorage keys
const KEYS = { quizzes: 'ql_quizzes', responses: 'ql_responses' };

const Storage = {
  // ── Quizzes ──────────────────────────────────

  init() {
    if (!localStorage.getItem(KEYS.quizzes)) {
      localStorage.setItem(KEYS.quizzes, JSON.stringify(SEED_QUIZZES));
    }
  },

  getQuizzes() {
    return JSON.parse(localStorage.getItem(KEYS.quizzes) || '[]');
  },

  getQuiz(id) {
    return this.getQuizzes().find(q => q.id === id || q.slug === id) || null;
  },

  saveQuiz(quiz) {
    const quizzes = this.getQuizzes();
    const idx = quizzes.findIndex(q => q.id === quiz.id);
    if (idx >= 0) quizzes[idx] = quiz;
    else quizzes.push(quiz);
    localStorage.setItem(KEYS.quizzes, JSON.stringify(quizzes));
  },

  deleteQuiz(id) {
    const quizzes = this.getQuizzes().filter(q => q.id !== id);
    localStorage.setItem(KEYS.quizzes, JSON.stringify(quizzes));
  },

  // ── Responses ────────────────────────────────

  getResponses() {
    return JSON.parse(localStorage.getItem(KEYS.responses) || '[]');
  },

  saveResponse(response) {
    const responses = this.getResponses();
    responses.unshift(response); // newest first
    localStorage.setItem(KEYS.responses, JSON.stringify(responses));
  },

  deleteResponse(id) {
    const responses = this.getResponses().filter(r => r.id !== id);
    localStorage.setItem(KEYS.responses, JSON.stringify(responses));
  },

  clearResponses() {
    localStorage.setItem(KEYS.responses, '[]');
  },

  // ── Scoring ──────────────────────────────────

  scoreAnswers(quiz, selectedOptions) {
    // selectedOptions: array of option objects (one per question)
    let maxTier = 1;
    const allFlags = [];

    for (const opt of selectedOptions) {
      if (opt.tier > maxTier) maxTier = opt.tier;
      for (const flag of opt.flags) {
        if (!allFlags.includes(flag)) allFlags.push(flag);
      }
    }

    const result = quiz.results.find(r => r.tier === maxTier);
    const topFlags = allFlags.slice(0, 3);

    return { tier: maxTier, result, flags: topFlags };
  },

  // ── Utilities ────────────────────────────────

  generateId() {
    return 'id_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now().toString(36);
  },
};
