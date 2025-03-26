import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaRobot, FaPlus, FaSearch, FaHistory } from "react-icons/fa";
import AWS from "aws-sdk";
import { ClipLoader } from "react-spinners";

const Chatbot = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("User");
  const [sessions, setSessions] = useState([]); // List of past sessions
  const [currentSessionId, setCurrentSessionId] = useState(null); // Active session
  const [messages, setMessages] = useState([]); // Messages in current session
  const [sidePanelData, setSidePanelData] = useState([]); // Side panel content
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null); // Auto-scroll to latest message

  // AWS SDK Configuration
  AWS.config.update({
    region: import.meta.env.VITE_AWS_REGION || "ap-south-1",
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
  });
  const lambda = new AWS.Lambda();

  // Fetch user details and initial sessions
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${localStorage.getItem("token")}`,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch user details");
        const data = await response.json();
        setUsername(data.name || "User");
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };

    const fetchSessions = async () => {
      // Placeholder: Fetch sessions from backend or localStorage
      const storedSessions = JSON.parse(localStorage.getItem("debuggingSessions")) || [];
      setSessions(storedSessions);
      if (storedSessions.length > 0) {
        setCurrentSessionId(storedSessions[0].session_id);
        setMessages(storedSessions[0].messages || []);
      }
    };

    fetchUserDetails();
    fetchSessions();
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Logout handler
  const handleLogout = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Logout failed");
      localStorage.removeItem("token");
      alert("Logout successful!");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Error logging out.");
    }
  };

  // Start a new session
  const startNewSession = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setSidePanelData([]);
  };

  // Resume a previous session
  const resumeSession = (sessionId) => {
    const session = sessions.find((s) => s.session_id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages || []);
      setSidePanelData(session.side_panel_data || []);
    }
  };

  // Handle query submission
  const handleSearch = async () => {
    if (!query.trim()) {
      setMessages([...messages, { role: "assistant", content: "Please enter a valid query." }]);
      return;
    }

    setIsLoading(true);
    const userMessage = { role: "user", content: query };
    setMessages([...messages, userMessage]);

    try {
      const params = {
        FunctionName: import.meta.env.VITE_AWS_LAMBDA_FUNCTION_NAME || "MainLambda",
        InvocationType: "RequestResponse",
        Payload: JSON.stringify({
          body: JSON.stringify({
            prompt: query,
            session_id: currentSessionId, // Pass session ID for context
          }),
        }),
      };

      const result = await lambda.invoke(params).promise();
      if (result.FunctionError) throw new Error(`Lambda error: ${result.Payload}`);

      const data = JSON.parse(result.Payload);
      const responseData = typeof data.body === "string" ? JSON.parse(data.body) : data;

      const assistantMessage = {
        role: "assistant",
        content: responseData.response || "No response received.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setSidePanelData(responseData.side_panel_data || []);
      setCurrentSessionId(responseData.session_id); // Update with new/existing session ID

      // Update sessions
      const updatedSessions = sessions.filter((s) => s.session_id !== responseData.session_id);
      updatedSessions.unshift({
        session_id: responseData.session_id,
        messages: [...messages, userMessage, assistantMessage],
        side_panel_data: responseData.side_panel_data,
        timestamp: new Date().toISOString(),
      });
      setSessions(updatedSessions);
      localStorage.setItem("debuggingSessions", JSON.stringify(updatedSessions));
    } catch (error) {
      console.error("Error invoking Lambda:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${error.message}` },
      ]);
    } finally {
      setIsLoading(false);
      setQuery("");
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-100 to-gray-300 font-sans text-gray-800">
      {/* Sidebar for Past Sessions */}
      <div className="w-1/5 bg-gray-800 text-white p-4 flex flex-col shadow-lg">
        <h1 className="text-xl font-bold mb-4 flex items-center">
          <FaRobot className="mr-2" /> GenAI Debugger
        </h1>
        <button
          onClick={startNewSession}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mb-4 flex items-center justify-center"
        >
          <FaPlus className="mr-2" /> New Session
        </button>
        <div className="flex-1 overflow-y-auto">
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <div
                key={session.session_id}
                onClick={() => resumeSession(session.session_id)}
                className={`p-3 mb-2 rounded cursor-pointer hover:bg-gray-700 ${
                  session.session_id === currentSessionId ? "bg-gray-600" : "bg-gray-800"
                }`}
              >
                <div className="text-sm font-semibold">
                  Session {session.session_id.slice(0, 8)}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(session.timestamp).toLocaleString()}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm">No past sessions.</p>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Hi {username}!</h2>
          <button
            onClick={handleLogout}
            className="text-xl text-gray-600 hover:text-gray-800"
          >
            <FaSignOutAlt />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Chat Window */}
          <div className="w-2/3 bg-white rounded-lg shadow-lg p-4 flex flex-col">
            <div className="flex-1 overflow-y-auto mb-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <FaRobot className="text-5xl mb-2" />
                  <p>AWS Debugging Assistant ready to help!</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`mb-3 p-3 rounded-lg max-w-[80%] ${
                      msg.role === "user"
                        ? "bg-blue-100 self-end ml-auto"
                        : "bg-gray-200 self-start"
                    }`}
                  >
                    {msg.content}
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-center mb-3">
                  <ClipLoader color="#000000" size={30} />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="flex items-center bg-gray-100 p-3 rounded-lg shadow-inner">
              <input
                type="text"
                placeholder="Ask about AWS logs, metrics, or resources..."
                className="flex-1 p-2 text-lg outline-none bg-transparent border-b border-gray-300"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                disabled={isLoading}
              />
              <button
                onClick={handleSearch}
                className="bg-blue-600 text-white px-4 py-2 ml-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                disabled={isLoading}
              >
                <FaSearch />
              </button>
            </div>
          </div>

          {/* Side Panel for Results */}
          <div className="w-1/3 bg-gray-50 p-4 ml-4 rounded-lg shadow-lg overflow-y-auto">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <FaHistory className="mr-2" /> Debug Details
            </h3>
            {sidePanelData.length > 0 ? (
              sidePanelData.map((item, index) => (
                <div key={index} className="mb-4 p-3 bg-white rounded shadow-sm">
                  <p className="font-medium text-sm">Tool: {item.tool}</p>
                  <pre className="text-xs text-gray-600 mt-1 overflow-x-auto">
                    {JSON.stringify(JSON.parse(item.result), null, 2)}
                  </pre>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">
                Results from your queries will appear here.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;