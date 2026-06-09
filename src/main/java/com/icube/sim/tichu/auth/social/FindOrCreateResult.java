package com.icube.sim.tichu.auth.social;

import com.icube.sim.tichu.users.User;

public record FindOrCreateResult(User user, boolean created) {}
