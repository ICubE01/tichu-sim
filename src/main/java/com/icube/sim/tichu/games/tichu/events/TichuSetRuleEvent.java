package com.icube.sim.tichu.games.tichu.events;

import com.icube.sim.tichu.games.common.events.GameSetRuleEvent;
import com.icube.sim.tichu.games.tichu.TichuRule;
import lombok.Getter;

@Getter
public class TichuSetRuleEvent extends TichuEvent implements GameSetRuleEvent {
    private final TichuRule rule;

    public TichuSetRuleEvent(TichuRule rule) {
        this.rule = rule;
    }
}
