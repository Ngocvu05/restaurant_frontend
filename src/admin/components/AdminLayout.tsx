import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../admin/css/AdminLayout.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

import { connectAllWebSockets, disconnectAllWebSockets } from '../../admin/api/WebSocket';
import { searchApi } from '../../admin/api/searchApi';
import { getNotificationApi } from '../../admin/api/getNotificationApi';

interface Notification {
  id: number;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface Dish {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  available: boolean;
}

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userInfo, setUserInfo] = useState({
    username: '',
    avatarUrl: '',
  });

  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Search states
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<Dish[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<Dish[]>([]);

  useEffect(() => {
    const username = sessionStorage.getItem('username');
    const avatar = sessionStorage.getItem('avatar');
    const token = sessionStorage.getItem('token');
    const adminId = sessionStorage.getItem('adminId') || sessionStorage.getItem('userId');
    
    console.log(`User Info: ${username}, Avatar: ${avatar}, Token: ${token}, AdminId: ${adminId}`);
    
    if (!username) {
      navigate('/login');
      return;
    }

    // Lưu adminId nếu chưa có (có thể extract từ token hoặc API)
    if (!adminId) {
      // TODO: Lấy adminId từ API hoặc decode từ JWT token
      // const extractedAdminId = extractAdminIdFromToken(token);
      // sessionStorage.setItem('adminId', extractedAdminId);
      console.warn('⚠️ AdminId not found in sessionStorage');
    }

    setUserInfo({
      username,
      avatarUrl: avatar ? avatar : '/assets/images/avatar.png',
    });

    // Lấy thông báo cũ từ API
    getNotificationApi.getLimited(5)
      .then((res) => {
        const data = res.data;
        console.log("📥 List notifications:", data);
        if (Array.isArray(data)) {
          setNotifications(data.reverse());
        } else if (data && Array.isArray(data.content)) {
          setNotifications(data.content.reverse());
        } else {
          console.warn('⚠️ Unexpected notification format:', data);
        }
      })
      .catch(error => {
        console.error('❌ Error fetching notifications:', error.message);
      });

    // Kết nối tất cả WebSocket services
    connectAllWebSockets(username, {
      // Callback cho thông báo từ User Service (port 8081)
      onUserNotificationReceived: (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        toast.info(`🔔 ${notification.title}`, {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          pauseOnHover: true,
          closeOnClick: true,
        });
      },
      
      // Callback cho thông báo từ Chat Service (port 8083)
      onChatNotificationReceived: (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        toast.info(`💬 ${notification.title}`, {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          pauseOnHover: true,
          closeOnClick: true,
        });
      },
      
      // Callback cho thông báo riêng tư của admin (alerts)
      onAdminAlertReceived: (alertMessage) => {
        const alertNotification = {
          id: Date.now(),
          title: 'Thông báo hệ thống',
          content: alertMessage,
          isRead: false,
          createdAt: new Date().toISOString()
        };
        
        setNotifications((prev) => [alertNotification, ...prev]);
        toast.success(`🚨 ${alertMessage}`, {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          pauseOnHover: true,
          closeOnClick: true,
        });
      },
      
      // Callback cho thông báo broadcast cho tất cả admin
      onAdminBroadcastReceived: (broadcastMessage) => {
        const broadcastNotification = {
          id: Date.now() + Math.random(), // Tránh trùng ID
          title: 'Thông báo Admin',
          content: broadcastMessage,
          isRead: false,
          createdAt: new Date().toISOString()
        };
        
        setNotifications((prev) => [broadcastNotification, ...prev]);
        toast.info(`📢 ${broadcastMessage}`, {
          position: 'top-right',
          autoClose: 4000,
          hideProgressBar: false,
          pauseOnHover: true,
          closeOnClick: true,
        });
      }
    });

    // Cleanup khi component unmount
    return () => {
      disconnectAllWebSockets();
    };
  }, [navigate]);

  // Search functionality
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchKeyword.trim()) return;

    setIsSearching(true);
    try {
      const res = await searchApi.search(searchKeyword);
      setSearchResults(res.data);
      setShowSearchResults(true);
    } catch (error) {
      console.error('❌ Error searching dishes:', error);
      toast.error('Lỗi khi tìm kiếm món ăn');
    } finally {
      setIsSearching(false);
    }
  };

  // Get search suggestions as user types
  const handleSearchInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchKeyword(value);

    if (value.length > 1) {
      try {
        const res = await searchApi.searchSuggestions(value);
        setSearchSuggestions(res.data.slice(0, 5));
      } catch (error) {
        console.error('❌ Error fetching suggestions:', error);
      }
    } else {
      setSearchSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: Dish) => {
    setSearchKeyword(suggestion.name);
    setSearchSuggestions([]);
    navigate(`/admin/dishes/${suggestion.id}`);
  };

  const handleLogout = () => {
    disconnectAllWebSockets(); // Disconnect all WebSocket connections
    sessionStorage.clear();
    navigate('/');
  };

  const handleOpenNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (selectedNotification && !selectedNotification.isRead) {
      getNotificationApi.readNotification(selectedNotification.id).then(() => {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === selectedNotification.id ? { ...n, isRead: true } : n
          )
        );
      }).catch(error => {
        console.error('❌ Error marking notification as read:', error);
      });
    }
    setShowModal(false);
  };

  const closeSearchResults = () => {
    setShowSearchResults(false);
    setSearchResults([]);
  };

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <nav className="bg-dark text-white p-3" style={{ width: '220px', position: 'fixed', height: '100%' }}>
        <h4 className="text-white">Quản lý</h4>
        <ul className="nav flex-column">
          <li className="nav-item"><Link to="/admin" className="nav-link text-white">Dashboard</Link></li>
          <li className="nav-item"><Link to="/admin/dishes" className="nav-link text-white">Món ăn</Link></li>
          <li className="nav-item"><Link to="/admin/bookings" className="nav-link text-white">Đặt bàn</Link></li>
          <li className="nav-item"><Link to="/admin/users" className="nav-link text-white">Người dùng</Link></li>
          <li className="nav-item"><Link to="/admin/chat-support" className="nav-link text-white">Phản hồi chat</Link></li>
        </ul>
      </nav>

      {/* Main content */}
      <div className="flex-grow-1" style={{ marginLeft: '220px' }}>
        {/* Topbar */}
        <nav className="navbar navbar-expand navbar-light bg-light shadow-sm px-3" style={{ height: '60px' }}>
          <form className="d-none d-sm-inline-block form-inline me-auto ms-md-3 my-2 my-md-0 w-50 position-relative" onSubmit={handleSearch}>
            <div className="input-group">
              <input 
                type="text" 
                className="form-control bg-light border-0 small" 
                placeholder="Tìm kiếm món ăn..." 
                value={searchKeyword}
                onChange={handleSearchInputChange}
                disabled={isSearching}
              />
              <button className="btn btn-primary" type="submit" disabled={isSearching}>
                {isSearching ? (
                  <span className="spinner-border spinner-border-sm me-1" />
                ) : (
                  <i className="bi bi-search"></i>
                )}
              </button>
            </div>
            
            {/* Search suggestions dropdown */}
            {searchSuggestions.length > 0 && (
              <div className="position-absolute top-100 start-0 w-100 bg-white border rounded shadow-lg" style={{ zIndex: 1000 }}>
                {searchSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="p-2 border-bottom cursor-pointer hover-bg-light"
                    onClick={() => handleSuggestionClick(suggestion)}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    <div className="d-flex align-items-center">
                      <i className="bi bi-search me-2 text-muted"></i>
                      <div>
                        <div className="fw-medium">{suggestion.name}</div>
                        <small className="text-muted">{suggestion.category} - {suggestion.price.toLocaleString()}đ</small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </form>

          <ul className="navbar-nav ms-auto">
            <li className="nav-item dropdown mx-2">
              <button className="nav-link btn btn-link p-0 border-0 bg-transparent position-relative" id="alertsDropdown" data-bs-toggle="dropdown" aria-expanded="false" type="button">
                <i className="bi bi-bell fs-5"></i>
                {notifications.some(n => !n.isRead) && (
                  <span className="badge bg-danger rounded-pill position-absolute top-0 start-100 translate-middle">
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow" aria-labelledby="alertsDropdown">
                <li><h6 className="dropdown-header">Thông báo</h6></li>
                {notifications.slice(0, 5).map((n, i) => (
                  <li key={i}>
                    <span
                      className={`dropdown-item ${!n.isRead ? 'fw-bold' : ''}`}
                      onClick={() => handleOpenNotification(n)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <div className="fw-medium">{n.title}</div>
                          <small className="text-muted">{n.content.substring(0, 50)}...</small>
                        </div>
                        {!n.isRead && <span className="badge bg-primary ms-2">New</span>}
                      </div>
                    </span>
                  </li>
                ))}
                <li><hr className="dropdown-divider" /></li>
                <li><Link to="/admin/notifications" className="dropdown-item text-center text-primary">Xem tất cả</Link></li>
              </ul>
            </li>

            <li className="nav-item dropdown">
              <button className="nav-link dropdown-toggle d-flex align-items-center btn btn-link p-0 border-0 bg-transparent" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false" type="button">
                <img src={userInfo.avatarUrl} className="rounded-circle" width="32" height="32" alt="avatar" />
                <span className="ms-2 d-none d-lg-inline text-dark">{userInfo.username}</span>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow" aria-labelledby="userDropdown">
                <li><button className="dropdown-item" type="button">Hồ sơ</button></li>
                <li><button className="dropdown-item" type="button">Cài đặt</button></li>
                <li><hr className="dropdown-divider" /></li>
                <li><button className="dropdown-item" onClick={handleLogout}>Đăng xuất</button></li>
              </ul>
            </li>
          </ul>
        </nav>

        {/* Search Results Modal */}
        {showSearchResults && (
          <div className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-50 d-flex justify-content-center align-items-center" style={{ zIndex: 1050 }}>
            <div className="bg-white rounded p-4 shadow-lg" style={{ maxWidth: '800px', width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Kết quả tìm kiếm cho "{searchKeyword}"</h5>
                <button className="btn btn-close" onClick={closeSearchResults}></button>
              </div>
              
              {searchResults.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-search display-1 text-muted"></i>
                  <p className="text-muted mt-2">Không tìm thấy món ăn nào phù hợp</p>
                </div>
              ) : (
                <div className="row">
                  {searchResults.map((dish) => (
                    <div key={dish.id} className="col-md-6 col-lg-4 mb-3">
                      <div className="card h-100">
                        {dish.imageUrl && (
                          <img src={dish.imageUrl} className="card-img-top" alt={dish.name} style={{ height: '150px', objectFit: 'cover' }} />
                        )}
                        <div className="card-body">
                          <h6 className="card-title">{dish.name}</h6>
                          <p className="card-text text-muted small">{dish.description}</p>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="badge bg-secondary">{dish.category}</span>
                            <span className="fw-bold text-primary">{dish.price.toLocaleString()}đ</span>
                          </div>
                          <div className="mt-2">
                            <span className={`badge ${dish.available ? 'bg-success' : 'bg-danger'}`}>
                              {dish.available ? 'Có sẵn' : 'Hết hàng'}
                            </span>
                          </div>
                        </div>
                        <div className="card-footer">
                          <button 
                            className="btn btn-primary btn-sm w-100"
                            onClick={() => {
                              navigate(`/admin/dishes/${dish.id}`);
                              closeSearchResults();
                            }}
                          >
                            Xem chi tiết
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Page content */}
        <div className="p-4">
          <Outlet />
        </div>

        <ToastContainer />

        {/* Modal hiển thị chi tiết thông báo */}
        <Modal show={showModal} onHide={handleCloseModal}>
          <Modal.Header closeButton>
            <Modal.Title>{selectedNotification?.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-3">
              <p className="mb-2">{selectedNotification?.content}</p>
              <small className="text-muted">
                <i className="bi bi-clock me-1"></i>
                {selectedNotification?.createdAt && new Date(selectedNotification.createdAt).toLocaleString('vi-VN')}
              </small>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Đóng
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default AdminLayout;