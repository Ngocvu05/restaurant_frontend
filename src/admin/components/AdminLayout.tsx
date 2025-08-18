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
import searchApi from '../../admin/api/searchApi';
import { getNotificationApi } from '../../admin/api/getNotificationApi';
import { 
  DishSearchResult,
  UserSearchResult,
  ReviewSearchResult,
  SearchResult 
} from '../types/search.types';

interface Notification {
  id: number;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  
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

  // Enhanced search states
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchResult[]>([]);
  const [searchType, setSearchType] = useState<'dishes' | 'users' | 'reviews'>('dishes');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

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

  if (!adminId) {
    console.warn('⚠️ AdminId not found in sessionStorage');
  }

  setUserInfo({
    username,
    avatarUrl: avatar ? avatar : '/assets/images/avatar.png',
  });

  // ✅ FIXED: Load notifications with proper error handling
  const loadNotifications = async () => {
    try {
      console.log('📬 Loading notifications...');
      const notificationData = await getNotificationApi.getLimited(5);
      
      console.log('📦 Raw notification data:', notificationData);
      
      if (Array.isArray(notificationData)) {
        // Reverse to show newest first
        const sortedNotifications = notificationData.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setNotifications(sortedNotifications);
        console.log(`✅ Loaded ${sortedNotifications.length} notifications`);
      } else {
        console.warn('⚠️ Notification data is not an array:', notificationData);
        setNotifications([]);
      }
    } catch (error: any) {
      console.error('❌ Error loading notifications:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // Show user-friendly error
      toast.error('Không thể tải thông báo. Vui lòng thử lại sau.', {
        position: 'top-right',
        autoClose: 3000
      });
      
      setNotifications([]); // Set empty array on error
    }
  };

  loadNotifications();

  // Connect WebSocket services
  connectAllWebSockets(username, {
    onUserNotificationReceived: (notification) => {
      console.log('🔔 New user notification received:', notification);
      setNotifications((prev) => [notification, ...prev]);
      toast.info(`📬 ${notification.title}`, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        pauseOnHover: true,
        closeOnClick: true,
      });
    },
    
    onChatNotificationReceived: (notification) => {
      console.log('💬 New chat notification received:', notification);
      setNotifications((prev) => [notification, ...prev]);
      toast.info(`💬 ${notification.title}`, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        pauseOnHover: true,
        closeOnClick: true,
      });
    },
    
    onAdminAlertReceived: (alertMessage) => {
      const alertNotification = {
        id: Date.now(),
        title: 'Thông báo hệ thống',
        content: alertMessage,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      
      console.log('🚨 New admin alert received:', alertNotification);
      setNotifications((prev) => [alertNotification, ...prev]);
      toast.success(`🚨 ${alertMessage}`, {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        pauseOnHover: true,
        closeOnClick: true,
      });
    },
    
    onAdminBroadcastReceived: (broadcastMessage) => {
      const broadcastNotification = {
        id: Date.now() + Math.random(),
        title: 'Thông báo Admin',
        content: broadcastMessage,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      
      console.log('📢 New admin broadcast received:', broadcastNotification);
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

  return () => {
    disconnectAllWebSockets();
  };
}, [navigate]);

  // Enhanced search with debouncing
  const handleSearchInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchKeyword(value);

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (value.length > 1) {
      const timeout = setTimeout(async () => {
        try {
          let response;
          switch (searchType) {
            case 'dishes':
              response = await searchApi.searchSuggestions(value);
              setSearchSuggestions(response.data.slice(0, 5));
              break;
            case 'users':
              response = await searchApi.searchUsers({ query: value, size: 5 });
              setSearchSuggestions(response.data.content?.slice(0, 5) || []);
              break;
            case 'reviews':
              response = await searchApi.searchReviews({ query: value, size: 5 });
              setSearchSuggestions(response.data.content?.slice(0, 5) || []);
              break;
          }
        } catch (error) {
          console.error('❌ Error fetching suggestions:', error);
          setSearchSuggestions([]);
        }
      }, 300);
      
      setSearchTimeout(timeout);
    } else {
      setSearchSuggestions([]);
    }
  };

  // Enhanced search functionality
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchKeyword.trim()) return;

