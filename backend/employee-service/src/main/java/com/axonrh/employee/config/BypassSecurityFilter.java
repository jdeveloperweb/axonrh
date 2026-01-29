package com.axonrh.employee.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Slf4j
public class BypassSecurityFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        log.warn(">>> [DEBUG-BYPASS] FORCING AUTHENTICATION for {}", request.getRequestURI());
        
        TestingAuthenticationToken auth = new TestingAuthenticationToken(
                "debug-user", 
                "password", 
                "ROLE_ADMIN", "EMPLOYEE:READ", "EMPLOYEE:WRITE"
        );
        auth.setAuthenticated(true);
        
        SecurityContextHolder.getContext().setAuthentication(auth);
        
        log.warn(">>> [DEBUG-BYPASS] SecurityContext populated: {}", SecurityContextHolder.getContext().getAuthentication());
        
        filterChain.doFilter(request, response);
    }
}
