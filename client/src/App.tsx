import "regenerator-runtime/runtime";
import { useState, useEffect } from "react";
import {
  FaMicrophoneAlt,
  FaStopCircle,
  FaStop,
  FaDatabase,
  FaChartLine,
  FaQuestionCircle,
  FaFileCode,
  FaTools,
  FaShieldAlt,
} from "react-icons/fa";
import { GoDot } from "react-icons/go";
import { GrSend } from "react-icons/gr";
import { motion } from "framer-motion";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { FaRegUser, FaRobot } from "react-icons/fa";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { BrowserRouter } from "react-router-dom";
import Markdown from "react-markdown";
import "./App.css";

function AiCard({
  Icon,
  title,
  text,
}: {
  Icon: any;
  title: string;
  text: string;
}) {
  return (
    <div className="bg-white rounded-md border p-4 sm:p-3 hover:ring-1 hover:ring-slate-300 cursor-pointer transition-all">
      <Icon className="w-10 h-10 opacity-70 mb-4 text-fill sm:w-8 sm:h-8" />
      <h1 className="font-bold text-xl text-primary sm:text-lg">{title}</h1>
      <p className="text-sm opacity-95 sm:text-xs">{text}</p>
    </div>
  );
}

function Message({
  message,
  isUser,
  isLoading,
}: {
  message: string;
  isUser: boolean;
  isLoading?: boolean;
}) {
  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} items-start`}
    >
      {!isUser && (
        <div className="mr-1 border border-gray-300 p-2 rounded-full">
          <FaRobot className="text-blue-400 text-2xl" />
        </div>
      )}
      <div
        className={`max-w-[75%] p-3 rounded-lg font-medium ${
          isUser
            ? "bg-blue-500 text-white shadow-md"
            : "bg-white text-black border border-gray-300 shadow-sm"
        }`}
      >
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.2 }}
            className="flex items-center"
          >
            {[...Array(3)].map((_, index) => (
              <motion.p
                key={index}
                initial={{ y: 4 }}
                animate={{ y: -4 }}
                transition={{
                  repeat: Infinity,
                  repeatType: "reverse",
                  duration: 0.5,
                  delay: index * 0.2,
                }}
              >
                <GoDot />
              </motion.p>
            ))}
          </motion.div>
        ) : (
          <Markdown>{message}</Markdown>
        )}
      </div>
      {isUser && (
        <div className="ml-1 bg-blue-500 text-white border border-gray-300 p-2 rounded-full">
          <FaRegUser className=" text-lg" />
        </div>
      )}
    </div>
  );
}

// Create a new component that uses useLocation
function AppContent() {
  console.log("AppContent component rendered");
  const [messages, setMessages] = useState<any[]>([]);
  const [prompt, setPrompt] = useState<string>("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [parent] = useAutoAnimate();

  const {
    finalTranscript,
    resetTranscript,
    listening,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // const location = useLocation(); // Now inside Router context

  const clearMemory = () => {
    console.log("clearMemory function invoked");
    fetch(`/clear_memory`, {
      method: 'GET',
      cache: 'no-store',
    })
      .then((res) => {
        console.log("Response received:", res);
        if (!res.ok) {
          throw new Error("Failed to clear memory");
        }
        return res.json();
      })
      .then((data) => {
        console.log("Data received:", data);
        setMessages([]);
      })
      .catch((error) => {
        console.error("Error clearing memory:", error);
      });
  };

  useEffect(() => {
    console.log("useEffect called");
    clearMemory();
  }, []);

  if (!browserSupportsSpeechRecognition) {
    alert("Browser doesn't support speech recognition.");
  }

  useEffect(() => {
    if (finalTranscript !== "") {
      handleSendMessage(finalTranscript);
      setIsListening(false);
    }
  }, [finalTranscript]);

  const handleMicClick = () => {
    if (isListening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: false });
    }
    setIsListening((prev) => !prev);
  };

    const handleSendMessage = (inputPrompt: string) => {
      if (inputPrompt.trim() === "") return;

      const userMessage = { text: inputPrompt, sender: "user" };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setPrompt("");
      resetTranscript();
      setIsProcessing(true);

      // Show loading message
      setTimeout(() => {
          const loadingMessage = { text: "", sender: "ai", isLoading: true };
          setMessages((prevMessages) => [...prevMessages, loadingMessage]);
      }, 250);

      // Prepare payload and controller
      const payload = { user_input: inputPrompt }; // Unified naming with backend
      const controller = new AbortController();
      setAbortController(controller);

      // Fetch response
      fetch("http://localhost:8000/ask", {
          method: "POST",
          body: JSON.stringify(payload),
          headers: {
              "Content-Type": "application/json",
          },
          signal: controller.signal,
      })
          .then((res) => {
              if (!res.ok) {
                console.log(res)
                  throw new Error("Network response was not ok");
                  
              }
              return res.json();
          })
          .then((data) => {
              const aiMessage = { text: data.response, sender: "ai" };

              // Replace loading message and add AI response
              setMessages((prevMessages) => {
                  const withoutLoading = prevMessages.slice(0, -1);
                  return [...withoutLoading, aiMessage];
              });
              setIsProcessing(false);
          })
          .catch((error) => {
            console.log(error);
              if (error.name === "AbortError") {
                  console.log("Fetch request was aborted");
              } else {
                  console.error("Fetch error:", error);
              }
          })
          .finally(() => {
              setIsProcessing(false);
          });
  };


  const handleCancelProcessing = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setMessages((prevMessages) =>
      prevMessages.slice(0, prevMessages.length - 1)
    );
    setIsProcessing(false);
  };

  useEffect(() => {
    const conversationContainer = document.querySelector(
      ".conversation-container"
    );
    if (conversationContainer) {
      conversationContainer.scrollTo(0, conversationContainer.scrollHeight);
    }
  }, [messages]);

  return (
    <main className="h-screen grid grid-cols-[12vw_1fr] font-mont max-md:grid-cols-1">
      <aside className="flex flex-col py-6 px-4 border-r items-center justify-between max-md:hidden sticky top-0 h-screen">
        <img
          src="/crustdata_logo.jpeg"
          alt="Logo"
          className="w-40 m-2 cursor-pointer"
          onClick={() => window.location.reload()}
        />
        <div className="w-full bg-fill/[0.1] h-14 rounded-md border gap-4 flex items-center px-2">
          <div className="size-10 bg-fill rounded-full"></div>
          <div>
            <p className="font-semibold text-[2vw] sm:text-[0.4vw] md:text-[0.5vw] lg:text-[0.6vw] xl:text-[0.8vw] flex">
              Rohit
            </p>
            <p className="text-[2vw] sm:text-[0.3vw] md:text-[0.4vw] lg:text-[0.5vw] xl:text-[0.6vw]">
              User
            </p>
          </div>
        </div>
      </aside>

      <section className="px-44  relative max-md:px-10 h-screen overflow-y-scroll overflow-x-hidden pb-8 conversation-container">
        <div className="py-10 flex flex-col items-center">
          {messages.length === 0 ? (
            <>
              <p className="font-bold text-3xl py-4 px-8 max-md:px-4 max-md:py-2 max-md:text-xl text-primary bg-white rounded-full border">
                Crustdata Assistant
              </p>
              <motion.div
                className="text-3xl font-medium mt-8 max-md:mt-3 opacity-80 max-md:text-lg"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.5 },
                  },
                }}
              >
                Good Day! How may I help you?
              </motion.div>

              <img
                src="/crustdata_logo.jpeg"
                alt="Company Logo"
                className="mt-32 w-56 md:hidden cursor-pointer"
                onClick={() => window.location.reload()}
              />
              <motion.div
                className="grid grid-cols-2 w-full gap-x-6 gap-y-10 pt-10 max-md:hidden"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.2,
                    },
                  },
                }}
              >
                {
                [
                  {
                    Icon: FaDatabase,
                    title: "API Information",
                    text: "What APIs does Crustdata offer?",
                  },
                  {
                    Icon: FaFileCode,
                    title: "Endpoint Details",
                    text: "Need information on API endpoints and their usage?",
                  },
                  {
                    Icon: FaTools,
                    title: "Technical Support",
                    text: "Facing issues while integrating or using Crustdata's APIs?",
                  },
                  {
                    Icon: FaQuestionCircle,
                    title: "Query Examples",
                    text: "Looking for example requests or API payloads?",
                  },
                  {
                    Icon: FaChartLine,
                    title: "Data Insights",
                    text: "Need guidance on accessing firmographic and growth metrics?",
                  },
                  {
                    Icon: FaShieldAlt,
                    title: "Authentication & Access",
                    text: "Learn about authorization tokens and access controls.",
                  },
                ]
                .map((card, index) => (
                  <motion.div
                    key={index}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <AiCard
                      Icon={card.Icon}
                      title={card.title}
                      text={card.text}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </>
          ) : (
            <div
              className="w-full flex flex-col gap-4 mb-24 overflow-y-hidden overflow-x-hidden h-full px-4"
              ref={parent}
            >
              {messages.map((message, index) => (
                <Message
                  key={index}
                  message={message.text}
                  isUser={message.sender === "user"}
                  isLoading={message.isLoading}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-center items-end pb-4 overflow-hidden">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(prompt);
            }}
            className="bg-white rounded-full border flex items-center justify-between px-4 w-[90%] md:w-[60%] lg:w-[50%] max-w-[800px] py-2 h-16 fixed bottom-6"
          >
            <input
              type="text"
              className={`rounded-full h-12 w-full focus:outline-none pl-4 ${
                isProcessing && "cursor-not-allowed"
              }`}
              placeholder={`${
                isProcessing ? "Processing..." : "Ask a question"
              }`}
              value={prompt}
              disabled={isProcessing}
              onChange={(e) => setPrompt(e.target.value)}
            />

            <div className="flex items-center">
              {!isProcessing && (
                <FaMicrophoneAlt
                  className={`${
                    listening
                      ? "text-red-500 animate-pulse"
                      : "hover:text-slate-600 text-slate-500"
                  } text-2xl cursor-pointer transition-colors`}
                  onClick={handleMicClick}
                />
              )}
              {!isProcessing && (
                <>
                  {isListening ? (
                    <FaStopCircle
                      className="text-red-500 text-2xl ml-4 cursor-pointer hover:text-red-600 transition-colors"
                      onClick={handleMicClick}
                    />
                  ) : (
                    <GrSend
                      className="text-slate-500 text-2xl ml-4 hover:text-slate-600 cursor-pointer transition-colors"
                      onClick={() => handleSendMessage(prompt)}
                    />
                  )}
                </>
              )}

              {isProcessing && (
                <FaStop
                  className="text-slate-500 text-2xl ml-4 hover:text-slate-600 cursor-pointer transition-colors animate-pulse"
                  onClick={handleCancelProcessing}
                />
              )}
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
