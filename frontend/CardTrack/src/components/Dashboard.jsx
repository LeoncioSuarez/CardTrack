import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Profile from './Profile';
import CreateBoard from './CreateBoard';
import Settings from './Settings';

const MyBoards = () => (
    <div style={{ padding: '20px' }}>
        <h2>Tus Tableros</h2>
        <p>Aquí se mostrará una tabla con los tableros kanban del usuario.</p>
    </div>
);

const Dashboard = () => {
    const [activeView, setActiveView] = useState('profile');

    const renderContent = () => {
        switch (activeView) {
            case 'profile':
                return <Profile />;
            case 'createBoard':
                return <CreateBoard />;
            case 'myBoards':
                return <MyBoards />;
            case 'settings':
                return <Settings />;
            default:
                return <Profile />;
        }
    };

    return (
        <div className="dashboard-container">
            <Sidebar activeView={activeView} setActiveView={setActiveView} />
            
            <div className="dashboard-content"> 
                {renderContent()}
            </div>
        </div>
    );
};

export default Dashboard;