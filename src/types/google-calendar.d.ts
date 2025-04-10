interface Window {
  gapi: {
    client: {
      init: (config: {
        apiKey: string;
        clientId: string;
        discoveryDocs: string[];
        scope: string;
      }) => Promise<void>;
      calendar: {
        events: {
          list: (params: {
            calendarId: string;
            timeMin: string;
            showDeleted: boolean;
            singleEvents: boolean;
            maxResults: number;
            orderBy: string;
          }) => Promise<{
            result: {
              items: GoogleCalendarEvent[];
            };
          }>;
          insert: (params: {
            calendarId: string;
            resource: Omit<GoogleCalendarEvent, 'id'>;
          }) => Promise<{
            result: GoogleCalendarEvent;
          }>;
        };
      };
    };
    auth2: {
      getAuthInstance: () => {
        signIn: () => Promise<{
          getAuthResponse: () => {
            access_token: string;
          };
        }>;
      };
    };
  };
}

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
} 