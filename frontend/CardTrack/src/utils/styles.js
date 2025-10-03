export const COLORS = {
    WHITE: '#FFFFFF',
    BLACK: '#000000',
    
    PRIMARY_BACKGROUND: '#F9F9F9', 
    SURFACE_BACKGROUND: '#EBEBEB',
    PRIMARY_TEXT: '#333333',
    SECONDARY_TEXT: '#777777',    

   
    ACCENT_PRIMARY: '#007ACF',  
    ACCENT_SECONDARY: '#5CB85C',

 
    STATUS_DANGER: '#D9534F', 
    STATUS_WARNING: '#F0AD4E',
};


export const COMMON_STYLES = {
    CARD_SHADOW: '0 4px 12px rgba(0, 0, 0, 0.1)',
    
    MAIN_BUTTON: {
        padding: '10px',
        backgroundColor: COLORS.ACCENT_PRIMARY,
        color: COLORS.WHITE,
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'background-color 0.2s',
    },

    DANGER_BUTTON: {
        padding: '10px 20px',
        backgroundColor: COLORS.STATUS_DANGER,
        color: COLORS.WHITE,
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        fontWeight: 'bold',
    },
};