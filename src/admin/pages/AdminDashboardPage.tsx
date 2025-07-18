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

const AdminDashboardPage: React.FC = () => {
  const [revenueData, setRevenueData] = useState<any>(null);
  const [bookingStats, setBookingStats] = useState<any>(null);
  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d;
  });
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [totalRevenue, setTotalRevenue] = useState<number>(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const start = new Date('2025-06-26T00:00:00').toISOString().slice(0, 19); // "2025-06-26T00:00:00"
      const end = new Date('2025-07-02T23:59:59').toISOString().slice(0, 19);

      const [revenueRes, statsRes] = await Promise.all([
        axios.get(`/admin/revenue?start=${start}&end=${end}`),
        axios.get(`/admin/bookings/status`)
      ]);

      setRevenueData(revenueRes.data);
      setBookingStats(statsRes.data);

      // Tính tổng doanh thu
      const total = revenueRes.data.reduce((acc: number, item: any) => acc + Number(item.totalRevenue), 0);

      setTotalRevenue(total);
    };

    fetchDashboardData();
  }, [startDate, endDate]);

  const lineChartData = {
    labels: revenueData?.map((item: any) => item.date),
    datasets: [{
      label: 'Doanh thu (VNĐ)',
      data: revenueData?.map((item: any) => item.totalRevenue),
      borderColor: '#007bff',
      backgroundColor: 'rgba(0,123,255,0.1)',
      tension: 0.3,
      fill: true
    }]
  };

  const pieChartData = {
    labels: bookingStats ? Object.keys(bookingStats) : [],
    datasets: [{
      data: bookingStats ? Object.values(bookingStats) : [],
      backgroundColor: ['#28a745', '#ffc107', '#dc3545', '#17a2b8'],
      hoverOffset: 10
    }]
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Thống kê tổng quan</h2>

      <div className="row mb-3">
        <div className="col-md-3">
          <label>Từ ngày:</label>
          <DatePicker
            className="form-control"
            selected={startDate}
            onChange={(date: Date | null) => {
              if(date) setStartDate(date);
            }}
            selectsStart
            startDate={startDate}
            endDate={endDate}
          />
        </div>
        <div className="col-md-3">
          <label>Đến ngày:</label>
          <DatePicker
            className="form-control"
            selected={endDate}
            onChange={(date: Date | null) => {
              if (date) setEndDate(date);
            }}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
          />
        </div>
        <div className="col-md-3 d-flex align-items-end">
          <h5 className="mb-0"><p>
                Tổng doanh thu:{" "}
                <span className="text-green-600">
                  {isNaN(Number(totalRevenue)) ? "0" : Number(totalRevenue).toLocaleString()} đ
                </span>
              </p>
            </h5>
        </div>
      </div>

      <div className="row">
        <div className="col-md-8">
          <div className="card p-3 shadow">
            <h5>Biểu đồ doanh thu</h5>
            <Line data={lineChartData} />
          </div>
        </div>
        <div className="col-md-4">
          <div className="card p-3 shadow">
            <h5>Trạng thái đặt bàn</h5>
            <Pie data={pieChartData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
