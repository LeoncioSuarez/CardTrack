// src/components/Dashboard.jsx

import React from 'react';
import { useAuth } from '../useAuth.js';

const Dashboard = () => {
    const { user, logout } = useAuth();
    
    // Aquí es donde iría la lógica del dashboard real (sidebar, rutas internas, etc.)

    return (
        <div className="dashboard-layout">
            <header style={{ padding: '20px', backgroundColor: '#f0f0f0', display: 'flex', justifyContent: 'space-between' }}>
                <h1>Bienvenido, {user ? user.name || user.email : 'Usuario'}</h1>
                <button onClick={logout} className="main-button">Cerrar Sesión</button>
            </header>
            
            {/* Por ahora, muestra solo un mensaje para confirmar que estás logueado */}
            <main style={{ padding: '20px' }}>
                <h2>Contenido del Dashboard</h2>
                <p>¡Has iniciado sesión exitosamente! Ahora podemos trabajar en la vista de Tableros y Tareas.</p>
                {/* Aquí deberías cargar el componente Sidebar y las Rutas internas */}
            </main>
        </div>
    );
};

export default Dashboard;