import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Check if Supabase credentials are available
const hasSupabaseCredentials = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY;
let supabase = null;
let useMockData = !hasSupabaseCredentials;

// Initialize Supabase
if (hasSupabaseCredentials) {
    try {
        supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
        console.log('✅ Initialized Supabase client');
    } catch (error) {
        console.warn('⚠️  Failed to initialize Supabase, using mock data:', error.message);
        useMockData = true;
    }
}

// RESTAURANT ID LOGIC
// Defaults to 2 (BE Bytes) if not specified in query param ?restaurantId=X
const getRestaurantId = (req) => {
    const id = req.query.restaurantId || req.headers['x-restaurant-id'];
    return id ? parseInt(id) : 2;
};

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'MyEzz Restaurant API is running',
        mode: useMockData ? 'MOCK - No Supabase required' : 'PRODUCTION - Connected to Supabase'
    });
});

// Get Restaurant Details
app.get('/api/restaurant', async (req, res) => {
    try {
        const id = getRestaurantId(req);
        if (useMockData) return res.json({ success: true, data: { name: 'Mock Restaurant' } });

        const { data, error } = await supabase
            .from('restaurants')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching restaurant:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch restaurant details' });
    }
});

// ============================================
// Menu Items API Endpoints
// ============================================

// Get all menu items
app.get('/api/menu', async (req, res) => {
    try {
        if (useMockData) {
            return res.json({ success: true, data: [] }); // Fallback empty for now
        }

        const restaurantId = getRestaurantId(req);

        // Fetch items joined with categories
        const { data, error } = await supabase
            .from('menu_items')
            .select('*, categories(name)')
            .eq('restaurant_id', restaurantId)
            .order('name');

        if (error) throw error;

        // Transform to frontend format
        const transformedItems = data.map(item => ({
            id: item.id,
            name: item.name,
            category: item.categories?.name || 'Uncategorized',
            price: parseFloat(item.price),
            // Defaulting inStock to true since column is missing in provided schema keys
            inStock: true, 
            isVeg: item.is_veg,
            imageUrl: null // Skipping images as requested
        }));

        res.json({
            success: true,
            data: transformedItems
        });
    } catch (error) {
        console.error('Error fetching menu items:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch menu items' });
    }
});

// Get all categories
app.get('/api/categories', async (req, res) => {
    try {
        if (useMockData) return res.json({ success: true, data: [] });

        const { data, error } = await supabase
            .from('categories')
            .select('id, name')
            .order('name');

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch categories' });
    }
});

// Add menu item
app.post('/api/menu', async (req, res) => {
    try {
        const { name, category, price, isVeg } = req.body;

        if (useMockData) return res.status(500).json({ error: 'Supabase not connected' });

        // 1. Find category ID from name
        const { data: catData, error: catError } = await supabase
            .from('categories')
            .select('id')
            .eq('name', category)
            .single();
        
        if (catError) {
             console.error('Category lookup failed:', catError);
             return res.status(400).json({ error: 'Invalid category' });
        }

        // 2. Insert item
        const { data, error } = await supabase
            .from('menu_items')
            .insert([{
                name,
                category_id: catData.id,
                price,
                is_veg: isVeg,
                restaurant_id: RESTAURANT_ID,
                // price and is_veg map directly, no in_stock column
            }])
            .select();

        if (error) throw error;

        res.json({ success: true, data: data[0] });
    } catch (error) {
        console.error('Error adding item:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete menu item
app.delete('/api/menu/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (useMockData) return res.status(500).json({ error: 'Supabase not connected' });

        const { error } = await supabase
            .from('menu_items')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`Connected to Supabase Project: ${hasSupabaseCredentials ? 'YES' : 'NO'}`);
});
