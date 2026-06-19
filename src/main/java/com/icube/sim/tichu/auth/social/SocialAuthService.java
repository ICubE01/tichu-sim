package com.icube.sim.tichu.auth.social;

import com.icube.sim.tichu.auth.AuthService;
import com.icube.sim.tichu.auth.social.providers.OidcProviderClientRegistry;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@AllArgsConstructor
@Service
public class SocialAuthService {
    private final AuthService authService;
    private final UserIdentityService userIdentityService;
    private final OidcProviderClientRegistry oidcProviderClientRegistry;

    public SocialAuthUrlResponse getAuthorizationUrl(OidcProviderName provider) {
        return oidcProviderClientRegistry.get(provider).getAuthorizationUrl();
    }

    public SocialLoginResult socialLogin(OidcProviderName provider, SocialAuthRequest request) {
        var idToken = oidcProviderClientRegistry.get(provider).fetchIdToken(request.code(), request.state());
        var findOrCreateResult = userIdentityService.findOrCreateUser(provider, idToken);
        var jwtIssueResult = authService.issueTokens(findOrCreateResult.user());
        return new SocialLoginResult(jwtIssueResult, findOrCreateResult.created());
    }

    public void connectProvider(OidcProviderName provider, SocialAuthRequest request) {
        var currentUserId = authService.getCurrentUserId();
        var idToken = oidcProviderClientRegistry.get(provider).fetchIdToken(request.code(), request.state());
        userIdentityService.connectIdentity(currentUserId, provider, idToken);
    }

    public void disconnectProvider(OidcProviderName provider) {
        userIdentityService.disconnectIdentity(authService.getCurrentUserId(), provider);
    }
}
