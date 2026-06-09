package com.icube.sim.tichu.auth.social;

import com.icube.sim.tichu.auth.AuthService;
import com.icube.sim.tichu.auth.jwt.JwtIssueResult;
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

    public List<ConnectedIdentityResponse> getConnectedIdentities() {
        return userIdentityService.getIdentities(authService.getCurrentUserId());
    }

    public SocialAuthUrlResponse getAuthorizationUrl(OidcProviderName provider) {
        return oidcProviderClientRegistry.get(provider).getAuthorizationUrl();
    }

    public JwtIssueResult socialLogin(OidcProviderName provider, SocialAuthRequest request) {
        var idToken = oidcProviderClientRegistry.get(provider).fetchIdToken(request.code(), request.state());
        var user = userIdentityService.findOrCreateUser(provider, idToken);
        return authService.issueTokens(user);
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
