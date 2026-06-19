package com.icube.sim.tichu.auth.social;

import java.time.Instant;

public record UserIdentityDto(
        SocialAuthProviderName provider,
        String providerEmail,
        Instant connectedAt
) {
}
