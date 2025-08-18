import api from './axiosConfigUser';

export interface LoginRequest {
  username: string;
  password: string;
  sessionId?: string;
}

export interface AuthResponse {
  userId: number | null;
  token: string | null;
  username: string | null;
  role: string | null;
  avatarUrl: string | null;
  email: string | null;
  fullName: string | null;
  refreshToken: string | null;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone_number: string;
  address: string;
}

class AuthApiService {
  private readonly baseUrl = '/auth';

  /**
   * Register new user
   */
  async register(registerData: RegisterRequest, avatarFile?: File): Promise<AuthResponse> {
    try {
      console.log('📝 Attempting registration:', { username: registerData.username, email: registerData.email });
      
      const formData = new FormData();
      Object.entries(registerData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      if (avatarFile) {
        formData.append('avatar', avatarFile);
        console.log('🖼️ Avatar file attached');
      }

      const response = await api.post(`${this.baseUrl}/register`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const authResponse = response.data as AuthResponse;

      // Lưu tokens vào sessionStorage (nếu register trả về token)
      if (authResponse.token) {
        sessionStorage.setItem('token', authResponse.token);
        console.log('✅ Access token saved');
      }

      if (authResponse.refreshToken) {
        sessionStorage.setItem('refreshToken', authResponse.refreshToken);
        console.log('✅ Refresh token saved');
      }

      // Lưu thông tin user
      if (authResponse.username) {
        sessionStorage.setItem('username', authResponse.username);
      }
      if (authResponse.role) {
        sessionStorage.setItem('role', authResponse.role);
      }
      if (authResponse.userId) {
        sessionStorage.setItem('userId', authResponse.userId.toString());
      }
      if (authResponse.email) {
        sessionStorage.setItem('email', authResponse.email);
      }
      if (authResponse.fullName) {
        sessionStorage.setItem('fullname', authResponse.fullName);
      }
      if (authResponse.avatarUrl) {
        sessionStorage.setItem('avatar', authResponse.avatarUrl);
      }
      if (authResponse.email) {
        sessionStorage.setItem('email', authResponse.email);
      }
      if (authResponse.fullName) {
        sessionStorage.setItem('fullname', authResponse.fullName);
      }

      console.log('✅ Registration successful:', {
        username: authResponse.username,
        email: authResponse.email,
        hasToken: !!authResponse.token,
        hasRefreshToken: !!authResponse.refreshToken
      });

      return authResponse;
    } catch (error: any) {
      console.error('❌ Registration failed:', error);
      throw new Error(error.response?.data?.message || 'Đăng ký thất bại');
    }
  }

  /**
   * Check if username is available
   */
  async checkUsername(username: string): Promise<boolean> {
    try {
      console.log('🔍 Checking username availability:', username);
      const response = await api.get(`${this.baseUrl}/check-username?username=${username}`);
      const isAvailable = !response.data; // API trả về true nếu username đã tồn tại
      console.log(`✅ Username ${username} availability:`, isAvailable ? 'Available' : 'Taken');
      return isAvailable;
    } catch (error: any) {
      console.error('❌ Username check failed:', error);
      throw new Error(error.response?.data?.message || 'Không thể kiểm tra tên đăng nhập');
    }
  }

  /**
   * Login user
   */
  async login(loginData: LoginRequest): Promise<AuthResponse> {
    try {
      console.log('🔐 Attempting login:', { username: loginData.username });
      
      const response = await api.post(`${this.baseUrl}/login`, loginData);
      const authResponse = response.data as AuthResponse;

      // Lưu tokens vào sessionStorage
      if (authResponse.token) {
        sessionStorage.setItem('token', authResponse.token);
        console.log('✅ Access token saved');
      }

      if (authResponse.refreshToken) {
        sessionStorage.setItem('refreshToken', authResponse.refreshToken);
        console.log('✅ Refresh token saved');
      }

      // Lưu thông tin user
      if (authResponse.username) {
        sessionStorage.setItem('username', authResponse.username);
      }
      if (authResponse.role) {
        sessionStorage.setItem('role', authResponse.role);
      }
      if (authResponse.userId) {
        sessionStorage.setItem('userId', authResponse.userId.toString());
      }

      console.log('✅ Login successful:', {
        username: authResponse.username,
        role: authResponse.role,
        hasToken: !!authResponse.token,
        hasRefreshToken: !!authResponse.refreshToken
      });

      return authResponse;
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      throw new Error(error.response?.data?.message || 'Đăng nhập thất bại');
    }
  }

  /**
   * OAuth2 login
   */
  async oauth2Login(oauth2Data: any): Promise<AuthResponse> {
    try {
      console.log('🔐 Attempting OAuth2 login:', { provider: oauth2Data.provider, email: oauth2Data.email });
      
      const response = await api.post(`${this.baseUrl}/oauth2/login`, oauth2Data);
      const authResponse = response.data as AuthResponse;

      // Lưu tokens vào sessionStorage
      if (authResponse.token) {
        sessionStorage.setItem('token', authResponse.token);
        console.log('✅ Access token saved');
      }

      if (authResponse.refreshToken) {
        sessionStorage.setItem('refreshToken', authResponse.refreshToken);
        console.log('✅ Refresh token saved');
      }

      // Lưu thông tin user
      if (authResponse.username) {
        sessionStorage.setItem('username', authResponse.username);
      }
      if (authResponse.role) {
        sessionStorage.setItem('role', authResponse.role);
      }
      if (authResponse.userId) {
        sessionStorage.setItem('userId', authResponse.userId.toString());
      }
      if (authResponse.email) {
        sessionStorage.setItem('email', authResponse.email);
      }
      if (authResponse.fullName) {
        sessionStorage.setItem('fullname', authResponse.fullName);
      }
      if (authResponse.avatarUrl) {
        sessionStorage.setItem('avatar', authResponse.avatarUrl);
      }

      console.log('✅ OAuth2 login successful:', {
        username: authResponse.username,
        role: authResponse.role,
        hasToken: !!authResponse.token,
        hasRefreshToken: !!authResponse.refreshToken
      });

      return authResponse;
    } catch (error: any) {
      console.error('❌ OAuth2 login failed:', error);
      throw new Error(error.response?.data?.message || 'OAuth2 đăng nhập thất bại');
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(): Promise<AuthResponse> {
    try {
      const refreshToken = sessionStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        throw new Error('Không tìm thấy refresh token');
      }

      console.log('🔄 Refreshing token...');

      const response = await api.post(`${this.baseUrl}/refresh-token`, {
        refreshToken: refreshToken
      });

      const authResponse = response.data as AuthResponse;

      // Cập nhật tokens
      if (authResponse.token) {
        sessionStorage.setItem('token', authResponse.token);
        console.log('✅ New access token saved');
      }

      if (authResponse.refreshToken) {
        sessionStorage.setItem('refreshToken', authResponse.refreshToken);
        console.log('✅ New refresh token saved');
      }

      return authResponse;
    } catch (error: any) {
      console.error('❌ Token refresh failed:', error);
      this.logout(); // Clear token and logout
      throw new Error(error.response?.data?.message || 'Làm mới token thất bại');
    }
  }

  /**
   * Logout - clear all tokens
   */
  logout(): void {
    console.log('🚪 Logging out...');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('userId');
    sessionStorage.clear(); // Clear all
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = sessionStorage.getItem('token');
    const refreshToken = sessionStorage.getItem('refreshToken');
    return !!(token || refreshToken);
  }

  /**
   * Get current user info from sessionStorage
   */
  getCurrentUser(): {
    userId: string | null;
    username: string | null;
    role: string | null;
    token: string | null;
    refreshToken: string | null;
  } {
    return {
      userId: sessionStorage.getItem('userId'),
      username: sessionStorage.getItem('username'),
      role: sessionStorage.getItem('role'),
      token: sessionStorage.getItem('token'),
      refreshToken: sessionStorage.getItem('refreshToken')
    };
  }

  /**
   * Test API call để kiểm tra token
   */
  async testProtectedRoute(): Promise<any> {
    try {
      console.log('🧪 Testing protected route...');
      const response = await api.get('/bookings');
      console.log('✅ Protected route test successful');
      return response.data;
    } catch (error: any) {
      console.error('❌ Protected route test failed:', error);
      throw error;
    }
  }
}

export const authApi = new AuthApiService();