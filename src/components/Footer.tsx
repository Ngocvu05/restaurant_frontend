import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer>
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <p>
              © {new Date().getFullYear()} Klassy Cafe. Thiết kế bởi TemplateMo. | Phục vụ bởi nhóm của bạn ❤
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;