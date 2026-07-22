# 🐳 Guía de Orquestación y Ejecución con Docker: SIGATE

Esta guía detalla la arquitectura de **3 microservicios** configurada y lista para ejecutarse mediante **Docker Compose** en tu entorno local.

---

## 1. Arquitectura de los 3 Microservicios

El archivo [docker-compose.yml](file:///d:/PROYECTO%20TITULACION/docker-compose.yml) orquesta los siguientes componentes en una red aislada llamada `sigate-network`:

1.  **Microservicio 1: MongoDB (`sigate-mongodb`)**  
    *   **Tipo:** Base de datos NoSQL orientada a documentos.
    *   **Uso:** Excelente para el registro de logs de auditoría técnica, logs de accesos del sistema o almacenamiento de datos no estructurados de la plataforma.
    *   **Puerto expuesto:** `27017`
2.  **Microservicio 2: PostgreSQL (`sigate-postgres`)**  
    *   **Tipo:** Base de datos Relacional (RDBMS).
    *   **Uso:** Almacenamiento central transaccional del negocio (usuarios, estudiantes, matrículas, bitácoras de prácticas, expedientes de titulación).
    *   **Inicialización automática:** Lee e inyecta tus archivos `schema.sql` y `seeds.sql` al levantar el contenedor por primera vez.
    *   **Puerto expuesto:** `5432`
3.  **Microservicio 3: PostgREST (`sigate-postgrest`)**  
    *   **Tipo:** Servidor web API RESTful autogenerado.
    *   **Uso:** Se conecta directamente a PostgreSQL y **convierte de forma instantánea todo tu esquema de tablas y relaciones en endpoints REST listos para consumir**. No requiere código de backend para operaciones CRUD.
    *   **Puerto expuesto:** `3005`

---

## 2. Cómo Levantar la Arquitectura

1. Abre tu terminal de Windows (PowerShell o CMD).
2. Asegúrate de estar ubicado en la raíz de tu proyecto:
   ```powershell
   cd "d:\PROYECTO TITULACION"
   ```
3. Ejecuta el comando de Docker Compose para levantar todos los servicios en segundo plano (`detached mode`):
   ```powershell
   docker compose up -d
   ```
4. Para verificar que los contenedores están corriendo correctamente, escribe:
   ```powershell
   docker compose ps
   ```

---

## 3. Pruebas de Conexión y Endpoints (PostgREST API)

Una vez que los microservicios estén activos, PostgREST expondrá tu base de datos de PostgreSQL en el puerto `3005`. Puedes probar el API directamente en tu navegador web o en herramientas como Postman/Thunder Client:

### A. Consultar la lista de asignaturas (Tabla `materias`)
*   **Método:** `GET`
*   **URL:** `http://localhost:3005/materias`
*   **Resultado:** Te devolverá el listado completo JSON con las materias de Desarrollo de Software (fundamentos de programación, estructuras de datos, etc.).

### B. Buscar un estudiante específico (Filtro por Cédula)
PostgREST incluye un potente sistema de filtros directamente en la URL:
*   **Método:** `GET`
*   **URL:** `http://localhost:3005/usuarios?cedula=eq.1725364758`
*   **Resultado:** Te devolverá únicamente los datos de usuario correspondientes al estudiante Marlon.

### C. Consultar las bitácoras aprobadas de prácticas
*   **Método:** `GET`
*   **URL:** `http://localhost:3005/bitacoras_actividades?estado_auditoria=eq.APPROVED`

---

## 4. Comandos de Control Útiles

*   **Ver los logs en tiempo real (para depurar errores):**
    ```powershell
    docker compose logs -f
    ```
*   **Detener los microservicios sin borrar los datos:**
    ```powershell
    docker compose stop
    ```
*   **Apagar los servicios y liberar recursos (redes y contenedores):**
    ```powershell
    docker compose down
    ```
*   **Apagar los servicios y borrar las bases de datos para reiniciar desde cero:**
    ```powershell
    docker compose down -v
    ```
