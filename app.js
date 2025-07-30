// Global variables
let currentFile = null;
let extractedText = '';
let flashcards = [];
let currentFlashcardIndex = 0;
let isAudioPlaying = false;
let audioProgress = 0;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    setupTabSwitching();
    setupFileUpload();
    setupNavigation();
    setupButtons();
    setupSmoothScrolling();
    setupHeaderEffect();
});

// Set up all button event listeners
function setupButtons() {
    // Hero section buttons
    const uploadButtons = document.querySelectorAll('button[onclick="scrollToUpload()"]');
    uploadButtons.forEach(btn => {
        btn.removeAttribute('onclick');
        btn.addEventListener('click', scrollToUpload);
    });
    
    const demoButtons = document.querySelectorAll('button[onclick="scrollToDemo()"]');
    demoButtons.forEach(btn => {
        btn.removeAttribute('onclick');
        btn.addEventListener('click', scrollToDemo);
    });
    
    // File input button
    const chooseFilesBtn = document.querySelector('.upload__area .btn');
    if (chooseFilesBtn) {
        chooseFilesBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            document.getElementById('fileInput').click();
        });
    }
}

// Set up navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav__link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// Event listeners
function initializeEventListeners() {
    const fileInput = document.getElementById('fileInput');
    const flashcard = document.getElementById('flashcard');
    const searchQuery = document.getElementById('searchQuery');
    
    // File input change
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    // Flashcard click to flip
    if (flashcard) {
        flashcard.addEventListener('click', flipFlashcard);
    }
    
    // Search on Enter key
    if (searchQuery) {
        searchQuery.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
}

// File upload functionality
function setupFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    if (!uploadArea) return;
    
    // Drag and drop events
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
    
    // Click to upload (but not on the button)
    uploadArea.addEventListener('click', function(e) {
        if (!e.target.classList.contains('btn')) {
            document.getElementById('fileInput').click();
        }
    });
}

// Handle file selection
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

// Process uploaded file
function handleFile(file) {
    currentFile = file;
    
    // Validate file type
    if (!file.type.includes('pdf') && !file.type.includes('text') && !file.name.toLowerCase().endsWith('.txt')) {
        showNotification('Please upload a PDF or text file.', 'warning');
        return;
    }
    
    const processing = document.getElementById('processing');
    const uploadArea = document.getElementById('uploadArea');
    
    // Show processing animation
    if (processing) {
        processing.classList.remove('hidden');
    }
    if (uploadArea) {
        uploadArea.style.display = 'none';
    }
    
    // Simulate file processing
    setTimeout(() => {
        processFile(file);
    }, 2000);
}

// Simulate file processing
function processFile(file) {
    // Mock text extraction
    extractedText = generateMockText(file.name);
    
    // Generate summary
    const summary = generateMockSummary(extractedText);
    const summaryContent = document.getElementById('summaryContent');
    if (summaryContent) {
        summaryContent.innerHTML = summary;
    }
    
    const processing = document.getElementById('processing');
    const results = document.getElementById('results');
    const fileInput = document.getElementById('fileInput');
    
    // Hide processing, show results
    if (processing) {
        processing.classList.add('hidden');
    }
    if (results) {
        results.classList.remove('hidden');
    }
    
    // Reset file input
    if (fileInput) {
        fileInput.value = '';
    }
    
    // Show success message
    showNotification('Document processed successfully!', 'success');
    
    // Scroll to results
    if (results) {
        results.scrollIntoView({ behavior: 'smooth' });
    }
}

// Generate mock extracted text based on filename
function generateMockText(filename) {
    const mockTexts = {
        'machine_learning': 'Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions from data without being explicitly programmed. Key concepts include supervised learning, unsupervised learning, and reinforcement learning. Common algorithms include linear regression, decision trees, neural networks, and support vector machines.',
        'biology': 'Photosynthesis is the process by which plants convert sunlight, carbon dioxide, and water into glucose and oxygen. This process occurs in chloroplasts and involves two main stages: light-dependent reactions and the Calvin cycle. The overall equation is 6CO2 + 6H2O + light energy → C6H12O6 + 6O2.',
        'history': 'The Industrial Revolution began in Britain in the late 18th century and transformed society from agricultural to manufacturing-based economies. Key innovations included the steam engine, textile machinery, and iron production techniques. This period led to urbanization, improved transportation, and significant social changes.',
        'physics': 'Newton\'s laws of motion describe the relationship between forces and motion. The first law states that objects at rest stay at rest unless acted upon by a force. The second law defines force as mass times acceleration (F=ma). The third law states that for every action, there is an equal and opposite reaction.'
    };
    
    // Try to match filename to content
    const key = Object.keys(mockTexts).find(k => filename.toLowerCase().includes(k));
    return key ? mockTexts[key] : mockTexts['machine_learning'];
}

// Generate mock summary
function generateMockSummary(text) {
    const sentences = text.split('. ');
    const summary = sentences.slice(0, 2).join('. ') + '.';
    return `<strong>Key Points:</strong><br>• ${summary.replace('. ', '<br>• ')}<br><br><em>This summary was generated using AI analysis of your uploaded document.</em>`;
}

