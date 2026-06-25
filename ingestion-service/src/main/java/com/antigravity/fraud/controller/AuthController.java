package com.antigravity.fraud.controller;

import com.antigravity.fraud.domain.User;
import com.antigravity.fraud.repository.UserRepository;
import com.antigravity.fraud.service.EncryptionService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EncryptionService encryptionService;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username already exists");
        }

        User user = User.builder()
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .encryptedEmail(encryptionService.encrypt(request.getEmail()))
                .encryptedPhone(encryptionService.encrypt(request.getPhone()))
                .role(User.Role.USER)
                .build();

        userRepository.save(user);
        return ResponseEntity.ok("User registered successfully. PII data has been encrypted.");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        return userRepository.findByUsername(request.getUsername())
                .filter(u -> passwordEncoder.matches(request.getPassword(), u.getPasswordHash()))
                .map(u -> {
                    java.util.Map<String, Object> response = new java.util.HashMap<>();
                    response.put("id", u.getId());
                    response.put("username", u.getUsername());
                    response.put("role", u.getRole().toString());
                    response.put("message", "Login successful");
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.status(401).body(java.util.Map.of("error", "Invalid credentials")));
    }

    @Data
    public static class SignupRequest {
        private String username;
        private String password;
        private String email;
        private String phone;
    }

    @Data
    public static class LoginRequest {
        private String username;
        private String password;
    }
}
