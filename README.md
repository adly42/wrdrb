# Outfit Planner

A mobile web application that helps users plan their outfits with AI-powered recommendations, weather integration, and a smart calendar system.

## Features

- Google OAuth 2.0 Authentication
- Clothing Database with AI Classification
- Calendar with Weather & Event Integration
- AI-Powered Outfit Recommendations
- Mix & Match Interface
- Modern, Clean UI with Serif Fonts

## Tech Stack

- Frontend: React.js with TypeScript
- Backend: Node.js with Express
- Database: Supabase
- Styling: Tailwind CSS
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

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

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