// Tab switching functionality
function setupTabSwitching() {
    const tabs = document.querySelectorAll('.results__tab');
    const panels = document.querySelectorAll('.results__panel');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            
            // Remove active class from all tabs and panels
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding panel
            this.classList.add('active');
            const targetPanel = document.getElementById(targetTab + '-panel');
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });
}

// Flashcard functionality
function generateFlashcards() {
    if (!extractedText) {
        showNotification('Please upload a document first!', 'warning');
        return;
    }
    
    // Generate mock flashcards based on content
    flashcards = [
        {
            question: "What is the main topic discussed in the document?",
            answer: "The document covers key concepts and principles related to the subject matter, providing foundational knowledge for understanding the topic."
        },
        {
            question: "What are the primary components mentioned?",
            answer: "The document outlines several important components that work together to form the complete system or concept being discussed."
        },
        {
            question: "How do these concepts apply in practice?",
            answer: "These concepts have practical applications in real-world scenarios and can be used to solve various problems effectively."
        },
        {
            question: "What are the key benefits discussed?",
            answer: "The main benefits include improved efficiency, better understanding, and enhanced problem-solving capabilities in the field."
        },
        {
            question: "What should you remember most?",
            answer: "The most important takeaway is understanding the fundamental principles and how they interconnect to form a cohesive framework."
        }
    ];
    
    currentFlashcardIndex = 0;
    updateFlashcard();
    showNotification('Flashcards generated successfully!', 'success');
}

function updateFlashcard() {
    if (flashcards.length === 0) return;
    
    const card = flashcards[currentFlashcardIndex];
    const flashcardQuestion = document.getElementById('flashcardQuestion');
    const flashcardAnswer = document.getElementById('flashcardAnswer');
    const flashcardCounter = document.getElementById('flashcardCounter');
    const flashcard = document.getElementById('flashcard');
    
    if (flashcardQuestion) flashcardQuestion.textContent = card.question;
    if (flashcardAnswer) flashcardAnswer.textContent = card.answer;
    if (flashcardCounter) flashcardCounter.textContent = `${currentFlashcardIndex + 1} / ${flashcards.length}`;
    
    // Reset flip state
    if (flashcard) flashcard.classList.remove('flipped');
}

function flipFlashcard() {
    if (flashcards.length === 0) return;
    const flashcard = document.getElementById('flashcard');
    if (flashcard) {
        flashcard.classList.toggle('flipped');
    }
}

function nextCard() {
    if (flashcards.length === 0) return;
    currentFlashcardIndex = (currentFlashcardIndex + 1) % flashcards.length;
    updateFlashcard();
}

function previousCard() {
    if (flashcards.length === 0) return;
    currentFlashcardIndex = currentFlashcardIndex === 0 ? flashcards.length - 1 : currentFlashcardIndex - 1;
    updateFlashcard();
}

// Audio functionality
function generateAudio() {
    if (!extractedText) {
        showNotification('Please upload a document first!', 'warning');
        return;
    }
    
    const audioControls = document.getElementById('audioControls');
    const audioBtn = document.querySelector('#audioPlayer .btn');
    
    // Show audio controls
    if (audioControls) {
        audioControls.classList.remove('hidden');
    }
    if (audioBtn) {
        audioBtn.style.display = 'none';
    }
    
    // Simulate audio generation
    setTimeout(() => {
        showNotification('Audio generated successfully! Click play to listen.', 'success');
        resetAudioPlayer();
    }, 1500);
}

function playPauseAudio() {
    const playBtn = document.querySelector('.audio-btn');
    
    if (isAudioPlaying) {
        playBtn.textContent = '▶️';
        isAudioPlaying = false;
    } else {
        playBtn.textContent = '⏸️';
        isAudioPlaying = true;
        simulateAudioProgress();
    }
}

function resetAudioPlayer() {
    audioProgress = 0;
    const progressBar = document.querySelector('.audio-progress-bar');
    const timeDisplay = document.querySelector('.audio-time');
    
    if (progressBar) progressBar.style.width = '0%';
    if (timeDisplay) timeDisplay.textContent = '0:00 / 0:30';
}

function simulateAudioProgress() {
    if (!isAudioPlaying) return;
    
    const progressBar = document.querySelector('.audio-progress-bar');
    const timeDisplay = document.querySelector('.audio-time');
    const duration = 30; // 30 seconds mock duration
    
    const interval = setInterval(() => {
        if (!isAudioPlaying) {
            clearInterval(interval);
            return;
        }
        
        audioProgress += 0.5;
        const percentage = (audioProgress / duration) * 100;
        if (progressBar) progressBar.style.width = percentage + '%';
        
        const currentTime = Math.floor(audioProgress);
        if (timeDisplay) {
            timeDisplay.textContent = `${Math.floor(currentTime / 60)}:${(currentTime % 60).toString().padStart(2, '0')} / 0:30`;
        }
        
        if (audioProgress >= duration) {
            clearInterval(interval);
            isAudioPlaying = false;
            const playBtn = document.querySelector('.audio-btn');
            if (playBtn) playBtn.textContent = '▶️';
            audioProgress = 0;
            resetAudioPlayer();
        }
    }, 500);
}

