import { TrickDto } from "@/games/tichu/dtos/TrickDto.ts";

export interface PlayBombMessage {
  playerId: number;
  bomb: TrickDto;
}
