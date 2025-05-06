import asyncio
from proxybroker import Broker
import requests

async def main():
    proxies = []
    
    # Configuración compatible
    broker = Broker(
        timeout=15,
        verify_ssl=True,
        max_tries=2
    )
    
    # Buscar proxies HTTPS de EE.UU.
    await broker.find(
        types=['HTTPS'],
        countries=['US'],
        limit=20,
        strict=True
    )
    
    # Obtener proxies
    while True:
        proxy = await broker.get(ignore_limit=True)
        if proxy is None:
            break
        proxy_url = f"{proxy.protocol}://{proxy.host}:{proxy.port}"
        proxies.append(proxy_url)
        print(f"Proxy válido: {proxy_url}")
        
        # Hacer una solicitud GET usando el proxy
        try:
            response = requests.get(
                "https://opciones-alejandrodev01s-projects.vercel.app/",
                proxies={'https': proxy_url},
                timeout=15
            )
            # Guardar la respuesta junto con el proxy
            with open('responses.txt', 'a') as f:
                f.write(f"Proxy: {proxy_url}\nResponse: {response.text}\n\n")
        except Exception as e:
            print(f"Error al usar el proxy {proxy_url}: {e}")
    
    return proxies

if __name__ == "__main__":
    valid_proxies = asyncio.run(main())
    print(f"\nTotal proxies válidos: {len(valid_proxies)}")
    with open('proxies.txt', 'w') as f:
        f.write('\n'.join(valid_proxies))