import { GameRule } from "@/games/types.ts";

export enum RainbowMode {
  WILDCARD = 'WILDCARD',
  SIXTH_LONG = 'SIXTH_LONG',
  SIXTH_SHORT = 'SIXTH_SHORT',
}

export interface HanabiRule extends GameRule {
  isRainbowEnabled: boolean;
  rainbowMode: RainbowMode;
  isBlackEnabled: boolean;
  isBonusEnabled: boolean;
}
