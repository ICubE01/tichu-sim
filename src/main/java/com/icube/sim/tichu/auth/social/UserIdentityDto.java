package com.icube.sim.tichu.auth.social;

import java.time.Instant;

public record UserIdentityDto(
        OidcProviderName provider,
        String providerEmail,
        Instant connectedAt
) {
}
