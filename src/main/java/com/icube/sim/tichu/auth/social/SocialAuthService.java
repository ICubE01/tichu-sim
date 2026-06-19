package com.icube.sim.tichu.auth.social;

import com.icube.sim.tichu.auth.AuthService;
import com.icube.sim.tichu.auth.social.providers.SocialAuthProviderClientRegistry;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@AllArgsConstructor
@Service
public class SocialAuthService {
    private final AuthService authService;
    private final UserIdentityService userIdentityService;
    private final SocialAuthProviderClientRegistry socialAuthProviderClientRegistry;

    public SocialAuthUrlResponse getAuthorizationUrl(SocialAuthProviderName provider) {
        return socialAuthProviderClientRegistry.get(provider).getAuthorizationUrl();
    }

    public SocialLoginResult socialLogin(SocialAuthProviderName provider, SocialAuthRequest request) {
        var userInfo = socialAuthProviderClientRegistry.get(provider).fetchUserInfo(request.code(), request.state());
        var findOrCreateResult = userIdentityService.findOrCreateUser(provider, userInfo);
        var jwtIssueResult = authService.issueTokens(findOrCreateResult.user());
        return new SocialLoginResult(jwtIssueResult, findOrCreateResult.created());
    }

    public void connectProvider(SocialAuthProviderName provider, SocialAuthRequest request) {
        var currentUserId = authService.getCurrentUserId();
        var userInfo = socialAuthProviderClientRegistry.get(provider).fetchUserInfo(request.code(), request.state());
        userIdentityService.connectIdentity(currentUserId, provider, userInfo);
    }

    public void disconnectProvider(SocialAuthProviderName provider) {
        userIdentityService.disconnectIdentity(authService.getCurrentUserId(), provider);
    }
}
