import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

// Renders Google's official "Sign in with Google" button using Google Identity
// Services. On success, sends the ID token to the backend to verify + create
// a session cookie. This is the CLIENT (booker) lightweight identity login -
// it does NOT request Calendar access, only basic profile/email.
export default function GoogleSignInButton({ onSuccess }) {
  const ref = useRef(null);
  const { loginWithIdToken } = useAuth();

  useEffect(() => {
    if (!window.google || !ref.current) return;

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: async (response) => {
        try {
          const user = await loginWithIdToken(response.credential);
          onSuccess?.(user);
        } catch (err) {
          console.error('Google sign-in failed', err);
          alert('Google sign-in failed. Please try again.');
        }
      },
    });

    window.google.accounts.id.renderButton(ref.current, {
      theme: 'outline',
      size: 'large',
      width: 280,
      text: 'continue_with',
    });
  }, []);

  return <div ref={ref}></div>;
}
