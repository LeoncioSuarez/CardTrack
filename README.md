# 🃏 CardTrack

![Kanban Board](https://img.shields.io/badge/Project%20Type-Kanban%20Board-007bff?style=flat&logo=trello)
![Frontend](https://img.shields.io/badge/Frontend-React%20JS-61DAFB?style=flat&logo=react)
![Backend](https://img.shields.io/badge/Backend-Django%20REST-092E20?style=flat&logo=django)
![Database](https://img.shields.io/badge/Database-MySQL-4479A1?style=flat&logo=mysql)
![Status](https://img.shields.io/badge/Status-En%20Desarrollo-orange)

> **CardTrack** es una aplicación web de gestión de proyectos inspirada en la metodología Kanban. Permite a los usuarios crear proyectos, definir columnas personalizables y gestionar tareas mediante tarjetas dinámicas, facilitando la visualización del flujo de trabajo y el seguimiento del progreso.

---

## ⚙️ Características Principales

* **Gestión de Usuarios:** Permite a los usuarios registrarse e iniciar sesión de forma segura.
* **Creación de Proyectos:** Los usuarios pueden crear y organizar múltiples proyectos de trabajo.
* **Tableros Kanban Personalizables:** Dentro de cada proyecto, es posible crear columnas (ej: *To Do*, *In Progress*, *Done*).
* **Gestión de Tareas (Cards):** Funcionalidad CRUD (Crear, Leer, Actualizar, Eliminar) para tarjetas/tareas dentro de las columnas.
* **Arrastrar y Soltar (Drag and Drop):** Interfaz dinámica para mover tareas entre columnas, reflejando el progreso.

---

## 💻 Tecnologías Utilizadas

### Frontend (Cliente)
* **Framework:** React.js
* **Lenguaje:** JavaScript 
* **Estilos:** CSS Modules

### Backend (Servidor/API)
* **Framework:** Django REST Framework (DRF)
* **Lenguaje:** Python 3.x
* **Autenticación:** Tokens JWT

### Base de Datos
* **SGBD:** MySQL (Servidor de base de datos)

---

## 🚀 Instalación y Ejecución Local

Dado que **CardTrack** es un proyecto Full-Stack, necesitas configurar el Backend (API) y el Frontend (UI) por separado.

### Prerrequisitos
Asegúrate de tener instalado:
1.  **Git**
2.  **Python 3.x** y **pip**
3.  **Node.js** (LTS) y **npm** o **yarn**
4.  Un servidor de **MySQL** (local o remoto)

### 1. Configuración del Backend (API de Django)

1.  **Clonar el repositorio:**
    ```bash
    git clone [https://github.com/tu-usuario/CardTrack.git](https://github.com/tu-usuario/CardTrack.git)
    cd CardTrack
    ```

2.  **Configurar el entorno de Python y dependencias:**
    ```bash
    # Asume que el backend está en una carpeta llamada 'backend'
    cd backend
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt # Asegúrate de crear este archivo previamente
    ```

3.  **Configurar la Base de Datos y Variables de Entorno:**
    * Crea una base de datos MySQL para el proyecto (ej: `cardtrack_db`).
    * Crea un archivo `.env` en la carpeta `backend/` con tus credenciales de base de datos (Ejemplo):
        ```
        # .env
        SECRET_KEY=tu_clave_secreta_de_django
        DEBUG=True
        DB_NAME=cardtrack_db
        DB_USER=root
        DB_PASSWORD=TuContraseña
        DB_HOST=127.0.0.1
        DB_PORT=3306
        ```

4.  **Ejecutar Migraciones:**
    ```bash
    python manage.py makemigrations
    python manage.py migrate
    ```

5.  **Iniciar el Servidor de la API:**
    ```bash
    python manage.py runserver
    # La API debería estar corriendo en [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
    ```

### 2. Configuración del Frontend (React.js)

1.  **Navega al directorio del Frontend:**
    ```bash
    cd ../frontend
    ```

2.  **Instalar dependencias de Node:**
    ```bash
    npm install
    # o
    yarn install
    ```

3.  **Iniciar la Aplicación React:**
    ```bash
    npm run dev
---

