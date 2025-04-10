import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useNavigate } from 'react-router-dom';
import '../styles/main.css';

interface ClothingItem {
  id: string;
  image_url: string;
  name: string | null;
  brand: string | null;
  category: string;
  color: string;
  occasion: string;
}

interface Outfit {
  id: string;
  name: string;
  occasion: string | null;
  items: ClothingItem[];
  created_at: string;
}

interface OutfitSchedule {
  id: string;
  outfit_id: string;
  date: string;
  user_id: string;
  created_at: string;
  outfit?: Outfit;
  google_event_id?: string;
}

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
}

interface WeatherData {
  date: string;
  temperature: number;
  condition: string;
  icon: string;
}

const OutfitPlanner: React.FC = () => {
  const navigate = useNavigate();
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<ClothingItem[]>([]);
  const [savedOutfits, setSavedOutfits] = useState<Outfit[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [outfitName, setOutfitName] = useState('');
  const [outfitOccasion, setOutfitOccasion] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [scheduledOutfits, setScheduledOutfits] = useState<OutfitSchedule[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedOutfitForSchedule, setSelectedOutfitForSchedule] = useState<Outfit | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'planner' | 'calendar'>('planner');
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>([]);
  const [showCalendarView, setShowCalendarView] = useState(true);
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const categories = [
    'Jacket',
    'Shirt',
    'T-Shirt',
    'Sweater',
    'Dress',
    'Skirt',
    'Pants',
    'Shorts',
    'Jeans',
    'Shoes',
    'Accessories',
  ];

  const categoryOrder = [
    'Headwear',
    'Jacket',
    'Shirt',
    'T-Shirt',
    'Sweater',
    'Dress',
    'Skirt',
    'Pants',
    'Shorts',
    'Jeans',
    'Shoes',
    'Accessories'
  ];

  useEffect(() => {
    fetchClothingItems();
    fetchSavedOutfits();
    checkOutfitSchedulesTable();
    fetchScheduledOutfits();
    ensureUserSettingsTable();
    checkGoogleCalendarConnection();
  }, []);

  useEffect(() => {
    if (showCalendarView && calendarEvents.length > 0) {
      fetchWeatherData();
    }
  }, [showCalendarView, calendarEvents]);

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
    }
  };

  const fetchSavedOutfits = async () => {
    try {
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const { data, error } = await supabase
        .from('outfits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        // Fetch the actual clothing items for each outfit
        const outfitsWithItems = await Promise.all(
          data.map(async (outfit) => {
            const { data: items } = await supabase
              .from('clothing_items')
              .select('*')
              .in('id', outfit.items);
            return {
              ...outfit,
              items: items || [],
            };
          })
        );
        setSavedOutfits(outfitsWithItems);
      }
    } catch (error) {
      console.error('Error fetching saved outfits:', error);
    }
  };

  const fetchScheduledOutfits = async () => {
    try {
      console.log('Fetching scheduled outfits...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found');
        return;
      }
  
      // First check if the outfit_schedules table exists
      const { error: tableCheckError } = await supabase
        .from('outfit_schedules')
        .select('id')
        .limit(1);
  
      if (tableCheckError) {
        console.log('Outfit schedules table may not exist yet:', tableCheckError);
        return;
      }
  
      // Fetch scheduled outfits with outfit details
      const { data: schedules, error: schedulesError } = await supabase
        .from('outfit_schedules')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });
  
      if (schedulesError) {
        console.error('Error fetching scheduled outfits:', schedulesError);
        return;
      }
  
      console.log('Fetched scheduled outfits:', schedules);
  
      if (schedules && schedules.length > 0) {
        // Fetch outfit details for each schedule
        const outfitIds = schedules.map(schedule => schedule.outfit_id);
        const { data: outfits, error: outfitsError } = await supabase
          .from('outfits')
          .select('*')
          .in('id', outfitIds);
  
        if (outfitsError) {
          console.error('Error fetching outfit details:', outfitsError);
          return;
        }
  
        console.log('Fetched outfit details:', outfits);
  
        // Fetch clothing items for each outfit
        const outfitItemsMap = new Map();
        for (const outfit of outfits) {
          // Parse outfit.items if it's a stringified array
          let itemIds: string[] = [];
          try {
            itemIds = typeof outfit.items === 'string'
              ? JSON.parse(outfit.items)
              : outfit.items;
          } catch (parseError) {
            console.error(`Error parsing outfit.items for outfit ${outfit.id}:`, parseError);
            continue;
          }
  
          const { data: items, error: itemsError } = await supabase
            .from('clothing_items')
            .select('*')
            .in('id', itemIds);
  
          if (itemsError) {
            console.error(`Error fetching items for outfit ${outfit.id}:`, itemsError);
            continue;
          }
  
          outfitItemsMap.set(outfit.id, items);
        }
  
        console.log('Fetched clothing items for outfits:', outfitItemsMap);
  
        // Combine schedules with outfit details and items
        const schedulesWithOutfits = schedules.map(schedule => {
          const outfit = outfits.find(o => o.id === schedule.outfit_id);
          if (outfit) {
            const items = outfitItemsMap.get(outfit.id) || [];
            return {
              ...schedule,
              outfit: {
                ...outfit,
                items
              }
            };
          }
          return schedule;
        });
  
        console.log('Combined schedules with outfits:', schedulesWithOutfits);
        setScheduledOutfits(schedulesWithOutfits);
      } else {
        console.log('No scheduled outfits found');
        setScheduledOutfits([]);
      }
    } catch (error) {
      console.error('Error in fetchScheduledOutfits:', error);
    }
  };

  const checkOutfitSchedulesTable = async () => {
    try {
      // Try to query the table to see if it exists
      const { error } = await supabase
        .from('outfit_schedules')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('Error checking outfit_schedules table:', error);
        
        // If the error indicates the table doesn't exist, create it
        if (error.code === '42P01') { // PostgreSQL error code for undefined_table
          console.log('Creating outfit_schedules table...');
          await createOutfitSchedulesTable();
        }
      } else {
        console.log('outfit_schedules table exists');
      }
    } catch (error) {
      console.error('Error in checkOutfitSchedulesTable:', error);
    }
  };

  const createOutfitSchedulesTable = async () => {
    try {
      // This is a simplified approach - in a real app, you'd use migrations
      // or have the table created by your backend
      console.log('This feature requires the outfit_schedules table to be created in Supabase.');
      console.log('Please run the SQL in the outfit_schedules.sql file in your Supabase SQL editor.');
      
      // Show a more user-friendly message
      alert('The outfit scheduling feature requires database setup. Please contact the administrator.');
    } catch (error) {
      console.error('Error creating outfit_schedules table:', error);
    }
  };

  const handleRandomize = () => {
    const newSelectedItems: ClothingItem[] = [];
    const usedCategories = new Set<string>();

    // Shuffle the clothing items
    const shuffledItems = [...clothingItems].sort(() => Math.random() - 0.5);

    // Select one item from each category
    for (const item of shuffledItems) {
      if (!usedCategories.has(item.category)) {
        newSelectedItems.push(item);
        usedCategories.add(item.category);
      }
    }

    setSelectedItems(newSelectedItems);
  };

  const handleItemSelect = (item: ClothingItem) => {
    // Check if the item is already selected
    const isAlreadySelected = selectedItems.some(i => i.id === item.id);
    
    if (isAlreadySelected) {
      // If already selected, remove it
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    } else {
      // If not selected, remove any existing item of the same category and add this one
      const filteredItems = selectedItems.filter(i => i.category !== item.category);
      setSelectedItems([...filteredItems, item]);
    }
  };

  const handleItemUnselect = (item: ClothingItem) => {
    // Remove the item from selected items
    setSelectedItems(selectedItems.filter(i => i.id !== item.id));
  };

  const handleSaveOutfit = async () => {
    if (!outfitName || selectedItems.length === 0) {
      alert('Please provide a name for the outfit and select at least one item');
      return;
    }

    try {
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }

      console.log('Saving outfit with data:', {
        user_id: user.id,
        name: outfitName,
        occasion: outfitOccasion || null,
        items: selectedItems.map(item => item.id)
      });

      const { data, error } = await supabase
        .from('outfits')
        .insert([
          {
            user_id: user.id,
            name: outfitName,
            occasion: outfitOccasion || null,
            items: selectedItems.map(item => item.id),
          },
        ])
        .select();

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      console.log('Successfully saved outfit:', data);

      setShowSaveModal(false);
      setOutfitName('');
      setOutfitOccasion('');
      fetchSavedOutfits();
    } catch (error) {
      console.error('Error saving outfit:', error);
      if (error instanceof Error) {
        alert(`Error saving outfit: ${error.message}`);
      } else {
        alert('Error saving outfit. Please check the console for details.');
      }
    }
  };

  const handleDeleteOutfit = async (outfitId: string) => {
    if (window.confirm('Are you sure you want to delete this outfit?')) {
      try {
        const { error } = await supabase
          .from('outfits')
          .delete()
          .eq('id', outfitId);

        if (error) throw error;
        fetchSavedOutfits();
      } catch (error) {
        console.error('Error deleting outfit:', error);
        alert('Error deleting outfit');
      }
    }
  };

  const checkGoogleCalendarConnection = async () => {
    try {
      console.log('Checking Google Calendar connection...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found');
        return;
      }

      // Check if user has Google Calendar connected
      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('google_calendar_connected, google_access_token, google_token_expiry')
        .eq('user_id', user.id)
        .single();

      if (settingsError) {
        console.error('Error checking user settings:', settingsError);
        return;
      }

      console.log('User settings for Google Calendar:', settings);

      // Check if the token is expired
      if (settings?.google_token_expiry && new Date(settings.google_token_expiry) < new Date()) {
        console.log('Google token is expired');
        setIsGoogleCalendarConnected(false);
        return;
      }

      // Check if we have a valid access token
      if (!settings?.google_access_token) {
        console.log('No Google access token found');
        setIsGoogleCalendarConnected(false);
        return;
      }

      // If we have a valid token and the connection is marked as connected, we're good
      if (settings.google_calendar_connected) {
        console.log('Google Calendar is connected');
        setIsGoogleCalendarConnected(true);
        
        // Fetch calendar events to make sure the connection is working
        await fetchCalendarEvents();
      } else {
        console.log('Google Calendar is not connected');
        setIsGoogleCalendarConnected(false);
      }
    } catch (error) {
      console.error('Error checking Google Calendar connection:', error);
      setIsGoogleCalendarConnected(false);
    }
  };

  const connectGoogleCalendar = async () => {
    try {
      console.log('Starting Google Calendar connection...');
      
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }
      
      // Load the Google API client
      if (typeof window.gapi === 'undefined') {
        console.log('Loading Google API script...');
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://apis.google.com/js/api.js';
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }
      
      // Initialize the Google API client
      console.log('Initializing Google API client...');
      try {
        await new Promise<void>((resolve, reject) => {
          (window.gapi as any).load('client', async () => {
            try {
              await (window.gapi as any).client.init({
                apiKey: process.env.REACT_APP_GOOGLE_API_KEY,
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
              });
              console.log('Google API client initialized successfully');
              resolve();
            } catch (error) {
              console.error('Error initializing Google API client:', error);
              reject(error);
            }
          });
        });
      } catch (error) {
        console.error('Error loading Google API client:', error);
        throw new Error('Failed to initialize Google API client. Please check your API credentials.');
      }
      
      // Use the new Google Identity Services for authentication
      console.log('Signing in with Google...');
      try {
        // Create a token client
        const tokenClient = (window.google as any).accounts.oauth2.initTokenClient({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/calendar',
          callback: async (response: any) => {
            if (response.error) {
              console.error('Error getting token:', response.error);
              throw new Error('Failed to get Google token');
            }
            
            console.log('Got Google token:', response);
            
            // Save the access token to user settings
            console.log('Saving access token to user settings...');
            try {
              // First check if the user settings record exists
              const { data: existingSettings, error: checkError } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();
              
              if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
                console.error('Error checking user settings:', checkError);
                throw checkError;
              }
              
              // If the record doesn't exist, create it
              if (!existingSettings) {
                console.log('Creating new user settings record...');
                const { error: createError } = await supabase
                  .from('user_settings')
                  .insert({
                    user_id: user.id,
                    google_calendar_connected: true,
                    google_access_token: response.access_token,
                    google_token_expiry: new Date(Date.now() + response.expires_in * 1000).toISOString()
                  });
                
                if (createError) {
                  console.error('Error creating user settings:', createError);
                  throw createError;
                }
              } else {
                // Update the existing record
                console.log('Updating existing user settings record...');
                try {
                  const { data: updateData, error: updateError } = await supabase
                    .from('user_settings')
                    .update({
                      google_calendar_connected: true,
                      google_access_token: response.access_token,
                      google_token_expiry: new Date(Date.now() + response.expires_in * 1000).toISOString()
                    })
                    .eq('user_id', user.id)
                    .select();
                  
                  if (updateError) {
                    console.error('Error updating user settings:', updateError);
                    console.error('Error details:', {
                      code: updateError.code,
                      message: updateError.message,
                      details: updateError.details,
                      hint: updateError.hint
                    });
                    
                    // If the error is about the column not existing, try to update without that field
                    if (updateError.message && updateError.message.includes('google_token_expiry')) {
                      console.log('Trying to update without the google_token_expiry field...');
                      const { error: retryError } = await supabase
                        .from('user_settings')
                        .update({
                          google_calendar_connected: true,
                          google_access_token: response.access_token
                        })
                        .eq('user_id', user.id);
                      
                      if (retryError) {
                        console.error('Error updating user settings without expiry:', retryError);
                        throw retryError;
                      }
                      
                      console.log('Successfully updated user settings without expiry field');
                    } else {
                      throw updateError;
                    }
                  } else {
                    console.log('Update successful:', updateData);
                  }
                } catch (error) {
                  console.error('Error saving Google tokens:', error);
                  alert('Failed to save Google Calendar connection. Please try again.');
                  return;
                }
              }
              
              console.log('Google Calendar connected successfully');
              setIsGoogleCalendarConnected(true);
              
              // Fetch calendar events
              await fetchCalendarEvents();
            } catch (error) {
              console.error('Error saving Google tokens:', error);
              alert('Failed to save Google Calendar connection. Please try again.');
            }
          },
          error_callback: (error: any) => {
            console.error('Error in token client:', error);
            alert('Failed to authenticate with Google. Please try again.');
          }
        });
        
        // Request a token
        tokenClient.requestAccessToken();
      } catch (error) {
        console.error('Error signing in with Google:', error);
        alert('Failed to sign in with Google. Please try again.');
      }
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      alert('Failed to connect to Google Calendar. Please try again.');
    }
  };

  const getDateKey = (input: Date | string | number): string => {
    if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
      // Parse 'YYYY-MM-DD' as local date
      const [year, month, day] = input.split('-').map(Number);
      return new Date(year, month - 1, day).toLocaleDateString('en-CA');
    }
  
    const d = new Date(input);
    return d.toLocaleDateString('en-CA');
  };

  const fetchCalendarEvents = async () => {
    try {
      console.log('Fetching calendar events...');
      
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }
      
      // Get user settings
      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (settingsError) {
        console.error('Error fetching user settings:', settingsError);
        throw settingsError;
      }
      
      if (!settings?.google_access_token) {
        console.log('No Google access token found');
        setIsGoogleCalendarConnected(false);
        return;
      }
      
      // Check if token is expired
      const tokenExpiry = new Date(settings.google_token_expiry);
      if (tokenExpiry < new Date()) {
        console.log('Google token expired, requesting new token...');
        setIsGoogleCalendarConnected(false);
        await connectGoogleCalendar();
        return;
      }
      
      // Ensure Google API client is loaded
      if (typeof window.gapi === 'undefined') {
        console.log('Loading Google API script...');
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://apis.google.com/js/api.js';
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }
      
      // Initialize the Google API client
      console.log('Initializing Google API client...');
      try {
        await new Promise<void>((resolve, reject) => {
          (window.gapi as any).load('client', async () => {
            try {
              await (window.gapi as any).client.init({
                apiKey: process.env.REACT_APP_GOOGLE_API_KEY,
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
              });
              console.log('Google API client initialized successfully');
              resolve();
            } catch (error) {
              console.error('Error initializing Google API client:', error);
              reject(error);
            }
          });
        });
      } catch (error) {
        console.error('Error loading Google API client:', error);
        throw new Error('Failed to initialize Google API client');
      }
      
      // Set the access token
      console.log('Setting Google API token...');
      try {
        (window.gapi as any).client.setToken({
          access_token: settings.google_access_token
        });
      } catch (error) {
        console.error('Error setting Google API token:', error);
        throw new Error('Failed to set Google API token');
      }
      
      // Get the current date and date 30 days from now
      const todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0); // local midnight
      
      const timeMin = todayMidnight.toISOString(); // ✅ 2025-04-09T06:00:00.000Z if you're in MDT
      
      const thirtyDaysFromNow = new Date(todayMidnight);
      thirtyDaysFromNow.setDate(todayMidnight.getDate() + 30);
      const timeMax = thirtyDaysFromNow.toISOString();
      
      // Fetch events from Google Calendar
      console.log('Fetching events from Google Calendar...');
      try {
        const response = await (window.gapi as any).client.calendar.events.list({
          'calendarId': 'primary',
          'timeMin': timeMin,
          'timeMax': timeMax,
          'showDeleted': false,
          'singleEvents': true,
          'orderBy': 'startTime'
        });
        
        console.log('Google Calendar API response:', response);
        
        if (response.result.items) {
          const events = response.result.items;
          console.log('Fetched calendar events:', events);
          
          // Update scheduled outfits based on event descriptions
          setCalendarEvents(events);
          setIsGoogleCalendarConnected(true);
        } else {
          console.log('No events found in the specified time range');
          setCalendarEvents([]);
        }
      } catch (error) {
        console.error('Error fetching calendar events:', error);
        throw new Error('Failed to fetch calendar events');
      }
    } catch (error) {
      console.error('Error in fetchCalendarEvents:', error);
      setIsGoogleCalendarConnected(false);
      setCalendarEvents([]);
    }
  };

  const handleScheduleOutfit = async () => {
    if (!selectedOutfitForSchedule || !scheduleDate) {
      alert('Please select an outfit and a date');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Create outfit schedule in Supabase
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('outfit_schedules')
        .insert([
          {
            user_id: user.id,
            outfit_id: selectedOutfitForSchedule.id,
            date: scheduleDate,
          },
        ])
        .select()
        .single();

      if (scheduleError) throw scheduleError;

      // If Google Calendar is connected, create calendar event
      // No need to create a Google Calendar event — Supabase only

      setShowScheduleModal(false);
      setSelectedOutfitForSchedule(null);
      setScheduleDate('');
      fetchScheduledOutfits();
      if (isGoogleCalendarConnected) {
        fetchCalendarEvents();
      }
    } catch (error) {
      console.error('Error scheduling outfit:', error);
      alert('Error scheduling outfit. Please try again.');
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (window.confirm('Are you sure you want to remove this outfit from your schedule?')) {
      try {
        const { error } = await supabase
          .from('outfit_schedules')
          .delete()
          .eq('id', scheduleId);

        if (error) throw error;
        fetchScheduledOutfits();
      } catch (error) {
        console.error('Error deleting scheduled outfit:', error);
        alert('Error removing outfit from schedule');
      }
    }
  };

  const getSortedItems = (items: ClothingItem[]) => {
    return [...items].sort((a, b) => {
      const indexA = categoryOrder.indexOf(a.category);
      const indexB = categoryOrder.indexOf(b.category);
      return indexA - indexB;
    });
  };

  const formatDate = (dateString: string) => {
    // Create a date object in the user's timezone
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const ensureUserSettingsTable = async () => {
    try {
      console.log('Ensuring user_settings table has correct structure...');
      
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found');
        return;
      }
      
      // Check if user_settings table exists
      const { error: tableCheckError } = await supabase
        .from('user_settings')
        .select('id')
        .limit(1);
      
      if (tableCheckError) {
        console.error('Error checking user_settings table:', tableCheckError);
        console.log('Please run the SQL script to create the user_settings table with the correct structure');
        return;
      }
      
      // Check if user has a settings record
      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (settingsError) {
        console.log('User settings record not found, creating one...');
        const { error: createError } = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            google_calendar_connected: false,
            google_access_token: null,
            google_refresh_token: null,
            google_token_expiry: null
          });
          
        if (createError) {
          console.error('Error creating user settings:', createError);
          return;
        }
        
        console.log('User settings record created');
      } else {
        console.log('User settings record exists:', settings);
        
        // Check if the record has all required fields
        const needsUpdate = !settings.google_token_expiry;
        
        if (needsUpdate) {
          console.log('Updating user settings record with missing fields...');
          const { error: updateError } = await supabase
            .from('user_settings')
            .update({
              google_token_expiry: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
            })
            .eq('user_id', user.id);
            
          if (updateError) {
            console.error('Error updating user settings:', updateError);
            console.log('Please run the SQL script to add the missing column to the user_settings table');
            return;
          }
          
          console.log('User settings record updated with missing fields');
        }
      }
    } catch (error) {
      console.error('Error ensuring user_settings table:', error);
    }
  };

  const fetchWeatherData = async () => {
    try {
      setWeatherLoading(true);
      setWeatherError(null);
  
      const apiKey = process.env.REACT_APP_OPENWEATHER_API_KEY;
  
      if (!apiKey) {
        throw new Error('OpenWeather API key is not configured');
      }
  
      const city = 'Calgary'; // You can make this dynamic based on user location
  
      // Fetch 5-day forecast (3-hour intervals)
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`
      );
  
      if (!forecastResponse.ok) {
        throw new Error('Failed to fetch forecast data');
      }
  
      const forecastData = await forecastResponse.json();
  
      console.log("🧊 Forecast data:", forecastData);
      const seenDates = new Set<string>();
      const dailyForecasts: WeatherData[] = [];

      const now = new Date();
      const todayKey = getDateKey(now);

      for (const item of forecastData.list) {
        const localDate = new Date(item.dt * 1000);
        const dateKey = getDateKey(localDate); // "YYYY-MM-DD"
        const hour = localDate.getHours();
      
        // ✅ Force include today EVEN if it's not the first forecast block
        if (!seenDates.has(dateKey)) {
          const condition = item.weather[0].main.toLowerCase();
          const description = item.weather[0].description.toLowerCase();
        
          let iconPath = '/images/weather-icons/clear-day.png'; // Default
        
          if (condition.includes('clear')) {
            iconPath = (hour >= 6 && hour < 18)
              ? '/images/weather-icons/clear-day.png'
              : '/images/weather-icons/clear-night.png';
          } else if (condition.includes('cloud')) {
            iconPath = '/images/weather-icons/cloudy.png';
          } else if (condition.includes('rain')) {
            iconPath = description.includes('drizzle')
              ? '/images/weather-icons/drizzle.png'
              : '/images/weather-icons/rain.png';
          } else if (condition.includes('snow')) {
            iconPath = '/images/weather-icons/snow.png';
          } else if (condition.includes('thunderstorm')) {
            iconPath = '/images/weather-icons/thunderstorm.png';
          } else if (['mist', 'fog', 'haze'].some(w => condition.includes(w))) {
            iconPath = '/images/weather-icons/fog.png';
          }
        
          dailyForecasts.push({
            date: dateKey,
            temperature: Math.round(item.main.temp),
            condition: item.weather[0].main,
            icon: iconPath,
          });
        
          seenDates.add(dateKey);
        }
      
        if (dailyForecasts.length === 5 && seenDates.has(todayKey)) break;
      }

      const hasToday = dailyForecasts.some(f => f.date === todayKey);
      if (!hasToday) {
        console.warn("⚠️ No forecast for today, injecting placeholder weather.");
      
        dailyForecasts.unshift({
          date: todayKey,
          temperature: 0,
          condition: 'Unavailable',
          icon: '/images/weather-icons/clear-night.png', // default fallback icon
        });
      
        // If you now have 6, remove the last one
        if (dailyForecasts.length > 5) dailyForecasts.pop();
      }
  
      console.log("🌤️ Final dailyForecasts:", dailyForecasts.map(f => f.date));
      console.log("📅 Today key:", todayKey); 
      setWeatherData(dailyForecasts);
    } catch (error) {
      console.error('Error fetching weather:', error);
      setWeatherError(error instanceof Error ? error.message : 'Failed to load weather data');
    } finally {
      setWeatherLoading(false);
    }
  };
  

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">Outfit Planner</h1>
        </div>
        <button onClick={() => navigate('/')} className="btn btn-secondary" style={{
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
          Back to Dashboard
        </button>
      </div>

      <div className="outfit-planner-tabs">
      <button 
          className={`tab-button ${activeTab === 'planner' ? 'active' : ''}`}
          onClick={() => setActiveTab('planner')}
          style={{
            fontSize: "16px",
            color: activeTab === 'planner' ? "#d07d6b" : "#3b3b3b",
            backgroundColor: "transparent",
            padding: "10px 20px",
            textTransform: "uppercase",
            fontWeight: "bold",
            borderRadius: "5px",
            border: "none",
            borderBottom: activeTab === 'planner' ? "2px solid #d07d6b" : "2px solid transparent",
            cursor: "pointer",
            display: "inline-block",
            textDecoration: "none",
            transition: "all 0.3s ease-in-out"
          }}
        >
          Outfit Planner
        </button>
        <button 
          className={`tab-button ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
          style={{
            fontSize: "16px",
            color: activeTab === 'calendar' ? "#d07d6b" : "#3b3b3b",
            backgroundColor: "transparent",
            padding: "10px 20px",
            textTransform: "uppercase",
            fontWeight: "bold",
            borderRadius: "5px",
            border: "none",
            borderBottom: activeTab === 'calendar' ? "2px solid #d07d6b" : "2px solid transparent",
            cursor: "pointer",
            display: "inline-block",
            textDecoration: "none",
            transition: "all 0.3s ease-in-out"
          }}
        >
          Calendar
        </button>
      </div>

      {activeTab === 'calendar' && (
        <div className="outfit-calendar-container">
          <div className="calendar-header">
            <h2 className="section-title">Outfit Calendar</h2>
            <div className="calendar-view-toggle">
              <button 
                className={`btn btn-secondary ${showCalendarView ? 'active' : ''}`}
                onClick={() => setShowCalendarView(true)}
                style={{
                  fontSize: "16px",
                  color: showCalendarView ? "#fefefd" : "#6b7280",
                  backgroundColor: showCalendarView ? "#d07d6b" : "#f3f4f6",
                  padding: "10px 20px",
                  textTransform: "uppercase",
                  fontWeight: "bold",
                  borderRadius: "5px",
                  border: "none",
                  cursor: "pointer",
                  display: "inline-block",
                  textDecoration: "none",
                  transition: "all 0.3s ease-in-out"
                }}
              >
                Calendar View
              </button>
              <button 
                className={`btn btn-secondary ${!showCalendarView ? 'active' : ''}`}
                onClick={() => setShowCalendarView(false)}
                style={{
                  fontSize: "16px",
                  color: !showCalendarView ? "#fefefd" : "#6b7280",
                  backgroundColor: !showCalendarView ? "#d07d6b" : "#f3f4f6",
                  padding: "10px 20px",
                  textTransform: "uppercase",
                  fontWeight: "bold",
                  borderRadius: "5px",
                  border: "none",
                  cursor: "pointer",
                  display: "inline-block",
                  textDecoration: "none",
                  transition: "all 0.3s ease-in-out"
                }}
              >
                List View
              </button>
            </div>
          </div>

          {!showCalendarView ? (
            <div className="scheduled-outfits-list">
              {scheduledOutfits.length === 0 ? (
                <div className="no-items-message">
                  <p>No outfits scheduled yet.</p>
                </div>
              ) : (
                scheduledOutfits
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((schedule) => (
                    <div key={schedule.id} className="scheduled-outfit-card">
                      <div className="scheduled-outfit-date">
                        {formatDate(schedule.date)}
                      </div>
                      {schedule.outfit && (
                        <div className="scheduled-outfit-details">
                          <div className="outfit-info">
                            <h4>{schedule.outfit.name}</h4>
                            {schedule.outfit.occasion && (
                              <span className="outfit-occasion">{schedule.outfit.occasion}</span>
                            )}
                          </div>
                          <div className="outfit-preview">
                            {getSortedItems(schedule.outfit.items).map((item) => (
                              <img
                                key={item.id}
                                src={item.image_url}
                                alt={item.name || item.category}
                                className="outfit-item-image"
                                style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', marginRight: '4px' }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="scheduled-outfit-actions">
                        <button 
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          className="btn btn-secondary"
                          style={{
                            fontSize: "14px",
                            color: "#fefefd",
                            backgroundColor: "#ef4444",
                            padding: "8px 16px",
                            textTransform: "uppercase",
                            fontWeight: "bold",
                            borderRadius: "5px",
                            border: "none",
                            cursor: "pointer"
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          ) : (
            <div className="calendar-view">
              {!isGoogleCalendarConnected ? (
                <div className="no-items-message">
                  <p>Please connect your Google Calendar to view your scheduled outfits in calendar view.</p>
                  <button onClick={connectGoogleCalendar} className="btn btn-secondary" style={{
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
                    Connect Google Calendar
                  </button>
                </div>
              ) : calendarEvents.length === 0 ? (
                <div className="no-items-message">
                  <p>No upcoming events found in your Google Calendar.</p>
                  <p>Schedule an outfit from the Outfit Planner tab to see it here.</p>
                </div>
              ) : (() => {
                console.log('Rendering Kanban calendar view with events:', calendarEvents);
                
                // Group events by date
                const groupedEvents = calendarEvents.reduce((acc, event) => {
                  let eventDateKey: string | null = null;
                
                  if (event.start?.dateTime) {
                    eventDateKey = getDateKey(event.start.dateTime);
                  } else if (event.start?.date) {
                    // Handle all-day events — date is in 'YYYY-MM-DD' format
                    eventDateKey = getDateKey(event.start.date); // safe parse to local key
                    // Also assign a fake time so it can render at 12:00 AM later
                    event.start.dateTime = event.start.date + 'T00:00:00';
                  }
                
                  if (eventDateKey) {
                    if (!acc[eventDateKey]) acc[eventDateKey] = [];
                    acc[eventDateKey].push(event);
                  } else {
                    console.warn('Skipping event with no valid date:', event);
                  }
                
                  return acc;
                }, {} as Record<string, GoogleCalendarEvent[]>);
                
                // Get the next 5 days starting from today
        
                const nextFiveDays = Array.from({ length: 5 }, (_, i) => {
                  const day = new Date();
                  day.setDate(day.getDate() + i);
                  return getDateKey(day);
                });
                
                // Sort dates to ensure they're in chronological order
                const sortedDates = nextFiveDays.sort((a, b) => {
                  try {
                    return new Date(a).getTime() - new Date(b).getTime();
                  } catch (error) {
                    console.error('Error sorting dates:', error);
                    return 0;
                  }
                });
                
                return (
                  <div className="kanban-calendar-view">
                    {sortedDates.map((date) => {
                      const events = groupedEvents[date] || [];
                      console.log(`Rendering column for date ${date} with ${events.length} events`);
                      
                      // Find the outfit scheduled for this date using the specified format
                      const scheduleMatch = scheduledOutfits.find(s => {
                        const scheduledKey = getDateKey(s.date);
                        console.log("🧥 Matching outfit:", s.outfit?.name, "| Raw date:", s.date, "→", scheduledKey, "| Column:", date);
                        return scheduledKey === date;
                      });
                      const outfit = scheduleMatch?.outfit;
                      // Create a date object for display
                      const displayDate = new Date(date + 'T00:00:00'); // Forces local time
                      
                      return (
                        <div key={date} className="kanban-day-column">
                          <div className="kanban-day-header">
                          <h3>
                            {displayDate.toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                            </h3>
                            
                            {/* Add weather information */}
                            {weatherData.length > 0 && (
                              <div className="day-weather">
                                {weatherLoading ? (
                                  <div className="weather-loading">
                                    <div className="spinner" style={{ width: '16px', height: '16px', marginRight: '4px' }}></div>
                                    Loading...
                                  </div>
                                ) : weatherError ? (
                                  <div className="weather-error">
                                    <span>Weather unavailable</span>
                                  </div>
                                ) : (
                                  (() => {
                                    const dayWeather = weatherData.find(w => w.date === date);
                                    if (dayWeather) {
                                      return (
                                        <div className="forecast-day" style={{
                                          padding: '8px',
                                          backgroundColor: '#2462A2',
                                          color: 'white',
                                          borderRadius: '8px',
                                          textAlign: 'center',
                                          minWidth: '80px',
                                          transition: 'transform 0.2s ease'
                                        }}>
                                          <p className="forecast-date" style={{
                                            fontSize: '0.9rem',
                                            color: 'rgba(255, 255, 255, 0.9)',
                                            margin: '0 0 0.5rem 0',
                                            fontWeight: '500'
                                          }}>
                                            {displayDate.toLocaleDateString('en-US', { weekday: 'short' })}
                                          </p>
                                          <img 
                                            src={dayWeather.icon} 
                                            alt={dayWeather.condition} 
                                            className="forecast-icon" 
                                            style={{ 
                                              width: '36px', 
                                              height: '36px',
                                              margin: '0.25rem 0',
                                              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                                              transition: 'filter 0.3s ease',
                                              objectFit: 'contain',
                                              padding: '2px',
                                              background: 'transparent'
                                            }} 
                                          />
                                          <p className="forecast-temp" style={{
                                            fontSize: '1.1rem',
                                            fontWeight: '600',
                                            color: 'white',
                                            margin: '0'
                                          }}>{dayWeather.temperature}°</p>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Outfit bar at the top */}
                          <div className={`kanban-outfit-bar ${outfit ? 'has-outfit' : 'no-outfit'}`}>
                            {outfit ? (
                              <div className="outfit-bar-content">
                                <div className="outfit-bar-title">
                                  <h4>{outfit.name}</h4>
                                  {outfit.occasion && <span className="outfit-occasion">{outfit.occasion}</span>}
                                </div>
                                <div className="outfit-bar-preview">
                                  {getSortedItems(outfit.items).map((item) => (
                                    <img
                                      key={item.id}
                                      src={item.image_url}
                                      alt={item.name || item.category}
                                      className="outfit-bar-item-image"
                                    />
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="no-outfit-message">
                                <p>No outfit scheduled</p>
                              </div>
                            )}
                          </div>
                          
                          {/* Events for this day */}
                          <div className="kanban-day-events">
                            {events.map((event) => {
                              try {
                                const rawStart = event.start.dateTime || event.start.date;
                                const startTime = new Date(rawStart || '');
                                if (isNaN(startTime.getTime())) {
                                  console.warn('Invalid start time for event:', event);
                                  return null;
                                }
                                console.log("🧠 Rendering event:", event.summary, "at", startTime.toLocaleTimeString());
                                return (
                                  <div key={event.id} className="kanban-event">
                                    <div className="event-time">
                                      {startTime.toLocaleTimeString([], { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </div>
                                    <div className="event-content">
                                      <h4>{event.summary}</h4>
                                      {event.description && (
                                        <p className="event-description">{event.description}</p>
                                      )}
                                    </div>
                                  </div>
                                );
                              } catch (error) {
                                console.error('Error rendering event:', error);
                                return null;
                              }
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {activeTab === 'planner' && (
        <div className="outfit-planner-container">
          <div className="outfit-preview-section">
            <h2 className="section-title">Current Outfit</h2>
            <div className="outfit-preview-grid">
              {getSortedItems(selectedItems).map((item) => (
                <div 
                  key={item.id} 
                  className="outfit-preview-item"
                  onClick={() => handleItemUnselect(item)}
                  style={{ cursor: 'pointer' }}
                >
                  <img
                    src={item.image_url}
                    alt={item.name || item.category}
                    className="outfit-preview-image"
                  />
                  <div className="outfit-preview-details">
                    <h3>{item.name || item.category}</h3>
                    {item.brand && <p className="item-brand">{item.brand}</p>}
                  </div>
                </div>
              ))}
            </div>
            <div className="outfit-actions">
              <button onClick={handleRandomize} className="btn btn-primary" style={{
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
                Randomize Outfit
              </button>
              <button
                onClick={() => setShowSaveModal(true)}
                disabled={selectedItems.length === 0}
                className="btn btn-primary"
                style={{
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
                  transition: "all 0.3s ease-in-out",
                  opacity: selectedItems.length === 0 ? 0.5 : 1
                }}
              >
                Save Outfit
              </button>
            </div>
          </div>

          <div className="clothing-selection-section">
            <h2 className="section-title">Select Items</h2>
            <div className="category-filters">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="form-select"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="clothing-selection-grid">
              {clothingItems
                .filter(item => !selectedCategory || item.category === selectedCategory)
                .map((item) => (
                  <div
                    key={item.id}
                    className={`clothing-selection-item ${
                      selectedItems.some(i => i.id === item.id) ? 'selected' : ''
                    }`}
                    onClick={() => handleItemSelect(item)}
                    style={{ cursor: 'pointer' }}
                  >
                    <img
                      src={item.image_url}
                      alt={item.name || item.category}
                      className="clothing-selection-image"
                    />
                    <div className="clothing-selection-details">
                      <h3>{item.name || item.category}</h3>
                      {item.brand && <p className="item-brand">{item.brand}</p>}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="saved-outfits-section">
            <h2 className="section-title">Saved Outfits</h2>
            <div className="saved-outfits-grid">
              {savedOutfits.map((outfit) => (
                <div key={outfit.id} className="saved-outfit-card">
                  <h3>{outfit.name}</h3>
                  {outfit.occasion ? (
                    <p className="outfit-occasion">{outfit.occasion}</p>
                  ) : (
                    <p className="outfit-occasion" style={{ visibility: "hidden" }}>No occasion</p>
                  )}
                  <div className="saved-outfit-preview">
                    {getSortedItems(outfit.items).map((item) => (
                      <img
                        key={item.id}
                        src={item.image_url}
                        alt={item.name || item.category}
                        className="saved-outfit-item-image"
                      />
                    ))}
                  </div>
                  <div className="saved-outfit-actions" style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    width: "100%"
                  }}>
                    <button
                      onClick={() => {
                        setSelectedItems(outfit.items);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="btn btn-secondary"
                      style={{
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
                        transition: "all 0.3s ease-in-out",
                        width: "100%"
                      }}
                    >
                      Load
                    </button>
                    <button
                      onClick={() => {
                        setSelectedOutfitForSchedule(outfit);
                        setShowScheduleModal(true);
                      }}
                      className="btn btn-secondary"
                      style={{
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
                        transition: "all 0.3s ease-in-out",
                        width: "100%"
                      }}
                    >
                      Schedule
                    </button>
                    <button
                      onClick={() => handleDeleteOutfit(outfit.id)}
                      className="btn btn-danger"
                      style={{
                        fontSize: "16px",
                        color: "#fefefd",
                        backgroundColor: "#ef4444",
                        padding: "10px 20px",
                        textTransform: "uppercase",
                        fontWeight: "bold",
                        borderRadius: "5px",
                        border: "none",
                        cursor: "pointer",
                        display: "inline-block",
                        textDecoration: "none",
                        transition: "all 0.3s ease-in-out",
                        width: "100%"
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Save Outfit Modal */}
      {showSaveModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="section-title">Save Outfit</h2>
            <div className="form-group">
              <label>Outfit Name:</label>
              <input
                type="text"
                value={outfitName}
                onChange={(e) => setOutfitName(e.target.value)}
                placeholder="Enter a name for your outfit"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Occasion (optional):</label>
              <input
                type="text"
                value={outfitOccasion}
                onChange={(e) => setOutfitOccasion(e.target.value)}
                placeholder="Enter an occasion"
                className="form-input"
              />
            </div>
            <div className="modal-actions">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setOutfitName('');
                  setOutfitOccasion('');
                }}
                className="btn btn-secondary"
                style={{
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
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOutfit}
                disabled={!outfitName}
                className="btn btn-primary"
                style={{
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
                  transition: "all 0.3s ease-in-out",
                  opacity: !outfitName ? 0.5 : 1
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Outfit Modal */}
      {showScheduleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="section-title">Schedule Outfit</h2>
            <div className="form-group">
              <label>Select Date:</label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="form-input"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="scheduled-outfit-preview">
              <h3>{selectedOutfitForSchedule?.name}</h3>
              {selectedOutfitForSchedule?.occasion && (
                <p className="outfit-occasion">{selectedOutfitForSchedule.occasion}</p>
              )}
              <div className="outfit-preview-grid">
                {selectedOutfitForSchedule?.items && getSortedItems(selectedOutfitForSchedule.items).map((item) => (
                  <div key={item.id} className="outfit-preview-item">
                    <img
                      src={item.image_url}
                      alt={item.name || item.category}
                      className="outfit-preview-image"
                    />
                    <div className="outfit-preview-details">
                      <h3>{item.name || item.category}</h3>
                      {item.brand && <p className="item-brand">{item.brand}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setSelectedOutfitForSchedule(null);
                  setScheduleDate('');
                }}
                className="btn btn-secondary"
                style={{
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
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleOutfit}
                disabled={!scheduleDate}
                className="btn btn-primary"
                style={{
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
                  transition: "all 0.3s ease-in-out",
                  opacity: !scheduleDate ? 0.5 : 1
                }}
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutfitPlanner; 