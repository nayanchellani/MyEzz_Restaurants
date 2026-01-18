import axios from 'axios';
import { config } from '../config';

const api = axios.create({
    baseURL: config.apiUrl,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Extract restaurantId from URL path (e.g., /2/menu -> 2)
const getRestaurantIdFromPath = () => {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const firstPart = pathParts[0];
    
    // Check if first part is a valid integer number
    if (firstPart) {
        const id = parseInt(firstPart, 10);
        if (!isNaN(id) && id > 0) {
            return id;
        }
    }
    return 1; // Default to 1 (Patel Juice Centre) if missing/invalid
};

// Add interceptor to include restaurantId from URL path
api.interceptors.request.use((reqConfig) => {
    const restaurantId = getRestaurantIdFromPath();
    // Always attach valid ID
    reqConfig.params = { ...reqConfig.params, restaurantId };
    return reqConfig;
});

export async function getRestaurantDetails(restaurantId) {
    try {
        const params = restaurantId ? { restaurantId } : {};
        const response = await api.get('/api/restaurant', { params });
        return response.data.data;
    } catch (error) {
        console.error('Error fetching restaurant details:', error);
        return { name: 'MyEzz Restaurant' }; // Fallback
    }
}

export async function getMenuItems(restaurantId) {
    try {
        const params = restaurantId ? { restaurantId } : {};
        const response = await api.get('/api/menu', { params });
        return response.data.data;
    } catch (error) {
        console.error('Error fetching menu items:', error);
        throw new Error(error.response?.data?.error || 'Failed to fetch menu items');
    }
}

export async function getCategories() {
    try {
        const response = await api.get('/api/categories');
        return response.data.data;
    } catch (error) {
        console.error('Error fetching categories:', error);
        return []; // Return empty if fails
    }
}

export async function addMenuItem(itemData, restaurantId) {
    try {
        const params = restaurantId ? { restaurantId } : {};
        const response = await api.post('/api/menu', itemData, { params });
        return response.data.data;
    } catch (error) {
        console.error('Error adding menu item:', error);
        throw new Error(error.response?.data?.error || 'Failed to add menu item');
    }
}

export async function deleteMenuItem(id) {
    try {
        await api.delete(`/api/menu/${id}`);
    } catch (error) {
        console.error('Error deleting menu item:', error);
        throw new Error(error.response?.data?.error || 'Failed to delete menu item');
    }
}

export async function toggleStock(id, inStock) {
    // Current DB schema doesn't have stock status
    // optimistically return success
    return { id, inStock };
}

export async function updateRestaurant(data, restaurantId) {
    try {
        const params = restaurantId ? { restaurantId } : {};
        const response = await api.put('/api/restaurant', data, { params });
        return response.data.data;
    } catch (error) {
        console.error('Error updating restaurant details:', error);
        throw new Error(error.response?.data?.error || 'Failed to update restaurant details');
    }
}
