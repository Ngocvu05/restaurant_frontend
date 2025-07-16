import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import '../assets/css/BookingSuccess.css';

const BookingSuccessPage: React.FC = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state) {
    navigate('/');
    return null;
  }

  const {
    fullName,
    tableName,
    bookingTime,
    guests,
    note,
    preOrderDishes,
    email
  } = state;

  const total = preOrderDishes?.reduce(
    (sum: number, item: any) => sum + item.quantity * item.price,
    0
  );

  // Generate Napas QR string (VietQR static, update for each order)
  // Bank: Shinhan Bank Việt Nam (970424), Account: 0962805614
  // Format: https://vietqr.net/documentation/
  interface VietQRParams {
    bankCode: string;
    accountNo: string;
    amount: number;
    addInfo: string;
  }

  // CRC-16/CCITT-FALSE for EMVCo QR (required for VietQR/Napas)
  function crc16ccitt(str: string) {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc = crc << 1;
        }
        crc &= 0xFFFF;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  function toVietQRString({ bankCode, accountNo, amount, addInfo }: VietQRParams) {
    // EMVCo TLV encoding
    function tlv(id: string, value: string) {
      const len = value.length.toString().padStart(2, '0');
      return `${id}${len}${value}`;
    }
    // Merchant Account Info (ID "38")
    const merchantInfo = tlv('00', 'A000000727') + tlv('01', bankCode) + tlv('02', accountNo);
    const merchantAccount = tlv('38', merchantInfo);
    // Additional Data Field (ID "62")
    const addData = addInfo ? tlv('08', addInfo) : '';
    const payload =
      tlv('00', '01') +
      tlv('01', '12') +
      merchantAccount +
      tlv('53', '704') +
      tlv('54', amount.toString()) +
      tlv('58', 'VN') +
      tlv('59', 'Shinhan Bank VN') +
      tlv('60', 'Ho Chi Minh') +
      (addData ? tlv('62', addData) : '');
    let qr = '000201' + payload + '6304';
    const crc = crc16ccitt(qr);
    return qr + crc;
  }

  const bankCode = '970424';
  const accountNo = '0962805614';
  const amount = total || 0;
  const addInfo = `${fullName} thanh toan hoa don dat ban`;
  const napasQR = toVietQRString({ bankCode, accountNo, amount, addInfo });

  return (
    <div className="container py-5" style={{ paddingTop: '120px' }}>
      <div className="card shadow p-4">
        <h2 className="text-center text-success mb-4" style={{ marginTop: '40px' }}>🎉 Đặt bàn thành công!</h2>
    
        <p><strong>Khách hàng:</strong> {fullName}</p>
        <p><strong>Email xác nhận:</strong> {email}</p>
        <p><strong>Bàn:</strong> {tableName}</p>
        <p><strong>Thời gian:</strong> {new Date(bookingTime).toLocaleString('vi-VN')}</p>
        <p><strong>Số khách:</strong> {guests}</p>
        {note && <p><strong>Ghi chú:</strong> {note}</p>}

        {preOrderDishes && preOrderDishes.length > 0 && (
          <>
            <h5 className="mt-4">🍽️ Món ăn đã chọn</h5>
            <div className="table-responsive">
              <table className="table table-bordered mt-2">
                <thead className="table-light">
                  <tr>
                    <th>Ảnh</th>
                    <th>Tên món</th>
                    <th>Đơn giá</th>
                    <th>Số lượng</th>
                    <th>Tổng</th>
                  </tr>
                </thead>
                <tbody>
                  {preOrderDishes.map((dish: any, index: number) => (
                    <tr key={index}>
                      <td>
                        <img
                          src={`http://localhost:8080/${dish.imageUrl}`}
                          alt={dish.name}
                          width="60"
                          height="40"
                          style={{ objectFit: 'cover', borderRadius: '4px' }}
                        />
                      </td>
                      <td>{dish.name}</td>
                      <td>{dish.price.toLocaleString()}₫</td>
                      <td>{dish.quantity}</td>
                      <td>{(dish.quantity * dish.price).toLocaleString()}₫</td>
                    </tr>
                  ))}
                  <tr className="table-success">
                    <td colSpan={4} className="text-end"><strong>Tổng cộng:</strong></td>
                    <td><strong>{total.toLocaleString()}₫</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="text-center mt-4">
              <h5>Quét mã QR để thanh toán (Napas)</h5>
              <QRCodeSVG value={napasQR} width={180} height={180} includeMargin={true} />
              <div className="mt-2 text-muted" style={{ fontSize: '0.95em' }}>
                Vui lòng sử dụng app ngân hàng hoặc ví điện tử hỗ trợ Napas để quét mã và chuyển khoản đúng số tiền.<br/>
                <b>Ngân hàng:</b> Shinhan Bank Việt Nam<br/>
                <b>Số tài khoản:</b> 0962805614<br/>
                <b>Số tiền:</b> {total.toLocaleString()}₫<br/>
                <b>Nội dung:</b> {addInfo}
              </div>
            </div>
          </>
        )}

        <div className="text-center mt-4">
          <button className="btn btn-outline-primary px-4" onClick={() => navigate('/')}>
            Về trang chủ
          </button>
        </div>
        <div className="text-center mt-2">
          <button className="btn btn-outline-secondary px-4 me-2" onClick={() => window.print()}>
            🖨️ In hóa đơn
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccessPage;
