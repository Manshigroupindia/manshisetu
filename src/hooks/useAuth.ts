// Auth hook for Manshi Group Setu

import { useApp } from '../context/AppContext';

export const useAuth = () => {
  const { auth, currentStaff, loginAdmin, loginStaff, logout } = useApp();

  return {
    isAuthenticated: auth.isAuthenticated,
    isDirector: auth.role === 'admin',
    isStaff: auth.role === 'staff',
    role: auth.role,
    user: auth,
    currentStaff,
    loginDirector: loginAdmin,
    loginStaff,
    logout,
  };
};

export default useAuth;
