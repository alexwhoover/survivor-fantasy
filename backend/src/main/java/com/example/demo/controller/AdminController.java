package com.example.demo.controller;

import com.example.demo.dto.ResetPasswordRequest;
import com.example.demo.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * Site-admin operations, authorized by the APP_ADMIN_KEY secret sent in the X-Admin-Key header
 * rather than by a session — there is no site-admin user role.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final UserService userService;

    @Autowired
    public AdminController(UserService userService) {
        this.userService = userService;
    }

    /** Sets a new password for any user and logs them out of every existing session. */
    @PostMapping("/reset-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
                              @RequestBody ResetPasswordRequest request) {
        userService.adminResetPassword(adminKey, request.username(), request.newPassword());
    }
}
