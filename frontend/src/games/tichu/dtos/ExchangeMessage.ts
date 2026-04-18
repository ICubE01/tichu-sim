import { CardDto } from "@/games/tichu/dtos/CardDto.ts";

export interface ExchangeMessage {
  gaveToLeft: CardDto;
  gaveToMid: CardDto;
  gaveToRight: CardDto;
  receivedFromLeft: CardDto;
  receivedFromMid: CardDto;
  receivedFromRight: CardDto;
}
