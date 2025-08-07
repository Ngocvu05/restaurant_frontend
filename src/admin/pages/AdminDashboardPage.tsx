import React, { useEffect, useState } from 'react';
import axios from '../../api/axiosConfigUser';
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  ArcElement,
  Title
} from 'chart.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

Chart.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend, ArcElement, Title);

interface BookingData {
  date: string;
  totalRevenue: number;
}

interface Booking {
  id: number;
  bookingDate: string;
  totalAmount: number;
  status: string;
  // thêm các thuộc tính khác nếu cần
}

interface BookingStats {
  [key: string]: number;
}

const AdminDashboardPage: React.FC = () => {
  const [revenueData, setRevenueData] = useState<BookingData[]>([]);
  const [bookingStats, setBookingStats] = useState<BookingStats>({});
  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d;
  });
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Hàm chuyển đổi dữ liệu từ Booking[] sang BookingData[]
  const processBookingData = (bookings: Booking[]): BookingData[] => {
    if (!Array.isArray(bookings) || bookings.length === 0) {
      return [];
    }

    // Group bookings by date and sum revenue
    const revenueByDate: { [key: string]: number } = {};
    
    bookings.forEach((booking) => {
      if (booking.bookingDate && booking.totalAmount) {
        // Format date to YYYY-MM-DD
        const date = new Date(booking.bookingDate).toISOString().split('T')[0];
        const amount = Number(booking.totalAmount) || 0;
        
        if (revenueByDate[date]) {
          revenueByDate[date] += amount;
        } else {
          revenueByDate[date] = amount;
        }
      }
    });

    // Convert to array format
    return Object.entries(revenueByDate).map(([date, totalRevenue]) => ({
      date,
      totalRevenue
    })).sort((a, b) => a.date.localeCompare(b.date));
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Format dates properly for the API
      const start = startDate.toISOString().slice(0, 19);
      const end = endDate.toISOString().slice(0, 19);

      console.log('Fetching data with dates:', { start, end });

      const [revenueRes, statsRes] = await Promise.all([
        axios.get(`/admin/revenue?start=${start}&end=${end}`),
        axios.get(`/admin/bookings/status`)
      ]);

      console.log('Revenue response:', revenueRes.data);
      console.log('Stats response:', statsRes.data);

      // Xử lý dữ liệu revenue - kiểm tra và convert từ Booking[] sang BookingData[]
      let rawBookings: Booking[] = [];
      if (Array.isArray(revenueRes.data)) {
        rawBookings = revenueRes.data;
      } else if (revenueRes.data && typeof revenueRes.data === 'object') {
        // Nếu API trả về object wrapper
        if (revenueRes.data.data && Array.isArray(revenueRes.data.data)) {
          rawBookings = revenueRes.data.data;
        } else if (revenueRes.data.bookings && Array.isArray(revenueRes.data.bookings)) {
          rawBookings = revenueRes.data.bookings;
        } else {
          console.warn('Unexpected revenue data format:', revenueRes.data);
          rawBookings = [];
        }
      } else {
        console.warn('Revenue data is not in expected format:', revenueRes.data);
        rawBookings = [];
      }

      // Chuyển đổi dữ liệu
      const processedRevenueData = processBookingData(rawBookings);
      setRevenueData(processedRevenueData);

      // Kiểm tra và xử lý dữ liệu booking stats
      const processedBookingStats = statsRes.data && typeof statsRes.data === 'object' 
        ? statsRes.data 
        : {};
      
      setBookingStats(processedBookingStats);

      // Tính tổng doanh thu từ raw bookings
      const total = rawBookings.reduce((acc: number, booking: Booking) => {
        const amount = Number(booking.totalAmount) || 0;
        return acc + amount;
      }, 0);

      setTotalRevenue(total);

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError(error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi tải dữ liệu');
      
      // Set default values in case of error
      setRevenueData([]);
      setBookingStats({});
      setTotalRevenue(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [startDate, endDate]);

  // Tạo data cho Line chart với kiểm tra an toàn
  const lineChartData = {
    labels: revenueData?.map((item: BookingData) => {
      // Format date for display (DD/MM/YYYY)
      const date = new Date(item.date);
      return date.toLocaleDateString('vi-VN');
    }) || [],
    datasets: [{
      label: 'Doanh thu (VNĐ)',
      data: revenueData?.map((item: BookingData) => Number(item.totalRevenue) || 0) || [],
      borderColor: '#007bff',
      backgroundColor: 'rgba(0,123,255,0.1)',
      tension: 0.3,
      fill: true
    }]
  };

  // Tạo data cho Pie chart với kiểm tra an toàn
  const pieChartData = {
    labels: Object.keys(bookingStats),
    datasets: [{
      data: Object.values(bookingStats),
      backgroundColor: ['#28a745', '#ffc107', '#dc3545', '#17a2b8'],
      hoverOffset: 10
    }]
  };

  const handleDateChange = () => {
    if (startDate && endDate && startDate <= endDate) {
      fetchDashboardData();
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Thống kê tổng quan</h2>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="row mb-3">
        <div className="col-md-3">
          <label>Từ ngày:</label>
          <DatePicker
            className="form-control"
            selected={startDate}
            onChange={(date: Date | null) => {
              if(date) {
                setStartDate(date);
              }
            }}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            dateFormat="dd/MM/yyyy"
          />
        </div>
        <div className="col-md-3">
          <label>Đến ngày:</label>
          <DatePicker
            className="form-control"
            selected={endDate}
            onChange={(date: Date | null) => {
              if (date) {
                setEndDate(date);
              }
            }}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            dateFormat="dd/MM/yyyy"
          />
        </div>
        <div className="col-md-3 d-flex align-items-end">
          <button 
            className="btn btn-primary"
            onClick={handleDateChange}
            disabled={loading}
          >
            {loading ? 'Đang tải...' : 'Cập nhật'}
          </button>
        </div>
        <div className="col-md-3 d-flex align-items-end">
          <h5 className="mb-0">
            <p>
              Tổng doanh thu:{" "}
              <span className="text-success">
                {totalRevenue.toLocaleString('vi-VN')} đ
              </span>
            </p>
          </h5>
        </div>
      </div>

      {loading ? (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="row">
          <div className="col-md-8">
            <div className="card p-3 shadow">
              <h5>Biểu đồ doanh thu</h5>
              {revenueData.length > 0 ? (
                <Line data={lineChartData} />
              ) : (
                <p className="text-muted">Không có dữ liệu doanh thu trong khoảng thời gian này</p>
              )}
            </div>
          </div>
          <div className="col-md-4">
            <div className="card p-3 shadow">
              <h5>Trạng thái đặt bàn</h5>
              {Object.keys(bookingStats).length > 0 ? (
                <Pie data={pieChartData} />
              ) : (
                <p className="text-muted">Không có dữ liệu thống kê đặt bàn</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;