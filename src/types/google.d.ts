interface Window {
  gapi: {
    load: (
      api: string,
      options: { callback?: () => void; onerror?: (error: any) => void } | (() => void)
    ) => void;
    client: {
      init: (config: {
        apiKey: string;
        clientId?: string;
        discoveryDocs?: string[];
        scope?: string;
      }) => Promise<void>;
      setToken: (token: { access_token: string }) => void;
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
            resource: any;
          }) => Promise<{
            result: {
              id: string;
            };
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
  } & {
    [key: string]: any;
  };
  google: {
    accounts: {
      oauth2: {
        initTokenClient: (config: {
          client_id: string;
          scope: string;
          callback: (response: { access_token: string; error?: string }) => void;
        }) => {
          requestAccessToken: () => void;
        };
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