import requests
import re
import json
import os

# ORACLE 2.0: THE THREE-BODY PRISM SOURCES
SOURCES = {
    "Pole_A": [ # The Architect (Tesla/Logic) - Technical, Obsessive, Mathematical
        "https://www.gutenberg.org/cache/epub/39272/pg39272.txt", # Tesla Experiments
        "https://www.gutenberg.org/files/28953/28953-0.txt"  # Scientific Essays
    ],
    "Pole_B": [ # The Ghost (Sartre/Void) - Existential, Fatalistic, Raw
        "https://www.gutenberg.org/files/600/600-0.txt", # Notes from Underground (Dostoevsky)
        "https://www.gutenberg.org/cache/epub/19322/pg19322.txt" # Antichrist (Nietzsche)
    ],
    "Pole_C": [ # The Pulse (Gonzo/Wit) - Kinetic, Sharp, Sensory
        "https://www.gutenberg.org/files/844/844-0.txt", # Importance of Being Earnest (Wilde)
        "https://www.gutenberg.org/cache/epub/43624/pg43624.txt" # American Language (Mencken)
    ]
}

# Simple POS tagging heuristics
def get_pos(word):
    if word.endswith('ing'): return 'verb'
    if word.endswith('ed'): return 'verb'
    if word.endswith('tion'): return 'noun'
    if word.endswith('ity'): return 'noun'
    if word.endswith('ness'): return 'noun'
    if word.endswith('ous'): return 'adjective'
    if word.endswith('al'): return 'adjective'
    if word.endswith('ive'): return 'adjective'
    if len(word) > 3: return 'noun' # Fallback
    return None

def harvest():
    dna = {
        "Pole_A": {"nouns": [], "verbs": [], "adjectives": [], "sentences": []},
        "Pole_B": {"nouns": [], "verbs": [], "adjectives": [], "sentences": []},
        "Pole_C": {"nouns": [], "verbs": [], "adjectives": [], "sentences": []}
    }

    for body, urls in SOURCES.items():
        print(f"Harvesting {body}...")
        full_text = ""
        for url in urls:
            try:
                print(f"  Fetching {url}...")
                response = requests.get(url)
                full_text += response.text
            except Exception as e:
                print(f"  Failed to fetch {url}: {e}")

        # Clean text
        # Remove Gutenberg headers/footers (rough approximation)
        start_idx = full_text.find("*** START OF")
        end_idx = full_text.find("*** END OF")
        if start_idx != -1: full_text = full_text[start_idx:]
        if end_idx != -1: full_text = full_text[:end_idx]

        # Extract Sentences
        sentences = re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s', full_text)
        clean_sentences = [s.strip().replace('\r', ' ').replace('\n', ' ') for s in sentences if 10 < len(s) < 150]
        
        # Limit to 500 unique lines per pole
        dna[body]["sentences"] = list(set(clean_sentences))[:500]

        # Extract Words for Mad Libs
        words = re.findall(r'\b\w+\b', full_text)
        for word in words:
            if len(word) < 4: continue
            pos = get_pos(word.lower())
            if pos:
                dna[body][pos + "s"].append(word.lower())

        # Limit word lists
        dna[body]["nouns"] = list(set(dna[body]["nouns"]))[:1000]
        dna[body]["verbs"] = list(set(dna[body]["verbs"]))[:1000]
        dna[body]["adjectives"] = list(set(dna[body]["adjectives"]))[:1000]

    # Save DNA
    os.makedirs("client/src/lib", exist_ok=True)
    with open("client/src/lib/dna.json", "w") as f:
        json.dump(dna, f)
    
    print("Harvest complete. DNA saved to client/src/lib/dna.json")

if __name__ == "__main__":
    harvest()
