package com.icube.sim.tichu.users;

import com.icube.sim.tichu.auth.AuthService;
import com.icube.sim.tichu.auth.social.UserIdentityService;
import com.icube.sim.tichu.common.ErrorDto;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@AllArgsConstructor
@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;
    private final AuthService authService;
    private final UserIdentityService userIdentityService;

    @GetMapping("/{id}")
    public ResponseEntity<AccountDto> getUserAccount(@PathVariable long id) {
        var currentUserId = authService.getCurrentUserId();
        if (currentUserId != id) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        var user = userService.getUser(id);
        var identities = userIdentityService.getIdentities(id);
        return ResponseEntity.ok(new AccountDto(user, identities));
    }

    @PostMapping
    public UserDto register(@Valid @RequestBody RegisterUserRequest request) {
        return userService.register(request);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<@NonNull Void> updateUser(
            @PathVariable long id,
            @Valid @RequestBody UpdateUserRequest request
    ) {
        var currentUserId = authService.getCurrentUserId();
        if (currentUserId != id) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        userService.updateName(id, request.name());
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(DuplicateUserException.class)
    public ResponseEntity<@NonNull ErrorDto> handleDuplicateUser() {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ErrorDto(
                "The email is already registered."
        ));
    }
}
