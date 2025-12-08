package citu.stde;

import citu.stde.entity.User;
import citu.stde.entity.UserType;
import citu.stde.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;

@SpringBootApplication
public class SoftwareTestDocumentEvaluatorApplication {

	public static void main(String[] args) {
		SpringApplication.run(SoftwareTestDocumentEvaluatorApplication.class, args);
		System.out.println("-----------------------------------");
		System.out.println("Backend started successfully");
		System.out.println("-----------------------------------");
	}

	@Bean
	public CommandLineRunner initializeAdmin(UserRepository userRepository, PasswordEncoder passwordEncoder) {
		return args -> {
			final String adminEmail = "admin@stde.com";
			final String defaultPassword = "ADMIN"; // As requested
			
			// Check if Admin exists using the UserRepository
			if (!userRepository.existsByEmail(adminEmail)) {
				User admin = User.builder()
						.firstname("System")
						.lastname("Admin")
						.email(adminEmail)
						.password(passwordEncoder.encode(defaultPassword)) // Encode the default password
						.userType(UserType.ADMIN)
						.isActive(true)
						.createdAt(Instant.now())
						.build();

				userRepository.save(admin);
				System.out.println("-----------------------------------");
				System.out.println("Default Admin User Created:");
				System.out.println("Email: " + adminEmail);
				System.out.println("Password: " + defaultPassword);
				System.out.println("-----------------------------------");
			}
		};
	}
}