package com.taskmanager.dto;

import com.taskmanager.entity.TaskComment;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
public class CommentRequest {

    @NotBlank(message = "Conteúdo é obrigatório")
    @Size(min = 1, max = 1000)
    private String content;
}
