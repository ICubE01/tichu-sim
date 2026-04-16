import { Client, StompSubscription } from "@stomp/stompjs";
import { useMemo, useRef } from "react";

interface SubscriptionEntry {
  destination: string;
  callback: Function;
  stompSubscription: StompSubscription | null;
}

export class useStomp {
  private subscriptions = useRef<SubscriptionEntry[]>([]);

  private client = useMemo(() => new Client({
    brokerURL: `${window.location.origin.replace('http', 'ws')}/api/ws`,
    reconnectDelay: 1000,
    heartbeatIncoming: 0,
    heartbeatOutgoing: 0,
    debug: (str) => console.debug(str),
    onStompError: (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
    },
  }), []);

  constructor() {
    this.client.onConnect = (_) => {
      this.subscriptions.current.forEach(entry => {
        entry.stompSubscription = this.client.subscribe(
          entry.destination,
          (message) => {
            entry.callback(JSON.parse(message.body))
          }
        );
      });
    }
  }

  connect(token: string) {
    this.client.connectHeaders.Authorization = `Bearer ${token}`;
    if (!this.client.active) {
      this.client.activate();
    }
  }

  disconnect() {
    this.client.deactivate().then();
  };

  subscribe(destination: string, callback: Function) {
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

  unsubscribe(destination: string, callback: Function) {
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
    this.client.publish({
      destination: destination,
      body: JSON.stringify(message)
    });
  };
}
