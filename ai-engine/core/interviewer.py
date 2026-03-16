from typing import List, Dict
import random
import spacy

nlp = spacy.load("en_core_web_sm")

# Fallback question banks
GENERAL_QUESTIONS = [
    "Tell me about yourself and your background.",
    "What are your greatest strengths?",
    "What do you consider to be your weaknesses?",
    "Describe a time when you faced a challenge at work and how you overcame it.",
    "Where do you see yourself in five years?"
]

TECHNICAL_PREFIXES = [
    "Can you explain your experience with ",
    "How have you used ",
    "Describe a project where you implemented ",
    "What is your proficiency level in ",
    "What are the best practices when working with "
]

def extract_key_skills_from_jd(jd_text: str) -> List[str]:
    """Extracts potential technical skills/keywords from a job description to use in questions."""
    doc = nlp(jd_text)
    skills = set()
    for token in doc:
        # Looking for nouns and proper nouns that might be technologies
        if token.pos_ in ['NOUN', 'PROPN'] and not token.is_stop and len(token.text) > 2:
            skills.add(token.text)
    
    # Return up to 10 random skills to keep questions varied
    skill_list = list(skills)
    random.shuffle(skill_list)
    return skill_list[:10]

def generate_interview_questions(job_description: str, num_questions: int = 5) -> List[str]:
    """Generates a mix of general and technical interview questions based on the JD."""
    questions = []
    
    # Always include 1 or 2 general questions
    num_general = min(2, num_questions)
    questions.extend(random.sample(GENERAL_QUESTIONS, num_general))
    
    # Generate technical questions based on JD keywords
    num_technical = num_questions - num_general
    if num_technical > 0 and job_description.strip():
        skills = extract_key_skills_from_jd(job_description)
        for i in range(min(num_technical, len(skills))):
            prefix = random.choice(TECHNICAL_PREFIXES)
            questions.append(f"{prefix}{skills[i]}?")
            
    # If we didn't have enough skills in the JD, fill the rest with random general questions
    while len(questions) < num_questions:
        remaining_general = [q for q in GENERAL_QUESTIONS if q not in questions]
        if not remaining_general:
            break
        questions.append(random.choice(remaining_general))
        
    return questions

def evaluate_answer(question: str, user_answer: str, expected_keywords: List[str] = None) -> Dict:
    """Evaluates the user's answer for length, keyword presence, and basic sentiment/clarity."""
    
    doc = nlp(user_answer)
    word_count = len([token for token in doc if not token.is_punct])
    
    # Basic Clarity / Length Check
    if word_count < 10:
        feedback = "Your answer is quite brief. Try to use the STAR method (Situation, Task, Action, Result) to provide more detail."
        score = 40
    elif word_count > 150:
        feedback = "Good detail, but try to be more concise to keep the interviewer engaged."
        score = 80
    else:
        feedback = "Good length and clarity."
        score = 85
        
    # Keyword Checking (Optional)
    matched_keywords = []
    if expected_keywords:
        answer_lower = user_answer.lower()
        for kw in expected_keywords:
            if kw.lower() in answer_lower:
                matched_keywords.append(kw)
                
        # Boost score slightly for hitting expected keywords
        if matched_keywords:
            score = min(100, score + (len(matched_keywords) * 5))
            feedback += f" Great job mentioning relevant context ({', '.join(matched_keywords)})."
            
    return {
        "score": score,
        "feedback": feedback,
        "matched_keywords": matched_keywords
    }
