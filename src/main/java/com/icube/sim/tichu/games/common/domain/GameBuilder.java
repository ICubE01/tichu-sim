package com.icube.sim.tichu.games.common.domain;

import com.icube.sim.tichu.games.tichu.Tichu;
import com.icube.sim.tichu.games.tichu.TichuRule;
import com.icube.sim.tichu.games.common.exceptions.InvalidMemberCountException;
import com.icube.sim.tichu.rooms.Member;

import java.util.Map;

public class GameBuilder {
    public static Game build(GameName gameName, GameRule gameRule, Map<Long, Member> members) {
        if (members.size() < gameRule.getMinPlayers() || members.size() > gameRule.getMaxPlayers()) {
            throw new InvalidMemberCountException();
        }

        return switch (gameName) {
            case TICHU -> new Tichu((TichuRule) gameRule, members);
        };
    }
}
