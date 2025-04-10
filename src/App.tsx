import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './utils/supabaseClient';
import { Session } from '@supabase/supabase-js';
import Dashboard from './pages/Dashboard';
import ClothingDatabase from './pages/ClothingDatabase';
import { Calendar } from './components/Calendar';
import OutfitPlanner from './pages/OutfitPlanner';
import MixAndMatch from './pages/MixAndMatch';
import { Auth } from './components/Auth';
import './styles/main.css';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="text-center">
          <h1>Loading...</h1>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <Router>
      <div className="dashboard-container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clothing" element={<ClothingDatabase />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/outfit-planner" element={<OutfitPlanner />} />
          <Route path="/mix-and-match" element={<MixAndMatch />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
