package citu.stde.security;

import citu.stde.entity.User;
import citu.stde.entity.UserType;
import citu.stde.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public OAuth2LoginSuccessHandler(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        
        // Extract user information from Google
        String email = oAuth2User.getAttribute("email");
        String firstName = oAuth2User.getAttribute("given_name");
        String lastName = oAuth2User.getAttribute("family_name");
        String picture = oAuth2User.getAttribute("picture");
        
        // DEBUG: Print ALL cookies
        System.out.println("=== ALL COOKIES ===");
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                System.out.println("Cookie: " + cookie.getName() + " = " + cookie.getValue());
            }
        } else {
            System.out.println("NO COOKIES FOUND!");
        }
        
        // Get login type from cookie
        String loginPage = "student"; // Default
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("oauthLoginType".equals(cookie.getName())) {
                    loginPage = cookie.getValue();
                    System.out.println("FOUND oauthLoginType cookie: " + loginPage);
                    // Delete the cookie after reading
                    cookie.setMaxAge(0);
                    cookie.setPath("/");
                    response.addCookie(cookie);
                    break;
                }
            }
        }
        
        System.out.println("=== OAUTH DEBUG ===");
        System.out.println("Email: " + email);
        System.out.println("Login page from cookie: " + loginPage);
        
        // Check if user exists
        Optional<User> existingUser = userRepository.findByEmail(email);
        User user;
        
        if (existingUser.isPresent()) {
            user = existingUser.get();
            
            // ROLE VALIDATION
            String userRole = user.getUserType().name();
            
            System.out.println("User role from DB: " + userRole);
            System.out.println("Expected login page: " + loginPage);
            
            if (loginPage.equals("student") && !userRole.equals("STUDENT")) {
                System.out.println("BLOCKING: TEACHER trying to use student login");
                String errorRedirect = "http://localhost:5173/login/student?error=" + 
                    URLEncoder.encode("This account is registered as a teacher. Please use the teacher login page.", StandardCharsets.UTF_8);
                response.sendRedirect(errorRedirect);
                return;
            } else if (loginPage.equals("teacher") && !userRole.equals("TEACHER")) {
                System.out.println("BLOCKING: STUDENT trying to use teacher login");
                String errorRedirect = "http://localhost:5173/login/teacher?error=" + 
                    URLEncoder.encode("This account is registered as a student. Please use the student login page.", StandardCharsets.UTF_8);
                response.sendRedirect(errorRedirect);
                return;
            }
            
            System.out.println("Role validation PASSED");
            
        } else {
            // Create new user
            user = new User();
            user.setEmail(email);
            user.setFirstname(firstName);
            user.setLastname(lastName);
            user.setPassword("");
            
            if (loginPage.equals("teacher")) {
                user.setUserType(UserType.TEACHER);
            } else {
                user.setUserType(UserType.STUDENT);
            }
            
            System.out.println("Creating NEW user with role: " + user.getUserType());
            user = userRepository.save(user);
        }
        
        // Generate JWT token
        String token = jwtUtil.generateToken(
            user.getEmail(),
            user.getId().toString(),
            user.getUserType().name()
        );
        
        // Redirect to frontend
        String redirectUrl = String.format(
            "http://localhost:5173/auth/callback?token=%s&userId=%s&userType=%s&firstname=%s&lastname=%s&email=%s&avatarUrl=%s",
            token,
            user.getId().toString(),
            user.getUserType().name(),
            URLEncoder.encode(user.getFirstname(), StandardCharsets.UTF_8),
            URLEncoder.encode(user.getLastname(), StandardCharsets.UTF_8),
            URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8),
            URLEncoder.encode(picture != null ? picture : "", StandardCharsets.UTF_8)
        );
        
        System.out.println("Redirecting to: " + redirectUrl);
        System.out.println("=== END DEBUG ===");
        
        response.sendRedirect(redirectUrl);
    }
}