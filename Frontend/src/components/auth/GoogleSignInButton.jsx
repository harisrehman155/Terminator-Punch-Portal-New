import { useEffect, useRef, useState } from 'react';
import { Box, Button } from '@mui/material';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { loginWithGoogle } from '../../redux/actions/AuthAction';

const GoogleSignInButton = ({ mode = 'signin' }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const buttonRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [initAttempts, setInitAttempts] = useState(0);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) {
      return;
    }

    const existingScript = document.querySelector('script[data-google-identity]');
    if (existingScript) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = 'true';
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setScriptLoaded(false);
    document.head.appendChild(script);
  }, [clientId]);

  useEffect(() => {
    if (!clientId || !scriptLoaded || !buttonRef.current) {
      return;
    }

    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
      if (initAttempts < 10) {
        const retryId = setTimeout(() => {
          setInitAttempts((prev) => prev + 1);
        }, 200);
        return () => clearTimeout(retryId);
      }
      return;
    }

    const containerWidth = buttonRef.current.offsetWidth;
    if (!containerWidth) {
      if (initAttempts < 10) {
        const retryId = setTimeout(() => {
          setInitAttempts((prev) => prev + 1);
        }, 200);
        return () => clearTimeout(retryId);
      }
      return;
    }

    const handleCredentialResponse = async (response) => {
      if (!response?.credential) {
        toast.error('Google sign-in failed. Please try again.');
        return;
      }

      const result = await dispatch(loginWithGoogle(response.credential));

      if (result.success) {
        const userRole = result.data.user.role;
        const redirectPath = userRole === 'ADMIN' ? '/admin/dashboard' : '/dashboard';
        toast.success('Login successful');
        navigate(redirectPath, { replace: true });
      } else {
        toast.error(result.message || 'Google login failed');
      }
    };

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
    });

    buttonRef.current.innerHTML = '';
    buttonRef.current.style.width = '100%';

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: 'outline',
      size: 'large',
      text: mode === 'signup' ? 'signup_with' : 'signin_with',
      shape: 'pill',
      width: Math.max(240, Math.floor(containerWidth)),
    });
  }, [clientId, dispatch, mode, navigate, scriptLoaded, initAttempts]);

  if (!clientId) {
    if (import.meta.env.DEV) {
      return (
        <Button fullWidth variant="outlined" disabled>
          Set VITE_GOOGLE_CLIENT_ID to enable Google sign-in
        </Button>
      );
    }
    return null;
  }

  return (
    <Box
      ref={buttonRef}
      sx={{
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
      }}
    />
  );
};

export default GoogleSignInButton;
