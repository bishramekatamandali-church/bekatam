# Bishram Ekata Mandali - Church Web Application (Full-Stack)

## 1. Application Overview

This project is a full-stack web application designed for the **Bishram Ekata Mandali (BEM)** church community. It serves as a central hub for members and visitors, providing information, community engagement features, and administrative tools.

The application is structured as a monorepo with two primary packages:
-   `/frontend`: A React-based single-page application.
-   `/backend`: A Node.js/Express API server with a MySQL database via Prisma.

## 2. Local Development Setup

### 2.1 Prerequisites
-   Node.js and npm (or a compatible package manager).
-   A running MySQL server instance.
-   `serve` and `concurrently` npm packages installed globally (`npm install -g serve concurrently`), or use `npx`.

### 2.2 First-Time Setup

**1. Install Dependencies**
From the **root directory** of the project, run:
```bash
npm install
```
This command will install root-level dependencies (like `concurrently`) and then automatically run `npm install` inside the `/backend` directory as well.

**2. Configure Backend Environment**
-   Create a `.env` file in the `/backend` directory.
-   Open the new `.env` file and add your MySQL connection string, Google Gemini API Key, and frontend URL. **All variables are required for the server to start.**
    ```env
    # backend/.env
    DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
    API_KEY="YOUR_GOOGLE_GEMINI_API_KEY"
    FRONTEND_URL="http://localhost:5000"
    ```
    Replace the placeholders with your actual MySQL details. The database must already exist. For production, change `FRONTEND_URL` to your live domain.

**3. Set Up the Database**
This is a **critical step**. It syncs the Prisma schema with your database, creating all tables and generating the Prisma Client.
-   From the `/backend` directory, run:
    ```bash
    npm run prisma:setup
    ```
-   Navigate back to the root directory: `cd ..`

### 2.3 Running the Application

1.  **Start Both Servers**: From the **root directory**, run the development script:
    ```bash
    npm run dev
    ```
    This command uses `concurrently` to start the frontend server (on `http://localhost:5000`) and the backend API server (on `http://localhost:3001`).

2.  **Access the Application**: Open your web browser and navigate to **`http://localhost:5000`**.

### 2.4 Running with PM2 (Optional)

If you have [PM2](https://pm2.keymetrics.io/) installed, you can run the application using the provided configuration file. From the **root directory**:
```bash
pm2 start ecosystem.config.js --env development
```

## 3. Troubleshooting

-   **`FATAL: ... environment variable is not set...`**
    -   **Solution:** Ensure the `.env` file exists inside the `/backend` directory (not the root) and contains `API_KEY`, `DATABASE_URL`, and `FRONTEND_URL`.

-   **`Error: @prisma/client did not initialize yet...`**
    -   **Solution:** You must run `npm run prisma:setup` from within the `/backend` directory after configuring your `.env` file.

-   **`Failed to fetch...` or CORS errors in the browser**
    -   **Cause:** The frontend cannot connect to the backend, likely because the backend server has crashed or the `FRONTEND_URL` in your `.env` file is incorrect.
    -   **Solution:** Check the terminal window for backend errors (usually API Key or Prisma issues). Verify your `.env` variables and restart with `npm run dev`.

## 4. Application Status

This application is a work in progress. Most features are now integrated with the backend and database. Some social features (friends, groups) are still using frontend-simulated data from local storage for demonstration purposes and will be migrated in the future.
