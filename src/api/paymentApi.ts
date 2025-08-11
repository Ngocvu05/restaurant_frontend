import api from './axiosConfigUser';

export interface CreatePaymentRequest {
  paymentMethod: string;
  bookingId: number;
  amount: number;
  orderInfo?: string;
}

export interface PaymentStatus {
  id: number;
  bookingId: number;
  amount: number;
  paymentMethod: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'COMPLETED';
  transactionId?: string;
  paymentTime?: string;
  paymentUrl?: string;
}

export interface PaymentMethod {
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
}

export interface SupportedPaymentMethods {
  MOMO: PaymentMethod;
  VNPAY: PaymentMethod;
  CASH: PaymentMethod;
  CARD: PaymentMethod;
}

export interface RefundRequest {
  txnRef: string;
  amount: number;
  reason?: string;
}

export const paymentApi = {
  // Tạo yêu cầu thanh toán thống nhất
  createPayment: async (request: CreatePaymentRequest) => {
    const response = await api.post('/payments/create', request);
    return response.data;
  },

  // Lấy trạng thái thanh toán
  getPaymentStatus: async (paymentId: number) => {
    const response = await api.get(`/payments/status/${paymentId}`);
    return response.data;
  },

  // Lấy danh sách phương thức thanh toán được hỗ trợ
  getSupportedPaymentMethods: async (): Promise<{ success: boolean; data: SupportedPaymentMethods }> => {
    const response = await api.get('/payments/methods');
    return response.data;
  },

  // Test tất cả phương thức thanh toán
  testAllPaymentMethods: async () => {
    const response = await api.get('/payments/test/all');
    return response.data;
  },

  // VNPay specific methods
  vnpay: {
    // Tạo thanh toán VNPay
    createPayment: async (request: CreatePaymentRequest) => {
      const response = await api.post('/payments/vnpay/create', request);
      return response.data;
    },

    // Lấy trạng thái thanh toán VNPay
    getPaymentStatus: async (paymentId: number) => {
      const response = await api.get(`/payments/vnpay/status/${paymentId}`);
      return response.data;
    },

    // Query transaction từ VNPay
    queryTransaction: async (txnRef: string) => {
      const response = await api.get(`/payments/vnpay/query/${txnRef}`);
      return response.data;
    },

    // Refund transaction
    refundTransaction: async (request: RefundRequest) => {
      const response = await api.post('/payments/vnpay/refund', request);
      return response.data;
    },

    // Test VNPay connection
    test: async () => {
      const response = await api.get('/payments/vnpay/test');
      return response.data;
    }
  }
};