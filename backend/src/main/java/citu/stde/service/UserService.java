package citu.stde.service;

import citu.stde.entity.User;
import citu.stde.entity.UserType;
import citu.stde.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional
    public User updateUserProfile(UUID userId, String firstname, String lastname) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (firstname != null && !firstname.isBlank()) {
            user.setFirstname(firstname);
        }
        if (lastname != null && !lastname.isBlank()) {
            user.setLastname(lastname);
        }
        
        user.setUpdatedAt(Instant.now());

        return userRepository.save(user);
    }

    // Admin function to get all users
    @Transactional(readOnly = true)
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // Admin function to update user role and active status
    @Transactional
    public User updateUserRoleAndStatus(UUID targetUserId, String newUserType, Boolean newStatus) {
        User user = userRepository.findById(targetUserId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // 1. Update User Type
        if (newUserType != null && !newUserType.isBlank()) {
            try {
                UserType type = UserType.valueOf(newUserType.toUpperCase());
                user.setUserType(type);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid user type: " + newUserType);
            }
        }
        
        // 2. Update Status
        if (newStatus != null) {
            user.setIsActive(newStatus);
        }
        
        user.setUpdatedAt(Instant.now());
        return userRepository.save(user);
    }
}