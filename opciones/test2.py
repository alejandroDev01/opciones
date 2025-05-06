import requests
import json
import socks
import socket
from config.list import PROXY_LIST

def parse_proxy(proxy_str):
    try:
        protocol, address = proxy_str.split(' ', 1)
        return {
            'protocol': protocol.lower(),
            'address': address,
            'original_str': proxy_str
        }
    except Exception as e:
        print(f"Error parsing proxy: {proxy_str} - {e}")
        return None

def test_proxies(proxies):
    report = []
    request_number = 1
    for proxy_str in proxies:
        proxy_info = parse_proxy(proxy_str)
        if not proxy_info:
            print(f"Formato inválido: {proxy_str}")
            continue
        print(f"Conectando al proxy: {proxy_info['original_str']}")
        
        try:
            if proxy_info['protocol'] in ['http', 'https']:
                proxies = {
                    "http": f"{proxy_info['protocol']}://{proxy_info['address']}",
                    "https": f"{proxy_info['protocol']}://{proxy_info['address']}"
                }
                ip_response = requests.get('https://api.ipify.org?format=json', proxies=proxies, timeout=15, verify=False)
            elif proxy_info['protocol'] in ['socks4', 'socks5']:
                host, port = proxy_info['address'].split(':')
                socks.set_default_proxy(
                    socks.SOCKS5 if proxy_info['protocol'] == 'socks5' else socks.SOCKS4,
                    host,
                    int(port)
                )
                socket.socket = socks.socksocket
                ip_response = requests.get('https://api.ipify.org?format=json', timeout=15, verify=False)
            else:
                print(f"Protocolo no soportado: {proxy_info['protocol']}")
                continue

            public_ip = ip_response.json().get('ip', 'N/A')
            
            response_info = {
                "numeroSolicitud": request_number,
                "protocolo": proxy_info['protocol'],
                "ipPublica": public_ip,
                "prueba": {
                    "error": None,
                    "respuesta": ip_response.text,
                    "encabezados": dict(ip_response.headers)
                }
            }
            
            report.append(response_info)
            print(f"IP pública recibida: {response_info}")
        
        except Exception as e:
            response_info = {
                "numeroSolicitud": request_number,
                "protocolo": proxy_info['protocol'],
                "ipPublica": None,
                "prueba": {
                    "error": str(e),
                    "respuesta": None,
                    "encabezados": None
                }
            }
            report.append(response_info)
            print(f"Error al usar el proxy {proxy_info['original_str']}: {e}")
        
        print(f"Desconectando del proxy: {proxy_info['original_str']}\n")
        request_number += 1
        
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    with open('proxy_report_{timestamp}.json', 'w') as f:
        json.dump(report, f, indent=4)

if __name__ == "__main__":
    test_proxies(PROXY_LIST)