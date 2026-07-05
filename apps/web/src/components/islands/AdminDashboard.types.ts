export interface DashboardData {
  stats: {
    salesToday: number;
    salesMonth: number;
    ordersToday: number;
    activeOrders: number;
    avgTicket: number;
    pendingBizum: number;
    outOfStock: number;
    unseenAlerts: number;
  };
  pipeline: { pending: number; confirmed: number; preparing: number; delivering: number };
  payments: { bizum: number; tpv: number; cash: number };
  settings: {
    delivery_fee_cents: number;
    free_delivery_from_cents: number;
    bizum_phone: string;
    delivery_enabled: boolean;
  };
  topDishes: { name: string; qty: number; revenue_cents: number }[];
  series: { d: string; total: number; label: string }[];
  recentOrders: {
    id: string;
    number: string;
    customer_name: string;
    total_cents: number;
    status: string;
    payment_method: string;
    created_at: string;
  }[];
}
