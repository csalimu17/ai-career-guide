"""
resume_parser_pipeline.py

This module implements a robust multi‑stage CV/resume parsing pipeline
designed to work reliably with a variety of document types (PDF, DOCX
and image formats) and withstand poorly formatted or creative CV layouts.

Stages of the pipeline
----------------------
1. File type detection and text extraction
   Depending on the file extension, the appropriate extractor is
   invoked. For PDF documents the ``pdfplumber`` library is used,
   DOCX files are read via ``docx2txt``, and for raster images
   ``pytesseract`` performs optical character recognition (OCR).

2. Primary parsing via PyResparser
   We attempt to use the open–source ``pyresparser`` library to
   extract structured information such as name, email, phone, skills,
   education and experience. This library uses spaCy under the hood
   and provides a quick way to obtain key resume fields. If this
   primary parser succeeds (returns a non‑empty dictionary), the
   process terminates here.

3. Fallback heuristics
   If PyResparser fails (for example due to unusual formatting,
   unsupported languages, or being unable to find key fields), the
   pipeline falls back to simple heuristics:

   * Email and phone number extraction via regular expressions.
   * Named entity recognition using spaCy to guess the candidate’s
     name if it appears near the top of the document.
   * Section based extraction: the text is tokenised into lines and
     sections such as "education", "work experience", and "skills"
     are detected via keyword matching. Content following these
     headings is collated into corresponding fields.

4. Last resort
   If both the primary parser and heuristic fallback fail to produce
   meaningful data, the pipeline returns the raw text for manual
   review. In production this text can be routed to a human in the
   loop or queued for additional processing (e.g. an LLM endpoint).
"""

import argparse
import json
import os
import re
import sys
from typing import Dict, Optional

def extract_text(file_path: str) -> Optional[str]:
    """Extract raw text from a resume file.

    Supports PDF, DOCX, TXT and common image formats. Returns the
    extracted text as a single string or ``None`` on failure.
    """
    ext = os.path.splitext(file_path)[1].lower()
    try:
        if ext == ".pdf":
            import pdfplumber
            text_parts = []
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text() or ""
                    text_parts.append(page_text)
            return "\n".join(text_parts)
        elif ext in (".doc", ".docx"):
            try:
                from docx import Document  # type: ignore
                doc = Document(file_path)
                return "\n".join(para.text for para in doc.paragraphs)
            except Exception:
                import docx2txt
                return docx2txt.process(file_path)
        elif ext in (".txt", ".rtf"):
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
        elif ext in (".png", ".jpg", ".jpeg", ".tiff", ".bmp"):
            from PIL import Image
            import pytesseract
            
            # Windows auto-detection for tesseract.exe
            if os.name == "nt" and not any(os.access(os.path.join(path, "tesseract.exe"), os.X_OK) for path in os.environ["PATH"].split(os.pathsep)):
                common_paths = [
                    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
                    r"C:\Users\PC\AppData\Local\Tesseract-OCR\tesseract.exe",
                ]
                for p in common_paths:
                    if os.path.exists(p):
                        pytesseract.pytesseract.tesseract_cmd = p
                        break
            
            image = Image.open(file_path)
            return pytesseract.image_to_string(image)
    except Exception as e:
        print(f"[extract_text] Error extracting text from {file_path}: {e}", file=sys.stderr)
        return None
    return None


def parse_with_pyresparser(text: str) -> Optional[Dict[str, any]]:
    """Attempt to parse resume using the pyresparser library.

    Returns a dictionary of structured fields if successful, otherwise
    ``None``.
    """
    try:
        from pyresparser import ResumeParser  # type: ignore
        import tempfile
        with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8") as tmp:
            tmp.write(text)
            tmp_path = tmp.name
        parser = ResumeParser()
        data = parser.extract_resume(tmp_path)  # type: ignore
        os.unlink(tmp_path)
        if data and any(data.values()):
            return data
        return None
    except ImportError:
        return None
    except Exception as e:
        print(f"[parse_with_pyresparser] parser error: {e}", file=sys.stderr)
        return None


def fallback_heuristic_parse(text: str) -> Dict[str, any]:
    """Use simple heuristics to extract contact information and sections."""
    email_regex = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
    emails = email_regex.findall(text)
    email = emails[0] if emails else None
    phone_regex = re.compile(r"(?:\+\d{1,3})?\s*(\d[\d\s-]{7,})")
    phones = [re.sub(r"\D", "", p) for p in phone_regex.findall(text)]
    phone = phones[0] if phones else None
    name = None
    try:
        import spacy
        nlp = spacy.load("en_core_web_sm")
        # Attempt to get name from PERSON NER
        doc = nlp(text[:1000])
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                name = ent.text
                break
    except Exception:
        pass
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    sections = {}
    current_section = None
    section_keywords = {
        "education": ["education", "qualifications", "academics"],
        "experience": ["experience", "work history", "professional history", "employment"],
        "skills": ["skills", "competencies", "technical skills"]
    }
    for line in lines:
        lower = line.lower()
        for section, keywords in section_keywords.items():
            if any(lower.startswith(k) for k in keywords):
                current_section = section
                sections.setdefault(section, [])
                break
        else:
            if current_section:
                sections[current_section].append(line)
    for sec, content_lines in sections.items():
        sections[sec] = "\n".join(content_lines)
    return {
        "name": name,
        "email": email,
        "phone": phone,
        "education": sections.get("education"),
        "experience": sections.get("experience"),
        "skills": sections.get("skills"),
    }


def parse_resume(file_path: str) -> Dict[str, any]:
    """Main entry point for parsing a resume file."""
    text = extract_text(file_path)
    if not text:
        return {"error": "Failed to extract text from file.", "raw_text": None}
    parsed = parse_with_pyresparser(text)
    if parsed:
        parsed["raw_text"] = text
        return parsed
    heuristics = fallback_heuristic_parse(text)
    heuristics["raw_text"] = text
    return heuristics


def main() -> None:
    parser = argparse.ArgumentParser(description="Robust resume parser pipeline")
    parser.add_argument("--input", required=True, help="Path to resume file")
    parser.add_argument("--output", help="Path to save parsed result as JSON", default=None)
    args = parser.parse_args()
    result = parse_resume(args.input)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    main()
