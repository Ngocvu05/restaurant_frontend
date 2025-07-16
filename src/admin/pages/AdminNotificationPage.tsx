import React, { useState } from 'react';
import axiosConfig from '../../api/axiosConfig';
import { useQuery } from '@tanstack/react-query';
import { toast, Slide } from 'react-toastify';
import ClipLoader from 'react-spinners/ClipLoader';
import 'react-toastify/dist/ReactToastify.css';

interface Notification {
  id: number;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationResponse {
  content: Notification[];
  first: boolean;
  last: boolean;
  totalPages: number;
  totalElements: number;
}

const AdminNotificationPage = () => {
  const [page, setPage] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const fetchNotifications = async (): Promise<NotificationResponse> => {
    const response = await axiosConfig.get(`/admin/notifications/?page=${page}&size=10`);
    console.log("notification respone:",response.data);
    return response.data;
  };

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery<NotificationResponse, Error>({
    queryKey: ['notifications', page],
    queryFn: fetchNotifications,
    staleTime: 10000,
    refetchInterval: 10000,
    // @ts-expect-error: keepPreviousData is for backward compatibility
    keepPreviousData: true,
  });

  // Helper to safely get NotificationResponse fields
  const notiData = data as unknown as NotificationResponse | undefined;

  const markAsRead = async (id: number) => {
    try {
      await axiosConfig.put(`/admin/notifications/${id}/mark-read`);
      toast.success('Đã đánh dấu là đã đọc', { transition: Slide });
      refetch();
    } catch (error) {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Thông báo hệ thống</h2>

      {(isLoading || isFetching) && (
        <div className="text-center my-4">
          <ClipLoader size={35} color="#0d6efd" />
        </div>
      )}

      {isError && (
        <div className="text-center text-danger my-4">Lỗi khi tải thông báo!</div>
      )}

      {!isLoading && !isError && notiData && (
        <>
          <div className="space-y-3">
            {notiData.content && notiData.content.length > 0 ? (
              notiData.content.map((noti: Notification) => (
                <div
                  key={noti.id}
                  className={`p-4 border rounded-lg shadow-sm transition-all duration-300 cursor-pointer hover:bg-gray-100 ${noti.isRead ? 'bg-white' : 'bg-yellow-50'}`}
                  onClick={() => {
                    if (!noti.isRead) markAsRead(noti.id);
                    setSelectedNotification(noti);
                  }}
                >
                  <div className="d-flex justify-content-between">
                    <h5 className="mb-1">{noti.title}</h5>
                    <small className="text-muted">{new Date(noti.createdAt).toLocaleString()}</small>
                  </div>
                  <p className="text-muted mb-0">{noti.content.length > 100 ? noti.content.substring(0, 100) + '...' : noti.content}</p>
                </div>
              ))
            ) : (
              <p className="text-muted">Không có thông báo.</p>
            )}
          </div>

          {/* Pagination */}
          <div className="d-flex justify-content-between align-items-center mt-4">
            <button
              className="btn btn-outline-primary"
              disabled={(notiData.first || page === 0)}
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
            >
              Trang trước
            </button>
            <span>Trang {page + 1} / {notiData.totalPages || 1}</span>
            <button
              className="btn btn-outline-primary"
              disabled={notiData.last || notiData.totalPages === 0}
              onClick={() => setPage((p) => p + 1)}
            >
              Trang sau
            </button>
          </div>
        </>
      )}

      {/* Popup chi tiết */}
      {selectedNotification && (
        <div className="modal show d-block" tabIndex={-1} role="dialog" onClick={() => setSelectedNotification(null)}>
          <div className="modal-dialog" role="document" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{selectedNotification.title}</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedNotification(null)}></button>
              </div>
              <div className="modal-body">
                <p>{selectedNotification.content}</p>
                <small className="text-muted">
                  Ngày gửi: {new Date(selectedNotification.createdAt).toLocaleString()}
                </small>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedNotification(null)}>
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationPage;
