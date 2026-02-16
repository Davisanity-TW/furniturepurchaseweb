export type ItemStatus = "want" | "candidate" | "purchased" | "eliminated";

export type Room =
  | "客廳"
  | "廚房"
  | "電腦房"
  | "小房間"
  | "主臥室"
  | "浴室";

export type Item = {
  id: string;
  name: string;
  category: string;
  room: Room;
  brand: string | null;
  model: string | null;
  price: number | null;
  currency: string;
  url: string | null;
  note: string | null;
  status: ItemStatus;
  image_path: string | null;
  purchased_at: string | null;
  created_at: string;
  updated_at: string;
};
