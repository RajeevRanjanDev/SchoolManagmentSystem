import { useAppSelector, useAppDispatch } from '../store/hooks';
import { loginThunk, logoutThunk } from '../store/slices/authSlice';
import type { LoginRequest } from '../types/api';

export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading, accessToken } = useAppSelector(s => s.auth);

  const login = (credentials: LoginRequest) => dispatch(loginThunk(credentials));
  const logout = () => dispatch(logoutThunk());

  return {
    user,
    isAuthenticated,
    isLoading,
    accessToken,
    login,
    logout,
    roles: user?.roles ?? [],
    schoolId: user?.schoolId,
    userId: user?.id,
  };
}
