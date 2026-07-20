package com.example.demo.service;

import com.example.demo.dao.UserDao;
import com.example.demo.dto.UserResponse;
import com.example.demo.entity.User;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class UserService {
    private final UserDao userDao;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.invite-code}")
    private String requiredInviteCode;

    @Autowired
    public UserService(UserDao userDao, PasswordEncoder passwordEncoder) {
        this.userDao = userDao;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Validation order below (username taken, then invite code) intentionally matches the
     * frontend's display priority, so a request that fails multiple checks reports the
     * same single message a human would expect first, regardless of entry point (UI or API).
     */
    @Transactional
    public UserResponse register(String username, String password, String inviteCode) {
        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username and password are required");
        }

        if (userDao.findByUsername(username).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
        }

        if (inviteCode == null || !inviteCode.equals(requiredInviteCode)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid invite code");
        }

        User user = new User(username, passwordEncoder.encode(password), LocalDateTime.now());
        userDao.save(user);
        return toResponse(user);
    }

    @Transactional(readOnly = true)
    public boolean isUsernameTaken(String username) {
        return username != null && userDao.findByUsername(username).isPresent();
    }

    @Transactional(readOnly = true)
    public UserResponse findByUsername(String username) {
        return toResponse(userDao.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found")));
    }

    @Transactional(readOnly = true)
    public UserResponse findById(Long id) {
        return toResponse(userDao.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found")));
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getCreatedAt());
    }
}
