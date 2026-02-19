package com.axonrh.vacation.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Entidade para armazenar os códigos CID-10.
 */
@Entity
@Table(name = "cid_codes", indexes = {
    @Index(name = "idx_cid_codes_code", columnList = "code")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CidCode {

    @Id
    @Column(length = 20)
    private String code;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "chapter_num")
    private Integer chapterNum;

    @Column(name = "group_code")
    private String groupCode;

    @Column(name = "category_code")
    private String categoryCode;

    @Column(name = "type", length = 30)
    private String type; // CHAPTER, GROUP, CATEGORY, SUBCATEGORY
}
