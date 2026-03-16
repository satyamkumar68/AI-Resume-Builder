import fitz  # PyMuPDF
import io

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Extracts text content from a PDF file using PyMuPDF.
    
    Args:
        pdf_bytes (bytes): The raw bytes of the PDF file.
        
    Returns:
        str: The extracted text, or an empty string if extraction fails.
    """
    text = ""
    try:
        # Open the PDF from the byte stream
        pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")
        
        # Iterate through pages and extract text
        for page_num in range(len(pdf_document)):
            page = pdf_document.load_page(page_num)
            text += page.get_text("text") + "\n"
            
        pdf_document.close()
        return text.strip()
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return ""

