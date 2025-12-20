import requests
import random
import json
import re

# --- CONFIGURATION ---
SOURCES = {
    "Body_1": [ # Explorer (Verne, Melville)
        "https://www.gutenberg.org/files/164/164-0.txt", # 20,000 Leagues
        "https://www.gutenberg.org/files/2701/2701-0.txt"  # Moby Dick
    ],
    "Body_2": [ # Stoic (Aurelius, Kafka)
        "https://www.gutenberg.org/files/2680/2680-0.txt", # Meditations
        "https://www.gutenberg.org/cache/epub/5200/pg5200.txt" # Metamorphosis
    ],
    "Body_3": [ # Wit (Twain, Flapper Fanny, Carroll, Lear)
        "https://www.gutenberg.org/files/74/74-0.txt", # Tom Sawyer
        "https://www.gutenberg.org/cache/epub/74404/pg74404.txt", # Flapper Fanny
        "https://www.gutenberg.org/files/11/11-0.txt", # Alice in Wonderland
        "https://www.gutenberg.org/files/136/136-0.txt" # Book of Nonsense
    ]
}

# Simple POS tagging heuristics (since we can't use heavy NLP libs easily in this env)
# We will look for patterns to identify likely candidates.
def extract_parts(text):
    words = re.findall(r'\b[a-z]{3,}\b', text.lower())
    
    nouns = []
    verbs = []
    adjectives = []
    
    # Very basic heuristic lists for demonstration/speed
    # In a full production env, we'd use NLTK or Spacy
    common_suffixes = {
        'noun': ['tion', 'ness', 'ment', 'ity', 'er', 'ism', 'ist'],
        'verb': ['ate', 'ify', 'ize', 'ing', 'ed'],
        'adj': ['ous', 'ive', 'al', 'ful', 'ic', 'less']
    }
    
    for w in words:
        if any(w.endswith(s) for s in common_suffixes['noun']): nouns.append(w)
        elif any(w.endswith(s) for s in common_suffixes['verb']): verbs.append(w)
        elif any(w.endswith(s) for s in common_suffixes['adj']): adjectives.append(w)
        
    return list(set(nouns)), list(set(verbs)), list(set(adjectives))

def clean_sentence(text):
    # Remove Gutenberg headers/footers and messy whitespace
    lines = text.split('\n')
    clean_lines = []
    start = False
    for line in lines:
        if "*** START OF" in line: start = True; continue
        if "*** END OF" in line: break
        if start and line.strip(): clean_lines.append(line.strip())
    
    full_text = " ".join(clean_lines)
    sentences = re.split(r'(?<=[.!?]) +', full_text)
    
    # Filter for quality
    return [s for s in sentences if 20 < len(s) < 140 and not "Gutenberg" in s]

def harvest():
    dna = {
        "Body_1": {"sentences": [], "nouns": [], "verbs": [], "adjectives": []},
        "Body_2": {"sentences": [], "nouns": [], "verbs": [], "adjectives": []},
        "Body_3": {"sentences": [], "nouns": [], "verbs": [], "adjectives": []}
    }
    
    for body, urls in SOURCES.items():
        print(f"Harvesting {body}...")
        all_text = ""
        for url in urls:
            try:
                print(f"  Fetching {url}...")
                r = requests.get(url, timeout=10)
                if r.status_code == 200:
                    all_text += r.text
            except Exception as e:
                print(f"  Failed: {e}")
        
        # Extract Sentences
        sentences = clean_sentence(all_text)
        dna[body]["sentences"] = random.sample(sentences, min(len(sentences), 500))
        
        # Extract Parts of Speech
        n, v, a = extract_parts(all_text)
        dna[body]["nouns"] = random.sample(n, min(len(n), 200))
        dna[body]["verbs"] = random.sample(v, min(len(v), 200))
        dna[body]["adjectives"] = random.sample(a, min(len(a), 200))
        
    return dna

if __name__ == "__main__":
    data = harvest()
    with open("client/src/lib/dna.json", "w") as f:
        json.dump(data, f)
    print("Harvest complete. DNA saved to client/src/lib/dna.json")
