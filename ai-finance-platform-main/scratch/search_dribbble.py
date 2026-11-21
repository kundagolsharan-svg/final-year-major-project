import urllib.request, re, json

query = "FinSight%20SaaS%20Landing%20Page"
url = f"https://dribbble.com/search/shots/popular?q={query}"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})

try:
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        # Find cdn image links
        imgs = set(re.findall(r'https://cdn\.dribbble\.com/userupload/[^\s\"\'\>]+', html))
        print("Found cdn links:", len(imgs))
        for img in list(imgs)[:10]:
            print(img)
except Exception as e:
    print("Error:", e)
