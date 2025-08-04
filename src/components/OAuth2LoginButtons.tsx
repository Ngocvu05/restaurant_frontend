import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import api from '../api/axiosConfigUser';

interface OAuth2LoginButtonsProps {
  onSuccess: (response: any) => void;
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
}

// Declare Facebook SDK
declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

const OAuth2LoginButtons: React.FC<OAuth2LoginButtonsProps> = ({ 
  onSuccess, 
  onError, 
  setLoading 
}) => {
  const [fbLoaded, setFbLoaded] = React.useState(false);

  React.useEffect(() => {
    // Load Facebook SDK
    if (!window.FB) {
      window.fbAsyncInit = function() {
        window.FB.init({
          appId: process.env.REACT_APP_FACEBOOK_APP_ID || '',
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });
        
        // Check login status when SDK is loaded
        window.FB.getLoginStatus(() => {
          setFbLoaded(true);
        });
      };

      // Load the SDK asynchronously
      const script = document.createElement('script');
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      script.src = 'https://connect.facebook.net/vi_VN/sdk.js';
      script.onload = () => {
        console.log('Facebook SDK loaded');
      };
      script.onerror = () => {
        console.error('Failed to load Facebook SDK');
        setFbLoaded(false);
      };
      document.head.appendChild(script);
    } else {
      setFbLoaded(true);
    }
  }, []);

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
    if (!window.FB) {
      onError('Facebook SDK chưa được tải. Vui lòng thử lại sau.');
      return;
    }

    if (!process.env.REACT_APP_FACEBOOK_APP_ID) {
      onError('Facebook App ID chưa được cấu hình');
      return;
    }

    setLoading(true);
    
    window.FB.login((response: FacebookLoginResponse) => {
      console.log('Facebook login response:', response);
      
      if (response.status === 'connected' && response.authResponse) {
        const { accessToken, userID } = response.authResponse;
        
        // Get user info
        window.FB.api('/me', {
          fields: 'id,name,email,picture.width(200).height(200)'
        }, async (userInfo: FacebookUserInfo) => {
          console.log('Facebook user info:', userInfo);
          
          try {
            // Kiểm tra email - nếu không có thì yêu cầu user cung cấp
            if (!userInfo.email) {
              throw new Error('Không thể lấy thông tin email từ Facebook. Vui lòng sử dụng phương thức đăng nhập khác.');
            }

            const oauth2Request = {
              provider: 'facebook',
              accessToken: accessToken,
              sessionId: sessionStorage.getItem('chat-session-id') || '',
              email: userInfo.email,
              name: userInfo.name,
              picture: userInfo.picture?.data?.url || '',
              providerId: userInfo.id
            };

            console.log('Facebook OAuth2 request:', oauth2Request);

            const apiResponse = await api.post('/auth/oauth2/login', oauth2Request);
            onSuccess(apiResponse.data);
            
          } catch (error: any) {
            console.error('Facebook login error:', error);
            onError(error.response?.data?.message || error.message || 'Đăng nhập Facebook thất bại');
          } finally {
            setLoading(false);
          }
        });
      } else if (response.status === 'not_authorized') {
        setLoading(false);
        onError('Bạn chưa cấp quyền cho ứng dụng');
      } else {
        setLoading(false);
        onError('Đăng nhập Facebook bị hủy');
      }
    }, { 
      scope: 'email',
      return_scopes: true 
    });
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
            disabled={!fbLoaded}
            style={{
              backgroundColor: !fbLoaded ? '#ccc' : '#1877f2',
              borderColor: !fbLoaded ? '#ccc' : '#1877f2',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: !fbLoaded ? 'not-allowed' : 'pointer'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            {!fbLoaded ? 'Đang tải...' : 'Đăng nhập với Facebook'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OAuth2LoginButtons;