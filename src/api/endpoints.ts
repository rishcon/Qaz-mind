import { apiRequest, ApiError } from './client';

// ----- DTOs returned by /api/v1 (snake_case, as on the server) ---------------------------------

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  email_verified: boolean;
  created_at: string;
}

export interface MeResponse {
  user: ApiUser;
  onboarding_completed: boolean;
}

export interface StatusResponse {
  status: string;
}

export interface ApiProfile {
  interface_lang: 'ru' | 'kz';
  exam_lang: 'ru' | 'kz';
  profile_pair_id: string;
  target_score: number;
  exam_year: number;
  exam_period: 'june_main' | 'march_paid' | 'ent_2027';
  daily_goal_minutes: number;
  onboarding_completed_at: string | null;
}

export interface ApiProfilePair {
  id: string;
  code: string;
  title_ru: string;
  title_kz: string;
  cluster_ru: string;
  cluster_kz: string;
  subject_codes: string[];
}

export interface OnboardingPayload {
  interface_lang: 'ru' | 'kz';
  exam_lang: 'ru' | 'kz';
  profile_pair_id: string;
  target_score: number;
  exam_year: number;
  exam_period: ApiProfile['exam_period'];
  daily_goal_minutes: number;
}

export type ProfilePatch = Partial<OnboardingPayload>;

// ----- auth ------------------------------------------------------------------------------------

export const authApi = {
  register: (name: string, email: string, password: string) =>
    apiRequest<StatusResponse>('POST', '/auth/register', { name, email, password }),
  verifyEmail: (token: string) => apiRequest<MeResponse>('POST', '/auth/verify-email', { token }),
  resendVerification: (email: string) => apiRequest<StatusResponse>('POST', '/auth/resend-verification', { email }),
  login: (email: string, password: string) => apiRequest<MeResponse>('POST', '/auth/login', { email, password }),
  logout: () => apiRequest<void>('POST', '/auth/logout'),
  me: () => apiRequest<MeResponse>('GET', '/auth/me'),
  forgotPassword: (email: string) => apiRequest<StatusResponse>('POST', '/auth/password/forgot', { email }),
  resetPassword: (token: string, password: string) =>
    apiRequest<StatusResponse>('POST', '/auth/password/reset', { token, password }),
};

// ----- profile ---------------------------------------------------------------------------------

export const profileApi = {
  /** Returns null when onboarding has not been completed yet (the server answers 404). */
  getProfile: async (): Promise<ApiProfile | null> => {
    try {
      return await apiRequest<ApiProfile>('GET', '/me/profile');
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
  completeOnboarding: (payload: OnboardingPayload) =>
    apiRequest<ApiProfile>('POST', '/me/onboarding/complete', payload),
  updateProfile: (patch: ProfilePatch) => apiRequest<ApiProfile>('PATCH', '/me/profile', patch),
  listProfilePairs: () => apiRequest<ApiProfilePair[]>('GET', '/catalog/profile-pairs'),
};
