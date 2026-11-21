import glob, re

files = [
    "ai-finance-platform-main/app/page.js",
    "ai-finance-platform-main/components/hero.jsx",
    "ai-finance-platform-main/components/cinematic-background.jsx"
]

for fname in files:
    with open(fname, "r", encoding="utf-8") as f:
        matches = re.findall(r'[\'"][^\'"]+\.(?:png|jpg|jpeg|svg|webp)[\'"]', f.read())
        print(fname, matches)
