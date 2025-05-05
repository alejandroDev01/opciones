# Usa una imagen base de Node.js
FROM node:18

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos necesarios al contenedor
COPY package*.json ./
COPY . .

# Instala las dependencias
RUN npm install

# Comando para ejecutar el script
CMD ["node", "index2.js"]