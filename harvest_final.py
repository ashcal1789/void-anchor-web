import requests
import re
import json
import os

# ORACLE FINAL: THE GENETIC ARCHITECTURE WITH FRACTAL ARCHIVE
SOURCES = {
    "Pole_A": { # THE ARCHITECT: Tesla + Da Vinci (Mechanical Anatomy)
        "urls": [
            "https://www.gutenberg.org/cache/epub/39272/pg39272.txt",  # Tesla Experiments
            "https://www.gutenberg.org/files/5000/5000-0.txt",  # Da Vinci Notebooks (proxy)
        ],
        "infusion": "Stalker-Logic",
        "vocabulary_focus": ["lever", "valve", "tendon", "gear", "anatomy", "spark", "lust", "creativity"]
    },
    "Pole_B": { # THE GHOST: Carlin + Dostoevsky + Tao + Sartre (The Void)
        "urls": [
            "https://www.gutenberg.org/files/600/600-0.txt",  # Notes from Underground (Dostoevsky)
            "https://www.gutenberg.org/cache/epub/19322/pg19322.txt",  # Antichrist (Nietzsche/Sartre proxy)
            "https://www.gutenberg.org/cache/epub/3321/pg3321.txt",  # Tao Te Ching
            "https://www.gutenberg.org/files/1497/1497-0.txt",  # Plato's Republic (Cave allegory)
        ],
        "infusion": "Mono no Aware",
        "vocabulary_focus": ["stone", "root", "hollow", "moss", "nausea", "void", "echo", "silence"]
    },
    "Pole_C": { # THE PULSE: Dickinson + Mitchell + Sherman-Palladino + Robbins (Visceral Wit)
        "urls": [
            "https://www.gutenberg.org/files/12242/12242-0.txt",  # Emily Dickinson Poems
            "https://www.gutenberg.org/cache/epub/43624/pg43624.txt",  # American Language (Mencken - wit proxy)
            "https://www.gutenberg.org/files/4300/4300-0.txt",  # Jitterbug Perfume (Tom Robbins)
        ],
        "infusion": "Duende",
        "vocabulary_focus": ["vein", "starlight", "bee", "thread", "slant", "blood", "spirit", "cosmic"]
    },
    "Subconscious": { # THE FRACTAL ARCHIVE: Old DNA preserved as "Historical Echoes"
        "urls": [
            "https://www.gutenberg.org/files/844/844-0.txt",  # Wilde (Importance of Being Earnest)
            "https://www.gutenberg.org/cache/epub/74404/pg74404.txt",  # 20,000 Leagues (Verne)
        ],
        "infusion": "Historical Echo",
        "vocabulary_focus": ["governess", "submarine", "earnest", "trivial", "profound"]
    }
}

def get_pos(word):
    if word.endswith('ing'): return 'verb'
    if word.endswith('ed'): return 'verb'
    if word.endswith('tion'): return 'noun'
    if word.endswith('ity'): return 'noun'
    if word.endswith('ness'): return 'noun'
    if word.endswith('ous'): return 'adjective'
    if word.endswith('al'): return 'adjective'
    if word.endswith('ive'): return 'adjective'
    if len(word) > 3: return 'noun'
    return None

def harvest():
    dna = {
        "Pole_A": {"nouns": [], "verbs": [], "adjectives": [], "sentences": [], "infusion": "Stalker-Logic"},
        "Pole_B": {"nouns": [], "verbs": [], "adjectives": [], "sentences": [], "infusion": "Mono no Aware"},
        "Pole_C": {"nouns": [], "verbs": [], "adjectives": [], "sentences": [], "infusion": "Duende"},
        "Subconscious": {"nouns": [], "verbs": [], "adjectives": [], "sentences": [], "infusion": "Historical Echo"}
    }

    for pole, config in SOURCES.items():
        print(f"\nHarvesting {pole} ({config['infusion']})...")
        full_text = ""
        
        for url in config["urls"]:
            try:
                print(f"  Fetching {url}...")
                response = requests.get(url, timeout=10)
                full_text += response.text
            except Exception as e:
                print(f"  Failed to fetch {url}: {e}")

        # Clean text
        start_idx = full_text.find("*** START OF")
        end_idx = full_text.find("*** END OF")
        if start_idx != -1: full_text = full_text[start_idx:]
        if end_idx != -1: full_text = full_text[:end_idx]

        # Extract Sentences
        sentences = re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s', full_text)
        clean_sentences = [s.strip().replace('\r', ' ').replace('\n', ' ') for s in sentences if 10 < len(s) < 150]
        
        # Limit to 500 unique lines per pole
        dna[pole]["sentences"] = list(set(clean_sentences))[:500]

        # Extract Words for Mad Libs
        words = re.findall(r'\b\w+\b', full_text)
        for word in words:
            if len(word) < 4: continue
            pos = get_pos(word.lower())
            if pos:
                dna[pole][pos + "s"].append(word.lower())

        # Limit word lists
        dna[pole]["nouns"] = list(set(dna[pole]["nouns"]))[:1000]
        dna[pole]["verbs"] = list(set(dna[pole]["verbs"]))[:1000]
        dna[pole]["adjectives"] = list(set(dna[pole]["adjectives"]))[:1000]

        print(f"  {pole}: {len(dna[pole]['sentences'])} sentences, {len(dna[pole]['nouns'])} nouns, {len(dna[pole]['verbs'])} verbs, {len(dna[pole]['adjectives'])} adjectives")

    # Save DNA
    os.makedirs("client/src/lib", exist_ok=True)
    with open("client/src/lib/dna_final.json", "w") as f:
        json.dump(dna, f)
    
    print("\n✓ Harvest complete. DNA saved to client/src/lib/dna_final.json")
    print("✓ Fractal Archive preserved in 'Subconscious' layer")

if __name__ == "__main__":
    harvest()
