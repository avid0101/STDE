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
      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({
        id: userId,
        userType,
        firstname,
        lastname,
        email,
        avatarUrl
      }));

      // Redirect based on role
      if (userType === 'STUDENT') {
        navigate('/student/dashboard');
      } else if (userType === 'TEACHER') {
        navigate('/teacher/dashboard');
      }
    } else {
      navigate('/login/student');
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
        <div>Authenticating with Google...</div>
      </div>
    </div>
  );
}