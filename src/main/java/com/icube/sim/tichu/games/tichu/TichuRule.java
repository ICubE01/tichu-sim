package com.icube.sim.tichu.games.tichu;

import com.icube.sim.tichu.games.common.domain.GameName;
import com.icube.sim.tichu.games.common.domain.GameRule;
import com.icube.sim.tichu.games.tichu.exceptions.InvalidTeamAssignmentException;
import lombok.Getter;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public record TichuRule(WinningScore winningScore, Map<Long, Team> teamAssignment, int timeLimit) implements GameRule {
    public static TichuRule createDefault() {
        return new TichuRule(WinningScore.ONE_THOUSAND, new HashMap<>(), 30);
    }

    @Override
    public GameName getGameName() {
        return GameName.TICHU;
    }

    @Override
    public int getMinPlayers() {
        return 4;
    }

    @Override
    public int getMaxPlayers() {
        return 4;
    }

    public Map<Long, Team> getDeterminedTeams(List<Long> userIds) {
        assert userIds.size() == 4;

        Collections.shuffle(userIds);

        int red = 0, blue = 0;
        for (Long userId : userIds) {
            var team = teamAssignment.getOrDefault(userId, Team.NONE);
            if (team.equals(Team.RED)) {
                red++;
            }
            if (team.equals(Team.BLUE)) {
                blue++;
            }
        }

        if (red > 2 || blue > 2) {
            throw new InvalidTeamAssignmentException();
        }

        var determinedTeams = new HashMap<Long, Team>();
        for (Long userId : userIds) {
            var team = teamAssignment.getOrDefault(userId, Team.NONE);
            if (!team.equals(Team.NONE)) {
                determinedTeams.put(userId, team);
                continue;
            }
            if (red < 2) {
                determinedTeams.put(userId, Team.RED);
                red++;
            } else if (blue < 2) {
                determinedTeams.put(userId, Team.BLUE);
                blue++;
            }
        }

        assert red == 2 && blue == 2;
        assert determinedTeams.size() == 4;
        return determinedTeams;
    }

    @Getter
    public enum WinningScore {
        ZERO(0),
        TWO_HUNDRED(200),
        FIVE_HUNDRED(500),
        ONE_THOUSAND(1000),
        ;

        private final int value;

        WinningScore(int value) {
            this.value = value;
        }
    }
}
