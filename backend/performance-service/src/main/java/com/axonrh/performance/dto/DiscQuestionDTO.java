package com.axonrh.performance.dto;

import com.axonrh.performance.entity.DiscQuestion;
import com.axonrh.performance.entity.DiscQuestionOption;

import java.util.List;
import java.util.stream.Collectors;

public class DiscQuestionDTO {

    private String id;
    private String text;
    private int order;
    private List<DiscOptionDTO> options;

    public DiscQuestionDTO() {}

    public static DiscQuestionDTO fromEntity(DiscQuestion entity) {
        DiscQuestionDTO dto = new DiscQuestionDTO();
        dto.setId(entity.getId().toString());
        dto.setText(entity.getQuestionText());
        dto.setOrder(entity.getQuestionOrder());
        dto.setOptions(entity.getOptions().stream()
            .map(DiscOptionDTO::fromEntity)
            .collect(Collectors.toList()));
        return dto;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public int getOrder() {
        return order;
    }

    public void setOrder(int order) {
        this.order = order;
    }

    public List<DiscOptionDTO> getOptions() {
        return options;
    }

    public void setOptions(List<DiscOptionDTO> options) {
        this.options = options;
    }

    public static class DiscOptionDTO {
        private String id;
        private String text;
        private String value; // D, I, S, or C

        public DiscOptionDTO() {}

        public static DiscOptionDTO fromEntity(DiscQuestionOption entity) {
            DiscOptionDTO dto = new DiscOptionDTO();
            dto.setId(entity.getId().toString());
            dto.setText(entity.getOptionText());
            dto.setValue(entity.getDiscType());
            return dto;
        }

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getText() {
            return text;
        }

        public void setText(String text) {
            this.text = text;
        }

        public String getValue() {
            return value;
        }

        public void setValue(String value) {
            this.value = value;
        }
    }
}
