package com.icube.sim.tichu.auth.social.providers;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.icube.sim.tichu.auth.social.SocialAuthProviderName;
import com.icube.sim.tichu.auth.social.SocialAuthUrlResponse;
import com.icube.sim.tichu.auth.social.SocialAuthUserInfo;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.core.OAuth2AuthorizationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.UUID;

@Service
public class NaverOAuth2ProviderClient implements SocialAuthProviderClient {

    private final String clientId;
    private final String clientSecret;
    private final String redirectUri;
    private final String authorizationUri;
    private final String tokenUri;
    private final String userInfoUri;
    private final OidcStateStore stateStore;
    private final RestClient restClient;

    public NaverOAuth2ProviderClient(
            ClientRegistrationRepository clientRegistrationRepository,
            OidcStateStore stateStore
    ) {
        var registration = clientRegistrationRepository.findByRegistrationId("naver");
        this.clientId = registration.getClientId();
        this.clientSecret = registration.getClientSecret();
        this.redirectUri = registration.getRedirectUri();
        var provider = registration.getProviderDetails();
        this.authorizationUri = provider.getAuthorizationUri();
        this.tokenUri = provider.getTokenUri();
        this.userInfoUri = provider.getUserInfoEndpoint().getUri();
        this.stateStore = stateStore;
        this.restClient = RestClient.create();
    }

    @Override
    public SocialAuthProviderName provider() {
        return SocialAuthProviderName.NAVER;
    }

    @Override
    public SocialAuthUrlResponse getAuthorizationUrl() {
        var state = UUID.randomUUID().toString();
        stateStore.save(state, "");
        var url = UriComponentsBuilder.fromUriString(authorizationUri)
                .queryParam("response_type", "code")
                .queryParam("client_id", clientId)
                .queryParam("redirect_uri", redirectUri)
                .queryParam("state", state)
                .toUriString();
        return new SocialAuthUrlResponse(url, state);
    }

    @Override
    public SocialAuthUserInfo fetchUserInfo(String code, String state) {
        stateStore.consume(state)
                .orElseThrow(() -> new OAuth2AuthorizationException(new OAuth2Error("invalid_state")));

        var accessToken = exchangeCodeForAccessToken(code, state);
        return fetchNaverUserInfo(accessToken);
    }

    private String exchangeCodeForAccessToken(String code, String state) {
        var params = new LinkedMultiValueMap<String, String>();
        params.add("grant_type", "authorization_code");
        params.add("client_id", clientId);
        params.add("client_secret", clientSecret);
        params.add("code", code);
        params.add("state", state);

        var response = restClient.post()
                .uri(tokenUri)
                .body(params)
                .retrieve()
                .body(NaverTokenResponse.class);

        if (response == null || response.accessToken() == null) {
            throw new OAuth2AuthorizationException(new OAuth2Error("token_exchange_failed"));
        }
        return response.accessToken();
    }

    private SocialAuthUserInfo fetchNaverUserInfo(String accessToken) {
        var response = restClient.get()
                .uri(userInfoUri)
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .body(NaverUserInfoResponse.class);

        if (response == null || response.response() == null) {
            throw new OAuth2AuthorizationException(new OAuth2Error("user_info_fetch_failed"));
        }

        var profile = response.response();
        var id = profile.id();
        if (id == null) {
            throw new OAuth2AuthorizationException(new OAuth2Error("missing_subject"));
        }
        var email = profile.email();
        if (email == null || email.isBlank()) {
            throw new OAuth2AuthorizationException(new OAuth2Error("missing_email"));
        }

        return new SocialAuthUserInfo(id, email, resolveDisplayName(profile));
    }

    private static String resolveDisplayName(NaverUserProfile profile) {
        var name = profile.nickname();
        if (name == null || name.isBlank()) {
            name = profile.email() != null ? profile.email().split("@")[0] : profile.id();
        }
        return name;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record NaverTokenResponse(
            @JsonProperty("access_token") String accessToken
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record NaverUserInfoResponse(
            String resultcode,
            String message,
            NaverUserProfile response
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record NaverUserProfile(
            String id,
            String email,
            String nickname
    ) {}
}
