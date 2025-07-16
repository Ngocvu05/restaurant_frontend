export const getToken = () => sessionStorage.getItem('token');
export const getUsername = () => sessionStorage.getItem('username');
export const getRole = () => sessionStorage.getItem('role');

export const logout = () => {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('username');
  sessionStorage.removeItem('role');
};
