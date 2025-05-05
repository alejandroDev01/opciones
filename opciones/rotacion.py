import requests
import random
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

from config.proxy_config import PROXY_LIST


DATA_TO_SEND = {
    "key1": "value1",
    "key2": "value2"
}

def send_through_proxy(proxy_url, data, attempt=1, max_attempts=3):
    proxies = {
        "http": proxy_url,
        "https": proxy_url,
    }
    
    try:
        print(f"Intento {attempt} con proxy: {proxy_url}")
        response = requests.post(
            "https://tu-servidor-destino.com/api",
            json=data,
            proxies=proxies,
            timeout=15
        )
        
        if response.status_code == 200:
            print(f"Éxito con {proxy_url} - Respuesta: {response.text[:100]}...")
            return True, proxy_url
        else:
            print(f"Error HTTP {response.status_code} con {proxy_url}")
            return False, proxy_url
            
    except Exception as e:
        print(f"Fallo con {proxy_url}: {str(e)}")
        if attempt < max_attempts:
            time.sleep(2)  # Espera antes de reintentar
            return send_through_proxy(proxy_url, data, attempt+1, max_attempts)
        return False, proxy_url

def rotate_proxies(num_requests=50):
    successful = 0
    failed = 0
    used_proxies = set()
    
    for i in range(num_requests):
        print(f"\n--- Solicitud {i+1}/{num_requests} ---")
        
        # Seleccionar proxy no usado recientemente
        available_proxies = [p for p in PROXY_LIST if p not in used_proxies]
        if not available_proxies:
            used_proxies = set()  # Resetear si todos se han usado
            available_proxies = PROXY_LIST
            
        proxy = random.choice(available_proxies)
        used_proxies.add(proxy)
        
        # Modificar datos si es necesario (opcional)
        current_data = DATA_TO_SEND.copy()
        current_data["request_id"] = i+1
        
        # Enviar a través del proxy
        success, proxy_used = send_through_proxy(proxy, current_data)
        
        if success:
            successful += 1
        else:
            failed += 1
        
        # Espera variable entre solicitudes (opcional)
        time.sleep(random.uniform(1, 3))
    
    print(f"\nResumen: {successful} exitosas, {failed} fallidas")

# Versión con hilos para mayor velocidad (cuidado con el rate limiting)
def threaded_rotate_proxies(num_requests=50, max_workers=5):
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = []
        
        for i in range(num_requests):
            proxy = random.choice(PROXY_LIST)
            current_data = DATA_TO_SEND.copy()
            current_data["request_id"] = i+1
            
            futures.append(
                executor.submit(
                    send_through_proxy,
                    proxy,
                    current_data
                )
            )
        
        successful = 0
        for future in as_completed(futures):
            success, proxy = future.result()
            if success:
                successful += 1
        
        print(f"\nResumen paralelo: {successful} exitosas de {num_requests}")

rotate_proxies(num_requests=50)
