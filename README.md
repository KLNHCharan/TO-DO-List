Real-Time To-Do List with AI Features
This is a modern, single-page web application for managing your to-do list in real time. It's built with a focus on a clean, responsive design and is enhanced with AI-powered features for smarter task management. All tasks are synchronized instantly across devices using a cloud-hosted database.

✨ Features
Create, Complete, and Delete Tasks: Standard functionality for managing your tasks.

Real-Time Synchronization: All changes are saved and updated instantly across all devices.

AI-Powered Task Decomposition: Use the "Break Down Task" button to automatically convert a high-level goal (e.g., "Plan a party") into a list of smaller, actionable sub-tasks using the Gemini API.

AI-Powered Summarization: Get a concise summary of your current tasks and progress with the "Summarize Tasks" button.

Responsive Design: The application is optimized for both desktop and mobile screens.

🚀 Technology Stack
React: The core JavaScript library for building the dynamic user interface.

Firebase: Provides the backend infrastructure.

Firestore: A NoSQL cloud database for real-time data storage.

Authentication: Handles anonymous and custom user sign-in to secure data.

Gemini API: Powers the AI features for task breakdown and summarization.

Tailwind CSS: A utility-first CSS framework used for all styling and responsive design.

Vanilla JavaScript (ES6+): Powers the core logic and API interactions.

💡 How It Works
The application leverages React's state management to provide a seamless user experience. All task data is stored in a private Firestore collection tied to a unique user ID, ensuring data persistence and isolation. The AI features are implemented by making fetch requests to the Gemini API with specific prompts to either break down complex tasks or summarize existing ones, demonstrating a practical application of AI in a web app.

⚙️ Getting Started
Prerequisites
A web browser with JavaScript enabled.

Access to the Firebase and Gemini API keys provided by the hosting environment.

Running the Application
The entire application is contained within a single App.jsx file, making it easy to run. If you have a local environment set up, you can simply run:

npm install
npm start

However, in a self-contained environment like this, the code is already prepared to run and can be executed with the "Preview" button.
