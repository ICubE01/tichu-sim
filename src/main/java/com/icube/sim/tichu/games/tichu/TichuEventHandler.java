package com.icube.sim.tichu.games.tichu;

import com.icube.sim.tichu.games.tichu.dtos.ExchangeMessage;
import com.icube.sim.tichu.games.tichu.dtos.PlayBombMessage;
import com.icube.sim.tichu.games.tichu.dtos.PlayTrickMessage;
import com.icube.sim.tichu.games.tichu.dtos.TichuMessage;
import com.icube.sim.tichu.games.tichu.events.*;
import com.icube.sim.tichu.games.tichu.mappers.CardMapper;
import com.icube.sim.tichu.games.tichu.mappers.PlayerMapper;
import com.icube.sim.tichu.games.tichu.mappers.TrickMapper;
import com.icube.sim.tichu.rooms.RoomRepository;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Set;

@Component
public class TichuEventHandler {
    private final RoomRepository roomRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final CardMapper cardMapper;
    private final TrickMapper trickMapper;

    public TichuEventHandler(RoomRepository roomRepository, SimpMessagingTemplate messagingTemplate) {
        this.roomRepository = roomRepository;
        this.messagingTemplate = messagingTemplate;
        this.cardMapper = new CardMapper();
        this.trickMapper = new TrickMapper();
    }

    @EventListener
    public void onSetRule(TichuSetRuleEvent event) {
        var message = TichuMessage.setRule(event.getRule());

        for (var userId : getRoomMemberIds(event.getRoomId())) {
            sendToUser(userId, message);
        }
    }

    @EventListener
    public void onGameStart(TichuStartEvent event) {
        var players = event.getPlayers();
        var playerMapper = new PlayerMapper();
        var playerDtos = Arrays.stream(players).map(playerMapper::toDto).toList();
        var message = TichuMessage.start(playerDtos);

        for (var userId : getRoomMemberIds(event.getRoomId())) {
            sendToUser(userId, message);
        }
    }

    @EventListener
    public void onFirstDraw(TichuFirstDrawEvent event) {
        var firstDraws = event.getFirstDraws();
        var cardMapper = new CardMapper();

        for (var userId : getRoomMemberIds(event.getRoomId())) {
            var playerFirstDraws = cardMapper.toDtos(firstDraws.get(userId));
            var message = TichuMessage.initFirstDraws(playerFirstDraws);
            sendToUser(userId, message);
        }
    }

    @EventListener
    public void onLargeTichu(TichuLargeTichuEvent event) {
        var message = TichuMessage.largeTichu(event.getTichuDeclarations());

        for (var userId : getRoomMemberIds(event.getRoomId())) {
            sendToUser(userId, message);
        }
    }

    @EventListener
    public void onSecondDraw(TichuSecondDrawEvent event) {
        var hands = event.getHands();

        for (var userId : getRoomMemberIds(event.getRoomId())) {
            var playerHand = cardMapper.toDtos(hands.get(userId));
            var message = TichuMessage.addSecondDraws(playerHand);
            sendToUser(userId, message);
        }
    }

    @EventListener
    public void onSmallTichu(TichuSmallTichuEvent event) {
        var message = TichuMessage.smallTichu(event.getPlayerId());

        for (var userId : getRoomMemberIds(event.getRoomId())) {
            sendToUser(userId, message);
        }
    }

    @EventListener
    public void onExchange(TichuExchangeEvent event) {
        for (var userId : getRoomMemberIds(event.getRoomId())) {
            var message = TichuMessage.exchange(new ExchangeMessage(
                    cardMapper.toDto(event.getCardGaveLeftFrom(userId)),
                    cardMapper.toDto(event.getCardGaveMidFrom(userId)),
                    cardMapper.toDto(event.getCardGaveRightFrom(userId)),
                    cardMapper.toDto(event.getCardReceivedFromLeft(userId)),
                    cardMapper.toDto(event.getCardReceivedFromMid(userId)),
                    cardMapper.toDto(event.getCardReceivedFromRight(userId))
            ));
            sendToUser(userId, message);
        }
    }

    @EventListener
    public void onPhaseStart(TichuPhaseStartEvent event) {
        var message = TichuMessage.phaseStart(event.getFirstPlayerIndex());

        for (var userId : getRoomMemberIds(event.getRoomId())) {
            sendToUser(userId, message);
        }
    }

    @EventListener
    public void onPlayTrick(TichuPlayTrickEvent event) {
        var message = TichuMessage.playTrick(new PlayTrickMessage(
                event.getPlayerId(),
                trickMapper.toDto(event.getTrick()),
                event.getWish()
        ));

        for (var userId : getRoomMemberIds(event.getRoomId())) {
            sendToUser(userId, message);
        }
    }

    @EventListener
    public void onPlayBomb(TichuPlayBombEvent event) {
        var message = TichuMessage.playBomb(new PlayBombMessage(
                event.getPlayerId(),
                trickMapper.toDto(event.getBomb())
        ));

        for (var userId : getRoomMemberIds(event.getRoomId())) {
            sendToUser(userId, message);
        }
    }

    @EventListener
    public void onPass(TichuPassEvent event) {
        var message = TichuMessage.pass(event.getPlayerId());

        for (var userId : getRoomMemberIds(event.getRoomId())) {
            sendToUser(userId, message);
        }
    }

    @EventListener
    public void onPhaseEndWithDragon(TichuPhaseEndWithDragonEvent event) {
        var message = TichuMessage.phaseEndWithDragon(event.getPlayerIndex());

        for (var userId : getRoomMemberIds(event.getRoomId())) {
            sendToUser(userId, message);
        }
    }

    @EventListener
    public void onSelectDragonReceiver(TichuSelectDragonReceiverEvent event) {
        var message = TichuMessage.selectDragonReceiver(event.getReceiverId());

        for (var userId : getRoomMemberIds(event.getRoomId())) {
            sendToUser(userId, message);
        }
    }

    @EventListener
    public void onRoundEnd(TichuRoundEndEvent event) {
        var message = TichuMessage.roundEnd(event.getScoresHistory());

        for (var userId : getRoomMemberIds(event.getRoomId())) {
            sendToUser(userId, message);
        }
    }

    @EventListener
    public void onGameEnd(TichuEndEvent event) {
        var message = TichuMessage.end(event.getScoresHistory());

        for (var userId : getRoomMemberIds(event.getRoomId())) {
            sendToUser(userId, message);
        }

        var room = roomRepository.findById(event.getRoomId()).orElseThrow();
        room.endGame();
    }

    private Set<Long> getRoomMemberIds(String roomId) {
        var room = roomRepository.findById(roomId).orElseThrow();
        return room.getMembers().keySet();
    }

    private void sendToUser(long userId, TichuMessage message) {
        messagingTemplate.convertAndSendToUser(Long.toString(userId), "/queue/game/tichu", message);
    }
}
