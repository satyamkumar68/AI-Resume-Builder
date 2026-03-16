from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel
from typing import List, Optional
from collections import defaultdict
import time
import uvicorn
import re
import os
from groq import Groq
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential
from dotenv import load_dotenv
from utils.pdf_extractor import extract_text_from_pdf
from core.analyzer import analyze_resume_match, extract_keywords
from core.interviewer import generate_interview_questions, evaluate_answer

load_dotenv()
API_KEY = os.getenv("API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not API_KEY:
    raise RuntimeError("CRITICAL: API_KEY environment variable is not set. Refusing to start the AI Engine unsecured.")
if not GROQ_API_KEY:
    print("WARNING: GROQ_API_KEY is not set. LLM features will fail.")

def verify_api_key(x_api_key: str = Header(None)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API Key")

# Configure Groq API
groq_client = None
if GROQ_API_KEY:
    groq_client = Groq(api_key=GROQ_API_KEY)

class MockGroqResponse:
    def __init__(self, text):
        self.text = text

# Exponential Backoff Wrapper for Groq API
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10), reraise=True)
def call_groq_with_retry(prompt):
    if not groq_client: return MockGroqResponse("")
    completion = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )
    return MockGroqResponse(completion.choices[0].message.content)

app = FastAPI(title="AI Resume Platform - NLP Engine", version="1.0.0", dependencies=[Depends(verify_api_key)])

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 50, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.request_counts = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        
        # Clean up old requests
        self.request_counts[client_ip] = [t for t in self.request_counts[client_ip] if now - t < self.window_seconds]
        
        if len(self.request_counts[client_ip]) >= self.max_requests:
            from fastapi.responses import JSONResponse
            return JSONResponse(status_code=429, content={"detail": "Too many requests. Please try again later."})
            
        self.request_counts[client_ip].append(now)
        return await call_next(request)

# Add Rate Limiter (Max 100 requests per minute per IP)
app.add_middleware(RateLimitMiddleware, max_requests=100, window_seconds=60)

@app.get("/")
def read_root():
    return {"message": "AI Engine is running API"}

