package com.icube.sim.tichu.games.tichu;

import com.icube.sim.tichu.games.common.domain.AbstractGame;
import com.icube.sim.tichu.games.tichu.events.TichuEndEvent;
import com.icube.sim.tichu.games.tichu.events.TichuStartEvent;
import com.icube.sim.tichu.games.tichu.events.TichuRoundEndEvent;
import com.icube.sim.tichu.rooms.Member;
import lombok.Locked;

import java.util.*;
import java.util.stream.Collectors;

public class Tichu extends AbstractGame {
    private final TichuRule rule;
    // Player order: { RED, BLUE, RED, BLUE }
    private final Player[] players;
    private final Map<Long, Integer> playerIndexById;
    private final List<Round> rounds;

    public Tichu(TichuRule rule, Map<Long, Member> members) {
        this(rule, initPlayers(rule, members));
    }

    private Tichu(TichuRule rule, Player[] players) {
        super(new TichuStartEvent(players));
        this.rule = rule;
        this.players = players;
        this.playerIndexById = Map.of(
                players[0].getId(), 0,
                players[1].getId(), 1,
                players[2].getId(), 2,
                players[3].getId(), 3
        );
        this.rounds = new ArrayList<>();
        this.rounds.add(new Round(this));
    }

    public Player getPlayer(int index) {
        return players[index];
    }

    public int getPlayerIndexById(Long id) {
        return playerIndexById.get(id);
    }

    private static Player[] initPlayers(TichuRule rule, Map<Long, Member> members) {
        var memberIds = new ArrayList<>(members.keySet());
        Collections.shuffle(memberIds);
        var teams = rule.getDeterminedTeams(memberIds);

        var reds = teams.entrySet().stream()
                .filter(entry -> entry.getValue().equals(Team.RED))
                .map(Map.Entry::getKey)
                .toList();
        var blues = memberIds.stream()
                .filter(id -> !reds.contains(id))
                .toList();

        assert reds.size() == 2 && blues.size() == 2;

        Player[] players = new Player[4];
        players[0] = new Player(members.get(reds.get(0)), Team.RED);
        players[1] = new Player(members.get(blues.get(0)), Team.BLUE);
        players[2] = new Player(members.get(reds.get(1)), Team.RED);
        players[3] = new Player(members.get(blues.get(1)), Team.BLUE);

        return players;
    }

    @Locked
    public Round getCurrentRound() {
        return rounds.getLast();
    }

    public void nextRound() {
        var scoresHistory = getScoresHistory();
        var redTotalScore = scoresHistory.stream().mapToInt(score -> score[0]).sum();
        var blueTotalScore = scoresHistory.stream().mapToInt(score -> score[1]).sum();

        // todo: set max score in rules
        if (redTotalScore < 1000 && blueTotalScore < 1000) {
            addEvent(new TichuRoundEndEvent(scoresHistory));
            rounds.add(new Round(this));
        } else {
            addEvent(new TichuEndEvent(scoresHistory));
        }
    }

    public List<int[]> getScoresHistory() {
        var scoresHistory = rounds.stream().map(Round::getScores).collect(Collectors.toList());
        if (scoresHistory.getLast() == null) {
            scoresHistory.removeLast();
        }
        return scoresHistory;
    }
}
