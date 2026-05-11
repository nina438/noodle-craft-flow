import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { User, UserRole } from './types';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAdmin: boolean;
  isManager: boolean;
  hasPermission: (minRole: UserRole) => boolean;
  staffList: string[];
  addStaff: (name: string) => void;
}

const DEFAULT_USERS: { username: string; password: string; name: string; role: UserRole }[] = [
  { username: 'admin', password: 'admin123', name: '管理員', role: 'admin' },
  { username: 'manager', password: 'manager123', name: '店長', role: 'manager' },
  { username: 'staff', password: 'staff123', name: '員工A', role: 'staff' },
];

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('erp_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
      return null;
    }
  });

  const [staffList, setStaffList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('erp_staff_list');
      return saved ? JSON.parse(saved) : ['管理員', '店長', '員工A', '員工B', '員工C'];
    } catch (e) {
      console.error("Failed to parse staff list from localStorage", e);
      return ['管理員', '店長', '員工A', '員工B', '員工C'];
    }
  });

  const login = useCallback((username: string, password: string) => {
    const found = DEFAULT_USERS.find(u => u.username === username && u.password === password);
    if (found) {
      const u: User = { id: found.username, username: found.username, name: found.name, role: found.role };
      setUser(u);
      localStorage.setItem('erp_user', JSON.stringify(u));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('erp_user');
  }, []);

  const hasPermission = useCallback((minRole: UserRole) => {
    if (!user) return false;
    const levels: Record<UserRole, number> = { admin: 3, manager: 2, staff: 1 };
    return levels[user.role] >= levels[minRole];
  }, [user]);

  const addStaff = useCallback((name: string) => {
    setStaffList(prev => {
      const next = [...prev, name];
      localStorage.setItem('erp_staff_list', JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAdmin: user?.role === 'admin',
      isManager: hasPermission('manager'),
      hasPermission,
      staffList,
      addStaff,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
