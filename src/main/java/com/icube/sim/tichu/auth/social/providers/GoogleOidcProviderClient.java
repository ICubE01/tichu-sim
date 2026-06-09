package com.icube.sim.tichu.auth.social.providers;

import com.icube.sim.tichu.auth.social.OidcProviderName;
import com.icube.sim.tichu.auth.social.SocialAuthUrlResponse;
import org.springframework.security.oauth2.client.endpoint.OAuth2AccessTokenResponseClient;
import org.springframework.security.oauth2.client.endpoint.OAuth2AuthorizationCodeGrantRequest;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.core.OAuth2AuthorizationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationExchange;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationResponse;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.endpoint.OidcParameterNames;
import org.springframework.security.oauth2.jwt.JwtDecoderFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.UUID;

@Service
public class GoogleOidcProviderClient implements OidcProviderClient {
    private final ClientRegistration clientRegistration;
    private final OAuth2AccessTokenResponseClient<OAuth2AuthorizationCodeGrantRequest> tokenResponseClient;
    private final JwtDecoderFactory<ClientRegistration> idTokenDecoderFactory;
    private final OidcStateStore stateStore;

    public GoogleOidcProviderClient(
            ClientRegistrationRepository clientRegistrationRepository,
            OAuth2AccessTokenResponseClient<OAuth2AuthorizationCodeGrantRequest> tokenResponseClient,
            JwtDecoderFactory<ClientRegistration> idTokenDecoderFactory,
            OidcStateStore stateStore
    ) {
        this.clientRegistration = clientRegistrationRepository.findByRegistrationId("google");
        this.tokenResponseClient = tokenResponseClient;
        this.idTokenDecoderFactory = idTokenDecoderFactory;
        this.stateStore = stateStore;
    }

    @Override
    public OidcProviderName provider() {
        return OidcProviderName.GOOGLE;
    }

    @Override
    public SocialAuthUrlResponse getAuthorizationUrl() {
        var state = UUID.randomUUID().toString();
        var rawNonce = UUID.randomUUID().toString();
        stateStore.save(state, rawNonce);
        var url = UriComponentsBuilder.fromUriString(clientRegistration.getProviderDetails().getAuthorizationUri())
                .queryParam("client_id", clientRegistration.getClientId())
                .queryParam("response_type", "code")
                .queryParam("scope", String.join(" ", clientRegistration.getScopes()))
                .queryParam("redirect_uri", clientRegistration.getRedirectUri())
                .queryParam("state", state)
                .queryParam("nonce", sha256(rawNonce))
                .toUriString();
        return new SocialAuthUrlResponse(url, state);
    }

    @Override
    public OidcIdToken fetchIdToken(String code, String state) {
        var rawNonce = stateStore.consume(state)
                .orElseThrow(() -> new OAuth2AuthorizationException(new OAuth2Error("invalid_state")));

        var idToken = exchangeCodeForIdToken(clientRegistration, code);

        if (!sha256(rawNonce).equals(idToken.getNonce())) {
            throw new OAuth2AuthorizationException(new OAuth2Error("invalid_nonce"));
        }
        if (!Boolean.TRUE.equals(idToken.getEmailVerified())) {
            throw new OAuth2AuthorizationException(new OAuth2Error("email_not_verified"));
        }

        return idToken;
    }

    private OidcIdToken exchangeCodeForIdToken(ClientRegistration reg, String code) {
        var authorizationRequest = OAuth2AuthorizationRequest.authorizationCode()
                .clientId(reg.getClientId())
                .authorizationUri(reg.getProviderDetails().getAuthorizationUri())
                .redirectUri(reg.getRedirectUri())
                .build();

        var authorizationResponse = OAuth2AuthorizationResponse.success(code)
                .redirectUri(reg.getRedirectUri())
                .build();

        var grantRequest = new OAuth2AuthorizationCodeGrantRequest(
                reg, new OAuth2AuthorizationExchange(authorizationRequest, authorizationResponse));

        var tokenResponse = tokenResponseClient.getTokenResponse(grantRequest);

        var idTokenValue = (String) tokenResponse.getAdditionalParameters().get(OidcParameterNames.ID_TOKEN);
        if (idTokenValue == null) {
            throw new OAuth2AuthorizationException(new OAuth2Error("missing_id_token"));
        }
        var jwt = idTokenDecoderFactory.createDecoder(reg).decode(idTokenValue);
        return new OidcIdToken(jwt.getTokenValue(), jwt.getIssuedAt(), jwt.getExpiresAt(), jwt.getClaims());
    }

    private static String sha256(String value) {
        try {
            var hash = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
