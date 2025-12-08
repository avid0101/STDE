import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');
    const userType = searchParams.get('userType');
    const firstname = searchParams.get('firstname');
    const lastname = searchParams.get('lastname');
    const email = searchParams.get('email');
    const avatarUrl = searchParams.get('avatarUrl');

    if (token && userId) {
      const userData = {
        id: userId,
        userType,
        firstname,
        lastname,
        email,
        avatarUrl
      };

      // Check if this window has an opener (parent window)
      if (window.opener) {
        // Send the data back to the main window
        window.opener.postMessage({
          type: 'GOOGLE_LINK_SUCCESS',
          token: token,
          user: userData
        }, window.location.origin); // Security: Only allow same origin
        
        // Close the popup
        window.close();
      } else {
        // NORMAL LOGIN FLOW (Not a popup)
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));

        if (userType === 'STUDENT') {
          navigate('/student/dashboard');
        } else if (userType === 'TEACHER') {
          navigate('/teacher/dashboard');
        }
      }
    } else {
      // Error or Cancelled
      if (window.opener) {
        window.opener.postMessage({ type: 'GOOGLE_LINK_ERROR' }, window.location.origin);
        window.close();
      } else {
        navigate('/login/student');
      }
    }
  }, [searchParams, navigate]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontSize: '1.25rem',
      color: '#6b7280',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔄</div>
        <div>Connecting to Google...</div>
      </div>
    </div>
  );
}