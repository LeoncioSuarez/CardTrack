import React from 'react';
import Sidebar from './Sidebar.jsx';

const Dashboard = ({ viewComponent }) => {
    return (
        <div className="dashboard-layout" style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <main className="dashboard-content" style={{ flex: 1, padding: '20px' }}>
                {viewComponent || (
                    <div className="dashboard-content-message">
                        Selecciona una opción del menú.
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
