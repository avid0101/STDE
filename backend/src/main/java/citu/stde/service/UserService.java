package citu.stde.service;

import citu.stde.entity.User;
import citu.stde.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
}