@app.post("/analyze_resume")
async def analyze_resume(
    job_description: str = Form(...),
    resume_file: UploadFile = File(None),
    resume_text: str = Form(None)
):
    try:
        # Determine the source of the resume text
        final_resume_text = ""
        if resume_file:
            if not resume_file.filename.lower().endswith('.pdf'):
                raise HTTPException(status_code=400, detail="Only PDF files are supported.")
            if resume_file.content_type != 'application/pdf':
                raise HTTPException(status_code=400, detail="Invalid file type.")
            file_bytes = await resume_file.read()
            if len(file_bytes) > 5 * 1024 * 1024:
                raise HTTPException(status_code=400, detail="File too large. 5MB maximum.")
            final_resume_text = extract_text_from_pdf(file_bytes)
        elif resume_text:
            final_resume_text = resume_text
        else:
            raise HTTPException(status_code=400, detail="Must provide either a resume_file (PDF) or raw resume_text.")
            
        if not final_resume_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from the provided resume source.")
            
        # Run NLP Analysis
        analysis_result = analyze_resume_match(final_resume_text, job_description)
        
        return {
            "success": True,
            "data": analysis_result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class JDRequest(BaseModel):
    job_description: str
    num_questions: int = 5
    resume_text: Optional[str] = None
    resume_url: Optional[str] = None

class KeywordRequest(BaseModel):
    job_description: str

class EnhanceBulletRequest(BaseModel):
    bullet_point: str

@app.post("/enhance_bullet")
def enhance_bullet_point(request: EnhanceBulletRequest):
    try:
        if not request.bullet_point.strip():
             raise HTTPException(status_code=400, detail="Bullet point cannot be empty.")
        
        original = request.bullet_point.strip()
        
        if not API_KEY:
            raise HTTPException(status_code=500, detail="Gemini API Key missing.")

        if API_KEY == "super-secret-ai-key-2026":
            # Provide a cleaner mock sentence
            return {"success": True, "enhanced_bullet": f"Successfully managed and optimized '{original}', resulting in improved efficiency and a reduction in operational overhead by leveraging industry best practices."}
            
        # Model initialization handled globally
        
        prompt = f"""
        You are an expert resume writer and career coach. Please rewrite the following bullet point to be more impactful, professional, and results-oriented.
        Use strong action verbs. Do NOT add an asterisk (*) or dash (-) at the beginning of your response. Just return the raw enhanced text.
        Do NOT invent fake metrics (like 15%) unless they were provided in the original text. Maintain the original truth.
        
        Original Bullet Point:
        {original}
        """
        try:
            response = call_groq_with_retry(prompt)
            
            if not response.text:
                 raise Exception("Failed to enhance bullet point via AI.")
                 
            enhanced = response.text.strip()
            # Clean potential dashes added by LLM
            if enhanced.startswith("- ") or enhanced.startswith("• ") or enhanced.startswith("* "):
                enhanced = enhanced[2:]
                
            return {"success": True, "enhanced_bullet": enhanced}
        except Exception as ai_e:
            print(f"AI Bullet Enhance failed: {ai_e}")
            return {"success": True, "enhanced_bullet": original} # Offline Fallback: Return original
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

class GlobalRankRequest(BaseModel):
    resume_text: str

@app.post("/evaluate_global_rank")
def evaluate_global_rank(request: GlobalRankRequest):
    try:
        if not request.resume_text.strip():
             raise HTTPException(status_code=400, detail="Resume text cannot be empty.")
             
        if not API_KEY:
            raise HTTPException(status_code=500, detail="Gemini API Key missing.")

        if API_KEY == "super-secret-ai-key-2026":
            mock_json = {
                "totalYearsExperience": 5,
                "educationTier": "Bachelors",
                "skillRarity": 8,
                "impactMetricsCount": 3,
                "projectComplexity": 7
            }
            return {"success": True, "data": mock_json}
            
        # Model initialization handled globally
        
        prompt = f"""
        You are an expert technical recruiter analyzing a resume to determine its global tier.
        Extract the following quantifiable facts from the resume text exactly in this JSON format:
        {{
            "totalYearsExperience": <integer, estimate total cumulative years of work experience>,
            "educationTier": <string, one of: "High School", "Bachelors", "Masters", "PhD", "None">,
            "skillRarity": <integer 1-10, 1 being only common skills like HTML, 10 being highly specialized/rare skills>,
            "impactMetricsCount": <integer, count how many distinct times the candidate used numbers/percentages to describe impact (e.g. "increased sales by 20%").>,
            "projectComplexity": <integer 1-10, average complexity of listed projects based on tech stack and scope>
        }}
        
        Do not include markdown blocks like ```json, just output the raw JSON string. Provide realistic estimates based on the text.
        
        --- RESUME TEXT ---
        {request.resume_text}
        """
        try:
            response = call_groq_with_retry(prompt)
            
            if not response.text:
                 raise Exception("Empty response.")
                 
            json_str = response.text.strip()
            if json_str.startswith("```json"):
                json_str = json_str[7:]
            if json_str.endswith("```"):
                json_str = json_str[:-3]
                
            import json
            parsed_data = json.loads(json_str.strip())
            return {"success": True, "data": parsed_data}
        except Exception as ai_e:
            print(f"AI Global Rank failed: {ai_e}")
            # Offline Fallback
            mock_json = {
                "totalYearsExperience": 0,
                "educationTier": "None",
                "skillRarity": 5,
                "impactMetricsCount": 0,
                "projectComplexity": 5
            }
            return {"success": True, "data": mock_json}
        
    except httpx.HTTPStatusError as e:
         raise HTTPException(status_code=e.response.status_code, detail=str(e))
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract_keywords")
def get_keywords(request: KeywordRequest):
    try:
        if not request.job_description.strip():
             raise HTTPException(status_code=400, detail="Job description cannot be empty.")
             
        keywords = extract_keywords(request.job_description)
        # Return top 15 keywords
        return {"success": True, "keywords": keywords[:15]}
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate_questions")
async def get_interview_questions(request: JDRequest):
    try:
        if not request.job_description.strip():
            raise HTTPException(status_code=400, detail="Job description cannot be empty.")
            
        if API_KEY and API_KEY != "super-secret-ai-key-2026":
            # Model initialization handled globally
            context_prompt = ""
            
            final_resume_text = request.resume_text
            if request.resume_url and not final_resume_text:
                try:
                    async with httpx.AsyncClient() as client:
                        pdf_resp = await client.get(request.resume_url)
                        if pdf_resp.status_code == 200:
                            final_resume_text = extract_text_from_pdf(pdf_resp.content)
                except Exception as e:
                    print(f"Failed to fetch PDF URL: {e}")

            if final_resume_text:
                context_prompt = f"The candidate has the following resume/background:\n{final_resume_text}\n\nTailor your questions to connect their past experience to the job requirements."
                
            prompt = f"""
            You are an expert HR Manager and Technical Interviewer conducting an interview for the role defined by the Job Description below.
            {context_prompt}
            
            Based on the job description (and their resume if provided), generate exactly {request.num_questions} professional interview questions.
            Provide ONLY the questions, separated by newlines, with no numbering, bullet points, or markdown formatting.
            
            Job Description:
            {request.job_description}
            """
            try:
                response = call_groq_with_retry(prompt)
                if response.text:
                    lines = response.text.strip().split('\n')
                    questions = [q.strip() for q in lines if q.strip()][:request.num_questions]
                    if len(questions) > 0:
                        return {"success": True, "questions": questions}
            except Exception as ai_e:
                print(f"Gemini mock interview question generation failed: {ai_e}")

        # Fallback to local NLP rule-based questions
        questions = generate_interview_questions(request.job_description, request.num_questions)
        return {"success": True, "questions": questions}
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

class AnswerEvaluationRequest(BaseModel):
    question: str
    user_answer: str
    expected_keywords: List[str] = []
    resume_text: Optional[str] = None
    resume_url: Optional[str] = None

@app.post("/evaluate_answer")
async def eval_interview_answer(request: AnswerEvaluationRequest):
    try:
        if API_KEY and API_KEY != "super-secret-ai-key-2026":
            # Model initialization handled globally
            context_prompt = ""
            
            final_resume_text = request.resume_text
            if request.resume_url and not final_resume_text:
                try:
                    async with httpx.AsyncClient() as client:
                        pdf_resp = await client.get(request.resume_url)
                        if pdf_resp.status_code == 200:
                            final_resume_text = extract_text_from_pdf(pdf_resp.content)
                except Exception as e:
                    print(f"Failed to fetch PDF URL: {e}")

            if final_resume_text:
                context_prompt = f"The candidate's resume/background is:\n{final_resume_text}\nUse this context to judge if their answer aligns with their claimed experience."
            
            prompt = f"""
            You are an expert interviewer evaluating a candidate's answer to an interview question.
            {context_prompt}
            
            Question asked: {request.question}
            Candidate's answer: {request.user_answer}
            Expected technical keywords (if any): {', '.join(request.expected_keywords) if request.expected_keywords else 'None'}
            
            Evaluate their answer and return exactly this strict JSON format and nothing else:
            {{
                "score": <integer from 0 to 100 based on clarity, relevance, and keyword presence>,
                "feedback": "<string, a 2-3 sentence constructive feedback on how they can improve their answer based on the STAR method or missing details>",
                "matched_keywords": [<string array of keywords they successfully hit>]
            }}
            """
            try:
                response = call_groq_with_retry(prompt)
                if response.text:
                    json_str = response.text.strip()
                    if json_str.startswith("```json"): json_str = json_str[7:]
                    if json_str.endswith("```"): json_str = json_str[:-3]
                    import json
                    parsed_data = json.loads(json_str.strip())
                    return {"success": True, "data": parsed_data}
            except Exception as ai_e:
                print(f"Gemini answer evaluation failed: {ai_e}")

        # Fallback to local NLP rule-based evaluation
        result = evaluate_answer(request.question, request.user_answer, request.expected_keywords)
        return {"success": True, "data": result}
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))


