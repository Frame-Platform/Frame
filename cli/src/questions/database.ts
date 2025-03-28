import inquirer from "inquirer";
import { displayPostgresInstructions } from "../utils/displayPostgresInstructions.js";

export const databaseQuestions = async () => {
  const postgres = await inquirer.prompt([
    /*
    {
      type: "input",
      name: "host",
      message: "Enter PostgreSQL Host:",
      validate: (input) => input.trim() !== "" || "Host cannot be empty.",
    },
    {
      type: "input",
      name: "port",
      message: "Enter PostgreSQL Port (default is 5432):",
      default: "5432",
      validate: (input) => {
        const port = input.trim();
        return port === "" || !isNaN(Number(port))
          ? true
          : "Port must be a number.";
      },
    },
    */
    {
      type: "input",
      name: "user",
      message: "Enter PostgreSQL Username:",
      validate: (input) => {
        const trimmed = input.trim();

        // Check length constraint
        if (trimmed.length < 1 || trimmed.length > 16) {
          return "Username must be between 1 and 16 characters.";
        }

        // Check first character is a letter
        if (!/^[a-zA-Z]/.test(trimmed)) {
          return "Username must start with a letter.";
        }

        // Check all characters are alphanumeric
        if (!/^[a-zA-Z0-9]+$/.test(trimmed)) {
          return "Username must contain only letters and numbers.";
        }

        return true;
      },
    },
    {
      type: "password",
      name: "password",
      message: "Enter PostgreSQL Password:",
      validate: (input) => {
        const trimmed = input.trim();

        // Check minimum length
        if (trimmed.length < 8) {
          return "Password must be at least 8 characters in length.";
        }

        // Check for disallowed characters
        const disallowedChars = ["/", "'", '"', "@"];
        for (const char of disallowedChars) {
          if (trimmed.includes(char)) {
            return `Password cannot contain the character: ${char}`;
          }
        }

        // Check for printable ASCII characters (codes 32-126)
        for (let i = 0; i < trimmed.length; i++) {
          const charCode = trimmed.charCodeAt(i);
          if (charCode < 32 || charCode > 126) {
            return "Password must contain only printable ASCII characters.";
          }
        }

        return true;
      },
    },
    {
      type: "input",
      name: "dbName",
      message: "Enter PostgreSQL Database Name:",
      validate: (input) =>
        input.trim() !== "" || "Database Name cannot be empty.",
    },
    {
      type: "input",
      name: "tableName",
      message: "Enter PostgreSQL Table Name (default is 'documents'):",
      default: "documents",
      validate: (input) => input.trim() !== "" || "Table Name cannot be empty.",
    },
  ]);

  displayPostgresInstructions(postgres.tableName);

  return postgres;
};
