package com.example.demo.service;

import com.example.demo.dao.UserDao;
import com.example.demo.dto.UserResponse;
import com.example.demo.entity.User;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.session.FindByIndexNameSessionRepository;
import org.springframework.session.Session;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class UserService {
    private final UserDao userDao;
    private final PasswordEncoder passwordEncoder;
    private final FindByIndexNameSessionRepository<? extends Session> sessionRepository;

    @Value("${app.invite-code}")
    private String requiredInviteCode;

    @Value("${app.admin-key}")
    private String adminKey;

    @Autowired
    public UserService(UserDao userDao, PasswordEncoder passwordEncoder,
                       FindByIndexNameSessionRepository<? extends Session> sessionRepository) {
        this.userDao = userDao;
        this.passwordEncoder = passwordEncoder;
        this.sessionRepository = sessionRepository;
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

    /**
     * Admin-key-gated password reset. Also deletes the user's sessions, so anyone still logged
     * in as them (e.g. whoever the reset is locking out) has to log in with the new password.
     */
    @Transactional
    public void adminResetPassword(String providedAdminKey, String username, String newPassword) {
        if (!isValidAdminKey(providedAdminKey)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid admin key");
        }

        if (username == null || username.isBlank() || newPassword == null || newPassword.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username and newPassword are required");
        }

        User user = userDao.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setPassword(passwordEncoder.encode(newPassword));

        sessionRepository.findByPrincipalName(username).keySet()
                .forEach(sessionRepository::deleteById);
    }

    /** Constant-time comparison so response timing can't be used to guess the key. */
    private boolean isValidAdminKey(String providedAdminKey) {
        if (adminKey == null || adminKey.isBlank() || providedAdminKey == null) {
            return false;
        }
        return MessageDigest.isEqual(
                providedAdminKey.getBytes(StandardCharsets.UTF_8),
                adminKey.getBytes(StandardCharsets.UTF_8));
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
