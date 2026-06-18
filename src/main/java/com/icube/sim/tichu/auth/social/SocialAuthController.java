package com.icube.sim.tichu.auth.social;

import com.icube.sim.tichu.auth.RefreshTokenCookieFactory;
import com.icube.sim.tichu.auth.jwt.JwtResponse;
import com.icube.sim.tichu.auth.social.providers.UnknownProviderException;
import com.icube.sim.tichu.common.ErrorDto;

import java.util.List;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.oauth2.core.OAuth2AuthorizationException;
import org.springframework.web.bind.annotation.*;

@AllArgsConstructor
@RestController
@RequestMapping("/api/auth/social")
public class SocialAuthController {
    private final RefreshTokenCookieFactory refreshTokenCookieFactory;
    private final SocialAuthService socialAuthService;

    @GetMapping
    public List<UserIdentityDto> getConnectedIdentities() {
        return socialAuthService.getConnectedIdentities();
    }

    @GetMapping("/{provider}/url")
    public SocialAuthUrlResponse getAuthorizationUrl(@PathVariable String provider) {
        return socialAuthService.getAuthorizationUrl(parseProvider(provider));
    }

    @PostMapping("/{provider}/login")
    public ResponseEntity<JwtResponse> socialLogin(
            @PathVariable String provider,
            @Valid @RequestBody SocialAuthRequest request,
            HttpServletResponse response
    ) {
        var result = socialAuthService.socialLogin(parseProvider(provider), request);

        response.addCookie(refreshTokenCookieFactory.create(result.jwtIssueResult()));
        var status = result.created() ? HttpStatus.CREATED : HttpStatus.OK;
        var body = new JwtResponse(result.jwtIssueResult().getAccessToken().toString());
        return ResponseEntity.status(status).body(body);
    }

    @PostMapping("/{provider}/connect")
    public ResponseEntity<Void> connectProvider(
            @PathVariable String provider,
            @Valid @RequestBody SocialAuthRequest request
    ) {
        socialAuthService.connectProvider(parseProvider(provider), request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{provider}")
    public ResponseEntity<Void> disconnectProvider(@PathVariable String provider) {
        socialAuthService.disconnectProvider(parseProvider(provider));
        return ResponseEntity.noContent().build();
    }

    private OidcProviderName parseProvider(String provider) {
        try {
            return OidcProviderName.valueOf(provider.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new UnknownProviderException();
        }
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Void> handleBadCredentials() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    @ExceptionHandler(OAuth2AuthorizationException.class)
    public ResponseEntity<ErrorDto> handleOAuthError(OAuth2AuthorizationException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorDto(e.getError().getErrorCode()));
    }

    @ExceptionHandler(UnknownProviderException.class)
    public ResponseEntity<ErrorDto> handleUnknownProvider() {
        return ResponseEntity.badRequest().body(new ErrorDto("Unknown provider."));
    }

    @ExceptionHandler(EmailConflictException.class)
    public ResponseEntity<ErrorDto> handleEmailConflict() {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ErrorDto(
                "An account with this email already exists. Log in and connect from account settings."));
    }

    @ExceptionHandler(IdentityConflictException.class)
    public ResponseEntity<ErrorDto> handleIdentityConflict() {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ErrorDto(
                "This social account is already linked to another user."));
    }

    @ExceptionHandler(ProviderAlreadyConnectedException.class)
    public ResponseEntity<ErrorDto> handleProviderAlreadyConnected() {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ErrorDto(
                "This provider is already connected to your account."));
    }

    @ExceptionHandler(LastLoginMethodException.class)
    public ResponseEntity<ErrorDto> handleLastLoginMethod() {
        return ResponseEntity.badRequest().body(new ErrorDto(
                "Cannot remove your only login method."));
    }
}
