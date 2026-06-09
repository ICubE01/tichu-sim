package com.icube.sim.tichu.auth.social.providers;

import com.icube.sim.tichu.common.TimeService;
import lombok.AllArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.oauth2.core.OAuth2AuthorizationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@AllArgsConstructor
@Component
public class OidcStateStore {
    private record Entry(String nonce, Instant expiresAt) {}

    private static final Duration TTL = Duration.ofMinutes(10);
    private static final int MAX_ENTRIES = 10_000;

    private final ConcurrentHashMap<String, Entry> store = new ConcurrentHashMap<>();
    private final TimeService timeService;

    public void save(String state, String nonce) {
        if (store.size() >= MAX_ENTRIES) {
            throw new OAuth2AuthorizationException(new OAuth2Error("server_busy"));
        }
        store.put(state, new Entry(nonce, timeService.now().plus(TTL)));
    }

    public Optional<String> consume(String state) {
        var entry = store.remove(state);
        if (entry == null || entry.expiresAt().isBefore(timeService.now())) {
            return Optional.empty();
        }
        return Optional.of(entry.nonce());
    }

    @Scheduled(fixedDelay = 1000 * 60)
    public void purgeExpired() {
        var now = timeService.now();
        store.entrySet().removeIf(e -> e.getValue().expiresAt().isBefore(now));
    }
}
