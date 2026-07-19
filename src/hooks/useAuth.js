import { AuthContext } from '../context/AuthContext.js';

export function useAuth() {
  return {
    currentUser: AuthContext.currentUser,
    loading: AuthContext.loading,
    login: (email, password) => AuthContext.login(email, password),
    register: (fullName, email, password, role) => AuthContext.register(fullName, email, password, role),
    logout: () => AuthContext.logout(),
    resetPassword: (email) => AuthContext.resetPassword(email),
    subscribe: (callback) => AuthContext.subscribe(callback)
  };
}
