import React, { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import moment from "moment";
import { bookingApi } from "../api/bookingApi";
import useTableCache from '../hooks/useTableCache';
import { Link } from "react-router-dom";

interface Booking {
  id: number;
  tableId: number;
  bookingTime: string;
  totalAmount: number;
  status: string;
}

const BookingHistoryPage: React.FC = () => {
  const { tables, loading: loadingTables } = useTableCache();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await bookingApi.getBookingHistory();
        console.log("Booking History result", response.data);
        setBookings(response.data);
      } catch (error) {
        console.error("Error fetching booking history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const getTableName = (tableId: number) => {
    const table = tables.find(t => t.id === tableId);
    return table ? table.tableName : `Bàn #${tableId}`;
  };

  if (loadingTables) return <div className="text-center mt-5" style={{ paddingTop: '120px' }}>Đang tải danh sách bàn...</div>;

  return (
    <div className="container mt-5" style={{ paddingTop: '120px' }}>
      <h3 className="mb-4">Lịch sử đặt bàn của bạn</h3>
      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="alert alert-info text-center">Bạn chưa có đặt bàn nào.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-dark">
                <tr>
                    <th>Mã đặt bàn</th>
                    <th>Bàn</th>
                    <th>Thời gian</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th> {/* ✅ thêm cột này */}
                </tr>
            </thead>
            <tbody>
                {bookings.map((booking) => (
                    <tr key={booking.id}>
                    <td>{booking.id}</td>
                    <td>{getTableName(booking.tableId)}</td>
                    <td>{moment(booking.bookingTime).format("HH:mm DD/MM/YYYY")}</td>
                    <td>{Number(booking.totalAmount || 0).toLocaleString()} VND</td>
                    <td>
                        <span className={`badge bg-${getStatusColor(booking.status)}`}>
                        {booking.status}
                        </span>
                    </td>
                    <td>
                        <Link
                        to={`/bookings-history/${booking.id}`}
                        className="btn btn-sm btn-outline-primary">
                        <i className="bi bi-eye"></i> Xem
                        </Link>
                    </td>
                    </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "confirmed":
      return "success";
    case "cancelled":
      return "danger";
    case "pending":
      return "warning";
    default:
      return "secondary";
  }
};

export default BookingHistoryPage;
