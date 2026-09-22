import re

with open('scripts/seed.ts', 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(r'2026-10-T23:59:59Z', r'2026-10-T23:59:59Z', text)
text = text.replace('type: \'', 'kind: \'')
text = text.replace('type: \"', 'kind: \"')

with open('scripts/seed.ts', 'w', encoding='utf-8') as f:
    f.write(text)
