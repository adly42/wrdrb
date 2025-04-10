import React, { useEffect, useState } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { supabase } from '../utils/supabaseClient';
import '../styles/main.css';

interface Event {
  id: string;
  title: string;
  date: string;
  type: 'event' | 'outfit';
}

interface ScheduledOutfit {
  id: string;
  name: string;
  date: string;
}

export const Calendar: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [outfits, setOutfits] = useState<ScheduledOutfit[]>([]);
  const [currentWeek, setCurrentWeek] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true); // Loading state

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .gte('date', format(startOfWeek(new Date()), 'yyyy-MM-dd'))
          .lte('date', format(addDays(startOfWeek(new Date()), 6), 'yyyy-MM-dd'));
  
        if (error) {
          throw error;
        }
  
        setEvents(data || []);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };
  
    const fetchScheduledOutfits = async () => {
      try {
        const { data, error } = await supabase
          .from('outfit_schedules')
          .select(`
            date,
            outfit:outfit_id (
              id,
              name
            )
          `)
          .gte('date', format(startOfWeek(new Date()), 'yyyy-MM-dd'))
          .lte('date', format(addDays(startOfWeek(new Date()), 6), 'yyyy-MM-dd'));
  
        if (error) throw error;
  
        const transformed = (data || []).map((entry: any) => ({
          id: entry.outfit.id,
          name: entry.outfit.name,
          date: entry.date,
        }));
  
        setOutfits(transformed);
      } catch (error) {
        console.error('Error fetching scheduled outfits:', error);
      }
    };
  
    const generateWeekDays = () => {
      const start = startOfWeek(new Date());
      const week = [];
      for (let i = 0; i < 7; i++) {
        week.push(addDays(start, i));
      }
      setCurrentWeek(week);
    };
  
    fetchEvents();
    fetchScheduledOutfits();
    generateWeekDays();
  
    // Once both fetch operations complete, set loading to false
    setLoading(false);
  
  }, []); // Empty dependency array means this will run once on component mount

  // Set loading to false after both events and outfits are fetched
  useEffect(() => {
    if (events.length > 0 && outfits.length > 0) {
      setLoading(false);
    }
  }, [events, outfits]);

  if (loading) {
    return (
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="spinner" style={{ marginRight: '0.5rem' }}></div>
          Loading calendar...
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="calendar-grid">
        {currentWeek.map((day, index) => {
          const dayEvents = events.filter(event =>
            isSameDay(new Date(event.date), day)
          );

          // Find outfits scheduled on this day
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayOutfits = outfits.filter(outfit => outfit.date === dayStr);

          return (
            <div key={index} className="calendar-day">
              <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                {format(day, 'EEE')}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                {format(day, 'MMM d')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {dayEvents.map(event => (
                  <div
                    key={event.id}
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.25rem',
                      borderRadius: '0.25rem',
                      backgroundColor: event.type === 'outfit' ? '#dbeafe' : '#dcfce7',
                      color: event.type === 'outfit' ? '#1e40af' : '#166534',
                    }}
                  >
                    {event.title}
                  </div>
                ))}
                {dayOutfits.map(outfit => (
                  <div
                    key={outfit.id}
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.25rem',
                      borderRadius: '0.25rem',
                      backgroundColor: '#dbeafe',
                      color: '#1e40af',
                    }}
                  >
                    {outfit.name}
                  </div>
                ))}
                {dayEvents.length === 0 && dayOutfits.length === 0 && (
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontStyle: 'italic' }}>
                    No outfits
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
