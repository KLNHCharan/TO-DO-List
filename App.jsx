import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';

// Global variables provided by the canvas environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Main App Component
const App = () => {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState('');

  // --- Gemini API Setup ---
  const apiKey = ""; // Canvas will provide this at runtime
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

  // Initialize Firebase and handle authentication
  useEffect(() => {
    try {
      if (!firebaseConfig || !firebaseConfig.apiKey) {
        console.error("Firebase config is missing.");
        setLoading(false);
        return;
      }
      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const authService = getAuth(app);
      
      setDb(firestore);
      setAuth(authService);
      
      const signIn = async () => {
        try {
          if (initialAuthToken) {
            await signInWithCustomToken(authService, initialAuthToken);
          } else {
            await signInAnonymously(authService);
          }
        } catch (error) {
          console.error("Authentication error:", error);
        }
      };
      
      signIn();
      
      const unsubscribe = onAuthStateChanged(authService, (user) => {
        if (user) {
          setUserId(user.uid);
          console.log("Authenticated as user:", user.uid);
        } else {
          console.log("No user signed in. Using a random ID for this session.");
          setUserId(crypto.randomUUID());
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error during Firebase initialization:", error);
      setLoading(false);
    }
  }, []);

  // Set up real-time listener for tasks
  useEffect(() => {
    if (!db || !userId) {
      console.log('Waiting for database or user ID to be available.');
      return;
    }

    const todosRef = collection(db, `artifacts/${appId}/users/${userId}/todos`);
    console.log(`Attempting to listen to Firestore path: artifacts/${appId}/users/${userId}/todos`);
    
    const unsubscribe = onSnapshot(todosRef, (snapshot) => {
      const fetchedTasks = [];
      snapshot.forEach(doc => {
        fetchedTasks.push({ id: doc.id, ...doc.data() });
      });

      fetchedTasks.sort((a, b) => a.created_at?.toMillis() - b.created_at?.toMillis());
      
      setTasks(fetchedTasks);
      setLoading(false);
      console.log("Real-time update received. Total tasks:", fetchedTasks.length);
    }, (error) => {
      console.error("Error getting real-time updates:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, userId]);

  const addTask = async (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      const taskText = newTask.trim();
      if (!taskText || !db || !userId) {
        return;
      }

      try {
        console.log(`Adding task to Firestore path: artifacts/${appId}/users/${userId}/todos`);
        await addDoc(collection(db, `artifacts/${appId}/users/${userId}/todos`), {
          text: taskText,
          is_completed: false,
          created_at: new Date(),
          owner_id: userId,
        });
        setNewTask(''); 
      } catch (e) {
        console.error("Error adding document:", e);
      }
    }
  };

  const toggleTaskStatus = async (taskId, currentStatus) => {
    if (!db) return;
    try {
      const taskRef = doc(db, `artifacts/${appId}/users/${userId}/todos`, taskId);
      await updateDoc(taskRef, {
        is_completed: !currentStatus
      });
    } catch (e) {
      console.error("Error updating document:", e);
    }
  };

  const handleDeleteClick = (taskId) => {
    if (pendingDelete === taskId) {
      deleteTask(taskId);
      setPendingDelete(null);
    } else {
      setPendingDelete(taskId);
      setTimeout(() => {
        setPendingDelete(null);
      }, 3000);
    }
  };

  const deleteTask = async (taskId) => {
    if (!db) return;
    try {
      const taskRef = doc(db, `artifacts/${appId}/users/${userId}/todos`, taskId);
      await deleteDoc(taskRef);
    } catch (e) {
      console.error("Error deleting document:", e);
    }
  };

  // --- Gemini API Functions ---
  const handleGenerateSubtasks = async () => {
    const taskText = newTask.trim();
    if (!taskText) {
      setGeneratedSummary("Please enter a task to break down.");
      return;
    }
    setIsGenerating(true);
    setGeneratedSummary("Generating sub-tasks...");
    
    const systemPrompt = "You are an expert at project management. Your task is to take a high-level request and break it down into a concise, numbered list of specific, actionable sub-tasks. Do not provide any extra text or conversation, just the numbered list.";
    const userQuery = `Break down the task "${taskText}" into a list of specific, actionable sub-tasks.`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      const generatedText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (generatedText) {
        const subtasks = generatedText.split('\n').filter(line => line.trim().length > 0);
        for (const subtask of subtasks) {
          const text = subtask.replace(/^\d+\.\s*/, '').trim(); // Remove numbering
          if (text) {
            await addDoc(collection(db, `artifacts/${appId}/users/${userId}/todos`), {
              text: text,
              is_completed: false,
              created_at: new Date(),
              owner_id: userId,
            });
          }
        }
        setGeneratedSummary('');
        setNewTask('');
      } else {
        setGeneratedSummary("Could not generate sub-tasks. Please try again.");
      }
    } catch (e) {
      console.error("Error calling Gemini API:", e);
      setGeneratedSummary("An error occurred. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSummarizeTasks = async () => {
    if (tasks.length === 0) {
      setGeneratedSummary("There are no tasks to summarize.");
      return;
    }
    setIsGenerating(true);
    setGeneratedSummary("Generating summary...");
    
    const taskList = tasks.map(task => `${task.text} [${task.is_completed ? 'completed' : 'not completed'}]`).join(', ');
    const userQuery = `Please provide a concise, single-paragraph summary of the following to-do list: ${taskList}. Mention the total number of tasks and how many are completed.`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      const generatedText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (generatedText) {
        setGeneratedSummary(generatedText);
      } else {
        setGeneratedSummary("Could not generate a summary. Please try again.");
      }
    } catch (e) {
      console.error("Error calling Gemini API:", e);
      setGeneratedSummary("An error occurred. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4 font-inter">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg space-y-6">
        
        <header className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">My To-Do List</h1>
          <p className="mt-2 text-sm text-gray-500">Add, complete, and delete your tasks in real time.</p>
        </header>
        
        <div className="text-xs text-center text-gray-400 p-2 rounded-lg bg-gray-50 break-all">
          User ID: <span className="font-mono text-gray-500">{userId || 'Authenticating...'}</span>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Enter a new task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={addTask}
            className="flex-grow p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <button
            onClick={addTask}
            className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl shadow-md hover:bg-blue-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add Task
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleGenerateSubtasks}
            disabled={isGenerating || !newTask.trim()}
            className={`flex-grow py-3 px-6 rounded-xl shadow-md transition-all font-semibold ${isGenerating ? 'bg-gray-400 text-gray-600 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
          >
            Break Down Task ✨
          </button>
          <button
            onClick={handleSummarizeTasks}
            disabled={isGenerating || tasks.length === 0}
            className={`flex-grow py-3 px-6 rounded-xl shadow-md transition-all font-semibold ${isGenerating ? 'bg-gray-400 text-gray-600 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
          >
            Summarize Tasks ✨
          </button>
        </div>

        {generatedSummary && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl">
            {isGenerating ? (
              <div className="flex items-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{generatedSummary}</span>
              </div>
            ) : (
              <p>{generatedSummary}</p>
            )}
          </div>
        )}
        
        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-gray-500 mt-4">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center text-gray-500 mt-4">No tasks yet. Add one to get started!</div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`group task-item flex items-center p-4 rounded-xl border border-gray-200 transition-all duration-300 transform hover:scale-[1.01] shadow-sm ${task.is_completed ? 'bg-gray-50' : 'bg-white'}`}
              >
                <input
                  type="checkbox"
                  checked={task.is_completed}
                  onChange={() => toggleTaskStatus(task.id, task.is_completed)}
                  className="form-checkbox h-5 w-5 text-blue-600 rounded-full border-gray-300 transition-all"
                />
                <span className={`ml-4 flex-grow text-gray-800 ${task.is_completed ? 'line-through text-gray-400' : ''}`}>
                  {task.text}
                </span>
                <button
                  onClick={() => handleDeleteClick(task.id)}
                  className={`p-1 rounded-full transition-all duration-300 ${pendingDelete === task.id ? 'bg-red-500 text-white' : 'text-gray-400 opacity-0 hover:bg-gray-200 hover:text-gray-600 group-hover:opacity-100'}`}
                >
                  {pendingDelete === task.id ? (
                    'Confirm?'
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              </div>
            ))
          )}
        </div>
        
      </div>
    </div>
  );
};

export default App;
