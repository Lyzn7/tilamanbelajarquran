import re
import json

# Baca file text
with open('textmentahkatamotivasi.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# Regex untuk match format: nomor. "kutipan" - sumber atau (sumber)
pattern = r'(\d+)\.\s+"([^"]+)"\s*(?:-\s*(.+?))?(?:\s*\(([^)]+)\))?(?=\n|$)'

matches = re.findall(pattern, content)

motivations = []
skip_sources = ['freepik', 'pexels', 'sketchepedia', 'image by', 'photo by', 'www.freepik.com']

for match in matches:
    num, quote, source1, source2 = match
    source = (source1 or source2 or '').strip()
    
    # Skip image credits
    if source:
        skip = False
        for skip_src in skip_sources:
            if skip_src.lower() in source.lower():
                skip = True
                break
        if not skip:
            motivations.append({
                'id': int(num),
                'text': quote.strip(),
                'source': source
            })
    else:
        motivations.append({
            'id': int(num),
            'text': quote.strip(),
            'source': ''
        })

# Remove duplicates while preserving order
seen = set()
unique_motivations = []
for m in motivations:
    key = m['text'].lower()
    if key not in seen:
        seen.add(key)
        unique_motivations.append(m)

print(f"Total unique quotes: {len(unique_motivations)}")

# Renumber IDs sequentially
for i, m in enumerate(unique_motivations, 1):
    m['id'] = i

# Save to JSON
json_data = {
    'motivations': unique_motivations
}

with open('src/data/motivations.json', 'w', encoding='utf-8') as f:
    json.dump(json_data, f, ensure_ascii=False, indent=2)

print(f"✓ Saved {len(unique_motivations)} quotes to src/data/motivations.json")
print("\nSample quotes:")
for m in unique_motivations[:3]:
    print(f"  - {m['text']}")
    if m['source']:
        print(f"    Source: {m['source']}")
