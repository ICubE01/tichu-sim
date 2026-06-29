package com.icube.sim.tichu.auth.social.providers;

import com.icube.sim.tichu.auth.social.SocialAuthProviderName;
import com.icube.sim.tichu.auth.social.SocialAuthUrlResponse;
import com.icube.sim.tichu.auth.social.SocialAuthUserInfo;

public interface SocialAuthProviderClient {
    SocialAuthProviderName provider();
    SocialAuthUrlResponse getAuthorizationUrl();
    SocialAuthUserInfo fetchUserInfo(String code, String state);
}
