declare module 'razorpay' {
  interface OrdersCreateOptions {
    amount: number;
    currency: string;
    receipt?: string;
    notes?: Record<string, string>;
    payment_capture?: number;
  }

  interface OrderResponse {
    id: string;
    entity: string;
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt: string;
    status: string;
    attempts: number;
    notes: Record<string, string>;
    created_at: number;
  }

  class Razorpay {
    constructor(options: { key_id: string; key_secret: string });
    orders: {
      create(options: OrdersCreateOptions): Promise<OrderResponse>;
      fetch(orderId: string): Promise<OrderResponse>;
    };
    payments: {
      fetch(paymentId: string): Promise<any>;
    };
  }

  export default Razorpay;
}
