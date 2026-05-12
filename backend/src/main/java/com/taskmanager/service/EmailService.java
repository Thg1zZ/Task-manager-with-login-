package com.taskmanager.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendPasswordResetEmail(String to, String resetLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Redefinição de Senha - TaskFlow");
        message.setText("Olá,\n\n" +
                "Você solicitou a redefinição de sua senha. Clique no link abaixo para criar uma nova senha:\n" +
                resetLink + "\n\n" +
                "Se você não solicitou isso, pode ignorar este e-mail.\n\n" +
                "Equipe TaskFlow");

        mailSender.send(message);
    }
}
