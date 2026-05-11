package com.taskmanager.service;

import com.taskmanager.entity.Category;
import com.taskmanager.entity.User;
import com.taskmanager.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Categorias iniciais alinhadas ao frontend ({@code SUGGESTED_CATEGORIES} em {@code categories.js}).
 */
@Component
public class DefaultCategorySeeder {

    public record Preset(String name, String icon, String color) {}

    private static final List<Preset> PRESETS = List.of(
            new Preset("Trabalho", "💼", "#3b82f6"),
            new Preset("Estudos", "📚", "#8b5cf6"),
            new Preset("Pessoal", "✨", "#ec4899"),
            new Preset("Urgente", "⚡", "#ef4444"),
            new Preset("Casa", "🏠", "#22d3a5"),
            new Preset("Saúde", "💚", "#14b8a6"),
            new Preset("Financeiro", "💰", "#f59e0b")
    );

    @Autowired
    private CategoryRepository categoryRepository;

    /**
     * Garante todas as categorias padrão para um usuário recém-criado (idempotente por nome).
     */
    @Transactional
    public void seedForNewUser(User user) {
        if (user.getId() == null) {
            throw new IllegalStateException("Usuário precisa estar persistido antes do seed de categorias");
        }
        Long userId = user.getId();
        for (Preset p : PRESETS) {
            if (!categoryRepository.existsByNameAndUserId(p.name(), userId)) {
                categoryRepository.save(Category.builder()
                        .name(p.name())
                        .icon(p.icon())
                        .color(p.color())
                        .user(user)
                        .build());
            }
        }
    }

    /**
     * Só preenche se o usuário ainda não tiver nenhuma categoria (ex.: conta demo antiga).
     */
    @Transactional
    public void seedIfEmpty(User user) {
        if (user.getId() == null) {
            throw new IllegalStateException("Usuário precisa estar persistido antes do seed de categorias");
        }
        if (categoryRepository.countByUserId(user.getId()) > 0) {
            return;
        }
        seedForNewUser(user);
    }
}
