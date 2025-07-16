import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface Props {
  children: React.ReactNode;
}

const MainLayout: React.FC<Props> = ({ children }) => {
  return (
    <>
      <Header />
      <main style={{ minHeight: 'calc(100vh - 200px)', padding: '2rem' }}>{children}</main>
      <Footer />
    </>
  );
};

export default MainLayout;