# FitTrack Azure App Service Deployment Guide

This guide describes three straightforward ways to deploy the FitTrack Node.js & Express application to **Azure App Service**. Since the application is structured with standard practices (using `process.env.PORT` and `npm start` command), it is ready for immediate cloud hosting.

---

## 📋 Prerequisites
1. An **Azure Account** (a free trial account with free credits is perfect).
2. The application files: `server.js`, `fittrack.html`, `db.json`, `package.json`, and `.gitignore`.

---

## ⚡ Option A: VS Code Azure App Service Extension (Recommended & Simplest)

If you are using Visual Studio Code, you can deploy the application directly from your editor in less than 5 minutes.

### Step 1: Install the Extension
1. Open VS Code.
2. Go to the Extensions Marketplace (`Ctrl+Shift+X` or `Cmd+Shift+X`).
3. Search for and install **Azure App Service**.

### Step 2: Sign In to Azure
1. Click the **Azure** logo icon that appears in the left sidebar.
2. Under **Resources**, click **Sign in to Azure...** and follow the browser prompts to log in.

### Step 3: Create the Web App Resource
1. In the Azure panel, hover over **Resources** and click the `+` icon, then select **Create Resource...** -> **Create Web App...**
2. Enter a unique, global name for your app (e.g., `fittrack-yourname`).
3. Select **Node 20 LTS** (or Node 18 LTS) as the runtime stack.
4. Select **Linux** as the Operating System.
5. Select a region close to you, and choose the **Free (F1)** pricing tier.

### Step 4: Deploy your Code
1. Once the Web App is created, expand your subscription in the **Resources** explorer.
2. Find your new Web App in the list, right-click it, and select **Deploy to Web App...**
3. Choose the local folder where your FitTrack files are located.
4. If prompted to upgrade your workspace configuration, click **Yes**.
5. VS Code will zip your files, upload them, and run `npm install` automatically on Azure.
6. A notification will appear in the bottom right corner with a button to **Browse Website** once it finishes!

---

## 🌌 Option B: Continuous Deployment via GitHub Actions (Best Practice)

This sets up a professional pipeline where every time you push a change to GitHub, your Azure website updates automatically.

### Step 1: Push your Code to GitHub
1. Create a new repository on your [GitHub account](https://github.com).
2. Open a terminal in your project directory and run:
   ```bash
   git init
   git add .
   git commit -m "Configure FitTrack for Azure Deployment"
   git branch -M main
   git remote add origin <your-github-repository-url>
   git push -u origin main
   ```

### Step 2: Create a Web App in Azure Portal
1. Log in to the [Azure Portal](https://portal.azure.com).
2. Click **Create a resource** -> **Web App**.
3. Configure the following:
   - **Subscription / Resource Group**: Create or select an existing one.
   - **Name**: Choose a unique name (e.g. `fittrack-live`).
   - **Publish**: Code
   - **Runtime stack**: Node 20 LTS
   - **Operating System**: Linux
   - **Pricing Plan**: Free F1 Tier (click "Change size" under pricing plan to select the free tier under Dev/Test).

### Step 3: Connect to GitHub
1. Once the Web App is created, open the resource page.
2. In the left-hand navigation sidebar, click on **Deployment Center** (under the *Deployment* header).
3. Under **Source**, select **GitHub**.
4. Click **Authorize** (if prompted) to allow Azure access to your repository.
5. Select your GitHub **Organization**, **Repository**, and **Branch** (`main`).
6. Click **Save** at the top.
7. Azure will automatically generate a workflow file under `.github/workflows/` in your repository and start building and deploying the site! You can monitor the progress under the "Actions" tab in GitHub.

---

## 📦 Option C: Quick Zip Deploy via Azure Portal Kudu Tools

If you want a manual deployment without using command-line git or installing extensions, you can upload a zip file directly.

### Step 1: Create a Node.js Web App in Azure
1. Create a **Node 20 LTS on Linux** App Service via the [Azure Portal](https://portal.azure.com).

### Step 2: Create the Deployment Zip
1. Select your project files (`server.js`, `fittrack.html`, `db.json`, `package.json`, `.gitignore`).
2. Compress them into a single `.zip` archive (do **not** include the `node_modules` folder, Azure will generate it).

### Step 3: Drag and Drop Upload
1. Navigate to the Kudu Advanced Deployment page:
   `https://<your-app-name>.scm.azurewebsites.net/ZipDeployUI`
   *(Replace `<your-app-name>` with the name you chose in Step 1).*
2. Sign in with your Azure Portal credentials if prompted.
3. Drag your `.zip` archive from your file manager and drop it into the folder area displayed on the page.
4. Kudu will upload, unzip, install dependencies (`npm install`), and launch the server.

---

## 🛡️ Persistent Storage Info on Azure App Service
Because the application uses a local JSON file (`db.json`) to persist your steps, workouts, and nutrition logs, Azure App Service (on Linux with persistent volume enabled by default for Web Apps) will keep this data saved across restarts! 

*Note: For scaling production deployments, connecting to a fully managed cloud database like Azure Cosmos DB or Azure SQL is recommended, but for personal use, the local `db.json` on the persistent App Service disk works perfectly.*
