# import requests
# import socks
# import socket
# import time
# from config.proxy_config import PROXY_LIST

# def parse_proxy(proxy_str):
#     try:
#         protocol, address = proxy_str.split(' ', 1)
#         return {
#             'protocol': protocol.lower(),
#             'address': address,
#             'original_str': proxy_str
#         }
#     except:
#         return None

# def test_proxy(proxy_info, test_url="http://httpbin.org/ip", timeout=10):
#     try:
#         if proxy_info['protocol'] in ['http', 'https']:
#             proxies = {
#                 "http": f"{proxy_info['protocol']}://{proxy_info['address']}",
#                 "https": f"{proxy_info['protocol']}://{proxy_info['address']}"
#             }
#             response = requests.get(test_url, proxies=proxies, timeout=timeout)
#         elif proxy_info['protocol'] in ['socks4', 'socks5']:
#             # Configurar socket para SOCKS
#             host, port = proxy_info['address'].split(':')
#             socks.set_default_proxy(
#                 socks.SOCKS5 if proxy_info['protocol'] == 'socks5' else socks.SOCKS4,
#                 host,
#                 int(port)
#             )
#             socket.socket = socks.socksocket
#             response = requests.get(test_url, timeout=timeout)
#             socks.set_default_proxy()  # Resetear
#         else:
#             return False, "Protocolo no soportado"
        
#         if response.status_code == 200:
#             return True, response.text
#         return False, f"Código HTTP {response.status_code}"
#     except Exception as e:
#         return False, str(e)

# def generate_report(working_proxies, failed_proxies):
#     timestamp = time.strftime("%Y%m%d_%H%M%S")
    
#     with open(f'proxy_report_{timestamp}.txt', 'w') as f:
#         f.write("=== PROXIES FUNCIONANDO ===\n")
#         for proxy in working_proxies:
#             f.write(f"{proxy['original_str']}\n")
        
#         f.write("\n=== PROXIES FALLIDOS ===\n")
#         for proxy in failed_proxies:
#             f.write(f"{proxy['original_str']} - Razón: {proxy['error']}\n")
#     with open(f'proxy_report_{timestamp}.py', 'w') as f:
#         f.write(f"WORKING_PROXIES = {[p['original_str'] for p in working_proxies]}\n")
#         f.write(f"FAILED_PROXIES = {[p['original_str'] for p in failed_proxies]}\n")

# def main():
#     working_proxies = []
#     failed_proxies = []
    
#     print(f"Probando {len(PROXY_LIST)} proxies...\n")
    
#     for proxy_str in PROXY_LIST:
#         proxy_info = parse_proxy(proxy_str)
#         if not proxy_info:
#             print(f"Formato inválido: {proxy_str}")
#             continue
        
#         print(f"Probando {proxy_info['original_str']}...", end=' ', flush=True)
#         success, result = test_proxy(proxy_info)
        
#         if success:
#             print("✓ Funciona")
#             working_proxies.append(proxy_info)
#         else:
#             print(f"✗ Falló ({result})")
#             failed_proxies.append({
#                 **proxy_info,
#                 'error': result
#             })
        
#         time.sleep(1)  
    
#     generate_report(working_proxies, failed_proxies)
#     print("\nReportes generados con éxito!")

# if __name__ == "__main__":
#     main()


import requests
import socks
import socket
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from config.proxy_config import PROXY_LIST

def parse_proxy(proxy_str):
    """Versión optimizada del parser con validación mejorada"""
    parts = proxy_str.strip().split(maxsplit=1)
    if len(parts) != 2:
        return None
    
    protocol, address = parts
    protocol = protocol.lower()
    
    # Validación básica de dirección
    if ':' not in address:
        return None
        
    return {
        'protocol': protocol,
        'address': address,
        'original_str': proxy_str
    }


