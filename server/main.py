from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import base64
import pickle
import json
import requests
from langchain_nvidia_ai_endpoints import ChatNVIDIA, NVIDIAEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from PyPDF2 import PdfReader
from langchain.schema import Document
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv  
from pydantic import BaseModel


load_dotenv()

NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")

if not NVIDIA_API_KEY:
    raise ValueError("NVIDIA API Key is missing. Please set it in the .env file.")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],  
)

DOCS_DIR = "./uploaded_docs"
os.makedirs(DOCS_DIR, exist_ok=True)

vector_store_path = "faiss_index.faiss"
vectorstore = None

llm = ChatNVIDIA(model="meta/llama-3.1-70b-instruct", temperature=0.5)
document_embedder = NVIDIAEmbeddings(model="nvidia/nv-embedqa-mistral-7b-v2", model_type="passage")

def display_pdf(file):
    base64_pdf = base64.b64encode(file.read()).decode('utf-8')
    pdf_display = f'<iframe src="data:application/pdf;base64,{base64_pdf}" width="100%" height="600" type="application/pdf"></iframe>'
    return pdf_display

@app.post("/upload/")
async def upload_files(files: list[UploadFile] = File(...)):
    global vectorstore
    uploaded_files = []
    for file in files:
        file_path = os.path.join(DOCS_DIR, file.filename)
        with open(file_path, "wb") as f:
            f.write(await file.read())
        uploaded_files.append(file_path)

    if not vectorstore:
        raw_documents = []
        for uploaded_file in uploaded_files:
            pdf_reader = PdfReader(uploaded_file)
            text = "".join(page.extract_text() for page in pdf_reader.pages)
            raw_documents.append(Document(page_content=text, metadata={"name": uploaded_file}))

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=400, chunk_overlap=50)
        documents = text_splitter.split_documents(raw_documents)

        with open(vector_store_path, "wb") as f:
            vectorstore = FAISS.from_documents(documents, document_embedder)
            pickle.dump(vectorstore, f)
        return {"message": "FAISS vector store created and uploaded successfully."}
    return {"message": "Vector store already exists."}


class UserInput(BaseModel):
    user_input: str
# Route for chatting with the document
@app.post("/ask/")
async def chat_with_document(user_input: UserInput):
    user_input = user_input.user_input
    print(user_input)
    if not vectorstore:
        raise HTTPException(status_code=404, detail="No vector store or documents available.")
    
    # Retrieve documents from vectorstore
    retriever = vectorstore.as_retriever()
    docs = retriever.invoke(user_input)
    passages = [doc.page_content for doc in docs]
    indexes = [doc.metadata for doc in docs]

    invoke_url = "https://ai.api.nvidia.com/v1/retrieval/nvidia/nv-rerankqa-mistral-4b-v3/reranking"
    headers = {
        "Authorization": f"Bearer {NVIDIA_API_KEY}",
        "Accept": "application/json",
    }
    payload = {
        "model": "nvidia/nv-rerankqa-mistral-4b-v3",
        "query": {"text": user_input},  # User input
        "passages": [{"text": passage} for passage in passages],
    }

    response = requests.post(invoke_url, headers=headers, json=payload)
    response.raise_for_status()
    response_body = response.json()

    reranked_passages = response_body.get("ranked_passages", [])
    top_responses = reranked_passages[:10]
    top_indexes = [indexes[passages.index(passage["text"])] for passage in top_responses]

    context = "\n".join(
        [f"Context: {response['text']} (Index: {index})"
         for response, index in zip(top_responses, top_indexes)]
    )

    augmented_input = f"{context}\nQuestion: {user_input}\n"

    prompt_template = ChatPromptTemplate.from_messages([
    ("system", '''You are an intelligent chatbot assistant for Crustdata, a platform that provides programmatic access to firmographic and growth metrics data via APIs. Your responsibilities include helping users understand and interact with Crustdata's APIs effectively. Use only the information from the Crustdata API documentation provided to answer questions. Stick strictly to the scope of these APIs:

    - Enrichment: Company Data API
    - LinkedIn Company Search API (real-time)
    - LinkedIn Posts by Company API (real-time)
    - People Profile Enrichment API
    - Screening APIs
    - Dataset APIs (including LinkedIn, Glassdoor, and other growth metrics)

    Guidelines:
    - Provide API-specific information only; do NOT make assumptions or offer advice outside the documentation.
    - Do NOT mention the name of the document or refer to it explicitly in your responses.
    - Respond concisely and professionally, using bullet points for clarity.
    - Highlight common API parameters, use cases, error handling, and limitations when relevant.
    - If asked for examples, provide them as per the documented examples and schemas.
    - For queries beyond the scope of Crustdata APIs, politely inform the user that the information is unavailable.
    - Always verify that your response aligns strictly with the API documentation before providing it.

    Example Response Structure:
    If asked, "How can I fetch data for multiple companies using the Company Data Enrichment API?":
    - Use the `company_domain` parameter with a comma-separated list (up to 25 domains).
    - Include the `auth_token` in the header for authorization.
    - Example Request:
      ```
      curl 'https://api.crustdata.com/screener/company?company_domain=example.com,other.com' \\
        --header 'Authorization: Token $auth_token' \\
        --header 'Accept: application/json'
      ```
    - Default fields in the response include top-level company data unless specified using the `fields` parameter.

    Remember to adhere strictly to the provided documentation to ensure accuracy.'''),
    ("human", "{input}")
])
    chain = prompt_template | llm | StrOutputParser()
    full_response = chain.invoke({"input": augmented_input})

    with open("re_ranked_response.txt", "a", encoding="utf-8") as file:
        file.write(f"Query: {user_input}\nResponse: {full_response}\n\n")

    embeddings = document_embedder.embed_documents([user_input])
    embedding_data = embeddings[0] if isinstance(embeddings[0], list) else embeddings[0].tolist()
    with open("embeddings.json", "a") as file:
        json.dump({"query": user_input, "embeddings": embedding_data}, file)
        file.write("\n")

    return {"response": full_response}


'''@app.get("/pdf/{file_name}", response_class=HTMLResponse)
async def get_pdf(file_name: str):
    try:
        file_path = os.path.join(DOCS_DIR, file_name)
        with open(file_path, "rb") as f:
            pdf_display = display_pdf(f)
        return pdf_display
    except Exception as e:
        raise HTTPException(status_code=404, detail="PDF file not found.")'''

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
