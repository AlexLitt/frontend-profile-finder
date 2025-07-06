import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/auth-context';
import { supabase } from '../lib/supabase';

// Debug component to show auth state
export function AuthDebugComponent() {
  const { user, profile, isAuthenticated, isLoading, error } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  const addLog = (type: 'log' | 'error' | 'warn', message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    setDebugInfo(prev => [...prev, { type, message, data, timestamp }]);
    console[type](`[AuthDebug] ${message}`, data);
  };

  const testProfileCreation = async () => {
    setDebugInfo([]);
    
    try {
      addLog('log', 'Starting profile creation test...');
      
      // Check if user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        addLog('error', 'Failed to get current user', userError);
        return;
      }
      
      if (!user) {
        addLog('warn', 'No authenticated user found');
        return;
      }
      
      addLog('log', 'Authenticated user found', { 
        id: user.id, 
        email: user.email,
        metadata: user.user_metadata 
      });
      
      // Check auth.users data instead of profiles table
      addLog('log', 'Using auth.users data for profile instead of separate profiles table');
      
      const userData = user;
      const profileFromAuth = {
        id: userData.id,
        email: userData.email,
        role: userData.email === import.meta.env.VITE_ADMIN_EMAIL ? 'admin' : 'user',
        created_at: userData.created_at,
        updated_at: userData.updated_at || userData.created_at,
        full_name: userData.user_metadata?.full_name || userData.user_metadata?.name || null,
        avatar_url: userData.user_metadata?.avatar_url || null
      };
      
      addLog('log', 'Profile created from auth.users data', profileFromAuth);
      
    } catch (error) {
      addLog('error', 'Unexpected error during test', error);
    }
  };

  if (!showDebug) {
    return (
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 10000,
        maxWidth: '300px'
      }}>
        <div><strong>Auth Debug:</strong></div>
        <div>Loading: {isLoading ? 'YES' : 'NO'}</div>
        <div>Authenticated: {isAuthenticated ? 'YES' : 'NO'}</div>
        <div>User: {user ? user.email : 'null'}</div>
        <div>Profile: {profile ? profile.role : 'null'}</div>
        {error && <div style={{color: 'red'}}>Error: {error}</div>}
        <button 
          onClick={() => setShowDebug(true)}
          style={{
            marginTop: '10px',
            padding: '5px 10px',
            background: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          Test Profile Creation
        </button>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'white',
      color: 'black',
      padding: '15px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 10000,
      maxWidth: '400px',
      maxHeight: '500px',
      overflow: 'auto',
      border: '1px solid #ccc',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <div style={{ marginBottom: '10px' }}>
        <strong>Profile Creation Debug</strong>
        <button 
          onClick={() => setShowDebug(false)}
          style={{
            float: 'right',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            fontSize: '11px',
            cursor: 'pointer',
            padding: '2px 6px'
          }}
        >
          ×
        </button>
      </div>
      
      <button
        onClick={testProfileCreation}
        style={{
          marginBottom: '10px',
          padding: '5px 10px',
          background: '#0066cc',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          fontSize: '11px',
          cursor: 'pointer'
        }}
      >
        Run Test
      </button>
      
      <div style={{ maxHeight: '300px', overflow: 'auto' }}>
        {debugInfo.map((log, index) => (
          <div
            key={index}
            style={{
              marginBottom: '8px',
              padding: '5px',
              borderLeft: `3px solid ${
                log.type === 'error' ? '#dc3545' : 
                log.type === 'warn' ? '#ffc107' : '#28a745'
              }`,
              background: log.type === 'error' ? '#ffe6e6' : 
                         log.type === 'warn' ? '#fff3cd' : '#d4edda',
              fontSize: '11px'
            }}
          >
            <div style={{ fontWeight: 'bold' }}>{log.type.toUpperCase()}: {log.message}</div>
            {log.data && (
              <pre style={{ 
                fontSize: '10px', 
                marginTop: '5px', 
                background: 'white', 
                padding: '5px', 
                borderRadius: '3px',
                overflow: 'auto',
                maxHeight: '100px'
              }}>
                {JSON.stringify(log.data, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
