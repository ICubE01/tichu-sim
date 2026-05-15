package com.icube.sim.tichu.common;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;

@RequiredArgsConstructor
@Service
public class TimeService {
    private final Clock clock;

    public Instant now() {
        return clock.instant();
    }
}
