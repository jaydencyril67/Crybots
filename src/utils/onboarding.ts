import { navigate } from './navigate';

const COMPLETED_STEPS_KEY = 'crybots_onboarding_completed_steps';
const RETURN_STEP_KEY = 'crybots_onboarding_return_step';

/** Return to onboarding only when this setup page was opened from a matching wizard step. */
export const completeOnboardingStep = (stepId: string) => {
  if (typeof window === 'undefined') return;
  try {
    if (window.localStorage.getItem(RETURN_STEP_KEY) !== stepId) return;
    const stored = JSON.parse(window.localStorage.getItem(COMPLETED_STEPS_KEY) || '[]');
    const completed: string[] = Array.isArray(stored) ? stored.filter((item): item is string => typeof item === 'string') : [];
    if (!completed.includes(stepId)) completed.push(stepId);
    window.localStorage.setItem(COMPLETED_STEPS_KEY, JSON.stringify(completed));
    navigate('/onboarding');
  } catch {
    // Setup should still succeed even if local storage is unavailable.
  }
};
