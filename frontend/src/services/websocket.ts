import { Client, StompSubscription } from '@stomp/stompjs';

const getWsUrl = (): string => {
  if (typeof window === 'undefined') return 'ws://localhost:8080/ws';
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
};

type MessageHandler = (data: any) => void;

class WebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, { callback: MessageHandler; subscription: StompSubscription | null }> = new Map();
  private connectPromise: Promise<void> | null = null;
  private statusListeners: Set<(connected: boolean) => void> = new Set();

  public addStatusListener(listener: (connected: boolean) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.isConnected());
    return () => this.statusListeners.delete(listener);
  }

  private notifyStatus(connected: boolean) {
    this.statusListeners.forEach((listener) => {
      try {
        listener(connected);
      } catch (err) {
        console.error('WebSocket status listener error', err);
      }
    });
  }

  public connect(token?: string): Promise<void> {
    if (this.client?.connected) {
      return Promise.resolve();
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    const jwt = token || localStorage.getItem('campus_connect_jwt') || undefined;

    this.connectPromise = new Promise((resolve, reject) => {
      this.client = new Client({
        brokerURL: getWsUrl(),
        connectHeaders: jwt ? { Authorization: `Bearer ${jwt}` } : {},
        reconnectDelay: 4000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,

        onConnect: () => {
          this.notifyStatus(true);
          console.log('[WebSocket] STOMP connected to Orbitly server');

          // Re-subscribe all active destinations
          this.resubscribeAll();
          resolve();
        },

        onStompError: (frame) => {
          console.warn('[WebSocket] STOMP broker error:', frame.headers['message'], frame.body);
        },

        onWebSocketError: (event) => {
          console.warn('[WebSocket] Transport error:', event);
        },

        onWebSocketClose: () => {
          this.notifyStatus(false);
          this.subscriptions.forEach((entry) => {
            entry.subscription = null;
          });
        },
      });

      try {
        this.client.activate();
      } catch (err) {
        this.connectPromise = null;
        reject(err);
      }
    });

    return this.connectPromise;
  }

  public isConnected(): boolean {
    return this.client?.connected ?? false;
  }

  public subscribe(destination: string, callback: MessageHandler): () => void {
    const existing = this.subscriptions.get(destination);
    if (existing?.subscription) {
      try {
        existing.subscription.unsubscribe();
      } catch {}
    }

    const entry = { callback, subscription: null as StompSubscription | null };
    this.subscriptions.set(destination, entry);

    if (this.client?.connected) {
      this.createSubscription(destination, entry);
    }

    return () => {
      this.unsubscribe(destination);
    };
  }

  private createSubscription(destination: string, entry: { callback: MessageHandler; subscription: StompSubscription | null }) {
    if (!this.client?.connected) return;

    try {
      const sub = this.client.subscribe(destination, (msg) => {
        try {
          const parsed = JSON.parse(msg.body);
          entry.callback(parsed);
        } catch {
          entry.callback(msg.body);
        }
      });
      entry.subscription = sub;
    } catch (err) {
      console.error('[WebSocket] Failed to subscribe to ' + destination, err);
    }
  }

  private resubscribeAll() {
    if (!this.client?.connected) return;
    this.subscriptions.forEach((entry, destination) => {
      entry.subscription = null;
      this.createSubscription(destination, entry);
    });
  }

  public unsubscribe(destination: string) {
    const entry = this.subscriptions.get(destination);
    if (entry) {
      if (entry.subscription) {
        try {
          entry.subscription.unsubscribe();
        } catch {}
      }
      this.subscriptions.delete(destination);
    }
  }

  public disconnect() {
    if (this.client) {
      try {
        this.client.deactivate();
      } catch {}
      this.client = null;
    }
    this.subscriptions.clear();
    this.connectPromise = null;
    this.notifyStatus(false);
  }

  // Convenience subscription helpers
  public subscribeToConnectionMessages(connectionId: string, callback: (msg: any) => void): () => void {
    return this.subscribe(`/topic/connections/${connectionId}/messages`, callback);
  }

  public subscribeToConnectionRead(connectionId: string, callback: (receipt: any) => void): () => void {
    return this.subscribe(`/topic/connections/${connectionId}/read`, callback);
  }

  public subscribeToUserMessages(userId: string, callback: (msg: any) => void): () => void {
    return this.subscribe(`/topic/users/${userId}/messages`, callback);
  }

  public subscribeToUserConnections(userId: string, callback: (conn: any) => void): () => void {
    return this.subscribe(`/topic/users/${userId}/connections`, callback);
  }
}

export const webSocketService = new WebSocketService();
export default webSocketService;
