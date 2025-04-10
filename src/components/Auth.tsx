import React from 'react';
import { supabase } from '../utils/supabaseClient';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import '../styles/main.css';

console.log("Environment:", process.env.NODE_ENV);
export const Auth: React.FC = () => {
  // Dynamically set the redirect URI based on the environment
  const redirectUri = process.env.NODE_ENV === 'production'
    ? 'https://wrdrb.vercel.app/callback' // Production redirect URL
    : 'http://localhost:3000/auth/callback'; // Localhost redirect URL

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">
          <img 
            src="/images/wrdrb_logo.png" 
            alt="wrdrb" 
            style={{
              maxWidth: '200px',
              height: 'auto',
              margin: '0 auto',
              display: 'block'
            }}
          />
        </h1>
        <p className="auth-subtitle">Take the stress out of getting dressed.</p>
        console.log('Redirect URI:', redirectUri);
        <SupabaseAuth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#28694B',
                  brandAccent: '#1f4f3a',
                },
              },
            },
            style: {
              button: {
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
              },
              input: {
                borderRadius: '8px',
              },
            },
          }}
          providers={['google']}
          redirectTo={redirectUri}  // Use the dynamic redirect URI
          onlyThirdPartyProviders
        />
      </div>
    </div>
  );
};
