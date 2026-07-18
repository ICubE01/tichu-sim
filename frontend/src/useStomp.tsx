import { Client, ReconnectionTimeMode, StompSubscription } from "@stomp/stompjs";
import { useMemo, useRef } from "react";

/**
 * A subscriber for a parsed message body. This layer cannot know the payload shape, so callers
 * declare the type they expect; `any` keeps that assignment bivariant, where `unknown` would
 * reject every typed handler under `strictFunctionTypes`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MessageCallback = (message: any) => void;

interface SubscriptionEntry {
  destination: string;
  callback: MessageCallback;
  stompSubscription: StompSubscription | null;
}

interface PublicationEntry {
  destination: string;
  message: unknown;
}

export class useStomp {
  private subscriptions = useRef<SubscriptionEntry[]>([]);

  private reservedPublications = useRef<PublicationEntry[]>([]);

  private issueToken = useRef<(() => Promise<string>) | null>(null);

  private client = useMemo(() => new Client({
    brokerURL: `${window.location.origin.replace('http', 'ws')}/api/ws`,
    reconnectDelay: 1000,
    reconnectTimeMode: ReconnectionTimeMode.EXPONENTIAL,
    maxReconnectDelay: 60000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onStompError: (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
    },
  }), []);

  constructor() {
    this.client.beforeConnect = async () => {
      if (!this.issueToken.current) {
        return;
      }
      try {
        this.client.connectHeaders.Authorization = `Bearer ${await this.issueToken.current()}`;
      } catch (e) {
        delete this.client.connectHeaders.Authorization;
        console.error('Failed to issue a web socket token: ', e);
      }
    };

    this.client.onConnect = (_) => {
      this.subscriptions.current.forEach(entry => {
        entry.stompSubscription = this.client.subscribe(
          entry.destination,
          (message) => {
            entry.callback(JSON.parse(message.body))
          }
        );
      });
      while (this.reservedPublications.current.length > 0) {
        const entry = this.reservedPublications.current[0];
        this.client.publish({
          destination: entry.destination,
          body: JSON.stringify(entry.message)
        });
        this.reservedPublications.current.shift();
      }
    }
  }

  connect(issueToken: () => Promise<string>) {
    this.issueToken.current = issueToken;
    if (!this.client.active) {
      this.client.activate();
    }
  }

  disconnect() {
    this.client.deactivate().then();
  };

  subscribe(destination: string, callback: MessageCallback) {
    const entry = {
      destination,
      callback,
      stompSubscription: !this.client.active ?
        null :
        this.client.subscribe(
          destination,
          (message) => {
            callback(JSON.parse(message.body))
          }
        )
    };
    this.subscriptions.current.push(entry);
  };

  unsubscribe(destination: string, callback: MessageCallback) {
    const index = this.subscriptions.current.findIndex(
      entry => entry.destination === destination && entry.callback === callback
    );

    if (index !== -1) {
      const entry = this.subscriptions.current[index];
      entry.stompSubscription?.unsubscribe();
      this.subscriptions.current.splice(index, 1);
    }
  };

  publish(destination: string, message: unknown) {
    if (this.client.active) {
      this.client.publish({
        destination: destination,
        body: JSON.stringify(message)
      });
    } else {
      this.reservedPublications.current.push({ destination, message });
    }
  };
}
