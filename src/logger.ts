import winston from "winston";

// Configuração do winston para gerar logs
const logger = winston.createLogger({
    level: "info", // nível de log, pode ser 'info', 'error', 'warn', etc.
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(
            (info) => `${info.timestamp} ${info.level}: ${info.message}`
        )
    ),
    transports: [
        new winston.transports.Console(), // Exibe os logs no console
        new winston.transports.File({ filename: "logs/app.log" }) // Salva logs em um arquivo
    ]
});

export { logger };