def test_proxy(proxy_info, test_url="http://httpbin.org/ip", timeout=5):
    """Versión optimizada con mejor manejo de conexiones"""
    try:
        if proxy_info['protocol'] in ['http', 'https']:
            proxy_url = f"{proxy_info['protocol']}://{proxy_info['address']}"
            proxies = {"http": proxy_url, "https": proxy_url}
            
            # Session reutilizable para conexiones HTTP/HTTPS
            with requests.Session() as session:
                session.proxies = proxies
                response = session.get(test_url, timeout=timeout)
                
        elif proxy_info['protocol'] in ['socks4', 'socks5']:
            host, port = proxy_info['address'].split(':', 1)
            socks_type = socks.SOCKS5 if proxy_info['protocol'] == 'socks5' else socks.SOCKS4
            
            # Configuración más limpia de SOCKS
            socks.set_default_proxy(socks_type, host, int(port))
            socket.socket = socks.socksocket
            
            # Timeout más estricto para SOCKS
            response = requests.get(test_url, timeout=min(timeout, 3))
            
        else:
            return False, "Protocolo no soportado"
        
        # Validación mejorada de respuesta
        if response.ok:
            return True, response.text.strip()[:100]  # Solo primeros 100 caracteres
        return False, f"HTTP {response.status_code}"
        
    except requests.exceptions.Timeout:
        return False, "Timeout"
    except requests.exceptions.ConnectionError:
        return False, "Connection failed"
    except Exception as e:
        return False, f"Error: {str(e)}"
    finally:
        # Asegurar limpieza de sockets
        if proxy_info['protocol'] in ['socks4', 'socks5']:
            # Restaurar el comportamiento predeterminado de socket
            socket.socket = socket.SocketType  # Usar `SocketType` en lugar de `_socketobject`
def test_proxy_wrapper(proxy_str):
    """Wrapper para manejo de errores en el hilo"""
    proxy_info = parse_proxy(proxy_str)
    if not proxy_info:
        return None, None, f"Formato inválido: {proxy_str}"
    
    success, result = test_proxy(proxy_info)
    return proxy_info, success, result

def generate_report(working_proxies, failed_proxies):
    """Generación de reportes optimizada"""
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    report_data = {
        'working': [p['original_str'] for p in working_proxies],
        'failed': {p['original_str']: p['error'] for p in failed_proxies}
    }
    
    # Reporte TXT
    with open(f'proxy_report_{timestamp}.txt', 'w') as f:
        f.write("=== PROXIES FUNCIONANDO ===\n")
        f.write('\n'.join(report_data['working']) + '\n')
        f.write("\n=== PROXIES FALLIDOS ===\n")
        for proxy, error in report_data['failed'].items():
            f.write(f"{proxy} - Razón: {error}\n")
    
    # Reporte Python (serializado)
    with open(f'proxy_report_{timestamp}.py', 'w') as f:
        f.write(f"WORKING_PROXIES = {report_data['working']}\n")
        f.write(f"FAILED_PROXIES = {report_data['failed']}\n")
    
    return report_data

def main():
    """Versión principal con concurrencia"""
    print(f"Probando {len(PROXY_LIST)} proxies...\n")
    
    working_proxies = []
    failed_proxies = []
    
    # Usamos ThreadPool para pruebas concurrentes
    with ThreadPoolExecutor(max_workers=20) as executor:
        future_to_proxy = {
            executor.submit(test_proxy_wrapper, proxy_str): proxy_str 
            for proxy_str in PROXY_LIST
        }
        
        for future in as_completed(future_to_proxy):
            proxy_info, success, result = future.result()
            if not proxy_info:
                print(f"✗ {result}")
                continue
                
            if success:
                print(f"✓ {proxy_info['original_str']}")
                working_proxies.append(proxy_info)
            else:
                print(f"✗ {proxy_info['original_str']} - {result}")
                failed_proxies.append({
                    **proxy_info,
                    'error': result
                })
    
    # Generar reportes
    report = generate_report(working_proxies, failed_proxies)
    
    print("\nResumen:")
    print(f"Proxies funcionales: {len(report['working'])}")
    print(f"Proxies fallidos: {len(report['failed'])}")
    print(f"Reportes guardados como proxy_report_*.txt/py")

if __name__ == "__main__":
    start_time = time.time()
    main()
    print(f"\nTiempo total: {time.time() - start_time:.2f} segundos")