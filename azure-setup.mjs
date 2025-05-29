// Azure Storage Account Connection Helper
// Run this script to get your Azure Storage connection string and update .env.local

import { execSync } from "child_process";
import * as fs from "fs";
import * as readline from "readline";

const STORAGE_ACCOUNT_NAME = "filesdropzone";
const RESOURCE_GROUP = "fdz";
const ENV_FILE = ".env.local";

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("🔷 Azure Storage Connection Helper 🔷");
console.log(
  "This script will help you configure your Azure Storage connection string"
);
console.log(`Storage Account: ${STORAGE_ACCOUNT_NAME}`);
console.log(`Resource Group: ${RESOURCE_GROUP}`);
console.log("\n");

console.log("Options:");
console.log("1. I have Azure CLI installed and I'm logged in");
console.log("2. I want to manually enter my storage account key");
console.log("3. Exit");

rl.question("\nSelect an option (1-3): ", async (option) => {
  switch (option) {
    case "1":
      try {
        console.log("\n⏳ Running Azure CLI to get connection string...");
        const result = execSync(
          `az storage account show-connection-string --name ${STORAGE_ACCOUNT_NAME} --resource-group ${RESOURCE_GROUP}`
        ).toString();

        // Parse the JSON output
        const connectionData = JSON.parse(result);
        const connectionString = connectionData.connectionString;

        if (!connectionString) {
          throw new Error("Connection string not found in output");
        }

        console.log("✅ Successfully retrieved connection string!");
        updateEnvFile(connectionString);
      } catch (error) {
        console.error("❌ Failed to get connection string from Azure CLI:");
        console.error(error.message || error);
        console.log("\n📝 You may need to:");
        console.log(
          "1. Install Azure CLI: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        );
        console.log("2. Log in with: az login");
        console.log("3. Try option 2 instead to manually enter your key");
      }
      break;

    case "2":
      rl.question("\nEnter your storage account key: ", (key) => {
        if (!key || key.trim().length === 0) {
          console.log("❌ Key cannot be empty!");
          rl.close();
          return;
        }

        const connectionString = `DefaultEndpointsProtocol=https;AccountName=${STORAGE_ACCOUNT_NAME};AccountKey=${key.trim()};EndpointSuffix=core.windows.net`;

        updateEnvFile(connectionString);
      });
      break;

    case "3":
      console.log("👋 Exiting...");
      rl.close();
      break;

    default:
      console.log("❌ Invalid option selected");
      rl.close();
  }
});

function updateEnvFile(connectionString) {
  try {
    if (!fs.existsSync(ENV_FILE)) {
      console.log(`❌ ${ENV_FILE} not found!`);
      rl.close();
      return;
    }

    let envFileContent = fs.readFileSync(ENV_FILE, "utf8");

    // Replace the connection string line with the new one
    const regex = /AZURE_CONNECTION_STRING=.*/;
    envFileContent = envFileContent.replace(
      regex,
      `AZURE_CONNECTION_STRING=${connectionString}`
    );

    // Write the updated content back to the file
    fs.writeFileSync(ENV_FILE, envFileContent);

    console.log(`✅ Updated ${ENV_FILE} with the new connection string!`);
    console.log("\n🚀 You can now run your application:");
    console.log("npm run dev");

    rl.close();
  } catch (error) {
    console.error(`❌ Error updating ${ENV_FILE}:`, error);
    rl.close();
  }
}
