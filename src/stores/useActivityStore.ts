import { create } from 'zustand';

export interface ActivityEvent {
  id: string;
  nodeType: string;
  label: string;
  timestamp: number;
  color: string;
}

interface ActivityStore {
  events: ActivityEvent[];
  isLive: boolean;
  isConnected: boolean;
  lastActivity: number;

  addEvent: (event: Omit<ActivityEvent, 'id' | 'color'>) => void;
  setConnected: (connected: boolean) => void;
  connect: () => (() => void) | void;
}

const NODE_TYPE_COLORS: Record<string, string> = {
  rule: '#8B5CF6',
  agent: '#EC4899',
  hook: '#EF4444',
  memory: '#14B8A6',
  skill: '#10B981',
  plugin: '#F59E0B',
  mcp: '#06B6D4',
  claude: '#0066FF',
  category: '#00FFFF',
  adapter: '#00FFFF',
};

let eventCounter = 0;
let liveTimeout: ReturnType<typeof setTimeout> | null = null;

export const useActivityStore = create<ActivityStore>((set, get) => ({
  events: [],
  isLive: false,
  isConnected: false,
  lastActivity: 0,

  addEvent: (event) => {
    const id = `evt-${++eventCounter}-${Date.now()}`;
    const color = NODE_TYPE_COLORS[event.nodeType] || '#00FFFF';

    set((state) => ({
      events: [...state.events.slice(-50), { ...event, id, color }],
      isLive: true,
      lastActivity: Date.now(),
    }));

    // Auto-clear live status after 5 seconds of inactivity
    if (liveTimeout) clearTimeout(liveTimeout);
    liveTimeout = setTimeout(() => {
      const { lastActivity } = get();
      if (Date.now() - lastActivity >= 4900) {
        set({ isLive: false });
      }
    }, 5000);
  },

  setConnected: (isConnected) => set({ isConnected }),

  connect: () => {
    if (typeof window === 'undefined') return;

    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const createConnection = () => {
      try {
        // Connect to standalone activity server (run: npm run activity-server)
        const serverUrl = process.env.NEXT_PUBLIC_ACTIVITY_SERVER || 'http://localhost:3099/events';
        eventSource = new EventSource(serverUrl);

        eventSource.onopen = () => {
          set({ isConnected: true });
        };

        eventSource.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            if (data.type === 'activity' && data.changes) {
              for (const change of data.changes) {
                get().addEvent({
                  nodeType: change.nodeType,
                  label: change.type,
                  timestamp: change.timestamp,
                });
              }
            }
          } catch {
            // Parse error, ignore
          }
        };

        eventSource.onerror = () => {
          set({ isConnected: false });
          eventSource?.close();
          // Reconnect after 5 seconds
          reconnectTimer = setTimeout(createConnection, 5000);
        };
      } catch {
        // EventSource creation failed
      }
    };

    createConnection();

    // Return cleanup function
    return () => {
      eventSource?.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      set({ isConnected: false });
    };
  },
}));
