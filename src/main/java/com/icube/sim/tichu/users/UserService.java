package com.icube.sim.tichu.users;

import lombok.AllArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@AllArgsConstructor
@Service
public class UserService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public UserDto getUser(long id) {
        return userMapper.toDto(userRepository.findById(id).orElseThrow());
    }

    public UserDto register(RegisterUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateUserException();
        }

        var user = userMapper.toEntity(request);
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        userRepository.save(user);

        return userMapper.toDto(user);
    }

    public void updateName(long userId, String name) {
        var user = userRepository.findById(userId).orElseThrow();
        user.setName(name);
        userRepository.save(user);
    }

    public void updatePassword(long userId, UpdatePasswordRequest request) {
        var user = userRepository.findById(userId).orElseThrow();
        if (user.getPassword() == null) {
            throw new NoPasswordException();
        }
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new WrongPasswordException();
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }
}
