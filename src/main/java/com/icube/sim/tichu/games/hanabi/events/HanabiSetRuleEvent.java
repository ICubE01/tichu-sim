package com.icube.sim.tichu.games.hanabi.events;

import com.icube.sim.tichu.games.common.events.GameSetRuleEvent;
import com.icube.sim.tichu.games.hanabi.HanabiRule;
import lombok.Getter;

@Getter
public class HanabiSetRuleEvent extends HanabiEvent implements GameSetRuleEvent {
    private final HanabiRule rule;

    public HanabiSetRuleEvent(HanabiRule rule) {
        this.rule = rule;
    }
}
