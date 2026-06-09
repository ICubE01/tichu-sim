package com.icube.sim.tichu.auth.social;

import com.icube.sim.tichu.auth.jwt.JwtIssueResult;

public record SocialLoginResult(JwtIssueResult jwtIssueResult, boolean created) {}
