# wrdrb

A mobile web application that helps users plan their outfits by connecting to their calendar and showing the weather. This was created for ENTI 674, taught by Dr. Mohammad Keyhani, by Adly Azim, Margaret Bauer, Carter Chopin, Ravinthie Dharmappriya, and Nadine Lachman.

## Features

- Google OAuth 2.0 Authentication
- Digitized Clothing Database with user-defined classification tags
- Calendar with Weather & Event Integration
- Mix & Match Interface
- Modern, Clean UI with Serif Fonts

## Tech Stack

- Frontend: React.js with TypeScript
- Backend: Node.js with Express
- Database: Supabase
- Styling: Custom CSS
- Authentication: Google OAuth 2.0
- APIs: Google Calendar, OpenWeather

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account
- Google Cloud Platform account (for OAuth and Calendar API)
- OpenWeather API key

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd outfit-planner
```

2. Install dependencies:
```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

3. Set up environment variables:

Create `.env` files in both client and server directories with the following variables:

Client (.env):
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

Server (.env):
```
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

4. Set up Supabase:

Create the following tables in your Supabase database:

- clothing_items
- planned_outfits
- saved_outfits

5. Start the development servers:

In the client directory:
```bash
npm start
```

In the server directory:
```bash
npm run dev
```

## Development

The live deployment of wrdrb is available at https://wrdrb.vercel.app

## Deployment

1. Build the client:
```bash
cd client
npm run build
```

2. Build the server:
```bash
cd server
npm run build
```

3. Deploy to your preferred hosting platform (e.g., Vercel, Heroku, or AWS).

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Database Setup

To use all features of the application, you need to set up the following tables in your Supabase database:

1. `user_settings` - Stores user settings including Google Calendar integration
2. `outfit_schedules` - Stores scheduled outfits
3. `events` - Stores calendar events

### Setting up the tables

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the following SQL files in order:
   - `user_settings.sql`
   - `outfit_schedules.sql`
   - `events.sql`

## Google Calendar Integration

To use the Google Calendar integration:

1. Set up a Google Cloud project
2. Enable the Google Calendar API
3. Create OAuth 2.0 credentials
4. Add the following environment variables to your `.env` file:
   ```
   REACT_APP_GOOGLE_API_KEY=your_api_key
   REACT_APP_GOOGLE_CLIENT_ID=your_client_id
   ```

## Content Security Policy

The application uses a Content Security Policy to secure the application. If you encounter issues with images or Google Calendar integration, you may need to update the CSP in `client/public/index.html`.

## Troubleshooting

### Google Calendar Integration Issues

If you're having issues with the Google Calendar integration:

1. Check that your Google API credentials are correct
2. Ensure the `user_settings` table exists and has the correct structure
3. Check the browser console for errors
4. Try disconnecting and reconnecting your Google Calendar

### Image Loading Issues

If images are not loading:

1. Check the Content Security Policy in `client/public/index.html`
2. Ensure the image URLs are allowed in the CSP
3. Check that the image URLs are correct

### Database Issues

If you're having issues with the database:

1. Check that all required tables exist
2. Ensure the tables have the correct structure
3. Check that Row Level Security is enabled and policies are set up correctly 
