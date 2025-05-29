// setup.mjs - Initialize File Drop Zone application
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import { BlobServiceClient } from "@azure/storage-blob";
import fs from "fs/promises";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config({ path: ".env.local" });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function validateEnvFile() {
  console.log("🔍 Checking environment configuration...");

  try {
    await fs.access(".env.local");
    console.log("✅ .env.local file found");
  } catch (error) {
    console.log("⚠️ .env.local file not found, creating template...");
    const envTemplate = `# Environment variables for the File Drop Zone application

# MongoDB Connection
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGO_DB=fdz

# Azure Blob Storage
AZURE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=youraccount;AccountKey=yourkey;EndpointSuffix=core.windows.net
AZURE_CONTAINER_NAME=files

# Application settings
NEXT_PUBLIC_APP_URL=http://localhost:9002
`;
    await fs.writeFile(".env.local", envTemplate);
    console.log(
      "📝 Created .env.local template - please update with your actual credentials"
    );
    return false;
  }

  // Check if required variables exist
  const requiredVars = [
    "MONGO_URI",
    "MONGO_DB",
    "AZURE_CONNECTION_STRING",
    "AZURE_CONTAINER_NAME",
  ];
  let allVarsPresent = true;

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      console.log(`⚠️ Missing required environment variable: ${varName}`);
      allVarsPresent = false;
    }
  }

  return allVarsPresent;
}

async function testMongoConnection() {
  console.log("🔄 Testing MongoDB connection...");

  if (!process.env.MONGO_URI) {
    console.log(
      "❌ MongoDB connection string not found in environment variables"
    );
    return false;
  }

  const client = new MongoClient(process.env.MONGO_URI);

  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ MongoDB connection successful!");

    // Create indexes for better performance
    const db = client.db(process.env.MONGO_DB || "fdz");
    const filesCollection = db.collection("files");

    await filesCollection.createIndex({ keyword: 1 });
    await filesCollection.createIndex({ expiresAt: 1 });
    console.log("✅ MongoDB indexes created");

    return true;
  } catch (error) {
    console.log("❌ MongoDB connection failed:", error.message);
    return false;
  } finally {
    await client.close();
  }
}

async function testAzureConnection() {
  console.log("🔄 Testing Azure Blob Storage connection...");

  if (!process.env.AZURE_CONNECTION_STRING) {
    console.log(
      "❌ Azure connection string not found in environment variables"
    );
    console.log("ℹ️ Your Azure Storage account name is: filesdropzone");
    console.log(
      "ℹ️ You can get the connection string from the Azure Portal or by running:"
    );
    console.log(
      "   az storage account show-connection-string --name filesdropzone --resource-group fdz"
    );
    return false;
  }

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_CONNECTION_STRING
    );

    const containerName = process.env.AZURE_CONTAINER_NAME || "files";
    const containerClient = blobServiceClient.getContainerClient(containerName);

    await containerClient.createIfNotExists({
      access: "blob", // Allow public read access to blobs
    });

    console.log(`✅ Azure Blob Storage connection successful!`);
    console.log(`✅ Container "${containerName}" is ready`);

    return true;
  } catch (error) {
    console.log("❌ Azure Blob Storage connection failed:", error.message);
    console.log(
      "⚠️ If you see an authentication error, please check your connection string"
    );
    console.log("⚠️ Your Azure Storage account name is: filesdropzone");
    console.log(
      "⚠️ Make sure to replace the placeholder with your actual account key"
    );
    return false;
  }
}

async function installDependencies() {
  console.log("🔄 Installing dependencies...");

  try {
    execSync("npm install", { stdio: "inherit" });
    console.log("✅ Dependencies installed successfully");
    return true;
  } catch (error) {
    console.log("❌ Failed to install dependencies:", error.message);
    return false;
  }
}

async function main() {
  console.log("🚀 Setting up File Drop Zone application...");

  const envValid = await validateEnvFile();
  if (!envValid) {
    console.log(
      "⚠️ Please update your .env.local file and run this script again"
    );
    return;
  }

  const depsInstalled = await installDependencies();
  if (!depsInstalled) return;

  const mongoConnected = await testMongoConnection();
  const azureConnected = await testAzureConnection();

  if (mongoConnected && azureConnected) {
    console.log("\n✅ Setup completed successfully!");
    console.log("\nYou can now start the application with:");
    console.log("  npm run dev");
    console.log("\nAccess your application at:");
    console.log(
      `  ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:9002"}`
    );
  } else {
    console.log(
      "\n⚠️ Setup completed with warnings. Please fix the issues mentioned above."
    );
  }
}

main().catch((error) => {
  console.error("❌ Setup failed with error:", error);
  process.exit(1);
});
