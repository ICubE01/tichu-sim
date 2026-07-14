package com.icube.sim.tichu.games.hanabi;

import com.icube.sim.tichu.games.hanabi.dtos.HanabiMessage;
import com.icube.sim.tichu.games.hanabi.events.HanabiDiscardEvent;
import com.icube.sim.tichu.games.hanabi.events.HanabiEndEvent;
import com.icube.sim.tichu.games.hanabi.events.HanabiHintEvent;
import com.icube.sim.tichu.games.hanabi.events.HanabiPlayEvent;
import com.icube.sim.tichu.games.hanabi.events.HanabiResolveFreeHintEvent;
import com.icube.sim.tichu.games.hanabi.events.HanabiResolveRecoverToDeckEvent;
import com.icube.sim.tichu.games.hanabi.events.HanabiResolveRecoverToPlayEvent;
import com.icube.sim.tichu.games.hanabi.events.HanabiSetRuleEvent;
import com.icube.sim.tichu.games.hanabi.events.HanabiStartEvent;
import com.icube.sim.tichu.games.hanabi.mappers.HanabiMapper;
import com.icube.sim.tichu.rooms.Room;
import com.icube.sim.tichu.rooms.RoomRepository;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class HanabiEventHandler {
    private final RoomRepository roomRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final HanabiMapper hanabiMapper;

    public HanabiEventHandler(RoomRepository roomRepository, SimpMessagingTemplate messagingTemplate) {
        this.roomRepository = roomRepository;
        this.messagingTemplate = messagingTemplate;
        this.hanabiMapper = new HanabiMapper();
    }

    @EventListener
    public void onSetRule(HanabiSetRuleEvent event) {
        var message = HanabiMessage.setRule(event.getRule());
        for (var userId : getRoomMemberIds(event.getRoomId())) {
            sendToUser(userId, message);
        }
    }

    @EventListener
    public void onStart(HanabiStartEvent event) {
        var room = getRoom(event.getRoomId());
        var game = (Hanabi) room.getGame();
        for (var userId : room.getMembers().keySet()) {
            sendToUser(userId, HanabiMessage.start());
            sendToUser(userId, HanabiMessage.state(hanabiMapper.toDto(game, userId)));
        }
    }

    @EventListener
    public void onHint(HanabiHintEvent event) {
        var message = HanabiMessage.hint(hanabiMapper.toHintInfo(event));
        for (var userId : getRoomMemberIds(event.getRoomId())) {
            sendToUser(userId, message);
        }
    }

    @EventListener
    public void onDiscard(HanabiDiscardEvent event) {
        for (var userId : getRoomMemberIds(event.getRoomId())) {
            sendToUser(userId, HanabiMessage.discard(hanabiMapper.toDiscardInfo(event, userId)));
        }
    }

    @EventListener
    public void onPlay(HanabiPlayEvent event) {
        for (var userId : getRoomMemberIds(event.getRoomId())) {
            sendToUser(userId, HanabiMessage.play(hanabiMapper.toPlayInfo(event, userId)));
        }
    }

    @EventListener
    public void onResolveFreeHint(HanabiResolveFreeHintEvent event) {
        for (var userId : getRoomMemberIds(event.getRoomId())) {
            sendToUser(userId, HanabiMessage.resolveFreeHint(hanabiMapper.toFreeHintInfo(event, userId)));
        }
    }

    @EventListener
    public void onResolveRecoverToDeck(HanabiResolveRecoverToDeckEvent event) {
        for (var userId : getRoomMemberIds(event.getRoomId())) {
            sendToUser(userId, HanabiMessage.resolveRecoverToDeck(hanabiMapper.toRecoverToDeckInfo(event, userId)));
        }
    }

    @EventListener
    public void onResolveRecoverToPlay(HanabiResolveRecoverToPlayEvent event) {
        for (var userId : getRoomMemberIds(event.getRoomId())) {
            sendToUser(userId, HanabiMessage.resolveRecoverToPlay(hanabiMapper.toRecoverToPlayInfo(event, userId)));
        }
    }

    @EventListener
    public void onEnd(HanabiEndEvent event) {
        var room = getRoom(event.getRoomId());
        var game = (Hanabi) room.getGame();
        for (var userId : room.getMembers().keySet()) {
            sendToUser(userId, HanabiMessage.end(hanabiMapper.toDto(game, userId)));
        }
        room.endGame();
    }

    private Room getRoom(String roomId) {
        return roomRepository.findById(roomId).orElseThrow();
    }

    private Set<Long> getRoomMemberIds(String roomId) {
        var room = roomRepository.findById(roomId).orElseThrow();
        return room.getMembers().keySet();
    }

    private void sendToUser(long userId, HanabiMessage message) {
        messagingTemplate.convertAndSendToUser(Long.toString(userId), "/queue/game/hanabi", message);
    }
}
