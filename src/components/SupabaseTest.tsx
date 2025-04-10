import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import '../styles/main.css';

export const SupabaseTest: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test 1: Basic connection
        const { data, error } = await supabase.from('outfits').select('count');
        
        if (error) {
          throw error;
        }

        // Test 2: Auth status
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          throw authError;
        }

        setStatus('success');
        setMessage('Successfully connected to Supabase! Database and auth are working.');
      } catch (error) {
        console.error('Supabase connection error:', error);
        setStatus('error');
        setMessage(`Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="card">
      <h2 className="section-title">Supabase Connection Test</h2>
      <div className="card" style={{
        backgroundColor: status === 'loading' ? '#f3f4f6' : 
                        status === 'success' ? '#dcfce7' : 
                        '#fee2e2'
      }}>
        {status === 'loading' && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className="spinner" style={{ marginRight: '0.5rem' }}></div>
            Testing connection...
          </div>
        )}
        {status === 'success' && (
          <div style={{ color: '#065f46' }}>
            {message}
          </div>
        )}
        {status === 'error' && (
          <div style={{ color: '#991b1b' }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}; 