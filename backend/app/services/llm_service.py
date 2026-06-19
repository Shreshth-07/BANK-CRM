import os
# Suppress tokenizer parallelism and OMP/MKL thread locks on Windows reload loops
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"

from app.config import GEMINI_API_KEY, GEMINI_MODEL, USE_HF_API, HF_API_KEY, HF_MODEL, USE_GROQ_API, GROQ_API_KEY, GROQ_MODEL

class LLMService:
    # Class-level cache variables to prevent reloading model on every agent node call
    _model = None
    _mode = None
    _initialized = False

    def __init__(self):
        if LLMService._initialized:
            self.model = LLMService._model
            self.mode = LLMService._mode
            return

        self.use_hf_api = USE_HF_API
        self.hf_api_key = HF_API_KEY
        self.hf_model = HF_MODEL
        self.use_groq_api = USE_GROQ_API
        self.groq_api_key = GROQ_API_KEY
        self.groq_model = GROQ_MODEL
        self.use_local = os.getenv("USE_LOCAL_LLM", "false").lower() == "true"
        self.api_key = GEMINI_API_KEY
        
        # If Groq API is explicitly enabled and API key is present
        if self.use_groq_api and self.groq_api_key:
            try:
                self.model = GroqAPIModel(model_id=self.groq_model, api_key=self.groq_api_key)
                self.mode = "groq"
                print(f"[INFO] LLM initialized successfully with Groq API ({self.groq_model})")
            except Exception as e:
                print(f"[WARNING] Failed to load Groq API: {e}. Falling back to default checks.")
                self.model = MockChatModel()
                self.mode = "mock"
        
        # If HF API is explicitly enabled and API key is present
        elif self.use_hf_api and self.hf_api_key:
            try:
                self.model = HFAPIModel(model_id=self.hf_model, api_key=self.hf_api_key)
                self.mode = "hf_api"
                print(f"[INFO] LLM initialized successfully with Hugging Face Serverless API ({self.hf_model})")
            except Exception as e:
                print(f"[WARNING] Failed to load Hugging Face API: {e}. Falling back to default checks.")
                self.model = MockChatModel()
                self.mode = "mock"
        
        # If API key is present and user explicitly sets USE_LOCAL_LLM=false, use Gemini
        elif self.api_key and not self.use_local:
            try:
                from langchain_google_genai import ChatGoogleGenerativeAI
                self.model = ChatGoogleGenerativeAI(
                    model=GEMINI_MODEL,
                    google_api_key=self.api_key,
                    temperature=0.2
                )
                self.mode = "gemini"
                print(f"[INFO] LLM initialized successfully with ChatGoogleGenerativeAI ({GEMINI_MODEL})")
            except Exception as e:
                print(f"[WARNING] Failed to load Gemini API model: {e}. Falling back to local model check.")
                self.model = MockChatModel()
                self.mode = "mock"

        # Try to load the local Hugging Face model
        elif self.use_local:
            try:
                # Import dependencies dynamically so server runs even if packages are not yet installed
                import torch
                # Restrict CPU thread count to 1 to avoid thread thrashing and deadlocks on Windows
                torch.set_num_threads(1)
                from transformers import pipeline
                self.model = LocalHuggingFaceModel(model_id="Qwen/Qwen2.5-1.5B-Instruct")
                self.mode = "local"
            except ImportError:
                print("[WARNING] transformers or torch is not installed. Operating in MOCK LLM mode.")
                print("[TIP] To use the local Hugging Face LLM, run: pip install transformers torch accelerate")
                self.model = MockChatModel()
                self.mode = "mock"
            except Exception as e:
                print(f"[WARNING] Failed to initialize local Hugging Face model: {e}. Falling back to MOCK mode.")
                self.model = MockChatModel()
                self.mode = "mock"
        else:
            self.model = MockChatModel()
            self.mode = "mock"

        # Cache the initialized model and mode
        LLMService._model = self.model
        LLMService._mode = self.mode
        LLMService._initialized = True

    def get_model(self):
        return self.model


