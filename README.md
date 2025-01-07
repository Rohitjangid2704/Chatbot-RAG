# FastAPI Document Chatbot

This is a FastAPI-based document chatbot application that allows users to upload PDF documents, create a FAISS vector store, and interact with the documents via chat using language models.

## Installation Instructions

### Step 1: Clone the repository
Clone this repository to your local machine:

```bash
git clone https://github.com/smeett247/Scan_pro__audio_chatbot.git
cd Scan_pro__audio_chatbot


### What is happening in the code?

- **FastAPI Setup**: The FastAPI app is created and CORS middleware is added to allow frontend requests from `localhost:5173`.
- **File Uploads**: The `/upload/` endpoint allows multiple PDFs to be uploaded. These files are saved locally and processed to extract text.
- **FAISS Vector Store**: The text from uploaded PDFs is used to create a FAISS vector store, which is serialized and saved in the file `faiss_index.pkl`.
- **Chat with Documents**: The `/chat/` endpoint allows the user to query the uploaded documents. The query is sent to an external NVIDIA API to rank relevant passages from the documents.
- **Environment Variable for API Key**: The NVIDIA API key is stored in a `.env` file, which is loaded using the `python-dotenv` package for secure handling.
-**In the server folder, there is a main.py file. To run this Python file, use the following command**: uvicorn main:app --reload


  
!


# STREAMLIT


### Key Additions:

1. **Run the Streamlit Application**: 
   - The command `streamlit run nvidia_chatbot_streamlit.py` is included with instructions on how to replace it with the actual script name.

This should give users clear steps on how to set up and run the app.
