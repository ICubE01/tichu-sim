package com.icube.sim.tichu.users;

import java.time.Instant;

public record UserDto(
        Long id,
        String name,
        String email,
        boolean hasPassword,
        Instant createdAt
) {
}
