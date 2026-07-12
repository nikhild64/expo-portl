declare module 'react-native-razorpay' {
  type CheckoutOptions = {
    amount: number;
    currency: string;
    description?: string;
    key: string;
    name: string;
    notes?: Record<string, string>;
    order_id: string;
    prefill?: { contact?: string; email?: string; name?: string };
    theme?: { color?: string };
  };

  type CheckoutResult = {
    razorpay_order_id?: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  };

  const RazorpayCheckout: {
    open(options: CheckoutOptions): Promise<CheckoutResult>;
  };

  export default RazorpayCheckout;
}
