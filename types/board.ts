export interface Board {
  id: string;
  name: string;
  description: string | null;
  vibe: string;
  background_color: string | null;
  owner_id: string;
  is_public: boolean;
  team_id: string | null;
  status: 'draft' | 'in_review' | 'approved';
}

export interface Tack {
  id: string;
  content_url: string;
  title: string | null;
  note: string | null;
  source: string | null;
  pin_color: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  rotation: number;
  z_index: number;
  origin_item_id: string | null;
  added_by: string | null;
  added_by_profile: { id: string; name: string | null; avatar_url: string | null } | null;
  hidden_as_ai: boolean;
}

export interface TextBlock {
  id: string;
  content: string;
  font_style: string;
  font_size: number;
  color: string;
  position_x: number;
  position_y: number;
  width: number;
  rotation: number;
  z_index: number;
  nowrap: boolean;
}
