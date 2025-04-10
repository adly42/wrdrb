import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import '../styles/main.css';

interface OutfitSuggestion {
  id: string;
  occasion: string;
  style: string;
  items: Array<{
    id: string;
    image_url: string;
    category: string;
  }>;
}

const OutfitGenerator: React.FC = () => {
  const [occasion, setOccasion] = useState('');
  const [style, setStyle] = useState('');
  const [weather, setWeather] = useState('');
  const [suggestions, setSuggestions] = useState<OutfitSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const generateOutfits = async () => {
    if (!occasion || !style || !weather) return;

    setLoading(true);
    try {
      // This would typically call an AI service to generate outfit suggestions
      // For now, we'll just create a mock suggestion
      const mockSuggestion: OutfitSuggestion = {
        id: Date.now().toString(),
        occasion,
        style,
        items: [
          {
            id: '1',
            image_url: 'https://via.placeholder.com/150',
            category: 'top',
          },
          {
            id: '2',
            image_url: 'https://via.placeholder.com/150',
            category: 'bottom',
          },
          {
            id: '3',
            image_url: 'https://via.placeholder.com/150',
            category: 'shoes',
          },
        ],
      };

      setSuggestions([mockSuggestion]);
    } catch (error) {
      console.error('Error generating outfits:', error);
      alert('Error generating outfits');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Outfit Generator</h1>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 className="section-title">What's the occasion?</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', color: '#374151', marginBottom: '0.5rem' }}>Occasion</label>
              <select
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                }}
              >
                <option value="">Select occasion</option>
                <option value="casual">Casual</option>
                <option value="work">Work</option>
                <option value="formal">Formal</option>
                <option value="party">Party</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', color: '#374151', marginBottom: '0.5rem' }}>Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                }}
              >
                <option value="">Select style</option>
                <option value="classic">Classic</option>
                <option value="modern">Modern</option>
                <option value="bohemian">Bohemian</option>
                <option value="minimalist">Minimalist</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', color: '#374151', marginBottom: '0.5rem' }}>Weather</label>
              <select
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                }}
              >
                <option value="">Select weather</option>
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
                <option value="cool">Cool</option>
                <option value="cold">Cold</option>
                <option value="rainy">Rainy</option>
              </select>
            </div>

            <button
              onClick={generateOutfits}
              disabled={!occasion || !style || !weather || loading}
              className="button"
              style={{ width: '100%', opacity: (!occasion || !style || !weather || loading) ? 0.5 : 1, cursor: (!occasion || !style || !weather || loading) ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Generating...' : 'Generate Outfits'}
            </button>
          </div>

          <div style={{ backgroundColor: '#f3f4f6', padding: '1rem', borderRadius: '0.375rem' }}>
            <h3 style={{ fontFamily: 'serif', fontSize: '1.125rem', marginBottom: '0.5rem' }}>AI Assistant Tips</h3>
            <ul style={{ color: '#4b5563', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>• Choose an occasion to get more relevant suggestions</li>
              <li>• Consider the weather for appropriate layering</li>
              <li>• Your style preference helps personalize the outfits</li>
            </ul>
          </div>
        </div>
      </div>

      {suggestions.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="card">
              <h3 style={{ fontFamily: 'serif', fontSize: '1.125rem', marginBottom: '1rem' }}>
                {suggestion.occasion} - {suggestion.style}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {suggestion.items.map((item) => (
                  <img
                    key={item.id}
                    src={item.image_url}
                    alt={item.category}
                    className="outfit-image"
                  />
                ))}
              </div>
              <button className="button" style={{ marginTop: '1rem', width: '100%', backgroundColor: '#f3f4f6', color: '#1f2937' }}>
                Save Outfit
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OutfitGenerator; 