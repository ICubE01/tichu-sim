import { Client } from "@stomp/stompjs";
import { useMemo, useRef } from "react";

export const useStomp = () => {
  const subscriptions = useRef([]);

  const client = useMemo(() => new Client({
    brokerURL: `${window.location.origin.replace('http', 'ws')}/api/ws`,
    reconnectDelay: 1000,
    heartbeatIncoming: 0,
    heartbeatOutgoing: 0,
    debug: (str) => console.debug(str),
    onStompError: (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
    },
  }), []);

  client.onConnect = (frame) => {
    subscriptions.current.forEach(entry => {
      entry.stompSubscription = client.subscribe(
        entry.destination,
        (message) => {
          entry.callback(JSON.parse(message.body))
        }
      );
    });
  }

  const connect = (token) => {
    client.connectHeaders.Authorization = `Bearer ${token}`;
    if (!client.active) {
      client.activate();
    }
  }

  const disconnect = () => {
    client.deactivate().then();
  };

  const subscribe = (destination, callback) => {
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
  };

  const unsubscribe = (destination, callback) => {
    const index = subscriptions.current.findIndex(
      entry => entry.destination === destination && entry.callback === callback
    );

    if (index !== -1) {
      const entry = subscriptions.current[index];
      entry.stompSubscription?.unsubscribe();
      subscriptions.current.splice(index, 1);
    }
  };

  const publish = (destination, message) => {
    client.publish({
      destination: destination,
      body: JSON.stringify(message)
    });
  };

  return { connect, disconnect, subscribe, unsubscribe, publish };
};
