import { createContext, useState, useEffect, ReactNode } from 'react';

type User = {
  id: string;
  name: string;
  phoneNumber: string;
  photoURL?: string;
  email?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (phoneNumber: string) => Promise<void>;
  register: (name: string, phoneNumber: string) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate checking for stored authentication
    const checkAuth = async () => {
      try {
        // For MVP, we'll just set loading to false
        // In a real app, we would check local storage or a token
        setLoading(false);
      } catch (error) {
        console.error('Error checking auth', error);
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (phoneNumber: string) => {
    // Simulate login process
    try {
      // For MVP, we'll just set a mock user
      // In a real app, we would verify OTP and get user details from backend
      setUser({
        id: '123456',
        name: 'John Doe',
        phoneNumber,
      });
    } catch (error) {
      console.error('Login error', error);
      throw error;
    }
  };

  const register = async (name: string, phoneNumber: string) => {
    // Simulate registration process
    try {
      // For MVP, we'll just set a mock user
      // In a real app, we would send user data to backend
      setUser({
        id: '123456',
        name,
        phoneNumber,
      });
    } catch (error) {
      console.error('Registration error', error);
      throw error;
    }
  };

  const logout = () => {
    // Simulate logout process
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}