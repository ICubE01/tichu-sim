package com.icube.sim.tichu.auth.social.providers;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.icube.sim.tichu.auth.social.EmailNotVerifiedException;
import com.icube.sim.tichu.auth.social.SocialAuthProviderName;
import com.icube.sim.tichu.auth.social.SocialAuthUrlResponse;
import com.icube.sim.tichu.auth.social.SocialAuthUserInfo;
import org.springframework.security.oauth2.client.endpoint.OAuth2AccessTokenResponseClient;
import org.springframework.security.oauth2.client.endpoint.OAuth2AuthorizationCodeGrantRequest;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.core.OAuth2AuthorizationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.endpoint.OAuth2AccessTokenResponse;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationExchange;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationResponse;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.endpoint.OidcParameterNames;
import org.springframework.security.oauth2.jwt.JwtDecoderFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.UUID;

@Service
public class KakaoOidcProviderClient implements SocialAuthProviderClient {
    private final ClientRegistration clientRegistration;
    private final OAuth2AccessTokenResponseClient<OAuth2AuthorizationCodeGrantRequest> tokenResponseClient;
    private final JwtDecoderFactory<ClientRegistration> idTokenDecoderFactory;
    private final OidcStateStore stateStore;
    private final RestClient restClient;
    // Kakao does not include an email-verification claim in its OIDC ID token, so we call the
    // classic user API (configured as user-info-uri), which exposes is_email_verified / is_email_valid.
    private final String userInfoUri;

    public KakaoOidcProviderClient(
            ClientRegistrationRepository clientRegistrationRepository,
            OAuth2AccessTokenResponseClient<OAuth2AuthorizationCodeGrantRequest> tokenResponseClient,
            JwtDecoderFactory<ClientRegistration> idTokenDecoderFactory,
            OidcStateStore stateStore
    ) {
        this.clientRegistration = clientRegistrationRepository.findByRegistrationId("kakao");
        this.tokenResponseClient = tokenResponseClient;
        this.idTokenDecoderFactory = idTokenDecoderFactory;
        this.stateStore = stateStore;
        this.restClient = RestClient.create();
        this.userInfoUri = clientRegistration.getProviderDetails().getUserInfoEndpoint().getUri();
    }

    @Override
    public SocialAuthProviderName provider() {
        return SocialAuthProviderName.KAKAO;
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
                .queryParam("nonce", rawNonce)
                .toUriString();
        return new SocialAuthUrlResponse(url, state);
    }

    @Override
    public SocialAuthUserInfo fetchUserInfo(String code, String state) {
        var rawNonce = stateStore.consume(state)
                .orElseThrow(() -> new OAuth2AuthorizationException(new OAuth2Error("invalid_state")));

        var tokenResponse = exchangeCodeForTokens(clientRegistration, code);
        var idToken = decodeIdToken(clientRegistration, tokenResponse);

        if (!rawNonce.equals(idToken.getNonce())) {
            throw new OAuth2AuthorizationException(new OAuth2Error("invalid_nonce"));
        }

        var subject = idToken.getSubject();
        if (subject == null) {
            throw new OAuth2AuthorizationException(new OAuth2Error("missing_subject"));
        }
        var email = idToken.getEmail();
        if (email == null || email.isBlank()) {
            throw new OAuth2AuthorizationException(new OAuth2Error("missing_email"));
        }

        verifyEmailOwnership(tokenResponse.getAccessToken().getTokenValue());

        return new SocialAuthUserInfo(subject, email, resolveName(idToken, email));
    }

    private OAuth2AccessTokenResponse exchangeCodeForTokens(ClientRegistration reg, String code) {
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

        return tokenResponseClient.getTokenResponse(grantRequest);
    }

    private OidcIdToken decodeIdToken(ClientRegistration reg, OAuth2AccessTokenResponse tokenResponse) {
        var idTokenValue = (String) tokenResponse.getAdditionalParameters().get(OidcParameterNames.ID_TOKEN);
        if (idTokenValue == null) {
            throw new OAuth2AuthorizationException(new OAuth2Error("missing_id_token"));
        }
        var jwt = idTokenDecoderFactory.createDecoder(reg).decode(idTokenValue);
        return new OidcIdToken(jwt.getTokenValue(), jwt.getIssuedAt(), jwt.getExpiresAt(), jwt.getClaims());
    }

    private void verifyEmailOwnership(String accessToken) {
        var response = restClient.get()
                .uri(userInfoUri)
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .body(KakaoUserInfoResponse.class);

        if (response == null || response.kakaoAccount() == null) {
            throw new OAuth2AuthorizationException(new OAuth2Error("user_info_fetch_failed"));
        }
        var account = response.kakaoAccount();
        if (!Boolean.TRUE.equals(account.isEmailValid()) || !Boolean.TRUE.equals(account.isEmailVerified())) {
            throw new EmailNotVerifiedException();
        }
    }

    private static String resolveName(OidcIdToken idToken, String email) {
        var name = idToken.getNickName();
        if (name == null || name.isBlank()) {
            name = email.split("@")[0];
        }
        return name;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record KakaoUserInfoResponse(
            @JsonProperty("kakao_account") KakaoAccount kakaoAccount
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record KakaoAccount(
            @JsonProperty("is_email_valid") Boolean isEmailValid,
            @JsonProperty("is_email_verified") Boolean isEmailVerified
    ) {}
}
