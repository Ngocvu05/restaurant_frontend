import React, { useEffect, useState } from 'react';
import { adminDishApi } from '../api/adminDishApi';
import 'bootstrap/dist/css/bootstrap.min.css';
import { data, Link } from 'react-router-dom';

const AdminDishPage: React.FC = () => {
  const [dishes, setDishes] = useState<any[]>([]);
  

  const fetchDishes = () => {
    adminDishApi.getAll().then((res: { data: any[] }) => setDishes(res.data));
  };

  useEffect(() => {
    fetchDishes();
  }, []);

  
  console.log(dishes)
  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Danh sách món ăn</h2>
        <button className="btn btn-primary" >
         <Link to="/admin/dishes/new" className="btn btn-primary">
            + Thêm món ăn
        </Link>
        </button>
      </div>

      <table className="table table-bordered table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên món</th>
            <th>Giá</th>
            <th>Hình ảnh</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {dishes.map((dish) => (
            <tr key={dish.id}>
              <td>{dish.id}</td>
              <td>{dish.name}</td>
              <td>{dish.price.toLocaleString()}₫</td>
              <td>
                <img src={dish.imageUrls[0]} alt={dish.name} style={{ width: 80 }} />
              </td>
              <td>
                <button className="btn btn-warning btn-sm">
                  <Link to={`/admin/dishes/${dish.id}/edit`}>
                    Sửa
                  </Link></button>
                <button className="btn btn-danger btn-sm">Xoá</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
    </div>
  );
};

export default AdminDishPage;
