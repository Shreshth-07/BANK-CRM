import os
import chromadb
from app.config import CHROMA_DB_PATH

class VectorDBService:
    def __init__(self):
        self.path = CHROMA_DB_PATH
        os.makedirs(self.path, exist_ok=True)
        self.client = chromadb.PersistentClient(path=self.path)
        
        # Initialize collections (create if they don't exist)
        try:
            self.products_col = self.client.get_collection("products")
        except Exception:
            self.products_col = self.client.create_collection("products")
            
        try:
            self.crm_notes_col = self.client.get_collection("crm_notes")
        except Exception:
            self.crm_notes_col = self.client.create_collection("crm_notes")

    def query_products(self, query_text: str, n_results: int = 2):
        """Query product guidelines and return matches."""
        try:
            results = self.products_col.query(
                query_texts=[query_text],
                n_results=n_results
            )
            return results
        except Exception as e:
            print(f"[ERROR] Error querying products in ChromaDB: {e}")
            return {"documents": [[]], "metadatas": [[]], "ids": [[]]}

    def query_crm_notes(self, query_text: str, n_results: int = 5):
        """Query unstructured customer CRM notes to find semantically relevant customers."""
        try:
            results = self.crm_notes_col.query(
                query_texts=[query_text],
                n_results=n_results
            )
            return results
        except Exception as e:
            print(f"[ERROR] Error querying crm_notes in ChromaDB: {e}")
            return {"documents": [[]], "metadatas": [[]], "ids": [[]]}
            
    def get_all_notes(self):
        """Helper to return count."""
        return self.crm_notes_col.count()
        
    def get_all_products(self):
        """Helper to return count."""
        return self.products_col.count()
