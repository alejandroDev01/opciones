from bs4 import BeautifulSoup

# Load the HTML content
with open('c:\\Users\\mi\\Desktop\\PROYECTOS\\modo-proxy\\opciones\\index.html', 'r', encoding='utf-8') as file:
    html_content = file.read()

# Parse the HTML content
soup = BeautifulSoup(html_content, 'html.parser')

# Find all table rows
rows = soup.find_all('tr')

# Extract proxy information
proxies = []
for row in rows:
    columns = row.find_all('td')
    if len(columns) >= 3:
        ip = columns[0].text.strip()
        port = columns[1].text.strip()
        protocol = columns[2].text.strip().lower()
        proxies.append(f"{protocol} {ip}:{port}")

# Print the proxies in the desired format
for proxy in proxies:
    print(f'"{proxy}",')