class GroqAPIModel:
    """Wrapper around Groq API to match LangChain invoke interface."""
    def __init__(self, model_id: str, api_key: str):
        self.model_id = model_id
        self.api_key = api_key
        self.url = "https://api.groq.com/openai/v1/chat/completions"

    def invoke(self, messages, **kwargs):
        import urllib.request
        import json
        
        # Format messages into OpenAI chat structure
        groq_messages = []
        for msg in messages:
            role = "user"
            content = ""
            if isinstance(msg, dict):
                role = msg.get("role", "user")
                content = msg.get("content", "")
            else:
                msg_type = getattr(msg, "type", "human")
                if msg_type == "system":
                    role = "system"
                elif msg_type == "ai":
                    role = "assistant"
                else:
                    role = "user"
                content = getattr(msg, "content", "")
                
            groq_messages.append({"role": role, "content": content})

        payload = {
            "model": self.model_id,
            "messages": groq_messages,
            "temperature": 0.2,
            "max_tokens": 1024
        }
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        
        try:
            req = urllib.request.Request(
                self.url,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=30) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                choices = res_data.get("choices", [])
                if choices:
                    content = choices[0].get("message", {}).get("content", "")
                    return MockResponse(content)
                else:
                    raise Exception(f"Unexpected Groq response format: {res_data}")
        except Exception as e:
            if hasattr(e, "read"):
                error_details = e.read().decode("utf-8")
                print(f"[ERROR] Groq API call failed: {e}. Details: {error_details}")
                raise Exception(f"Groq API Error: {error_details}")
            else:
                print(f"[ERROR] Groq API call failed: {e}")
                raise e


class HFAPIModel:
    """Wrapper around Hugging Face Serverless Inference API to match LangChain invoke interface."""
    def __init__(self, model_id: str, api_key: str):
        self.model_id = model_id
        self.api_key = api_key
        # We will use the chat completions API endpoint which is standard on HF Inference Router
        self.url = "https://router.huggingface.co/v1/chat/completions"

    def invoke(self, messages, **kwargs):
        import urllib.request
        import json
        
        # Format messages into HF chat structure
        hf_messages = []
        for msg in messages:
            role = "user"
            content = ""
            if isinstance(msg, dict):
                role = msg.get("role", "user")
                content = msg.get("content", "")
            else:
                msg_type = getattr(msg, "type", "human")
                if msg_type == "system":
                    role = "system"
                elif msg_type == "ai":
                    role = "assistant"
                else:
                    role = "user"
                content = getattr(msg, "content", "")
                
            hf_messages.append({"role": role, "content": content})

        payload = {
            "model": self.model_id,
            "messages": hf_messages,
            "temperature": 0.2,
            "max_tokens": 1024
        }
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        
        try:
            req = urllib.request.Request(
                self.url,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=30) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                choices = res_data.get("choices", [])
                if choices:
                    content = choices[0].get("message", {}).get("content", "")
                    return MockResponse(content)
                else:
                    raise Exception(f"Unexpected HF response format: {res_data}")
        except Exception as e:
            if hasattr(e, "read"):
                error_details = e.read().decode("utf-8")
                print(f"[ERROR] Hugging Face API call failed: {e}. Details: {error_details}")
                raise Exception(f"HF API Error: {error_details}")
            else:
                print(f"[ERROR] Hugging Face API call failed: {e}")
                raise e


class LocalHuggingFaceModel:
    """Wrapper around Hugging Face Pipeline to match LangChain invoke interface."""
    def __init__(self, model_id: str = "Qwen/Qwen2.5-1.5B-Instruct"):
        import torch
        # Restrict CPU thread count to 1 to avoid thread thrashing and deadlocks on Windows
        torch.set_num_threads(1)
        from transformers import pipeline
        
        print(f"[INFO] Loading local Hugging Face model '{model_id}'...")
        print("[INFO] This model will download and cache locally on first execution. Size: ~950MB.")
        
        # Detect device
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.torch_dtype = torch.float16 if self.device == "cuda" else torch.float32
        
        # Build text-generation pipeline
        # device_map="auto" leverages multiple GPUs if available
        self.pipe = pipeline(
            "text-generation",
            model=model_id,
            torch_dtype=self.torch_dtype,
            device_map="auto" if self.device == "cuda" else None,
            device=0 if self.device == "cuda" and not torch.cuda.device_count() > 1 else -1
        )
        print(f"[INFO] Local LLM loaded successfully on '{self.device}' device.")

    def invoke(self, messages, **kwargs):
        # Format messages into HF chat structure
        hf_messages = []
        is_json_request = False
        
        for msg in messages:
            role = "user"
            content = ""
            if isinstance(msg, dict):
                role = msg.get("role", "user")
                if role == "system":
                    role = "system"
                content = msg.get("content", "")
            else:
                msg_type = getattr(msg, "type", "human")
                if msg_type == "system":
                    role = "system"
                elif msg_type == "ai":
                    role = "assistant"
                else:
                    role = "user"
                content = getattr(msg, "content", "")
                
            if "json" in content.lower():
                is_json_request = True
                
            hf_messages.append({"role": role, "content": content})

        # Generate prompt using model-specific chat template
        prompt = self.pipe.tokenizer.apply_chat_template(
            hf_messages,
            tokenize=False,
            add_generation_prompt=True
        )
        
        # If it is a JSON request, we pre-fill the assistant response with "{"
        if is_json_request:
            prompt = prompt.rstrip()
            if not prompt.endswith("{"):
                prompt = prompt + "{"
                
        # Determine stop tokens dynamically
        stop_token_ids = [self.pipe.tokenizer.eos_token_id]
        im_end_id = self.pipe.tokenizer.convert_tokens_to_ids("<|im_end|>")
        if im_end_id is not None:
            stop_token_ids.append(im_end_id)
        
        # Execute local inference
        outputs = self.pipe(
            prompt,
            max_new_tokens=128,
            max_length=None,
            do_sample=True,
            temperature=0.2,
            top_p=0.9,
            pad_token_id=self.pipe.tokenizer.eos_token_id,
            eos_token_id=stop_token_ids
        )
        
        # Extract generated response text
        response_text = outputs[0]["generated_text"][len(prompt):].strip()
        
        # Prepend the pre-filled "{" back if it was a JSON request
        if is_json_request:
            response_text = "{" + response_text
            
            # Extract only the JSON block to be absolutely sure
            start = response_text.find('{')
            end = response_text.rfind('}')
            if start != -1 and end != -1 and end > start:
                response_text = response_text[start:end+1]
                
        return MockResponse(response_text)


