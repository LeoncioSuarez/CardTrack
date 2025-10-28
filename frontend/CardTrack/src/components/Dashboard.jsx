import React from 'react';
import Sidebar from './Sidebar.jsx';

export const Dashboard = ({ viewComponent }) => {
    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content">
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
