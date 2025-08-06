import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer style={{ 
      marginTop: 'auto',
      backgroundColor: '#fb5849', // Màu cam/đỏ giống template
      color: 'white',
      padding: '40px 0',
      textAlign: 'center'
    }}>
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <p style={{ margin: 0, color: 'white' }}>
              © {new Date().getFullYear()} Klassy Cafe. Thiết kế bởi TemplateMo. | Phục vụ bởi nhóm của bạn ❤
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;