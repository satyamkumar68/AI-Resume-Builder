import re
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Load the English NLP model
nlp = spacy.load("en_core_web_sm")

def clean_text(text: str) -> str:
    """
    Cleans unstructured text by removing special characters, URLs, and extra whitespace.
    """
    # Remove URLs
    text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
    # Remove everything except alphabets, numbers, and basic punctuation
    text = re.sub(r'[^a-zA-Z0-9\s.,;-]', '', text)
    # Remove extra spaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text.lower()

def extract_keywords(text: str) -> list[str]:
    """
    Extracts key nouns, proper nouns, and recognized named entities (like skills) using spaCy.
    """
    doc = nlp(text)
    keywords = set()
    
    # Add named entities (e.g. Orgs, Locations, Products)
    for ent in doc.ents:
        if ent.label_ not in ['DATE', 'TIME', 'PERCENT', 'MONEY', 'QUANTITY', 'ORDINAL', 'CARDINAL']:
            keywords.add(ent.text.lower())
            
    # Add Noun Chunks (multi-word phrases like "Machine Learning" or "Full Stack")
    for chunk in doc.noun_chunks:
        if not chunk.root.is_stop and len(chunk.text) > 3:
            keywords.add(chunk.text.lower())
            
    # Add relevant Nouns/Proper Nouns (Often skills, tools, methodologies)
    for token in doc:
        if token.pos_ in ['NOUN', 'PROPN'] and not token.is_stop and len(token.text) > 2:
            keywords.add(token.text.lower())
            
    return list(keywords)

def extract_section_analysis(clean_text: str) -> dict:
    """
    Scans the clean resume text for standard headers to ensure structural integrity.
    """
    sections = {
        "experience": bool(re.search(r'\b(experience|history|employment|work)\b', clean_text)),
        "education": bool(re.search(r'\b(education|academic|degree|university)\b', clean_text)),
        "skills": bool(re.search(r'\b(skills|technologies|tools|expertise)\b', clean_text)),
        "summary": bool(re.search(r'\b(summary|objective|profile|about)\b', clean_text))
    }
    return sections

def calculate_base_ats_score(clean_text: str, sections: dict) -> int:
    """
    Computes a base ATS score out of 100 based entirely on the structural quality of the resume.
    """
    score = 100
    
    # Check Section Presence (Deduct 15 points per missing standard section)
    missing_sections = sum(1 for present in sections.values() if not present)
    score -= (missing_sections * 15)
    
    # Check Length (If too short, it likely lacks detail)
    word_count = len(clean_text.split())
    if word_count < 150:
        score -= 20
    elif word_count < 300:
        score -= 10
        
    # Check Contact Info (Emails/Phones usually bypass basic text cleaning due to numbers/symbols)
    # Very basic heuristic: if numbers are completely absent, probably missing phone/dates
    if not bool(re.search(r'\d', clean_text)):
         score -= 10
         
    return max(0, score)

def calculate_similarity_score(resume_text: str, job_description: str) -> float:
    """
    Calculates a match percentage between the resume and job description using TF-IDF and Cosine Similarity.
    """
    docs = [resume_text, job_description]
    
    # Convert text into TF-IDF vectors
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(docs)
    
    # Calculate Cosine Similarity between doc 0 (resume) and doc 1 (JD)
    similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
    
    # Return as percentage (0-100)
    return round(similarity * 100, 2)

def analyze_resume_match(resume_text: str, jd_text: str) -> dict:
    """
    Full pipeline: Cleans text, computes similarity, and identifies missing keywords.
    """
    clean_resume = clean_text(resume_text)
    clean_jd = clean_text(jd_text)
    
    score = calculate_similarity_score(clean_resume, clean_jd)
    
    resume_keywords = extract_keywords(clean_resume)
    jd_keywords = extract_keywords(clean_jd)
    
    # Structural Analysis
    section_analysis = extract_section_analysis(clean_resume)
    base_score = calculate_base_ats_score(clean_resume, section_analysis)
    
    # Calculate Matches and Misses
    matched_keywords = [kw for kw in jd_keywords if kw in resume_keywords]
    missing_keywords = [kw for kw in jd_keywords if kw not in resume_keywords]
    
    # Simple feedback heuristic based on score
    feedback = ""
    if score >= 80:
        feedback = "Excellent match! Your resume is highly optimized for this role."
    elif score >= 50:
        feedback = "Good match. Consider adding more specific skills from the Job Description."
    else:
        feedback = "Weak match. Try tailoring your experience and skills to the requested job description keywords."
        
    return {
        "score": score,
        "base_score": base_score,
        "section_analysis": section_analysis,
        "matched_keywords": matched_keywords[:15],
        "missing_keywords": missing_keywords[:15], 
        "feedback": feedback
    }

