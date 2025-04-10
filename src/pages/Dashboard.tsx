import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { Calendar } from '../components/Calendar';
import { WeatherWidget } from '../components/WeatherWidget';
import '../styles/main.css';

interface User {
  name: string;
  email: string;
}

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser({
          name: user.user_metadata?.full_name || 'User',
          email: user.email || '',
        });
      }
    };
  
    fetchUser();
  }, []);

  const handleClothingScanner = () => {
    navigate('/scanner');
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="dashboard-container" style={{ 
      fontFamily: "'Poppins', sans-serif",
      color: "#666666",
      fontSize: "14px",
      lineHeight: "1.80857",
      fontWeight: "normal",
      overflowX: "hidden"
    }}>
      <div className="dashboard-header" style={{
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "15px 0",
        maxWidth: "1200px",
        margin: "0 auto",
        backgroundImage: "url(../images/header-bg.png)",
        backgroundSize: "100%",
        backgroundRepeat: "no-repeat"
      }}>
        <div className="header-content">
          <h1 style={{
            fontSize: '2.5rem',
            marginBottom: '1rem',
            color: 'var(--color-green)',
            display: 'flex',
            alignItems: 'center'
          }}>
            <img 
              src="/images/wrdrb_logo.png" 
              alt="wrdrb" 
              style={{
                maxWidth: '150px',
                height: 'auto'
              }}
            />
          </h1>
          <p className="dashboard-subtitle" style={{
            fontSize: "16px",
            color: "#4a4949",
            margin: "0"
          }}>
            Welcome, {user?.email ? user.email.split('@')[0] : 'User'}. What are we wearing today?
          </p>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary logout-btn" style={{
          fontSize: "16px",
          color: "#fefefd",
          backgroundColor: "#d07d6b",
          padding: "10px 20px",
          textTransform: "uppercase",
          fontWeight: "bold",
          borderRadius: "5px",
          border: "none",
          cursor: "pointer",
          whiteSpace: "nowrap"
        }}>
          Log Out
        </button>
      </div>

      <div className="dashboard-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "20px",
        padding: "20px"
      }}>
        <div className="dashboard-card" style={{
          backgroundColor: "#ffffff",
          boxShadow: "0px 0px 20px 0px rgba(0,0,0,0.1)",
          padding: "30px",
          borderRadius: "5px"
        }}>
          <h2 className="card-title" style={{
            fontSize: "22px",
            color: "#3b3b3b",
            textTransform: "uppercase",
            textAlign: "center",
            fontWeight: "bold",
            marginBottom: "20px"
          }}>Weather</h2>
          <WeatherWidget />
        </div>

        <div className="dashboard-card" style={{
          backgroundColor: "#ffffff",
          boxShadow: "0px 0px 20px 0px rgba(0,0,0,0.1)",
          padding: "30px",
          borderRadius: "5px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <h2 className="card-title" style={{
            fontSize: "22px",
            color: "#3b3b3b",
            textTransform: "uppercase",
            textAlign: "center",
            fontWeight: "bold",
            marginBottom: "20px"
          }}>Manage Wardrobe</h2>
          <p className="text-center" style={{
            fontSize: "16px",
            color: "#3b3b3b",
            textAlign: "center",
            margin: "0 0 20px 0"
          }}>Add, edit, or remove items from your wardrobe</p>
          <div className="text-center" style={{ marginTop: "20px" }}>
            <Link to="/clothing" className="btn btn-primary" style={{
              fontSize: "16px",
              color: "#fefefd",
              backgroundColor: "#d07d6b",
              padding: "10px 20px",
              textTransform: "uppercase",
              fontWeight: "bold",
              borderRadius: "5px",
              border: "none",
              cursor: "pointer",
              display: "inline-block",
              textDecoration: "none",
              transition: "all 0.3s ease-in-out"
            }}>
              Manage Wardrobe
            </Link>
          </div>
        </div>

        <div className="dashboard-card" style={{
          backgroundColor: "#ffffff",
          boxShadow: "0px 0px 20px 0px rgba(0,0,0,0.1)",
          padding: "30px",
          borderRadius: "5px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <h2 className="card-title" style={{
            fontSize: "22px",
            color: "#3b3b3b",
            textTransform: "uppercase",
            textAlign: "center",
            fontWeight: "bold",
            marginBottom: "20px"
          }}>Plan Outfit</h2>
          <p className="text-center" style={{
            fontSize: "16px",
            color: "#3b3b3b",
            textAlign: "center",
            margin: "0 0 20px 0"
          }}>Create and schedule outfits for upcoming events</p>
          <div className="text-center" style={{ marginTop: "20px" }}>
            <Link to="/outfit-planner" className="btn btn-primary" style={{
              fontSize: "16px",
              color: "#fefefd",
              backgroundColor: "#d07d6b",
              padding: "10px 20px",
              textTransform: "uppercase",
              fontWeight: "bold",
              borderRadius: "5px",
              border: "none",
              cursor: "pointer",
              display: "inline-block",
              textDecoration: "none",
              transition: "all 0.3s ease-in-out"
            }}>
              Plan Outfit
            </Link>
          </div>
        </div>
      </div>

      <section className="section" style={{
        padding: "40px 20px",
        backgroundColor: "#f9f9f9"
      }}>
        <h2 className="section-title" style={{
          fontSize: "30px",
          color: "#3b3b3b",
          textTransform: "uppercase",
          textAlign: "center",
          fontWeight: "bold",
          marginBottom: "20px"
        }}>Your Outfits This Week</h2>
        <Calendar />
      </section>
    </div>
  );
};

export default Dashboard; 