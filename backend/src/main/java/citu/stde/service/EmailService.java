package citu.stde.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    // Reads the username from your secrets/properties file
    @Value("${spring.mail.username}")
    private String fromEmail;

    @Async // Sends email in background so the user doesn't wait
    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Reset Your Password - STDE Platform");
        
        message.setText("Hello,\n\n" +
                "You have requested to reset your password.\n" +
                "Click the link below to change your password:\n\n" +
                resetLink + "\n\n" +
                "This link will expire in 15 minutes.\n" +
                "If you did not request this, please ignore this email.");

        mailSender.send(message);
    }
}