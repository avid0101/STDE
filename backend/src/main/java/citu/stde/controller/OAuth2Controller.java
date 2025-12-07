package citu.stde.controller;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

@RestController
@RequestMapping("/api/oauth2")
public class OAuth2Controller {

    @GetMapping("/login/{loginType}")
    public RedirectView initiateOAuth2Login(
            @PathVariable String loginType,
            HttpServletResponse response) {
        
        // Store login type in a cookie that will survive the OAuth redirect
        Cookie loginTypeCookie = new Cookie("oauthLoginType", loginType);
        loginTypeCookie.setPath("/");
        loginTypeCookie.setMaxAge(300); // 5 minutes (enough for OAuth flow)
        loginTypeCookie.setHttpOnly(true);
        loginTypeCookie.setSecure(false); // Set to true in production with HTTPS
        response.addCookie(loginTypeCookie);
        
        System.out.println("=== Setting OAuth login type cookie: " + loginType + " ===");
        
        // Redirect to Spring Security's OAuth2 endpoint
        return new RedirectView("/oauth2/authorization/google");
    }
}