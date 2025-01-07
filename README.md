

# Crustdata API Chatbot

This repository contains a Crustdata API chatbot designed to assist users with API-related queries. The application has a frontend built with React and a backend implemented using FastAPI.

---

## 🚀 Getting Started

Follow the steps below to set up and run the project.

---

### 🖥️ Frontend Setup

1. **Clone the Repository**  
   ```bash
   git clone <your-repository-url>
   cd <your-repository-folder>

	2.	Navigate to the Client Directory

cd client


	3.	Install Dependencies

npm install


	4.	Run the Development Server

npm run dev

The frontend should now be running on http://localhost:5173 (or another port specified in the terminal).

🛠️ Backend Setup (FastAPI)
	1.	Navigate to the Server Directory

cd ../server


	2.	Set Up the Virtual Environment

python -m venv env
source env/bin/activate  # On Windows, use `env\Scripts\activate`


	3.	Install Requirements

pip install -r requirements.txt


	4.	Run the FastAPI Server

uvicorn main:app --reload

The backend should now be running on http://localhost:8000.

🧪 Testing Your Chatbot

Here are five example questions to test the chatbot:
	1.	“How can I use the Company Data Enrichment API to fetch data for multiple companies by their domains?”
	•	Tests the chatbot’s understanding of API parameters and request structure.
	2.	“What fields are available when using the fields parameter in the Company Data API?”
	•	Validates field-level and nested field explanations.
	3.	“How do I retrieve LinkedIn posts for a specific company using the LinkedIn Posts by Company API?”
	•	Evaluates endpoint-specific usage knowledge.
	4.	“What is the maximum number of companies I can screen in a single API request using the Screening API?”
	•	Checks knowledge about API limitations.
	5.	“What error will I get if I request unauthorized fields in an API response?”
	•	Tests error handling and permissions information.

📸 Example Screenshots

Example 1: Chatbot Interface

![Interface](https://github.com/Rohitjangid2704/Crustdata-API-Chatbot/blob/main/client/public/interface.png?raw=true)


Example 2: API Query and Response

![QA Image](https://github.com/Rohitjangid2704/Crustdata-API-Chatbot/blob/main/client/public/qa.png)


📝 Notes
	•	Ensure the frontend and backend are running on their respective ports before testing the chatbot.
	•	Update .env files for any necessary API keys or configuration.
	•	The chatbot relies on vectorized Crustdata documentation for accurate answers.

