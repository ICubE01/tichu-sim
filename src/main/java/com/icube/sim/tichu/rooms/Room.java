package com.icube.sim.tichu.rooms;

import com.icube.sim.tichu.games.common.domain.*;
import com.icube.sim.tichu.games.common.exceptions.GameHasAlreadyStartedException;
import com.icube.sim.tichu.games.common.exceptions.GameNotFoundException;
import lombok.Getter;
import lombok.Locked;

import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Map;

public class Room {
    @Getter
    private final String id;
    @Getter
    private final String name;
    private final Map<Long, Member> members;
    private int memberCounter = 0;
    @Getter
    private final GameName gameName;
    private final GameRuleWrapper gameRuleWrapper;
    private Game game;
    private Instant updatedAt;

    public Room(String id, String name, GameName gameName) {
        this.id = id;
        this.name = name;
        this.members = new HashMap<>();
        this.gameName = gameName;
        this.gameRuleWrapper = GameRuleWrapper.of(gameName);
        this.game = null;
        this.updatedAt = Instant.now();
    }

    @Locked.Read
    public Map<Long, Member> getMembers() {
        return Map.copyOf(members);
    }

    @Locked.Write
    public void addMember(Member member) {
        assert !members.containsKey(member.getId());
        if (members.size() >= getGameRule().getMaxPlayers()) {
            throw new TooManyMembersException();
        }
        if (hasGameStarted()) {
            throw new GameHasAlreadyStartedException();
        }

        members.put(member.getId(), member);
        member.setRoom(this);
        member.setSeq(++memberCounter);

        updatedAt = Instant.now();
    }

    @Locked.Write
    public void removeMember(Long memberId) {
        if (hasGameStarted()) {
            throw new GameHasAlreadyStartedException();
        }

        var member = members.remove(memberId);
        if (member != null) {
            member.setRoom(null);
            if (member.isHost()) {
                var leastSeqMember = members.values().stream().min(Comparator.comparing(Member::getSeq));
                leastSeqMember.ifPresent(m -> m.setHost(true));
            }
        }

        updatedAt = Instant.now();
    }

    @Locked.Read
    public boolean containsMember(Long memberId) {
        return members.containsKey(memberId);
    }

    @Locked.Read
    public GameRule getGameRule() {
        return gameRuleWrapper.getGameRule();
    }

    @Locked.Write
    public void setGameRule(GameRule gameRule) {
        gameRuleWrapper.setGameRule(gameRule);
        updatedAt = Instant.now();
    }

    @Locked.Read
    public boolean hasGameStarted() {
        return game != null;
    }

    @Locked.Write
    public void startGame() {
        if (hasGameStarted()) {
            throw new GameHasAlreadyStartedException();
        }

        gameRuleWrapper.setMutable(false);
        game = GameBuilder.build(gameName, gameRuleWrapper.getGameRule(), members);
        updatedAt = Instant.now();
    }

    @Locked.Read
    public Game getGame() {
        if (game == null) {
            throw new GameNotFoundException();
        }

        return game;
    }

    @Locked.Write
    public void endGame() {
        game = null;
        gameRuleWrapper.setMutable(true);
        updatedAt = Instant.now();
    }

    @Locked.Read
    public Duration sinceLastUpdate(Instant now) {
        return Duration.between(updatedAt, now);
    }
}
