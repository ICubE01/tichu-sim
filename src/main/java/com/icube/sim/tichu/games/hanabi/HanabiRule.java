package com.icube.sim.tichu.games.hanabi;

import com.icube.sim.tichu.games.common.domain.GameName;
import com.icube.sim.tichu.games.common.domain.GameRule;

public record HanabiRule(
        boolean isRainbowEnabled,
        RainbowMode rainbowMode,
        boolean isBlackEnabled,
        boolean isBonusEnabled
) implements GameRule {
    public HanabiRule {
        if (rainbowMode == null) {
            rainbowMode = RainbowMode.WILDCARD;
        }
    }

    public static HanabiRule createDefault() {
        return new HanabiRule(false, RainbowMode.WILDCARD, false, false);
    }

    @Override
    public GameName getGameName() {
        return GameName.HANABI;
    }

    @Override
    public int getMinPlayers() {
        return 2;
    }

    @Override
    public int getMaxPlayers() {
        return 5;
    }

    public int handSize(int playerCount) {
        return playerCount <= 3 ? 5 : 4;
    }
}
