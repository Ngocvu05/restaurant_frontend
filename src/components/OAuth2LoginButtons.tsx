import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import api from '../api/axiosConfigUser';

interface OAuth2Response {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    avatar?: string;
  };
}

interface OAuth2LoginButtonsProps {
  onSuccess: (response: OAuth2Response) => void;
  onError: (error: string) => void;
  setLoading: (loading: boolean) => void;
}

interface GoogleTokenPayload {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

interface FacebookLoginResponse {
  status: string;
  authResponse?: {
    accessToken: string;
    userID: string;
    expiresIn: string;
    signedRequest: string;
  };
}

interface FacebookUserInfo {
  id: string;
  name: string;
  email?: string;
  picture: {
    data: {
      url: string;
    };
  };
  error?: {
    message: string;
  };
}

// Declare Facebook SDK types
interface FacebookSDK {
  init(options: {
    appId: string;
    cookie?: boolean;
    xfbml?: boolean;
    version: string;
    status?: boolean;
    frictionlessRequests?: boolean;
  }): void;
  login(callback: (response: FacebookLoginResponse) => void, options: {
    scope: string;
    return_scopes?: boolean;
    auth_type?: string;
  }): void;
  api(path: string, params: any, callback: (response: FacebookUserInfo) => void): void;
  getLoginStatus(callback: (response: FacebookLoginResponse) => void, force?: boolean): void;
}

declare global {
  interface Window {
    FB: FacebookSDK;
    fbAsyncInit: () => void;
  }
}

const OAuth2LoginButtons: React.FC<OAuth2LoginButtonsProps> = ({ 
  onSuccess, 
  onError, 
  setLoading 
}) => {
  const [fbLoaded, setFbLoaded] = React.useState(false);
  const [fbInitialized, setFbInitialized] = React.useState(false);
  const [initializationAttempts, setInitializationAttempts] = React.useState(0);
  const maxRetries = 3;

  React.useEffect(() => {
    let isMounted = true;
    let initTimer: NodeJS.Timeout;

    const initializeFacebook = async (attempt: number = 1) => {
      if (!process.env.REACT_APP_FACEBOOK_APP_ID) {
        console.warn('Facebook App ID not configured');
        return;
      }

      if (attempt > maxRetries) {
        console.error('Failed to initialize Facebook SDK after maximum retries');
        if (isMounted) {
          setFbLoaded(false);
          setFbInitialized(false);
        }
        return;
      }

      try {
        // Check if FB is already available
        if (window.FB && typeof window.FB.init === 'function') {
          console.log('Facebook SDK already available, reinitializing...');
          try {
            window.FB.init({
              appId: process.env.REACT_APP_FACEBOOK_APP_ID!,
              cookie: true,
              xfbml: false, // Disable automatic parsing to avoid conflicts
              version: 'v18.0',
              status: false, // Disable automatic status check
              frictionlessRequests: true
            });
            
            if (isMounted) {
              setFbLoaded(true);
              setFbInitialized(true);
              console.log('Facebook SDK reinitialized successfully');
            }
            return;
          } catch (reinitError) {
            console.warn('Facebook SDK reinitialization failed, loading fresh SDK...', reinitError);
            // Continue to load fresh SDK
          }
        }

        // Clean up existing scripts and FB instance
        const existingScripts = document.querySelectorAll('script[src*="connect.facebook.net"]');
        existingScripts.forEach(script => script.remove());
        
        // Reset FB instance and fbAsyncInit
        window.FB = undefined as any;
        window.fbAsyncInit = undefined as any;

        // Set up fbAsyncInit before loading script
        window.fbAsyncInit = function() {
          if (!isMounted) return;

          try {
            console.log('Facebook SDK fbAsyncInit called');
            
            window.FB.init({
              appId: process.env.REACT_APP_FACEBOOK_APP_ID!,
              cookie: true,
              xfbml: false, // Disable to prevent auto-parsing issues
              version: 'v18.0',
              status: false,
              frictionlessRequests: true
            });

            // Wait a bit for SDK to fully initialize
            setTimeout(() => {
              if (isMounted && window.FB) {
                setFbLoaded(true);
                setFbInitialized(true);
                console.log('Facebook SDK initialized successfully');
              }
            }, 500);
            
          } catch (error) {
            console.error('Facebook SDK initialization error:', error);
            if (isMounted) {
              setFbLoaded(false);
              setFbInitialized(false);
              // Retry initialization
              setInitializationAttempts(prev => prev + 1);
            }
          }
        };

        // Load the SDK script
        const script = document.createElement('script');
        script.async = true;
        script.defer = true;
        script.crossOrigin = 'anonymous';
        script.src = `https://connect.facebook.net/en_US/sdk.js#xfbml=0&version=v18.0&appId=${process.env.REACT_APP_FACEBOOK_APP_ID!}`;
        
        script.onload = () => {
          console.log(`Facebook SDK script loaded (attempt ${attempt})`);
        };
        
        script.onerror = (error) => {
          console.error(`Failed to load Facebook SDK (attempt ${attempt}):`, error);
          if (isMounted) {
            setFbLoaded(false);
            setFbInitialized(false);
            // Retry after delay
            if (attempt < maxRetries) {
              initTimer = setTimeout(() => {
                initializeFacebook(attempt + 1);
              }, 2000 * attempt); // Exponential backoff
            }
          }
        };
        
        document.head.appendChild(script);

      } catch (error) {
        console.error(`Facebook SDK initialization attempt ${attempt} failed:`, error);
        if (isMounted && attempt < maxRetries) {
          initTimer = setTimeout(() => {
            initializeFacebook(attempt + 1);
          }, 2000 * attempt);
        }
      }
    };

    // Start initialization with a small delay to avoid conflicts
    const startTimer = setTimeout(() => {
      initializeFacebook(1);
    }, 300);

    return () => {
      isMounted = false;
      if (initTimer) clearTimeout(initTimer);
      if (startTimer) clearTimeout(startTimer);
    };
  }, [initializationAttempts]);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setLoading(true);
      
      if (!credentialResponse.credential) {
        throw new Error('Không nhận được credential từ Google');
      }

      // Decode JWT token để lấy thông tin user
      const decoded = jwtDecode<GoogleTokenPayload>(credentialResponse.credential);
      
      const oauth2Request = {
        provider: 'google',
        accessToken: credentialResponse.credential,
        sessionId: sessionStorage.getItem('chat-session-id') || '',
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        providerId: decoded.sub
      };

      console.log('Google OAuth2 request:', oauth2Request);

      const response = await api.post('/auth/oauth2/login', oauth2Request);
      onSuccess(response.data);
      
    } catch (error: any) {
      console.error('Google login error:', error);
      onError(error.response?.data?.message || 'Đăng nhập Google thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    onError('Đăng nhập Google bị hủy hoặc thất bại');
  };

  const handleFacebookLogin = () => {
    if (!fbInitialized || !window.FB) {
      onError('Facebook SDK chưa sẵn sàng. Vui lòng thử lại sau.');
      return;
    }

    if (!process.env.REACT_APP_FACEBOOK_APP_ID) {
      onError('Facebook App ID chưa được cấu hình');
      return;
    }

    setLoading(true);
    
    // Add comprehensive timeout handling
    const loginTimeout = setTimeout(() => {
      setLoading(false);
      onError('Đăng nhập Facebook bị timeout. Vui lòng thử lại.');
    }, 45000); // Increased timeout to 45 seconds

    try {
      // Check FB status first
      window.FB.getLoginStatus((statusResponse: FacebookLoginResponse) => {
        console.log('Facebook login status:', statusResponse);
        
        if (statusResponse.status === 'connected' && statusResponse.authResponse) {
          // User is already logged in, get their info
          clearTimeout(loginTimeout);
          handleFacebookUserInfo(statusResponse.authResponse.accessToken, loginTimeout);
        } else {
          // User needs to login
          window.FB.login((response: FacebookLoginResponse) => {
            console.log('Facebook login response:', response);
            
            if (response.status === 'connected' && response.authResponse) {
              clearTimeout(loginTimeout);
              handleFacebookUserInfo(response.authResponse.accessToken, loginTimeout);
            } else if (response.status === 'not_authorized') {
              clearTimeout(loginTimeout);
              setLoading(false);
              onError('Bạn chưa cấp quyền cho ứng dụng. Vui lòng cho phép truy cập để tiếp tục.');
            } else if (response.status === 'unknown') {
              clearTimeout(loginTimeout);
              setLoading(false);
              onError('Không thể kết nối đến Facebook. Vui lòng kiểm tra kết nối mạng và thử lại.');
            } else {
              clearTimeout(loginTimeout);
              setLoading(false);
              console.log('Facebook login cancelled or failed:', response);
              // Don't show error for user cancellation
            }
          }, { 
            scope: 'email,public_profile',
            return_scopes: true,
            auth_type: 'rerequest' // Force re-request permissions
          });
        }
      }, true); // Force fresh status check

    } catch (error: any) {
      clearTimeout(loginTimeout);
      setLoading(false);
      console.error('Facebook login initialization error:', error);
      onError('Lỗi khởi tạo đăng nhập Facebook. Vui lòng thử lại.');
    }
  };

  const handleFacebookUserInfo = (accessToken: string, timeoutRef: NodeJS.Timeout) => {
    // Get user info with enhanced error handling
    const apiTimeout = setTimeout(() => {
      setLoading(false);
      onError('Lấy thông tin từ Facebook bị timeout. Vui lòng thử lại.');
    }, 20000); // 20 seconds for API call

    try {
      window.FB.api('/me', {
        fields: 'id,name,email,picture.width(200).height(200)',
        access_token: accessToken // Explicitly pass access token
      }, async (userInfo: FacebookUserInfo) => {
        clearTimeout(apiTimeout);
        console.log('Facebook user info:', userInfo);
        
        try {
          // Enhanced error checking
          if (userInfo.error) {
            throw new Error(`Facebook API Error: ${userInfo.error.message}`);
          }

          if (!userInfo.id) {
            throw new Error('Không thể lấy thông tin ID từ Facebook.');
          }

          if (!userInfo.name) {
            throw new Error('Không thể lấy thông tin tên từ Facebook.');
          }

          // Check for email - provide more specific error message
          if (!userInfo.email) {
            throw new Error('Không thể lấy thông tin email từ Facebook. Vui lòng:\n1. Cấp quyền email cho ứng dụng\n2. Đảm bảo tài khoản Facebook có email xác thực\n3. Hoặc sử dụng phương thức đăng nhập khác');
          }

          const oauth2Request = {
            provider: 'facebook' as const,
            accessToken: accessToken,
            sessionId: sessionStorage.getItem('chat-session-id') || '',
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture?.data?.url || '',
            providerId: userInfo.id
          };

          console.log('Facebook OAuth2 request:', oauth2Request);

          // Add retry logic for API call
          let apiRetries = 0;
          const maxApiRetries = 2;
          
          const makeApiCall = async (): Promise<any> => {
            try {
              return await api.post('/auth/oauth2/login', oauth2Request);
            } catch (error: any) {
              if (apiRetries < maxApiRetries && (
                error.code === 'NETWORK_ERROR' || 
                error.response?.status >= 500 ||
                error.message?.includes('timeout')
              )) {
                apiRetries++;
                console.log(`Retrying API call (attempt ${apiRetries + 1})`);
                await new Promise(resolve => setTimeout(resolve, 1000 * apiRetries));
                return makeApiCall();
              }
              throw error;
            }
          };

          const apiResponse = await makeApiCall();
          onSuccess(apiResponse.data);
          
        } catch (error: any) {
          console.error('Facebook login processing error:', error);
          let errorMessage = 'Đăng nhập Facebook thất bại';
          
          if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          onError(errorMessage);
        } finally {
          setLoading(false);
        }
      });
    } catch (error: any) {
      clearTimeout(apiTimeout);
      setLoading(false);
      console.error('Facebook API call error:', error);
      onError('Lỗi khi gọi Facebook API. Vui lòng thử lại.');
    }
  };

  return (
    <div className="oauth2-login-buttons">
      <div className="row mt-3">
        <div className="col-lg-12">
          <div className="text-center mb-3">
            <span className="text-muted">Hoặc đăng nhập bằng</span>
          </div>
        </div>
      </div>
      
      <div className="row">
        <div className="col-lg-6 mb-2">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap={false}
            theme="outline"
            size="large"
            width="100%"
            text="signin_with"
            locale="vi"
          />
        </div>
        
        <div className="col-lg-6 mb-2">
          <button
            type="button"
            className="btn btn-primary w-100"
            onClick={handleFacebookLogin}
            disabled={!fbInitialized}
            style={{
              backgroundColor: !fbInitialized ? '#ccc' : '#1877f2',
              borderColor: !fbInitialized ? '#ccc' : '#1877f2',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: !fbInitialized ? 'not-allowed' : 'pointer'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            {!fbInitialized ? 'Đang khởi tạo...' : 'Đăng nhập với Facebook'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OAuth2LoginButtons;