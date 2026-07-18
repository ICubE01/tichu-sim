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

export interface Stomp {
  connect: (issueToken: () => Promise<string>) => void;
  disconnect: () => void;
  subscribe: (destination: string, callback: MessageCallback) => void;
  unsubscribe: (destination: string, callback: MessageCallback) => void;
  publish: (destination: string, message: unknown) => void;
}

export const useStomp = (): Stomp => {
  const subscriptions = useRef<SubscriptionEntry[]>([]);

  const reservedPublications = useRef<PublicationEntry[]>([]);

  const issueToken = useRef<(() => Promise<string>) | null>(null);

  const client = useMemo(() => {
    const client = new Client({
      brokerURL: `${window.location.origin.replace('http', 'ws')}/api/ws`,
      reconnectDelay: 1000,
      reconnectTimeMode: ReconnectionTimeMode.EXPONENTIAL,
      maxReconnectDelay: 60000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
      },
    });

    client.beforeConnect = async () => {
      if (!issueToken.current) {
        return;
      }
      try {
        client.connectHeaders.Authorization = `Bearer ${await issueToken.current()}`;
      } catch (e) {
        delete client.connectHeaders.Authorization;
        console.error('Failed to issue a web socket token: ', e);
      }
    };

    client.onConnect = () => {
      subscriptions.current.forEach(entry => {
        entry.stompSubscription = client.subscribe(
          entry.destination,
          (message) => {
            entry.callback(JSON.parse(message.body))
          }
        );
      });
      while (reservedPublications.current.length > 0) {
        const entry = reservedPublications.current[0];
        client.publish({
          destination: entry.destination,
          body: JSON.stringify(entry.message)
        });
        reservedPublications.current.shift();
      }
    };

    return client;
  }, []);

  return useMemo(() => ({
    connect: (newIssueToken: () => Promise<string>) => {
      issueToken.current = newIssueToken;
      if (!client.active) {
        client.activate();
      }
    },

    disconnect: () => {
      client.deactivate().then();
    },

    subscribe: (destination: string, callback: MessageCallback) => {
      const entry = {
        destination,
        callback,
        stompSubscription: !client.active ?
          null :
          client.subscribe(
            destination,
            (message) => {
              callback(JSON.parse(message.body))
            }
          )
      };
      subscriptions.current.push(entry);
    },

    unsubscribe: (destination: string, callback: MessageCallback) => {
      const index = subscriptions.current.findIndex(
        entry => entry.destination === destination && entry.callback === callback
      );

      if (index !== -1) {
        const entry = subscriptions.current[index];
        entry.stompSubscription?.unsubscribe();
        subscriptions.current.splice(index, 1);
      }
    },

    publish: (destination: string, message: unknown) => {
      if (client.active) {
        client.publish({
          destination: destination,
          body: JSON.stringify(message)
        });
      } else {
        reservedPublications.current.push({ destination, message });
      }
    },
  }), [client]);
};
