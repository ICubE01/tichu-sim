import { Client, ReconnectionTimeMode, StompSubscription } from "@stomp/stompjs";
import { useCallback, useMemo, useRef, useState } from "react";

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

export interface StompApi {
  connect: (issueToken: () => Promise<string>) => void;
  disconnect: () => void;
  subscribe: (destination: string, callback: MessageCallback) => void;
  unsubscribe: (destination: string, callback: MessageCallback) => void;
  publish: (destination: string, message: unknown) => void;
}

export const useStomp = () => {
  const subscriptions = useRef<SubscriptionEntry[]>([]);

  const reservedPublications = useRef<PublicationEntry[]>([]);

  const issueToken = useRef<(() => Promise<string>) | null>(null);

  // `active` spans connect() → disconnect() and stays true while reconnecting;
  // `connected` is true only while a STOMP session is live. Reconnecting is `active && !connected`.
  const [active, setActive] = useState(false);
  const [connected, setConnected] = useState(false);

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
      setConnected(true);
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

    client.onWebSocketClose = () => {
      setConnected(false);
    };

    return client;
  }, []);

  const connect = useCallback((issueTokenFn: () => Promise<string>) => {
    issueToken.current = issueTokenFn;
    if (!client.active) {
      client.activate();
      setActive(true);
    }
  }, [client]);

  const disconnect = useCallback(() => {
    client.deactivate().then();
    setActive(false);
    setConnected(false);
  }, [client]);

  const subscribe = useCallback((destination: string, callback: MessageCallback) => {
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
  }, [client]);

  const unsubscribe = useCallback((destination: string, callback: MessageCallback) => {
    const index = subscriptions.current.findIndex(
      entry => entry.destination === destination && entry.callback === callback
    );

    if (index !== -1) {
      const entry = subscriptions.current[index];
      entry.stompSubscription?.unsubscribe();
      subscriptions.current.splice(index, 1);
    }
  }, []);

  const publish = useCallback((destination: string, message: unknown) => {
    if (client.active) {
      client.publish({
        destination: destination,
        body: JSON.stringify(message)
      });
    } else {
      reservedPublications.current.push({ destination, message });
    }
  }, [client]);

  const stomp = useMemo<StompApi>(() => ({
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    publish,
  }), [connect, disconnect, subscribe, unsubscribe, publish]);

  return { stomp, active, connected };
};
