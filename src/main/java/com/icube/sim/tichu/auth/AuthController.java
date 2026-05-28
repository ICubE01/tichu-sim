package com.icube.sim.tichu.auth;

import com.icube.sim.tichu.auth.jwt.JwtConfig;
import com.icube.sim.tichu.auth.jwt.JwtIssueResult;
import com.icube.sim.tichu.auth.jwt.JwtResponse;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.*;

@AllArgsConstructor
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final String REFRESH_TOKEN_COOKIE_NAME = "refresh_token";

    private final JwtConfig jwtConfig;
    private final AuthService authService;

    @PostMapping("/login")
    public JwtResponse login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response
    ) {
        var jwtIssueResult = authService.login(request);

        var cookie = createRefreshTokenCookie(jwtIssueResult);
        response.addCookie(cookie);

        return new JwtResponse(jwtIssueResult.getAccessToken().toString());
    }

    @PostMapping("/refresh")
    public JwtResponse refresh(
            @CookieValue(value = REFRESH_TOKEN_COOKIE_NAME) String refreshToken,
            HttpServletResponse response
    ) {
        var jwtIssueResult = authService.refreshTokens(refreshToken);

        var cookie = createRefreshTokenCookie(jwtIssueResult);
        response.addCookie(cookie);

        return new JwtResponse(jwtIssueResult.getAccessToken().toString());
    }

    private Cookie createRefreshTokenCookie(JwtIssueResult jwtIssueResult) {
        var cookie = new Cookie(REFRESH_TOKEN_COOKIE_NAME, jwtIssueResult.getRefreshToken().toString());
        cookie.setHttpOnly(true);
        cookie.setPath("/api/auth/refresh");
        cookie.setMaxAge(jwtConfig.getRefreshTokenExpiration());
        cookie.setSecure(true);
        return cookie;
    }

    @PostMapping("/logout")
    public ResponseEntity<@NonNull Void> logout(
            @CookieValue(value = REFRESH_TOKEN_COOKIE_NAME, required = false) String refreshToken,
            HttpServletResponse response
    ) {
        authService.logout(refreshToken);

        var cookie = new Cookie(REFRESH_TOKEN_COOKIE_NAME, "");
        cookie.setHttpOnly(true);
        cookie.setPath("/api/auth/refresh");
        cookie.setMaxAge(0);
        cookie.setSecure(true);
        response.addCookie(cookie);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public MeResponse getMe() {
        var user = authService.getCurrentUser();
        return new MeResponse(user.getId(), user.getName(), user.getRole());
    }

    @GetMapping("/issue/web-socket-token")
    public JwtResponse issueWebSocketToken() {
        var webSocketToken = authService.issueWebSocketToken();
        return new JwtResponse(webSocketToken.toString());
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<@NonNull Void> handleBadCredentials() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
}
