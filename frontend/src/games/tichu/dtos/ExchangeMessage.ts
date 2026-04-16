import { Card } from "@/games/tichu/domain/Card.ts";

export interface ExchangeMessage {
  gaveToLeft: Card;
  gaveToMid: Card;
  gaveToRight: Card;
  receivedFromLeft: Card;
  receivedFromMid: Card;
  receivedFromRight: Card;
}
