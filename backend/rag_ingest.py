import os
import chromadb
from chromadb.utils import embedding_functions
from sentence_transformers import SentenceTransformer
import glob
from pypdf import PdfReader

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DOCS_DIR = os.path.join(BASE_DIR, 'documents')
DB_DIR = os.path.join(BASE_DIR, 'chroma_db')

# Initialize ChromaDB
client = chromadb.PersistentClient(path=DB_DIR)

# Use a local embedding model (lightweight)
# 'all-MiniLM-L6-v2' is standard for RAG
EMBEDDING_MODEL_NAME = 'all-MiniLM-L6-v2'
embedding_func = embedding_functions.SentenceTransformerEmbeddingFunction(model_name=EMBEDDING_MODEL_NAME)

collection = client.get_or_create_collection(
    name="hospital_protocols",
    embedding_function=embedding_func
)

def ingest_documents():
    print(f"📂 Scanning {DOCS_DIR}...")
    
    files = glob.glob(os.path.join(DOCS_DIR, '*'))
    documents = []
    ids = []
    metadatas = []
    
    for file_path in files:
        filename = os.path.basename(file_path)
        print(f"   Processing {filename}...")
        
        content = ""
        if filename.endswith('.txt'):
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        elif filename.endswith('.pdf'):
            reader = PdfReader(file_path)
            for page in reader.pages:
                content += page.extract_text() + "\n"
        
        if content:
            # Simple chunking (by paragraph or fixed size)
            # For now, let's split by double newlines (sections)
            chunks = content.split('\n\n')
            for i, chunk in enumerate(chunks):
                if chunk.strip():
                    documents.append(chunk.strip())
                    ids.append(f"{filename}_{i}")
                    metadatas.append({"source": filename})
    
    if documents:
        print(f"🚀 Upserting {len(documents)} chunks to ChromaDB...")
        collection.upsert(
            documents=documents,
            ids=ids,
            metadatas=metadatas
        )
        print("✅ Ingestion Complete!")
    else:
        print("⚠️ No documents found or empty content.")

if __name__ == "__main__":
    ingest_documents()
