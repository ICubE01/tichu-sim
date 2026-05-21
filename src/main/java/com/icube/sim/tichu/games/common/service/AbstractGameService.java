package com.icube.sim.tichu.games.common.service;

import com.icube.sim.tichu.games.common.domain.Game;
import com.icube.sim.tichu.games.common.domain.GameRule;
import com.icube.sim.tichu.games.common.event.GameEvent;
import com.icube.sim.tichu.games.common.event.GameSetRuleEvent;
import com.icube.sim.tichu.rooms.MemberMessagePublisher;
import com.icube.sim.tichu.rooms.Room;
import com.icube.sim.tichu.rooms.RoomRepository;
import org.springframework.context.ApplicationEventPublisher;

public abstract class AbstractGameService implements GameService {
    private final RoomRepository roomRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final MemberMessagePublisher memberMessagePublisher;

    protected AbstractGameService(RoomRepository roomRepository,
                                  ApplicationEventPublisher eventPublisher,
                                  MemberMessagePublisher memberMessagePublisher) {
        this.roomRepository = roomRepository;
        this.eventPublisher = eventPublisher;
        this.memberMessagePublisher = memberMessagePublisher;
    }

    protected abstract void checkRule(GameRule gameRule);

    protected abstract GameSetRuleEvent createSetRuleEvent(GameRule gameRule);

    protected abstract void postStart(Game game, Room room);

    @Override
    public void setRule(String roomId, GameRule gameRule) {
        checkRule(gameRule);

        var room = getRoom(roomId);
        var oldRule = room.getGameRule();
        if (oldRule.equals(gameRule)) {
            return;
        }

        room.setGameRule(gameRule);
        memberMessagePublisher.publish(room);
        publishEvent(createSetRuleEvent(gameRule), roomId);
    }

    @Override
    public void start(String roomId) {
        var room = getRoom(roomId);
        room.startGame();

        var game = room.getGame();
        postStart(game, room);

        publishQueuedEvents(game, roomId);
    }

    protected Room getRoom(String roomId) {
        return roomRepository.findById(roomId).orElseThrow();
    }

    protected Game getGame(String roomId) {
        return getRoom(roomId).getGame();
    }

    protected void publishQueuedEvents(Game game, String roomId) {
        game.drainAllEvents().forEach(event -> publishEvent(event, roomId));
    }

    protected void publishEvent(GameEvent event, String roomId) {
        event.setRoomId(roomId);
        eventPublisher.publishEvent(event);
    }
}
