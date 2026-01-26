package com.axonrh.auth.repository;

import com.axonrh.auth.entity.LoginAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Repository para operacoes com tentativas de login.
 */
@Repository
public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, UUID> {

    @Query("SELECT COUNT(la) FROM LoginAttempt la WHERE la.email = :email AND la.success = false AND la.attemptedAt > :since")
    long countFailedAttemptsSince(@Param("email") String email, @Param("since") LocalDateTime since);

    @Query("SELECT COUNT(la) FROM LoginAttempt la WHERE la.ipAddress = :ip AND la.success = false AND la.attemptedAt > :since")
    long countFailedAttemptsByIpSince(@Param("ip") String ip, @Param("since") LocalDateTime since);
}
