import React from 'react';
import Header from './Header';
import Footer from './Footer';
import FloatingChatWidget from '../components/FloatingChatWidget';
let timeout: NodeJS.Timeout;

const resetTimer = () => {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    sessionStorage.clear();
    window.location.href = "/login";
  }, 5 * 60 * 1000); // 5 phút
};

window.onload = resetTimer;
window.onmousemove = resetTimer;
window.onkeydown = resetTimer;

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <Header />
       <main>{children}</main>
       <FloatingChatWidget />
      <Footer />
    </>
  );
};

export default Layout;
