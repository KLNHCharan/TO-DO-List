### Real-Time To-Do List with AI Features

This project is a dynamic, single-page web application for managing tasks in real time. It's designed with a clean, responsive interface and is enhanced with AI to help you stay organized. All tasks are instantly saved and synchronized across all your devices using a cloud-hosted database.

### Key Features

  * **Real-Time Sync:** All changes to your to-do list are saved and updated instantly.
  * **AI-Powered Task Breakdown:** You can enter a high-level goal, and the Gemini API will break it down into a list of smaller, actionable sub-tasks.
  * **AI-Powered Task Summaries:** Get a quick summary of your progress and what's left to do from your entire task list.
  * **User-Friendly Interface:** The app is easy to use and looks great on both desktop and mobile devices.

### Technologies Used

  * **React:** Used for building the component-based user interface.
  * **Firebase:** Provides the backend services.
      * **Firestore:** A NoSQL database for real-time data storage.
      * **Authentication:** Manages user sessions for data security.
  * **Gemini API:** Powers the AI features for task generation and summarization.
  * **Tailwind CSS:** A utility-first framework for fast and responsive styling.

-----

### How to Run the Project Locally

To get the project running, you'll need a standard React development environment. Just follow these steps:

#### 1\. Set Up Your React Project

Open your terminal and create a new React app. This will set up the basic project structure.

```bash
npx create-react-app my-todo-app
cd my-todo-app
```

#### 2\. Install Dependencies

Navigate to your project folder and install the necessary libraries:

```bash
npm install firebase react-icons
npm install -D tailwindcss
npx tailwindcss init
```

#### 3\. Configure Tailwind CSS

Open the **`tailwind.config.js`** file and update the `content` section to scan your source files for Tailwind classes:

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Then, open **`src/index.css`** and add the Tailwind directives at the top:

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

#### 4\. Add the Code

Open your project in VS Code, go to the `src` folder, and replace the contents of **`App.js`** with the `App.jsx` code for this project.

**Note:** The code uses placeholder variables for Firebase. For the app to work, you'll need to replace these with your actual Firebase project credentials from the Firebase Console.

#### 5\. Run the Application

Finally, start the development server with this command:

```bash
npm start
```

This will launch the application in your browser.
