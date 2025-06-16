export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  rating?: number;
  rank?: string; // 棋力（段級位）
  is_public: boolean; // プロフィール公開設定
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileData {
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  rank?: string;
  is_public?: boolean;
}

export interface ProfileStats {
  total_games: number;
  wins: number;
  losses: number;
  draws: number;
  win_rate: number;
}