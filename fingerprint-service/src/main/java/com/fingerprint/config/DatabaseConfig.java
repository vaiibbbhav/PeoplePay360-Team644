package com.fingerprint.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DatabaseConfig {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseConfig.class);

    @Value("${DATABASE_URL:${spring.datasource.url:}}")
    private String rawDatabaseUrl;

    @Bean
    @Primary
    public DataSource dataSource() {
        String dbUrl = rawDatabaseUrl;
        if (dbUrl == null || dbUrl.trim().isEmpty()) {
            dbUrl = System.getenv("DATABASE_URL");
        }
        if (dbUrl == null || dbUrl.trim().isEmpty()) {
            dbUrl = System.getProperty("DATABASE_URL");
        }

        if (dbUrl == null || dbUrl.trim().isEmpty()) {
            logger.warn("No DATABASE_URL found. Please set DATABASE_URL environment variable.");
            throw new IllegalStateException("DATABASE_URL is not configured for Neon PostgreSQL");
        }

        DriverManagerDataSource dataSource = new DriverManagerDataSource();
        dataSource.setDriverClassName("org.postgresql.Driver");

        try {
            if (dbUrl.startsWith("jdbc:")) {
                dataSource.setUrl(dbUrl);
            } else if (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://")) {
                String cleanUriStr = dbUrl.replace("postgresql://", "http://").replace("postgres://", "http://");
                URI uri = new URI(cleanUriStr);

                String userInfo = uri.getUserInfo();
                String username = null;
                String password = null;
                if (userInfo != null && userInfo.contains(":")) {
                    String[] parts = userInfo.split(":", 2);
                    username = parts[0];
                    password = parts[1];
                }

                String host = uri.getHost();
                int port = uri.getPort() == -1 ? 5432 : uri.getPort();
                String path = uri.getPath(); // e.g. /neondb
                String query = uri.getQuery(); // e.g. sslmode=require...

                StringBuilder jdbcUrl = new StringBuilder("jdbc:postgresql://")
                        .append(host)
                        .append(":")
                        .append(port)
                        .append(path);

                if (query != null && !query.isEmpty()) {
                    jdbcUrl.append("?").append(query);
                } else {
                    jdbcUrl.append("?sslmode=require");
                }

                dataSource.setUrl(jdbcUrl.toString());
                if (username != null) dataSource.setUsername(username);
                if (password != null) dataSource.setPassword(password);

                logger.info("Configured PostgreSQL DataSource for host: {}{}", host, path);
            } else {
                dataSource.setUrl("jdbc:postgresql://" + dbUrl);
            }
        } catch (Exception e) {
            logger.error("Error parsing DATABASE_URL: {}", e.getMessage(), e);
            throw new RuntimeException("Invalid DATABASE_URL configuration", e);
        }

        return dataSource;
    }

    @Bean
    public JdbcTemplate jdbcTemplate(DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }
}
