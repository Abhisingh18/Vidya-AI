// Feedback constants shared by the client (FeedbackBar) and the server (src/lib/feedback.ts).

export const FEEDBACK_FEATURES = {
  doubt: 'student',
  flashcards: 'student',
  notes: 'student',
  mock: 'student',
  plan: 'student',
  slides: 'teacher',
  quiz: 'teacher',
  lesson: 'teacher',
  exam: 'teacher',
} as const;
export type FeedbackFeature = keyof typeof FEEDBACK_FEATURES;

export const FEEDBACK_REASONS = {
  wrong: 'Something is wrong',
  unclear: 'Hard to understand',
  too_long: 'Too long',
  too_short: 'Not detailed enough',
  language: 'Wrong language or level',
  other: 'Something else',
} as const;
export type FeedbackReason = keyof typeof FEEDBACK_REASONS;

export const MAX_FEEDBACK_NOTE = 300;

export const isFeature = (v: unknown): v is FeedbackFeature => typeof v === 'string' && v in FEEDBACK_FEATURES;
export const isReason = (v: unknown): v is FeedbackReason => typeof v === 'string' && v in FEEDBACK_REASONS;
