# app.py - Edu Helper AI Streamlit Application
import streamlit as st
import streamlit.components.v1 as components
import PyPDF2
import io
import base64
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import gtts
import tempfile
import os

# Page configuration
st.set_page_config(
    page_title="Edu Helper AI",
    page_icon="📚",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# CSS styling to match modern UI design
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

/* Hide default Streamlit elements */
#MainMenu, footer, header {visibility: hidden;}
.stApp > header {display: none;}

/* Main container styling */
.main .block-container {
    padding-top: 0rem;
    padding-bottom: 0rem;
    max-width: 100%;
}

/* Hero section */
.hero {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 4rem 2rem;
    text-align: center;
    border-radius: 0;
    margin: -1rem -1rem 2rem -1rem;
}

.hero h1 {
    font-family: 'Inter', sans-serif;
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: 1rem;
    line-height: 1.2;
}

.hero p {
    font-size: 1.2rem;
    opacity: 0.9;
    margin-bottom: 2rem;
}

/* Section styling */
.section {
    padding: 3rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.section h2 {
    font-family: 'Inter', sans-serif;
    font-size: 2.5rem;
    margin-bottom: 2rem;
    color: #2d3748;
    text-align: center;
}

/* Feature cards */
.features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
    margin: 2rem 0;
}

.feature-card {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    text-align: center;
}

.feature-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 30px rgba(0,0,0,0.15);
}

.feature-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
}

.feature-card h3 {
    font-family: 'Inter', sans-serif;
    color: #2d3748;
    margin-bottom: 1rem;
}

/* Demo card */
.demo-card {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    margin: 2rem 0;
}

.demo-card h4 {
    color: #667eea;
    margin-bottom: 1rem;
}

.demo-source {
    opacity: 0.7;
    font-style: italic;
    margin-top: 1rem;
}

/* Upload area styling */
.upload-area {
    border: 2px dashed #667eea;
    border-radius: 12px;
    padding: 3rem 2rem;
    text-align: center;
    background: #f8faff;
    margin: 2rem 0;
    transition: border-color 0.3s ease;
}

.upload-area:hover {
    border-color: #764ba2;
}

/* Results styling */
.results-container {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    margin: 2rem 0;
}

/* Testimonials */
.testimonials-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin: 2rem 0;
}

.testimonial-card {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    text-align: center;
}

