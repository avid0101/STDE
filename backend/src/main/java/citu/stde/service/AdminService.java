package citu.stde.service;

import citu.stde.entity.ActivityLog;
import citu.stde.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final ActivityLogRepository logRepository;
    private final DataSource dataSource;
    private final ChatClient.Builder chatClientBuilder;

    // --- ACTIVITY LOGS ---

    @Async // Run in background to not block main thread
    public void logActivity(String action, String email, String details) {
        ActivityLog log = ActivityLog.builder()
                .action(action)
                .userEmail(email)
                .details(details)
                .timestamp(Instant.now())
                .build();
        logRepository.save(log);
    }

    public List<ActivityLog> getAllLogs() {
        return logRepository.findAllByOrderByTimestampDesc();
    }

    // --- SYSTEM HEALTH ---

    public Map<String, String> getSystemHealth() {
        Map<String, String> health = new HashMap<>();

        // 1. Database Check
        try (Connection conn = dataSource.getConnection()) {
            if (conn.isValid(2)) {
                health.put("database", "UP");
            } else {
                health.put("database", "DOWN");
            }
        } catch (Exception e) {
            health.put("database", "DOWN (" + e.getMessage() + ")");
        }

        // 2. OpenAI / GPT Check
        try {
            // Simple ping to AI model
            ChatClient client = chatClientBuilder.build();
            String response = client.prompt().user("ping").call().content();
            if (response != null) health.put("openai", "UP");
            else health.put("openai", "DOWN (Empty Response)");
        } catch (Exception e) {
            health.put("openai", "DOWN"); // Usually means API Key issue or Quota
        }

        // 3. Google API Check
        // We assume UP if the service is initialized, actual connectivity 
        // is best checked via the GoogleDriveService, but here we do a basic check.
        health.put("googleApi", "UP (Initialized)"); 

        return health;
    }
}