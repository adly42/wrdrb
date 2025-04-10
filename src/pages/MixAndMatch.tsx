import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import '../styles/main.css';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface ClothingItem {
  id: string;
  image_url: string;
  category: string;
  color: string;
}

interface SavedOutfit {
  id: string;
  name: string;
  items: string[];
  created_at: string;
}

const MixAndMatch: React.FC = () => {
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<ClothingItem[]>([]);
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    fetchClothingItems();
    fetchSavedOutfits();
  }, []);

  const fetchClothingItems = async () => {
    try {
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const { data, error } = await supabase
        .from('clothing_items')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      if (data) setClothingItems(data);
    } catch (error) {
      console.error('Error fetching clothing items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedOutfits = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_outfits')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setSavedOutfits(data);
    } catch (error) {
      console.error('Error fetching saved outfits:', error);
    }
  };

  const handleItemClick = (item: ClothingItem) => {
    if (selectedItems.find(selected => selected.id === item.id)) {
      setSelectedItems(selectedItems.filter(selected => selected.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const saveOutfit = async () => {
    if (selectedItems.length === 0) return;

    try {
      const outfitName = prompt('Name this outfit:');
      if (!outfitName) return;

      const { data, error } = await supabase
        .from('saved_outfits')
        .insert([
          {
            name: outfitName,
            items: selectedItems.map(item => item.id),
          },
        ])
        .select();

      if (error) throw error;
      if (data) {
        setSavedOutfits([...savedOutfits, data[0]]);
        setSelectedItems([]);
      }
    } catch (error) {
      console.error('Error saving outfit:', error);
      alert('Error saving outfit');
    }
  };

  const categories = ['all', ...Array.from(new Set(clothingItems.map(item => item.category)))];

  const filteredItems = activeCategory === 'all'
    ? clothingItems
    : clothingItems.filter(item => item.category === activeCategory);

  if (loading) {
    return (
      <div className="card">
        <h1 className="section-title">Mix & Match</h1>
        <div style={{ color: '#4b5563' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Mix & Match</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }}>
        {/* Clothing Items Panel */}
        <div style={{ gridColumn: 'span 2' }}>
          <div className="card">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '9999px',
                    fontSize: '0.875rem',
                    backgroundColor: activeCategory === category ? '#2563eb' : '#f3f4f6',
                    color: activeCategory === category ? 'white' : '#1f2937',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseOver={e => {
                    if (activeCategory !== category) {
                      e.currentTarget.style.backgroundColor = '#e5e7eb';
                    }
                  }}
                  onMouseOut={e => {
                    if (activeCategory !== category) {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>

            <div className="outfit-grid">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  style={{
                    cursor: 'pointer',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    border: selectedItems.find(selected => selected.id === item.id)
                      ? '2px solid #2563eb'
                      : '2px solid transparent',
                  }}
                >
                  <img
                    src={item.image_url}
                    alt={item.category}
                    className="outfit-image"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Items Panel */}
        <div>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 className="section-title">Selected Items</h2>
            {selectedItems.length > 0 ? (
              <>
                <div className="outfit-grid" style={{ marginBottom: '1rem' }}>
                  {selectedItems.map(item => (
                    <div key={item.id} style={{ position: 'relative' }}>
                      <img
                        src={item.image_url}
                        alt={item.category}
                        className="outfit-image"
                      />
                      <button
                        onClick={() => handleItemClick(item)}
                        style={{
                          position: 'absolute',
                          top: '0.5rem',
                          right: '0.5rem',
                          backgroundColor: 'white',
                          borderRadius: '9999px',
                          padding: '0.25rem',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = 'white'}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={saveOutfit}
                  className="button"
                  style={{ width: '100%' }}
                >
                  Save Outfit
                </button>
              </>
            ) : (
              <p style={{ color: '#4b5563' }}>
                Click on items to add them to your outfit
              </p>
            )}
          </div>

          {/* Saved Outfits */}
          <div className="card">
            <h2 className="section-title">Saved Outfits</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {savedOutfits.map(outfit => (
                <div key={outfit.id} style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
                  <h3 style={{ fontWeight: 500, marginBottom: '0.5rem' }}>{outfit.name}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {outfit.items.map(itemId => {
                      const item = clothingItems.find(i => i.id === itemId);
                      return item ? (
                        <img
                          key={item.id}
                          src={item.image_url}
                          alt={item.category}
                          style={{
                            width: '4rem',
                            height: '4rem',
                            objectFit: 'cover',
                            borderRadius: '0.375rem',
                          }}
                        />
                      ) : null;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MixAndMatch; 