    setIsSearching(true);
    try {
      let response;
      switch (searchType) {
        case 'dishes':
          response = await searchApi.searchDishesAdvanced(searchKeyword);
          setSearchResults(response.data);
          break;
        case 'users':
          response = await searchApi.searchUsers({ query: searchKeyword, size: 20 });
          setSearchResults(response.data.content || []);
          break;
        case 'reviews':
          response = await searchApi.searchReviews({ query: searchKeyword, size: 20 });
          setSearchResults(response.data.content || []);
          break;
      }
      
      setShowSearchResults(true);
      setSearchSuggestions([]);
    } catch (error) {
      console.error('❌ Error searching:', error);
      toast.error('Lỗi khi tìm kiếm');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchResult) => {
    const name = searchType === 'dishes' ? (suggestion as DishSearchResult).name : 
                 searchType === 'users' ? (suggestion as UserSearchResult).username : 
                 `Review by ${(suggestion as ReviewSearchResult).customerName}`;
    setSearchKeyword(name);
    setSearchSuggestions([]);
    
    // Navigate to detail page
    switch (searchType) {
      case 'dishes':
        navigate(`/admin/dishes/${(suggestion as DishSearchResult).id}`);
        break;
      case 'users':
        navigate(`/admin/users/${(suggestion as UserSearchResult).id}`);
        break;
      case 'reviews':
        navigate(`/admin/reviews/${(suggestion as ReviewSearchResult).id}`);
        break;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    closeSearchResults();
    
    switch (searchType) {
      case 'dishes':
        navigate(`/admin/dishes/${(result as DishSearchResult).id}`);
        break;
      case 'users':
        navigate(`/admin/users/${(result as UserSearchResult).id}`);
        break;
      case 'reviews':
        navigate(`/admin/reviews/${(result as ReviewSearchResult).id}`);
        break;
    }
  };

  const handleLogout = () => {
    disconnectAllWebSockets();
    sessionStorage.clear();
    navigate('/');
  };

  const handleOpenNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowModal(true);
  };