/* About section */
.about-section {
    background: linear-gradient(135deg, #2d3748, #4a5568);
    color: white;
    padding: 3rem 2rem;
    border-radius: 12px;
    text-align: center;
    margin: 3rem 0;
}

.about-links {
    margin-top: 2rem;
}

.about-link {
    display: inline-block;
    margin: 0 0.5rem;
    padding: 0.6rem 1.2rem;
    background: #667eea;
    color: white;
    text-decoration: none;
    border-radius: 8px;
    transition: all 0.2s ease;
}

.about-link:hover {
    background: #5a67d8;
    transform: translateY(-2px);
}

/* CTA section */
.cta-section {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    padding: 4rem 2rem;
    text-align: center;
    border-radius: 12px;
    margin: 3rem 0;
}

/* Button styling */
.stButton > button {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0.5rem 1rem;
    font-weight: 500;
    transition: all 0.2s ease;
}

.stButton > button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* Audio player styling */
.audio-player {
    margin: 1rem 0;
}

/* Search results */
.search-result {
    background: #f8faff;
    padding: 1rem;
    border-radius: 8px;
    margin: 0.5rem 0;
    border-left: 4px solid #667eea;
}

</style>
""", unsafe_allow_html=True)

# Initialize session state
if 'processed_text' not in st.session_state:
    st.session_state.processed_text = ""
if 'summary' not in st.session_state:
    st.session_state.summary = ""
if 'flashcards' not in st.session_state:
    st.session_state.flashcards = []
if 'embeddings' not in st.session_state:
    st.session_state.embeddings = None
if 'text_chunks' not in st.session_state:
    st.session_state.text_chunks = []

# Load embedding model (cached)
@st.cache_resource
def load_embedding_model():
    return SentenceTransformer('all-MiniLM-L6-v2')

# Extract text from PDF
def extract_text_from_pdf(pdf_file):
    try:
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        st.error(f"Error extracting text from PDF: {str(e)}")
        return ""

# Extract text from TXT file
def extract_text_from_txt(txt_file):
    try:
        return txt_file.read().decode('utf-8')
    except Exception as e:
        st.error(f"Error reading text file: {str(e)}")
        return ""

# Generate AI summary (simulated)
def generate_summary(text):
    # Simulated AI summary - in production, use actual AI models
    sentences = text.split('.')[:5]  # Take first 5 sentences
    summary = '. '.join([s.strip() for s in sentences if s.strip()]) + '.'
    return f"**Key Points Summary:**\n\n{summary}\n\n**Main Topics:** The document covers fundamental concepts including definitions, methodologies, and practical applications relevant to the subject matter."

# Generate flashcards (simulated)
def generate_flashcards(text, num_cards=5):
    # Simulated flashcard generation
    flashcards = []
    topics = ["Definition", "Key Concept", "Important Term", "Method", "Application"]
    
    for i in range(min(num_cards, len(topics))):
        flashcard = {
            "front": f"What is the main {topics[i].lower()} discussed in this section?",
            "back": f"The {topics[i].lower()} refers to the core principles and methodologies outlined in the source material, emphasizing practical understanding and application."
        }
        flashcards.append(flashcard)
    
    return flashcards

# Text-to-speech function
def text_to_speech(text):
    try:
        tts = gtts.gTTS(text=text[:500], lang='en')  # Limit text length
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
        tts.save(temp_file.name)
        
        with open(temp_file.name, 'rb') as f:
            audio_bytes = f.read()
        
        os.unlink(temp_file.name)
        return audio_bytes
    except Exception as e:
        st.error(f"Error generating audio: {str(e)}")
        return None

# Semantic search function
def semantic_search(query, text_chunks, embeddings, model, top_k=3):
    if not text_chunks or embeddings is None:
        return []
    
    try:
        query_embedding = model.encode([query])
        similarities = cosine_similarity(query_embedding, embeddings)[0]
        top_indices = np.argsort(similarities)[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            if similarities[idx] > 0.3:  # Threshold for relevance
                results.append({
                    'text': text_chunks[idx],
                    'score': similarities[idx]
                })
        return results
    except Exception as e:
        st.error(f"Error in semantic search: {str(e)}")
        return []

# Hero section
st.markdown("""
<div class="hero">
    <h1>Transform Your Notes & Accelerate Learning</h1>
    <p>Instant summaries, flashcards, audio notes, and semantic search — all in one AI platform.</p>
</div>
""", unsafe_allow_html=True)

# Features section
st.markdown("""
<div class="section">
    <h2>Key Features</h2>
    <div class="features-grid">
        <div class="feature-card">
            <div class="feature-icon">📝</div>
            <h3>AI Summaries</h3>
            <p>Condense textbooks and lecture notes into bite-sized insights.</p>
        </div>
        <div class="feature-card">
            <div class="feature-icon">🃏</div>
            <h3>Flashcards</h3>
            <p>Generate effective flashcards automatically for spaced repetition.</p>
        </div>
        <div class="feature-card">
            <div class="feature-icon">🔊</div>
            <h3>Audio Notes</h3>
            <p>Listen to summaries anywhere — perfect for on-the-go learning.</p>
        </div>
        <div class="feature-card">
            <div class="feature-icon">🔍</div>
            <h3>Semantic Search</h3>
            <p>Ask natural-language questions and get answers from your documents.</p>
        </div>
    </div>
</div>
""", unsafe_allow_html=True)

# Demo section
st.markdown("""
<div class="section">
    <h2>Live Demo Snippet</h2>
    <div class="demo-card">
        <h4>Machine Learning Concepts</h4>
        <p><strong>ML:</strong> Algorithms that learn from data — includes regression, classification, clustering.</p>
        <p class="demo-source"><em>Source: Intro_to_ML.pdf</em></p>
    </div>
</div>
""", unsafe_allow_html=True)

# File upload section
st.markdown('<div class="section"><h2>Upload Your Study Material</h2></div>', unsafe_allow_html=True)

uploaded_file = st.file_uploader(
    "Choose a PDF or TXT file",
    type=['pdf', 'txt'],
    help="Upload your study materials to get started with AI-powered learning tools."
)

if uploaded_file:
    # Extract text based on file type
    if uploaded_file.type == "application/pdf":
        extracted_text = extract_text_from_pdf(uploaded_file)
    else:
        extracted_text = extract_text_from_txt(uploaded_file)
    
    if extracted_text:
        st.session_state.processed_text = extracted_text
        
        # Text preview
        st.markdown('<div class="results-container">', unsafe_allow_html=True)
        st.subheader("📄 Document Preview")
        preview_text = extracted_text[:1000] + "..." if len(extracted_text) > 1000 else extracted_text
        st.text_area("Extracted Text Preview", preview_text, height=200, disabled=True)
        
        # Processing buttons
        col1, col2, col3 = st.columns(3)
        
        with col1:
            if st.button("🧠 Generate Summary", use_container_width=True):
                with st.spinner("Generating AI summary..."):
                    summary = generate_summary(extracted_text)
                    st.session_state.summary = summary
        
        with col2:
            if st.button("🃏 Create Flashcards", use_container_width=True):
                with st.spinner("Creating flashcards..."):
                    flashcards = generate_flashcards(extracted_text, 5)
                    st.session_state.flashcards = flashcards
        
        with col3:
            if st.button("🔊 Generate Audio", use_container_width=True):
                if st.session_state.summary:
                    with st.spinner("Generating audio..."):
                        audio_bytes = text_to_speech(st.session_state.summary)
                        if audio_bytes:
                            st.audio(audio_bytes, format='audio/mp3')
                else:
                    st.warning("Please generate a summary first!")
        
        # Display results
        if st.session_state.summary:
            st.subheader("📋 AI-Generated Summary")
            st.markdown(st.session_state.summary)
        
        if st.session_state.flashcards:
            st.subheader("🃏 Generated Flashcards")
            for i, card in enumerate(st.session_state.flashcards, 1):
                with st.expander(f"Flashcard {i}"):
                    st.write(f"**Question:** {card['front']}")
                    st.write(f"**Answer:** {card['back']}")
        
        st.markdown('</div>', unsafe_allow_html=True)
        
        # Semantic search section
        st.markdown('<div class="results-container">', unsafe_allow_html=True)
        st.subheader("🔍 Semantic Search")
        
        # Prepare embeddings for search
        if st.session_state.embeddings is None:
            with st.spinner("Preparing search index..."):
                model = load_embedding_model()
                # Split text into chunks
                sentences = extracted_text.split('.')
                chunks = [s.strip() for s in sentences if len(s.strip()) > 20]
                st.session_state.text_chunks = chunks
                st.session_state.embeddings = model.encode(chunks)
        
        search_query = st.text_input("Ask a question about your document:")
        
        if search_query and st.button("Search"):
            model = load_embedding_model()
            results = semantic_search(
                search_query, 
                st.session_state.text_chunks, 
                st.session_state.embeddings, 
                model
            )
            
            if results:
                st.write("**Search Results:**")
                for i, result in enumerate(results, 1):
                    st.markdown(f"""
                    <div class="search-result">
                        <strong>Result {i}:</strong> {result['text']}<br>
                        <small>Relevance Score: {result['score']:.2f}</small>
                    </div>
                    """, unsafe_allow_html=True)
            else:
                st.info("No relevant results found. Try rephrasing your question.")
        
        st.markdown('</div>', unsafe_allow_html=True)

# Testimonials section
st.markdown("""
<div class="section">
    <h2>What Students Say</h2>
    <div class="testimonials-grid">
        <div class="testimonial-card">
            <p>"The semantic search is like a personal tutor!"</p>
            <strong>– Aisha K.</strong>
        </div>
        <div class="testimonial-card">
            <p>"Flashcards saved me hours of work."</p>
            <strong>– Raj P.</strong>
        </div>
        <div class="testimonial-card">
            <p>"Audio notes let me study while commuting."</p>
            <strong>– Maya L.</strong>
        </div>
    </div>
</div>
""", unsafe_allow_html=True)

# About section
st.markdown("""
<div class="about-section">
    <h2>About the Creator</h2>
    <p>Shivang Kumar Dubey — AI/ML enthusiast on a mission to help students succeed.</p>
    <div class="about-links">
        <a href="mailto:shivangkumardubey@gmail.com" class="about-link">📧 Email</a>
        <a href="https://instagram.com/shivang.skd" target="_blank" class="about-link">📷 Instagram</a>
        <a href="https://github.com/Shivang731/edu-helper-ai" target="_blank" class="about-link">💻 GitHub</a>
    </div>
</div>
""", unsafe_allow_html=True)

# CTA section
st.markdown("""
<div class="cta-section">
    <h2>Ready to Transform Your Learning?</h2>
    <p>Experience the future of AI-powered education with Edu Helper AI.</p>
</div>
""", unsafe_allow_html=True)
