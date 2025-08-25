import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import ComplementNB
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from sklearn.utils.class_weight import compute_class_weight
from imblearn.over_sampling import RandomOverSampler
from imblearn.pipeline import make_pipeline as make_imb_pipeline
import joblib
import os
import re
from datetime import datetime

# Constants
DATASET_PATH = "../datasets/file_metadata.xlsx"
MODEL_SAVE_PATH = "../models/file_classifier_model.pkl"
KEYWORD_EXTRACTOR_PATH = "../models/keyword_extractor.pkl"

def preprocess_text(text):
    """Enhanced text preprocessing"""
    if not isinstance(text, str):
        return ""
    # Remove special characters but keep words with apostrophes
    text = re.sub(r"[^\w\s'-]", " ", text.lower())
    # Remove standalone numbers
    text = re.sub(r"\b\d+\b", " ", text)
    # Remove extra whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text

def determine_category(row):
    """More precise category determination with enhanced patterns"""
    file_name = preprocess_text(row['Name'])
    file_type = row['Type'].lower()
    folder_context = preprocess_text(row.get('Folder', ''))
    
    # Enhanced matching patterns with priorities
    category_patterns = [
        ('research', ['research', 'paper', 'thesis', 'dissertation', 'journal']),
        ('lecture', ['lecture', 'note', 'notes', 'class', 'lesson']),
        ('slide', ['slide', 'presentation', 'deck', 'ppt']),
        ('assignment', ['assignment', 'hw', 'homework', 'problem set', 'pset']),
        ('exam', ['exam', 'test', 'quiz', 'midsem', 'final']),
        ('code', ['code', 'program', 'script', 'src', '.py', '.cpp', '.java']),
        ('document', ['doc', 'report', 'article', 'writeup']),
        ('image', ['image', 'photo', 'pic', 'screenshot', '.jpg', '.png'])
    ]
    
    # Check for exact matches first
    for category, keywords in category_patterns:
        if any(f'_{k}_' in f'_{file_name}_' for k in keywords):
            return category
    
    # Then check folder context
    for category, keywords in category_patterns:
        if any(f'_{k}_' in f'_{folder_context}_' for k in keywords):
            return category
    
    # File type fallback mapping
    type_mapping = {
        'pdf': 'document',
        'docx': 'document',
        'pptx': 'slide',
        'png': 'image',
        'jpg': 'image',
        'jpeg': 'image',
        'py': 'code',
        'cpp': 'code',
        'java': 'code',
        'ipynb': 'code'
    }
    
    return type_mapping.get(file_type, 'other')

def load_and_preprocess():
    """Enhanced data loading with folder context integration"""
    files = pd.read_excel(DATASET_PATH, sheet_name='Files')
    folders = pd.read_excel(DATASET_PATH, sheet_name='Folders')
    
    # Create a folder name mapping for context
    folder_map = {folder['Name']: folder for _, folder in folders.iterrows()}
    
    # Add folder context to files
    files['Folder'] = files['Name'].apply(
        lambda x: next((f for f in folder_map if f.lower() in x.lower()), None))
    
    # Enhanced categorization
    files['category'] = files.apply(determine_category, axis=1)
    
    # Create enhanced text features with folder context
    files['text_features'] = (
        files['Name'] + ' ' +
        files['Type'] + ' ' +
        files['Tags'].fillna('') + ' ' +
        files['Folder'].fillna('')
    ).apply(preprocess_text)
    
    return files['text_features'], files['category']

def train_and_evaluate_model(X, y):
    """Enhanced model training with class balancing"""
    # Split data with stratification
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Create pipeline with oversampling and enhanced vectorizer
    model = make_imb_pipeline(
        TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 3),  # Include tri-grams
            min_df=2,  # Ignore rare terms
            sublinear_tf=True  # Use sublinear TF scaling
        ),
        RandomOverSampler(random_state=42),
        ComplementNB(alpha=1.0)  # Adjust smoothing parameter
    )
    
    print("Training model with class balancing...")
    model.fit(X_train, y_train)
    
    # Enhanced evaluation
    print("\nEnhanced Model Evaluation:")
    y_pred = model.predict(X_test)
    print(classification_report(y_test, y_pred, zero_division=0))
    
    # Save the model
    os.makedirs(os.path.dirname(MODEL_SAVE_PATH), exist_ok=True)
    joblib.dump(model, MODEL_SAVE_PATH)
    print(f"\nImproved model saved to {MODEL_SAVE_PATH}")
    
    return model

def train_keyword_extractor(X):
    """Train an enhanced TF-IDF vectorizer for keyword extraction"""
    vectorizer = TfidfVectorizer(
        max_features=1000,
        stop_words='english',
        ngram_range=(1, 3),
        min_df=2
    )
    vectorizer.fit(X)
    os.makedirs(os.path.dirname(KEYWORD_EXTRACTOR_PATH), exist_ok=True)
    joblib.dump(vectorizer, KEYWORD_EXTRACTOR_PATH)
    print(f"Enhanced keyword extractor saved to {KEYWORD_EXTRACTOR_PATH}")
    return vectorizer

def post_process_predictions(model, texts):
    """Apply business rules to model predictions"""
    preds = model.predict(texts)
    return [adjust_prediction(text, pred) for text, pred in zip(texts, preds)]

def adjust_prediction(text, pred):
    """Apply specific business rules to predictions"""
    text = text.lower()
    if 'lecture' in text and pred != 'lecture':
        return 'lecture'
    if 'slide' in text and ('ppt' in text or 'slide' in text) and pred != 'slide':
        return 'slide'
    if 'assignment' in text and pred != 'assignment':
        return 'assignment'
    return pred

def main():
    try:
        print("Loading and preprocessing data...")
        X, y = load_and_preprocess()
        
        print("\nCategory distribution:")
        print(y.value_counts())
        
        if len(y.unique()) < 2:
            raise ValueError("Not enough categories to train - need more diverse data")
        
        # Train and evaluate model
        model = train_and_evaluate_model(X, y)
        
        # Train keyword extractor
        keyword_extractor = train_keyword_extractor(X)
        
        # Test predictions with post-processing
        test_files = [
            "lecture_notes.pdf",
            "python_assignment.py",
            "meeting_slides.pptx",
            "machine_learning_lecture.pdf",
            "final_exam_prep.docx",
            "research_paper_ai.pdf"
        ]
        
        print("\nEnhanced Test Predictions:")
        predictions = post_process_predictions(model, test_files)
        for file, pred in zip(test_files, predictions):
            print(f"{file} → {pred}")
            
    except Exception as e:
        print(f"\nError: {str(e)}")
        print("\nRecommendations:")
        print("- Add more samples for under-represented categories (research, slide)")
        print("- Review and clean the dataset for inconsistent labels")
        print("- Add more specific tags to files in the 'Tags' column")

if __name__ == "__main__":
    main()