  const handleCloseModal = async () => {
    if (selectedNotification && !selectedNotification.isRead) {
      try {
        console.log(`📖 Marking notification ${selectedNotification.id} as read...`);
        await getNotificationApi.readNotification(selectedNotification.id);
        
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === selectedNotification.id ? { ...n, isRead: true } : n
          )
        );
        
        console.log(`✅ Notification ${selectedNotification.id} marked as read`);
      } catch (error: any) {
        console.error('❌ Error marking notification as read:', error);
        toast.error('Không thể đánh dấu thông báo đã đọc');
      }
    }
    setShowModal(false);
    setSelectedNotification(null);
  };

  // FIXED: Add notification refresh function
  const refreshNotifications = async () => {
    try {
      console.log('🔄 Refreshing notifications...');
      const notificationData = await getNotificationApi.getLimited(10);
      
      if (Array.isArray(notificationData)) {
        const sortedNotifications = notificationData.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setNotifications(sortedNotifications);
        console.log(`✅ Refreshed ${sortedNotifications.length} notifications`);
        toast.success('Đã cập nhật thông báo');
      }
    } catch (error) {
      console.error('❌ Error refreshing notifications:', error);
      toast.error('Không thể cập nhật thông báo');
    }
  };

  // FIXED: Add mark all as read function
  const markAllNotificationsAsRead = async () => {
    try {
      console.log('📖 Marking all notifications as read...');
      await getNotificationApi.markAllAsRead();
      
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      
      console.log('✅ All notifications marked as read');
      toast.success('Đã đánh dấu tất cả thông báo đã đọc');
    } catch (error: any) {
      console.error('❌ Error marking all notifications as read:', error);
      toast.error('Không thể đánh dấu tất cả thông báo đã đọc');
    }
  };

  const closeSearchResults = () => {
    setShowSearchResults(false);
    setSearchResults([]);
  };

  const getDisplayName = (item: any) => {
    switch (searchType) {
      case 'dishes':
        return item.name;
      case 'users':
        return item.username || item.fullName;
      case 'reviews':
        return `Review by ${item.customerName}`;
      default:
        return item.name || item.title;
    }
  };

  const getDisplayInfo = (item: any) => {
    switch (searchType) {
      case 'dishes':
        return `${item.category} - ${item.price?.toLocaleString()}₫`;
      case 'users':
        return `${item.email} - ${item.roleName}`;
      case 'reviews':
        return `Rating: ${item.rating}/5 - Dish ID: ${item.dishId}`;
      default:
        return '';
    }
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
          <li className="nav-item"><Link to="/admin/reviews" className="nav-link text-white">Đánh giá</Link></li>
          <li className="nav-item"><Link to="/admin/chat-support" className="nav-link text-white">Phản hồi chat</Link></li>
        </ul>
      </nav>

      {/* Main content */}
      <div className="flex-grow-1" style={{ marginLeft: '220px' }}>
        {/* Enhanced Topbar */}
        <nav className="navbar navbar-expand navbar-light bg-light shadow-sm px-3" style={{ height: '60px' }}>
          <form className="d-none d-sm-inline-block form-inline me-auto ms-md-3 my-2 my-md-0 w-50 position-relative" onSubmit={handleSearch}>
            <div className="input-group">
              {/* Search type selector */}
              <select 
                className="form-select" 
                style={{ maxWidth: '120px' }}
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as 'dishes' | 'users' | 'reviews')}
              >
                <option value="dishes">Món ăn</option>
                <option value="users">Người dùng</option>
                <option value="reviews">Đánh giá</option>
              </select>
              
              <input 
                type="text" 
                className="form-control bg-light border-0 small" 
                placeholder={`Tìm kiếm ${searchType === 'dishes' ? 'món ăn' : searchType === 'users' ? 'người dùng' : 'đánh giá'}...`}
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
            
            {/* Enhanced suggestions dropdown */}
            {searchSuggestions.length > 0 && (
              <div className="position-absolute top-100 start-0 w-100 bg-white border rounded shadow-lg" style={{ zIndex: 1000 }}>
                <div className="p-2">
                  <small className="text-muted fw-medium">
                    Gợi ý tìm kiếm {searchType === 'dishes' ? 'món ăn' : searchType === 'users' ? 'người dùng' : 'đánh giá'}:
                  </small>
                </div>
                {searchSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-2 border-bottom cursor-pointer hover-bg-light"
                    onClick={() => handleSuggestionClick(suggestion)}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    <div className="d-flex align-items-center">
                      <i className={`bi ${searchType === 'dishes' ? 'bi-cup-straw' : searchType === 'users' ? 'bi-person' : 'bi-star'} me-2 text-muted`}></i>
                      <div className="flex-grow-1 admin-search-suggest-content">
                        <div className="fw-medium admin-search-suggest-name">{getDisplayName(suggestion)}</div>
                        <small className="text-muted admin-search-suggest-info">{getDisplayInfo(suggestion)}</small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </form>

          <ul className="navbar-nav ms-auto">
            <li className="nav-item dropdown mx-2">
              <button 
                className="nav-link btn btn-link p-0 border-0 bg-transparent position-relative" 
                id="alertsDropdown" 
                data-bs-toggle="dropdown" 
                aria-expanded="false" 
                type="button"
              >
                <i className="bi bi-bell fs-5"></i>
                {notifications.some(n => !n.isRead) && (
                  <span className="badge bg-danger rounded-pill position-absolute top-0 start-100 translate-middle">
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow" aria-labelledby="alertsDropdown" style={{ minWidth: '350px' }}>
                <li>
                  <div className="dropdown-header d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">Thông báo</h6>
                    <div>
                      <button 
                        className="btn btn-sm btn-outline-primary me-1"
                        onClick={refreshNotifications}
                        title="Cập nhật"
                      >
                        <i className="bi bi-arrow-clockwise"></i>
                      </button>
                      {notifications.some(n => !n.isRead) && (
                        <button 
                          className="btn btn-sm btn-outline-success"
                          onClick={markAllNotificationsAsRead}
                          title="Đánh dấu tất cả đã đọc"
                        >
                          <i className="bi bi-check-all"></i>
                        </button>
                      )}
                    </div>
                  </div>
                </li>
                <li><hr className="dropdown-divider" /></li>
                
                {notifications.length === 0 ? (
                  <li>
                    <div className="text-center py-3 text-muted">
                      <i className="bi bi-bell-slash fs-4"></i>
                      <p className="mb-0 small">Không có thông báo</p>
                    </div>
                  </li>
                ) : (
                  notifications.slice(0, 5).map((notification, index) => (
                    <li key={notification.id || index}>
                      <button
                        className={`dropdown-item ${!notification.isRead ? 'fw-bold bg-light' : ''}`}
                        onClick={() => handleOpenNotification(notification)}
                        style={{ whiteSpace: 'normal', maxWidth: '330px' }}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1 me-2">
                            <div className="fw-medium">{notification.title}</div>
                            <small className="text-muted d-block">
                              {getNotificationApi.utils.truncateContent(notification.content, 60)}
                            </small>
                            <small className="text-muted">
                              <i className="bi bi-clock me-1"></i>
                              {getNotificationApi.utils.getRelativeTime(notification.createdAt)}
                            </small>
                          </div>
                          {!notification.isRead && (
                            <span className="badge bg-primary ms-2">Mới</span>
                          )}
                        </div>
                      </button>
                    </li>
                  ))
                )}
                
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <Link to="/admin/notifications" className="dropdown-item text-center text-primary">
                    <i className="bi bi-list me-1"></i>
                    Xem tất cả ({notifications.length})
                  </Link>
                </li>
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

        {/* Enhanced Search Results Modal */}
        {showSearchResults && (
          <div className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-50 d-flex justify-content-center align-items-center" style={{ zIndex: 1050 }}>
            <div className="bg-white rounded p-4 shadow-lg" style={{ maxWidth: '900px', width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">
                  Kết quả tìm kiếm {searchType === 'dishes' ? 'món ăn' : searchType === 'users' ? 'người dùng' : 'đánh giá'} cho "{searchKeyword}"
                  <span className="badge bg-secondary ms-2">{searchResults.length} kết quả</span>
                </h5>
                <button className="btn btn-close" onClick={closeSearchResults}></button>
              </div>
              
              {searchResults.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-search display-1 text-muted"></i>
                  <p className="text-muted mt-2">Không tìm thấy kết quả nào phù hợp</p>
                </div>
              ) : (
                <div className="search-results">
                  {searchType === 'dishes' && (
                    <div className="row">
                      {searchResults.map((dish: any) => (
                        <div key={dish.id} className="col-md-6 col-lg-4 mb-3">
                          <div 
                            className="card h-100 cursor-pointer" 
                            onClick={() => handleResultClick(dish)}
                            style={{ cursor: 'pointer' }}
                          >
                            {dish.imageUrls?.[0] && (
                              <img src={dish.imageUrls[0]} className="card-img-top" alt={dish.name} style={{ height: '150px', objectFit: 'cover' }} />
                            )}
                            <div className="card-body">
                              <h6 className="card-title">{dish.name}</h6>
                              <p className="card-text text-muted small">{dish.description}</p>
                              <div className="d-flex justify-content-between align-items-center">
                                <span className="badge bg-secondary">{dish.category}</span>
                                <span className="fw-bold text-primary">{dish.price?.toLocaleString()}₫</span>
                              </div>
                              <div className="mt-2">
                                <span className={`badge ${dish.isAvailable ? 'bg-success' : 'bg-danger'}`}>
                                  {dish.isAvailable ? 'Có sẵn' : 'Hết hàng'}
                                </span>
                                {dish.averageRating > 0 && (
                                  <span className="badge bg-warning ms-1">
                                    <i className="bi bi-star-fill me-1"></i>
                                    {dish.averageRating.toFixed(1)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {searchType === 'users' && (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Avatar</th>
                            <th>Username</th>
                            <th>Họ tên</th>
                            <th>Email</th>
                            <th>Vai trò</th>
                            <th>Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchResults.map((user: any) => (
                            <tr 
                              key={user.id} 
                              style={{ cursor: 'pointer' }} 
                              onClick={() => handleResultClick(user)}
                            >
                              <td>
                                <img src={user.avatarUrl || '/default-avatar.png'} alt={user.username} className="rounded-circle" width="32" height="32" />
                              </td>
                              <td className="fw-medium">{user.username}</td>
                              <td>{user.fullName}</td>
                              <td>{user.email}</td>
                              <td>
                                <span className={`badge ${user.roleName === 'ADMIN' ? 'bg-danger' : 'bg-primary'}`}>
                                  {user.roleName}
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${user.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}`}>
                                  {user.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  {searchType === 'reviews' && (
                    <div className="reviews-list">
                      {searchResults.map((review: any) => (
                        <div 
                          key={review.id} 
                          className="card mb-3 cursor-pointer" 
                          onClick={() => handleResultClick(review)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div className="d-flex align-items-center">
                                <img 
                                  src={review.customerAvatar || '/default-avatar.png'} 
                                  alt={review.customerName}
                                  className="rounded-circle me-2"
                                  width="32"
                                  height="32"
                                />
                                <div>
                                  <h6 className="mb-0">{review.customerName}</h6>
                                  <small className="text-muted">{review.customerEmail}</small>
                                </div>
                              </div>
                              <div className="text-end">
                                <div className="text-warning mb-1">
                                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                </div>
                                <small className="text-muted">
                                  {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                                </small>
                              </div>
                            </div>
                            <p className="mb-2">{review.comment}</p>
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="badge bg-info">Dish ID: {review.dishId}</span>
                              <div>
                                <span className={`badge ${review.isActive ? 'bg-success' : 'bg-secondary'} me-1`}>
                                  {review.isActive ? 'Hoạt động' : 'Không hoạt động'}
                                </span>
                                {review.isVerified && (
                                  <span className="badge bg-primary">
                                    <i className="bi bi-check-circle me-1"></i>
                                    Đã xác minh
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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