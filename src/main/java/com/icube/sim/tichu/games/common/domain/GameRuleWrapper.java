package com.icube.sim.tichu.games.common.domain;

import com.icube.sim.tichu.games.common.exceptions.ImmutableGameRuleException;
import com.icube.sim.tichu.games.common.exceptions.InvalidGameRuleException;
import com.icube.sim.tichu.games.tichu.TichuRule;
import lombok.Getter;
import lombok.Setter;

@Getter
public class GameRuleWrapper {
    private GameRule gameRule;
    @Setter
    private boolean isMutable;

    private GameRuleWrapper(GameRule gameRule) {
        this.gameRule = gameRule;
        this.isMutable = true;
    }

    public static GameRuleWrapper of(GameName gameName) {
        return switch (gameName) {
            case TICHU -> new GameRuleWrapper(TichuRule.createDefault());
        };
    }

    public void setGameRule(GameRule gameRule) {
        if (!isMutable) {
            throw new ImmutableGameRuleException();
        }
        if (this.gameRule.getGameName() != gameRule.getGameName()) {
            throw new InvalidGameRuleException();
        }
        this.gameRule = gameRule;
    }
}
