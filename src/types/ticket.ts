export interface CoffeeHistory {
  storeName: string;
  coffeeName: string;
  ticketCount: number;
  exchangeDate: string;
  imageUrl: string;
  number: number; // 店舗の番号
}

export interface HistoryGroup {
  date: string;
  histories: CoffeeHistory[];
}

export interface EventDate {
  id: string;
  date: string;
  time: string;
}

export interface Event {
  id: string;
  name: string;
  theme: string | null;
  image_url: string | null;
  event_number: number | null;
  event_dates: EventDate[];
  status: string;
  country?: string;
  prefecture?: string;
  city?: string;
  reception_location?: string;
}

export interface Shop {
  name: string;
  coffeeName: string;
  description: string;
  coffeeIntro: string;
  imageUrl: string;
  number: number;
}
