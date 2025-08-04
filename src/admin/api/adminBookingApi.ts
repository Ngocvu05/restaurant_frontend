import axios from '../../api/axiosConfigUser';

export interface PreOrderDTO {
  id?: number;
  bookingId?: number;
  dishId: number;
  quantity: number;
  note?: string;
}

export interface BookingDTO {
  id?: number;
  userId?: number;
  username?: string;
  tableId?: number;
  bookingTime: string;
  numberOfGuests?: number;
  numberOfPeople?: number;
  note?: string;
  status?: string;
  totalAmount?: number;
  preOrderDishes?: PreOrderDTO[];
}

export interface Booking {
  id?: number;
  username?: string;
  tableId?: number;
  bookingTime?: string;
  numberOfGuests?: number;
  status?: string;
  note?: string;
}

// BaseURL is: http://localhost:8080/users/api/v1
const API_BASE_URL = '/admin/bookings';

// API functions
export const getAllBookings = async (): Promise<BookingDTO[]> => {
  try {
    const response = await axios.get<BookingDTO[]>(API_BASE_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }
};

export const getBookingById = async (id: number): Promise<BookingDTO> => {
  try {
    const response = await axios.get<BookingDTO>(`${API_BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching booking by id:', error);
    throw error;
  }
};

export const createBooking = async (bookingData: Partial<BookingDTO>): Promise<BookingDTO> => {
  try {
    const response = await axios.post<BookingDTO>(API_BASE_URL, bookingData);
    return response.data;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

export const updateBooking = async (id: number, bookingData: Partial<BookingDTO>): Promise<BookingDTO> => {
  try {
    const response = await axios.put<BookingDTO>(`${API_BASE_URL}/${id}`, bookingData);
    return response.data;
  } catch (error) {
    console.error('Error updating booking:', error);
    throw error;
  }
};

export const deleteBooking = async (id: number): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/${id}`);
  } catch (error) {
    console.error('Error deleting booking:', error);
    throw error;
  }
};

export const cancelBooking = async (id: number): Promise<BookingDTO> => {
  try {
    const response = await axios.put<BookingDTO>(`${API_BASE_URL}/${id}/cancel`);
    return response.data;
  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw error;
  }
};