export interface CoffeeHistory {
  storeName: string;
  coffeeName: string;
  ticketCount: number;
  exchangeDate: string;
  imageUrl: string;
}

export interface HistoryGroup {
  date: string;
  histories: CoffeeHistory[];
}

export interface Event {
  id: number;
  title: string;
  date: string;
  theme: string;
  imageUrl: string;
}

export interface Shop {
  name: string;
  coffeeName: string;
  description: string;
  coffeeIntro: string;
  imageUrl: string;
}
