import urllib.request

url = "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFYIJfyHNcA8OjC_9rLYS7UHdmkz_1Sni_EWWizTRdJwFfdRUIyvnPmHbjj_E8MXpdiFXi1F2Vyk-DBXGJIOi_kgZ3jnmmVn4rQ9nWVE8ChdU-9L-Poc2N-1L3R6j6IUlwv-VtZDnxe4KdV5EjIJ1yfIw=="

req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as resp:
        print("Final URL:", resp.geturl())
except Exception as e:
    print("Error:", e)
