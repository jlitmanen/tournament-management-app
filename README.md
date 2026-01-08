# KTP Ranking Portal 2025

A modern web application for managing sports rankings, match results, and tournament opens. Built with **Node.js**, **Express**, and **Sass**, featuring a full administrative suite and dynamic dark/light mode.

## Features

* **Live Rankings:** Real-time player standings and performance tracking.
* **Match Management:** Historical data and upcoming match schedules.
* **Admin Dashboard:** Secure tools to edit players, results, and site content.
* **Theme Support:** Native Bootstrap 5.3 dark/light mode toggle.
* **Responsive Design:** Fully optimized for mobile and desktop viewing.

## Tech Stack

* **Backend:** Node.js (v22+) & Express
* **Frontend:** EJS (Embedded JavaScript templates)
* **Styling:** Sass (compiled with Bootstrap 5.3)
* **Database:** LibSQL / SQLite
* **Auth:** Passport.js (Local Strategy)
* **Deployment:** GitHub → Railway

## Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/ktp-ranking.git](https://github.com/your-username/ktp-ranking.git)
    cd ktp-ranking
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env` file in the root directory and add your credentials:
    ```env
    SESSION_SECRET=your_secret_here
    DATABASE_URL=your_libsql_url
    DATABASE_AUTH_TOKEN=your_token
    ```

4.  **Compile CSS:**
    ```bash
    npm run build-css
    ```

5.  **Run Development Server:**
    ```bash
    npm start
    ```

## Scripts

* `npm start`: Runs the app using Node 22's native `.env` loader.
* `npm run build-css`: Compiles Sass files from `public/scss` to `public/css`.
* `npm run build`: Automates CSS compilation during Railway deployment.
* `npm run prod`: Standard production start command.

## Project Structure

* `/bin/www`: Server entry point.
* `/views`: EJS templates (Main layout, partials, and pages).
* `/public`: Static assets (Compiled CSS, client-side JS, images).
* `/routes`: Express route handlers for auth, admin, and public views.

---
*Created by Joonas Litmanen*
