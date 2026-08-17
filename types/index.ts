// Shared database and app types for LiFePath.

export type Role = 'mentee' | 'mentor';

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: Role;
  bio: string | null;
  interests: string[] | null;
  created_at: string;
}

export interface MentorProfile {
  id: string;
  headline: string | null;
  expertise: string[] | null;
  categories: string[] | null;
  is_available: boolean;
  profile?: Profile | null;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
  milestones?: GoalMilestone[];
}

export interface GoalMilestone {
  id: string;
  goal_id: string;
  title: string;
  is_completed: boolean;
  completed_at: string | null;
}

export interface MentorshipRequest {
  id: string;
  mentee_id: string;
  mentor_id: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  mentee?: Profile | null;
}

export interface Conversation {
  id: string;
  mentorship_id: string | null;
  created_at: string;
  // Joined from related profiles for the list view.
  other_participant?: Profile | null;
  last_message?: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export type Category =
  | 'Technology'
  | 'Business'
  | 'Career Planning'
  | 'Education'
  | 'Personal Development'
  | 'Creative'
  | 'Health'
  | 'Other';

export const CATEGORIES: Category[] = [
  'Technology',
  'Business',
  'Career Planning',
  'Education',
  'Personal Development',
  'Creative',
  'Health',
  'Other',
];