class CoverLetterRequest(BaseModel):
    resume_text: str
    job_description: str

@app.post("/generate_cover_letter")
def generate_cover_letter(request: CoverLetterRequest):
    try:
        if not request.job_description.strip() or not request.resume_text.strip():
             raise HTTPException(status_code=400, detail="Job description and resume text cannot be empty.")
             
        if not API_KEY:
            raise HTTPException(status_code=500, detail="Server misconfigured: Gemini API Key missing.")
            
        if API_KEY == "super-secret-ai-key-2026":
            mock_letter = f"""Dear Hiring Manager,

I am writing to express my strong interest in the open position at your company. With a solid foundation in software engineering and a passion for creating efficient, scalable applications, I am eager to bring my background to your innovative team.

Based on the job description you provided, my experience perfectly aligns with your needs. I have hands-on experience building robust systems, including AI-powered features and full-stack web applications. My enclosed resume highlights my ability to adapt to new technologies, solve complex algorithms, and deliver high-quality code.

Thank you for considering my application. I would welcome the opportunity to discuss how my technical skills and enthusiasm for development can contribute to the success of your engineering team.

Sincerely,
[Your Name]"""
            return {"success": True, "cover_letter": mock_letter}
            
        # Model initialization handled globally
        
        prompt = f"""
        You are an expert career coach and executive recruiter. Write a highly professional, tailored, and persuasive cover letter for a candidate applying to the following job description.

        Use the candidate's existing resume text to highlight relevant skills and experiences that directly match the job requirements.
        Do NOT invent fake experiences. If the resume lacks certain skills mentioned in the JD, emphasize the candidate's ability to learn quickly and their transferable skills.
        
        The tone should be confident, concise, and modern. Do not use overly formal or archaic language (e.g., avoid "Enclosed please find").
        
        Format the output as a clean, structured letter with paragraphs. Include bracketed placeholders like [Employer Name] or [Date] if specific info is missing.

        --- JOB DESCRIPTION ---
        {request.job_description}

        --- CANDIDATE RESUME ---
        {request.resume_text}
        """
        
        try:
            response = call_groq_with_retry(prompt)
            if not response.text:
                 raise Exception("Failed to generate cover letter from AI.")
            return {"success": True, "cover_letter": response.text}
        except Exception as ai_e:
            print(f"AI Cover Letter failed: {ai_e}")
            # Offline Fallback Lettr
            mock_letter = f"""Dear Hiring Manager,

I am writing to express my strong interest in the open position. Based on the job description you provided, my experience perfectly aligns with your needs. 

Thank you for considering my application.

Sincerely,
Candidate"""
            return {"success": True, "cover_letter": mock_letter}
        
    except httpx.HTTPStatusError as e:
         raise HTTPException(status_code=e.response.status_code, detail=str(e))
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@app.post("/parse_linkedin")
async def parse_linkedin_pdf(file: UploadFile = File(...)):
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
        file_bytes = await file.read()
        if len(file_bytes) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. 5MB maximum.")
            
        extracted_text = extract_text_from_pdf(file_bytes)
        
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from the provided PDF.")

        # Proceed directly to Gemini AI generation

        # Model initialization handled globally
        
        prompt = f"""
        You are an expert data extractor. The following text is extracted from a LinkedIn profile PDF export.
        Extract the information and format it EXACTLY as the following JSON structure. 
        Do not include markdown blocks like ```json, just output the raw JSON string.
        Generate sequential unique string IDs for experience and education arrays (e.g., "exp-1", "edu-1").
        If a field is missing in the text, leave it as an empty string ("") or empty array ([]).
        Keep experience descriptions as bulleted lists separated by newlines.

        JSON Schema requirement:
        {{
          "contact": {{ "fullName": "", "email": "", "phone": "", "linkedin": "", "portfolio": "" }},
          "summary": "",
          "experience": [ {{ "id": "", "company": "", "role": "", "startDate": "", "endDate": "", "description": "" }} ],
          "education": [ {{ "id": "", "institution": "", "degree": "", "year": "" }} ],
          "projects": [ {{ "id": "", "title": "", "link": "", "description": "" }} ],
          "skills": ["skill1", "skill2"]
        }}

        --- LINKEDIN TEXT ---
        {extracted_text}
        """
        
        try:
            response = call_groq_with_retry(prompt)
            
            if not response.text:
                 raise Exception("Failed to parse LinkedIn data via AI.")
                 
            # Clean potential markdown formatting
            json_str = response.text.strip()
            if json_str.startswith("```json"):
                json_str = json_str[7:]
            if json_str.endswith("```"):
                json_str = json_str[:-3]
                
            import json
            parsed_data = json.loads(json_str.strip())
            return {"success": True, "data": parsed_data}
            
        except Exception as ai_e:
            print(f"Gemini LinkedIn Parsing Failed: {ai_e}")
            # Offline Fallback Empty Template
            fallback_data = {
              "contact": { "fullName": "", "email": "", "phone": "", "linkedin": "", "portfolio": "" },
              "summary": "",
              "experience": [],
              "education": [],
              "projects": [],
              "skills": []
            }
            return {"success": True, "data": fallback_data}
        
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@app.post("/parse_resume")
async def parse_prebuilt_resume_pdf(file: UploadFile = File(...)):
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
        file_bytes = await file.read()
        if len(file_bytes) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. 5MB maximum.")
            
        extracted_text = extract_text_from_pdf(file_bytes)
        
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from the provided PDF.")

        # Proceed directly to Gemini AI generation

        # Model initialization handled globally
        
        prompt = f"""
        You are an expert data extractor and resume parser. The following text is extracted from a candidate's uploaded PDF resume.
        Your goal is to intelligently parse this unstructured text and map it accurately into the following strict JSON schema.
        
        Do not include markdown blocks like ```json, just output the raw JSON string.
        Generate sequential unique string IDs for experience, education, and projects arrays (e.g., "exp-1", "edu-1").
        If a specific field is completely missing in the resume text, leave it as an empty string ("") or empty array ([]).
        For descriptions, keep them as bulleted lists separated by newlines. Do not invent information.

        JSON Schema requirement:
        {{
          "contact": {{ "fullName": "", "email": "", "phone": "", "linkedin": "", "portfolio": "" }},
          "summary": "",
          "experience": [ {{ "id": "", "company": "", "role": "", "startDate": "", "endDate": "", "description": "" }} ],
          "education": [ {{ "id": "", "institution": "", "degree": "", "year": "" }} ],
          "projects": [ {{ "id": "", "title": "", "link": "", "description": "" }} ],
          "skills": ["skill1", "skill2"]
        }}

        --- RESUME TEXT ---
        {extracted_text}
        """
        
        try:
            response = call_groq_with_retry(prompt)
            
            if not response.text:
                 raise Exception("Failed to parse Prebuilt Resume data via AI.")
                 
            # Clean potential markdown formatting
            json_str = response.text.strip()
            if json_str.startswith("```json"):
                json_str = json_str[7:]
            if json_str.endswith("```"):
                json_str = json_str[:-3]
                
            import json
            parsed_data = json.loads(json_str.strip())
            return {"success": True, "data": parsed_data}
            
        except Exception as ai_e:
            print(f"Gemini Prebuilt Resume Parsing Failed: {ai_e}")
            # Offline Fallback Empty Template
            fallback_data = {
              "contact": { "fullName": "", "email": "", "phone": "", "linkedin": "", "portfolio": "" },
              "summary": "Offline Fallback Enabled. We could not automatically extract your data right now.",
              "experience": [],
              "education": [],
              "projects": [],
              "skills": []
            }
            return {"success": True, "data": fallback_data}
            
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
