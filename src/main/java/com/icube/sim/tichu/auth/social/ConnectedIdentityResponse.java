package com.icube.sim.tichu.auth.social;

import java.time.Instant;

public record ConnectedIdentityResponse(
        OidcProviderName provider,
        String providerEmail,
        Instant connectedAt
) {
}
