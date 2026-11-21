import urllib.request, re, json

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

req = urllib.request.Request('https://dribbble.com/novelinojonathan', headers=headers)
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        shots = set(re.findall(r'/shots/\d+-[a-zA-Z0-9\-]+', html))
        finsight = [s for s in shots if 'finsight' in s.lower()]
        print('Finsight shots:', finsight)
        print('All shots sample:', list(shots)[:5])
except Exception as e:
    print('Error:', e)
