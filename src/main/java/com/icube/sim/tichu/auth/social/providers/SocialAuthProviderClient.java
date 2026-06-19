package com.icube.sim.tichu.auth.social.providers;

import com.icube.sim.tichu.auth.social.SocialAuthProviderName;
import com.icube.sim.tichu.auth.social.SocialAuthUrlResponse;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;

public interface SocialAuthProviderClient {
    SocialAuthProviderName provider();
    SocialAuthUrlResponse getAuthorizationUrl();
    OidcIdToken fetchIdToken(String code, String state);
}