class MockChatModel:
    """Mock model to generate realistic replies if Gemini key and local LLM modules are missing."""
    def invoke(self, messages, **kwargs):
        user_msg = ""
        system_prompt = ""
        
        for msg in messages:
            if isinstance(msg, dict):
                role = msg.get("role", "user")
                content = msg.get("content", "")
                if role == "system":
                    system_prompt = content
                else:
                    user_msg = content
            else:
                msg_type = getattr(msg, "type", "human")
                content = getattr(msg, "content", "")
                if msg_type == "system":
                    system_prompt = content
                else:
                    user_msg = content
                
        content = "Mock response from LLM"
        
        if "Planner" in system_prompt or "planner" in user_msg.lower():
            if "credit card" in user_msg.lower() or "card" in user_msg.lower():
                content = '{"scenario": "card", "target_income": 120000, "description": "Search for premium card conversions", "min_relationship_years": 2}'
            elif "dormant" in user_msg.lower():
                content = '{"scenario": "dormant", "target_income": 0, "description": "Search for dormant account re-engagement", "min_relationship_years": 5}'
            else:
                content = '{"scenario": "loan", "target_income": 45000, "description": "Search for high-value customers likely to convert for a personal loan", "min_relationship_years": 1}'
                
        elif "Conversion Prediction" in system_prompt:
            content = '{"conversion_probability": 85.5, "reasons": ["Regular salary credits detected", "High average balance maintained", "Recent loan inquiry in CRM interactions", "Low active liabilities"]}'
            
        elif "Product Recommendation" in system_prompt:
            if "card" in user_msg.lower():
                content = '{"recommended_product": "Apex Elite Premium Credit Card", "why": "The customer has an income over $120,000, high spending on travel/dining, and has specifically inquired about premium card benefits like airport lounges."}'
            elif "dormant" in user_msg.lower():
                content = '{"recommended_product": "Platinum Savings Account", "why": "The customer is dormant but has long relationship years. Re-engaging them with our high-yield 4.65% APY savings account is an excellent low-risk incentive."}'
            else:
                content = '{"recommended_product": "Personal Loan", "why": "Customer is seeking $30,000 for home improvement and meets the $45,000 annual income requirement with clean repayment history and no active loans."}'
                
        elif "Personalization" in system_prompt:
            content = '{"whatsapp_message": "Hello! We noticed you recently inquired about our credit services. We are pleased to offer you pre-approved rates starting at 8.99% for our Personal Loans. Reply YES to connect with a specialist today. Disclaimer: Rates subject to credit approval.", "email_message": "Dear Valued Customer, Thank you for choosing Apex Bank. Based on your relationship, we are pleased to offer you exclusive rates on our Personal Loans. Subject to credit approval."}'
            
        elif "RM Summary" in system_prompt:
            content = '{"summary": "We identified top candidates for your campaign. Outreach templates have been generated."}'
            
        return MockResponse(content)


class MockResponse:
    def __init__(self, content):
        self.content = content
        
    def __repr__(self):
        return f"MockResponse(content={self.content})"
