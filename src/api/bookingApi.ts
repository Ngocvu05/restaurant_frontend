import { get } from 'http';
import axiosConfig from './axiosConfig';
export interface BookingRequest {
  userId: number;
  tableId: number;
  bookingTime: string;
  numberOfGuests: number;
  note?: string;
}

export const bookingApi = {
  createBooking: (data: BookingRequest) => {
    return axiosConfig.post('/bookings', data);
  },
  getAllBookings: () => {
    return axiosConfig.get('/bookings');
  },
  getBookingHistory: () => {
    return axiosConfig.get('/bookings/history');
  },
  getTableInfoById: (tableId: number) => {
    return axiosConfig.get(`/tables/${tableId}`);
  },
  getBookingDetail: (id: string | number) => {
    return axiosConfig.get(`/bookings/${id}`);
  },
  getDishById: (id: number) => {
    return axiosConfig.get(`/dishes/${id}`);
  }
}