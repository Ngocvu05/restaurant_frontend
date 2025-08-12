import api from '../../api/axiosConfigUser';

export interface PaymentConfirmationRequest {
  bookingId: number;
  amount: number;
  paymentMethod?: string;
  transactionReference?: string;
  customerNote?: string;
}

export interface PaymentConfirmationDTO {
  id: number;
  bookingId: number;
  amount: number;
  paymentMethod: string;
  transactionReference: string;
  customerNote?: string;
  adminNote?: string;
  status: 'PENDING' | 'REJECTED' | 'FAILED' | 'SUCCESS' | 'CANCELED';
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
  // Booking info
  customerName?: string;
  tableNumber?: number;
  bookingTime?: string;
  bookingStatus?: string;
}

export interface AdminConfirmationRequest {
  adminNote: string;
  processedBy?: string;
}

class PaymentConfirmationApi {
  private readonly userBaseUrl = '/payments';
  private readonly adminBaseUrl = '/admin/payments';

  // ===== USER ENDPOINTS =====
  
  /**
   * User tạo yêu cầu xác nhận thanh toán
   */
  async requestPaymentConfirmation(request: PaymentConfirmationRequest): Promise<PaymentConfirmationDTO> {
    try {
      console.log('Requesting payment confirmation:', request);
      const response = await api.post(this.userBaseUrl, request);
      return response.data;
    } catch (error: any) {
      console.error('Error requesting payment confirmation:', error);
      throw new Error(error.response?.data?.message || 'Không thể gửi yêu cầu xác nhận thanh toán');
    }
  }

  /**
   * User kiểm tra trạng thái xác nhận
   */
  async getConfirmationStatus(bookingId: number): Promise<PaymentConfirmationDTO | null> {
    try {
      const response = await api.get(`${this.userBaseUrl}/booking/${bookingId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // Chưa có yêu cầu xác nhận nào
      }
      console.error('Error getting confirmation status:', error);
      throw new Error(error.response?.data?.message || 'Không thể kiểm tra trạng thái xác nhận');
    }
  }

  // ===== ADMIN ENDPOINTS =====

  /**
   * Lấy tất cả yêu cầu pending
   */
  async getPendingConfirmations(): Promise<PaymentConfirmationDTO[]> {
    try {
      const response = await api.get(`${this.adminBaseUrl}/pending`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting pending confirmations:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách xác nhận');
    }
  }

  /**
   * Lấy xác nhận theo trạng thái
   */
  async getConfirmationsByStatus(status: string = 'PENDING'): Promise<PaymentConfirmationDTO[]> {
    try {
      const response = await api.get(`${this.adminBaseUrl}?status=${status}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting confirmations by status:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách xác nhận');
    }
  }

  /**
   * Lấy xác nhận theo booking ID - THÊM MỚI
   */
  async getConfirmationsByBooking(bookingId: number): Promise<PaymentConfirmationDTO[]> {
    try {
      const response = await api.get(`${this.adminBaseUrl}/booking/${bookingId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return []; // Không có yêu cầu xác nhận nào
      }
      console.error('Error getting confirmations by booking:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách xác nhận thanh toán');
    }
  }

  /**
   * Admin xác nhận thanh toán
   */
  async confirmPayment(id: number, adminNote: string): Promise<PaymentConfirmationDTO> {
    try {
      const response = await api.put(`${this.adminBaseUrl}/${id}/confirm`, {
        adminNote,
        processedBy: 'admin' // TODO: Get from current user context
      });
      return response.data;
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      throw new Error(error.response?.data?.message || 'Không thể xác nhận thanh toán');
    }
  }

  /**
   * Admin từ chối thanh toán
   */
  async rejectPayment(id: number, adminNote: string): Promise<PaymentConfirmationDTO> {
    try {
      const response = await api.put(`${this.adminBaseUrl}/${id}/reject`, {
        adminNote,
        processedBy: 'admin' // TODO: Get from current user context
      });
      return response.data;
    } catch (error: any) {
      console.error('Error rejecting payment:', error);
      throw new Error(error.response?.data?.message || 'Không thể từ chối thanh toán');
    }
  }

  /**
   * Lấy thống kê xác nhận
   */
  async getConfirmationStats(): Promise<{
    pending: number;
    confirmed: number;
    rejected: number;
    total: number;
  }> {
    try {
      const response = await api.get(`${this.adminBaseUrl}/stats`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting confirmation stats:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải thống kê');
    }
  }
}

export const paymentConfirmationApi = new PaymentConfirmationApi();