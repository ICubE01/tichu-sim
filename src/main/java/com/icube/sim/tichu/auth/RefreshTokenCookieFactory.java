package com.icube.sim.tichu.auth;

import com.icube.sim.tichu.auth.jwt.JwtConfig;
import com.icube.sim.tichu.auth.jwt.JwtIssueResult;
import jakarta.servlet.http.Cookie;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;

@AllArgsConstructor
@Component
public class RefreshTokenCookieFactory {
    public static final String COOKIE_NAME = "refresh_token";

    private final JwtConfig jwtConfig;

    public Cookie create(JwtIssueResult result) {
        var cookie = new Cookie(COOKIE_NAME, result.getRefreshToken().toString());
        cookie.setHttpOnly(true);
        cookie.setPath("/api/auth/refresh");
        cookie.setMaxAge(jwtConfig.getRefreshTokenExpiration());
        cookie.setSecure(true);
        return cookie;
    }

    public Cookie createExpired() {
        var cookie = new Cookie(COOKIE_NAME, "");
        cookie.setHttpOnly(true);
        cookie.setPath("/api/auth/refresh");
        cookie.setMaxAge(0);
        cookie.setSecure(true);
        return cookie;
    }
}
