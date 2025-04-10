import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { supabase } from '../utils/supabaseClient';
import '../styles/main.css';

interface ClothingItem {
  id: string;
  image_url: string;
  name: string | null;
  category: string;
}

interface OutfitPreviewProps {
  outfit?: {
    id: string;
    name: string;
    occasion?: string | null;
    items: string[];
    created_at: string;
  };
}

export const OutfitPreview: React.FC<OutfitPreviewProps> = ({ outfit }) => {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      if (!outfit?.items?.length) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('clothing_items')
          .select('*')
          .in('id', outfit.items);

        if (error) throw error;
        setItems(data || []);
      } catch (error) {
        console.error('Error fetching outfit items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [outfit]);

  if (!outfit) {
    return (
      <div className="outfit-preview">
        <p className="text-center">No outfit selected</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="outfit-preview">
        <div className="spinner"></div>
        <p className="text-center">Loading outfit...</p>
      </div>
    );
  }

  return (
    <div className="outfit-preview">
      <div className="outfit-grid">
        <div className="outfit-item">
          <h3 className="outfit-item-title">{outfit.name}</h3>
          {outfit.occasion && <p className="outfit-occasion">{outfit.occasion}</p>}
          <p className="outfit-item-date">Created: {format(new Date(outfit.created_at), 'PPP')}</p>
          <div className="outfit-items-grid">
            {items.map((item) => (
              <div key={item.id} className="outfit-item-preview">
                <img
                  src={item.image_url}
                  alt={item.name || item.category}
                  className="outfit-item-image"
                />
                <p className="outfit-item-name">{item.name || item.category}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 