// Search functionality
function performSearch() {
    const searchQuery = document.getElementById('searchQuery');
    const query = searchQuery ? searchQuery.value.trim() : '';
    
    if (!query) {
        showNotification('Please enter a search query!', 'warning');
        return;
    }
    
    if (!extractedText) {
        showNotification('Please upload a document first!', 'warning');
        return;
    }
    
    // Simulate search results
    const mockResults = [
        {
            text: "This section discusses the fundamental concepts related to your query, providing detailed explanations and practical examples that demonstrate the core principles.",
            relevance: 0.95
        },
        {
            text: "Additional information can be found in this passage, which covers related topics and their applications in real-world scenarios and problem-solving contexts.",
            relevance: 0.87
        },
        {
            text: "This excerpt provides essential context and background information that supports the main concepts discussed throughout the document.",
            relevance: 0.74
        }
    ];
    
    displaySearchResults(mockResults, query);
    showNotification('Search completed successfully!', 'success');
}

function displaySearchResults(results, query) {
    const searchResults = document.getElementById('searchResults');
    if (!searchResults) return;
    
    searchResults.innerHTML = '';
    
    if (results.length === 0) {
        searchResults.innerHTML = '<p>No results found for your query.</p>';
        return;
    }
    
    const resultsHeader = document.createElement('h4');
    resultsHeader.textContent = `Search Results for "${query}":`;
    resultsHeader.style.marginBottom = 'var(--space-16)';
    searchResults.appendChild(resultsHeader);
    
    results.forEach((result, index) => {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'search-result';
        resultDiv.innerHTML = `
            <p><strong>Result ${index + 1}:</strong> ${result.text}</p>
            <small style="color: var(--color-text-secondary);">Relevance: ${(result.relevance * 100).toFixed(0)}%</small>
        `;
        searchResults.appendChild(resultDiv);
    });
}

// Utility functions
function scrollToUpload() {
    const uploadSection = document.getElementById('upload');
    if (uploadSection) {
        uploadSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function scrollToDemo() {
    const demoSection = document.getElementById('demo');
    if (demoSection) {
        demoSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--color-surface);
        color: var(--color-text);
        padding: var(--space-16) var(--space-20);
        border-radius: var(--radius-base);
        box-shadow: var(--shadow-lg);
        border-left: 4px solid var(--color-${type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'primary'});
        z-index: 10000;
        max-width: 300px;
        transform: translateX(100%);
        transition: transform var(--duration-normal) var(--ease-standard);
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Animate out and remove
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Smooth scroll setup
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Header scroll effect
function setupHeaderEffect() {
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header');
        if (header) {
            if (window.scrollY > 100) {
                header.style.background = 'rgba(255, 255, 255, 0.98)';
                header.style.boxShadow = 'var(--shadow-md)';
            } else {
                header.style.background = 'rgba(255, 255, 255, 0.95)';
                header.style.boxShadow = 'none';
            }
        }
    });
}

// Enhanced interactions
document.addEventListener('DOMContentLoaded', function() {
    // Add hover effects to feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Add click-to-copy functionality for demo content
    const demoCard = document.querySelector('.demo-card');
    if (demoCard) {
        demoCard.addEventListener('click', function() {
            const content = this.querySelector('.demo-card__content').textContent;
            if (navigator.clipboard) {
                navigator.clipboard.writeText(content).then(() => {
                    showNotification('Demo content copied to clipboard!', 'success');
                });
            }
        });
        
        demoCard.style.cursor = 'pointer';
        demoCard.title = 'Click to copy content';
    }
});

// Keyboard navigation
document.addEventListener('keydown', function(e) {
    // ESC key to close modals or reset states
    if (e.key === 'Escape') {
        const flashcard = document.getElementById('flashcard');
        if (flashcard) {
            flashcard.classList.remove('flipped');
        }
    }
    
    // Arrow keys for flashcard navigation
    if (e.key === 'ArrowLeft' && flashcards.length > 0) {
        previousCard();
    } else if (e.key === 'ArrowRight' && flashcards.length > 0) {
        nextCard();
    }
    
    // Space bar to flip flashcard
    if (e.key === ' ' && flashcards.length > 0 && e.target === document.body) {
        e.preventDefault();
        flipFlashcard();
    }
});

// Make functions globally available for HTML onclick attributes (fallback)
window.scrollToUpload = scrollToUpload;
window.scrollToDemo = scrollToDemo;
window.generateFlashcards = generateFlashcards;
window.generateAudio = generateAudio;
window.performSearch = performSearch;
window.playPauseAudio = playPauseAudio;
window.nextCard = nextCard;
window.previousCard = previousCard;
