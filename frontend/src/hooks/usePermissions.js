import { useState, useEffect } from 'react';
import { api } from '../services/api';

const usePermissions = () => {
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPermissions = async () => {
            try {
                const data = await api('/clubs/my-permissions');
                setPermissions(data);
            } catch (err) {
                // Default to all permissions if fetch fails
                setPermissions({});
            } finally {
                setLoading(false);
            }
        };
        fetchPermissions();
    }, []);

    const hasPermission = (feature) => {
        // If no permissions configured, allow everything
        if (Object.keys(permissions).length === 0) return true;
        return permissions[feature] === true;
    };

    return { permissions, loading, hasPermission };
};

export default usePermissions;