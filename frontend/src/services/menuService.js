import axios from 'axios';
import { config } from '../config';

const api = axios.create({
    baseURL: config.apiUrl,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add interceptor to include restaurantId from URL if present
api.interceptors.request.use((config) => {
    const params = new URLSearchParams(window.location.search);
    const restaurantId = params.get('restaurantId');
    if (restaurantId) {
        config.params = { ...config.params, restaurantId };
    }
    return config;
});

export async function getRestaurantDetails() {
    try {
        const response = await api.get('/api/restaurant');
        return response.data.data;
    } catch (error) {
        console.error('Error fetching restaurant details:', error);
        return { name: 'MyEzz Restaurant' }; // Fallback
    }
}

export async function getMenuItems() {
    try {
        const response = await api.get('/api/menu');
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

export async function addMenuItem(itemData) {
    try {
        const response = await api.post('/api/menu', itemData);
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
