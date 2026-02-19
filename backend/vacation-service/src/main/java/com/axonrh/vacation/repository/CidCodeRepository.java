package com.axonrh.vacation.repository;

import com.axonrh.vacation.entity.CidCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CidCodeRepository extends JpaRepository<CidCode, String> {
    
    @Query("SELECT c FROM CidCode c WHERE LOWER(c.code) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(c.description) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<CidCode> search(String query);
}
