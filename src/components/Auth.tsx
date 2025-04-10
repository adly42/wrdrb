import React from 'react';
import { supabase } from '../utils/supabaseClient';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import '../styles/main.css';

export const Auth: React.FC = () => {
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
        <p className="auth-subtitle">Sign in to manage your wardrobe</p>
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
          redirectTo={`${window.location.origin}/auth/callback`}
          onlyThirdPartyProviders
        />
      </div>
    </div>
  );
}; 