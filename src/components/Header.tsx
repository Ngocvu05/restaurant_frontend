import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../assets/css/bootstrap.min.css';
import '../assets/css/font-awesome.css';
import '../assets/css/templatemo-klassy-cafe.css';
import '../assets/css/Header.css';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const username = sessionStorage.getItem('username');
  const avatar = sessionStorage.getItem('avatar');

  const handleLogout = () => {
    sessionStorage.removeItem('chatMessages');
    sessionStorage.clear();
    navigate('/login');
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const closeDropdown = () => {
    setDropdownOpen(false);
  };

  return (
    <header className="header-area header-sticky">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-12">
            <nav className="main-nav d-flex align-items-center justify-content-between py-2">
              {/* Logo */}
              <Link to="/" className="logo d-flex align-items-center">
                <img src="/assets/images/klassy-logo.png" alt="Klassy Cafe" style={{ height: 50 }} />
              </Link>

              {/* Menu items */}
              <ul className="nav d-flex align-items-center gap-4 mb-0">
                <li><Link to="/" className="nav-link active">Trang chủ</Link></li>
                <li><Link to="/menu" className="nav-link">Thực đơn</Link></li>
                <li><Link to="/booking" className="nav-link">Đặt bàn</Link></li>
                <li><Link to="/about" className="nav-link">Giới thiệu</Link></li>
                <li><Link to="/chat" className="nav-link">Liên hệ</Link></li>
              </ul>

              {/* User section */}
              <div className="d-flex align-items-center gap-2 ms-auto position-relative">
                {username ? (
                  <>
                    <div onClick={toggleDropdown} className="d-flex align-items-center gap-2 cursor-pointer">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt="avatar"
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid #eee',
                          }}
                        />
                      ) : (
                        <i className="fa fa-user-circle text-dark fs-4" />
                      )}
                      <span className="fw-semibold text-dark">{username}</span>
                      <i className="fa fa-caret-down text-dark" />
                    </div>

                    {dropdownOpen && (
                      <ul
                        className="dropdown-menu show position-absolute"
                        style={{ top: '100%', right: 0, zIndex: 1000 }}
                        onMouseLeave={closeDropdown}
                      >
                        <li>
                          <Link to="/profile" className="dropdown-item" onClick={closeDropdown}>
                            Hồ sơ cá nhân
                          </Link>
                        </li>
                        <li>
                          <Link to="/profile/edit" className="dropdown-item" onClick={closeDropdown}>
                            Cập nhật thông tin
                          </Link>
                        </li>
                        <li>
                          <Link to="/booking-history" className="dropdown-item" onClick={closeDropdown}>
                            Lịch sử đặt bàn
                          </Link>
                        </li>
                        <li><hr className="dropdown-divider" /></li>
                        <li>
                          <button className="dropdown-item text-danger" onClick={handleLogout}>
                            Đăng xuất
                          </button>
                        </li>
                      </ul>
                    )}
                  </>
                ) : (
                  <Link to="/login" className="main-button-icon px-3 py-1">
                    Đăng nhập
                  </Link>
                )}
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;