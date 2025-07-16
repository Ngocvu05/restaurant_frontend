// src/admin/components/Sidebar.tsx
import React from "react";
import { Link } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // Quan trọng để navbar, collapse... hoạt động

const Sidebar = () => {
  return (
    <ul className="navbar-nav bg-gradient-primary sidebar sidebar-dark accordion" id="accordionSidebar">
      <Link className="sidebar-brand d-flex align-items-center justify-content-center" to="/admin">
        <div className="sidebar-brand-text mx-3">Restaurant Admin</div>
      </Link>

      <hr className="sidebar-divider my-0" />

      <li className="nav-item">
        <Link className="nav-link" to="/admin">
          <i className="fas fa-fw fa-tachometer-alt"></i>
          <span>Dashboard</span>
        </Link>
      </li>

      <li className="nav-item">
        <Link className="nav-link" to="/admin/dishes">
          <span>Quản lý món ăn</span>
        </Link>
      </li>

      <li className="nav-item">
        <Link className="nav-link" to="/admin/bookings">
          <span>Đặt bàn</span>
        </Link>
      </li>

      <li className="nav-item">
        <Link className="nav-link" to="/admin/users">
          <span>Người dùng</span>
        </Link>
      </li>
    </ul>
  );
};

export default Sidebar;
