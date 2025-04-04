import inquirer from "inquirer";

export const databaseQuestions = async () => {
  const postgres = await inquirer.prompt([
    {
      type: "input",
      name: "user",
      message: "Enter PostgreSQL Username:",
      validate: (input) => {
        const trimmed = input.trim();

        if (trimmed.length < 1 || trimmed.length > 16) {
          return "Username must be between 1 and 16 characters.";
        }

        if (!/^[a-zA-Z]/.test(trimmed)) {
          return "Username must start with a letter.";
        }

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

        if (trimmed.length < 8) {
          return "Password must be at least 8 characters in length.";
        }

        const disallowedChars = ["/", "'", '"', "@"];
        for (const char of disallowedChars) {
          if (trimmed.includes(char)) {
            return `Password cannot contain the character: ${char}`;
          }
        }

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
  ]);

  return postgres;
};
