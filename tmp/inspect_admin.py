import re

with open('src/components/AdminPanel.tsx', 'r', encoding='utf-8', errors='replace') as f:
    text = f.read()

tabs = re.findall(r"activeTab\s*===?\s*'([^']+)'", text[:520000])
print('Tabs found:', sorted(list(set(tabs))))

# Find what state variables exist related to push / alerts / source protection / modals etc
push_states = re.findall(r'const\s+\[([a-zA-Z0-9]+),\s*set[a-zA-Z0-9]+\]\s*=', text[:520000])
print('States found (sample):', [s for s in push_states if 'push' in s.lower() or 'alert' in s.lower() or 'source' in s.lower() or 'notify' in s.lower()])

# Find all functions in AdminPanel
funcs = re.findall(r'const\s+(handle[a-zA-Z0-9]+)\s*=', text[:520000])
print('Handlers found:', [f for f in funcs if 'push' in f.lower() or 'alert' in f.lower() or 'dispatch' in f.lower()])
