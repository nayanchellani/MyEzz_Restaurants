import { useState, useMemo, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import MenuItemCard from '../../components/MenuItemCard/MenuItemCard';
import AddItemModal from '../../components/AddItemModal/AddItemModal';
import SuccessToast from '../../components/ui/SuccessToast';
import Spinner from '../../components/Spinner/Spinner';
import { useRestaurant } from '../../context/RestaurantContext';
import { getMenuItems, getCategories, addMenuItem, toggleStock, deleteMenuItem } from '../../services/menuService';
import { STATUS_TABS } from '../../types/menu';
import styles from './Menu.module.css';

function Menu() {
  const { restaurantName, restaurantId } = useRestaurant();
  const [menuItems, setMenuItems] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState(STATUS_TABS.ALL);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: '' });

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [items, cats] = await Promise.all([
        getMenuItems(restaurantId),
        getCategories()
      ]);
      setMenuItems(items);
      setAvailableCategories(cats.map(c => c.name));
    } catch (err) {
      console.error('Failed to load menu data:', err);
      setError('Failed to load menu. Please make sure backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const categories = ['All', ...availableCategories];

  // Filter items based on search, category, and status
  const filteredItems = useMemo(() => {
    let items = menuItems;

    // Filter by search query
    if (searchQuery) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      items = items.filter(item => item.category === selectedCategory);
    }

    // Filter by status tab
    if (activeTab === STATUS_TABS.IN_STOCK) {
      items = items.filter(item => item.inStock);
    } else if (activeTab === STATUS_TABS.OUT_OF_STOCK) {
      items = items.filter(item => !item.inStock);
    }

    return items;
  }, [menuItems, searchQuery, selectedCategory, activeTab]);

  // Count items
  const inStockCount = menuItems.filter(item => item.inStock).length;
  const outOfStockCount = menuItems.filter(item => !item.inStock).length;

  // Handle toggle stock status
  const handleToggleStock = async (itemId) => {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;

    // Optimistic update
    setMenuItems(prev => prev.map(i => i.id === itemId ? { ...i, inStock: !i.inStock } : i));

    try {
       await toggleStock(itemId, !item.inStock);
    } catch (e) {
       // Revert on failure
       setMenuItems(prev => prev.map(i => i.id === itemId ? { ...i, inStock: item.inStock } : i));
    }
  };

  // Handle add new item
  const handleAddItem = async (newItemData) => {
    try {
      const addedItem = await addMenuItem(newItemData);
      setMenuItems(prev => [...prev, { ...addedItem, category: newItemData.category }]); 
      // Note: Backend returns joined category object, but for simplicity we rely on local data or refetch
      // Actually backend response from my server.js returns the raw inserted row without join?
      // Ah, I need to check my server.js POST implementation. 
      // It returns `data[0]`. `data[0]` is just the menu_items row. It won't have `categories: { name: ... }`.
      // So `addedItem.category` will be undefined or I need to refetch.
      // Easiest is to manually attach the category name from input since we know it exists.
      
      setIsAddModalOpen(false);
      setToast({ isVisible: true, message: `"${newItemData.name}" added!` });
      
      // Refresh to be safe/clean
      fetchData();
    } catch (err) {
      console.error(err);
      setToast({ isVisible: true, message: 'Failed to add item' });
    }
  };

  // Handle delete item
  const handleDeleteItem = async (itemId) => {
    if(!window.confirm('Delete this item?')) return;
    
    const item = menuItems.find(i => i.id === itemId);
    setMenuItems(prev => prev.filter(i => i.id !== itemId)); // Optimistic

    try {
      await deleteMenuItem(itemId);
      setToast({ isVisible: true, message: 'Item deleted' });
    } catch (err) {
      setMenuItems(prev => [...prev, item]); // Revert
      setToast({ isVisible: true, message: 'Failed to delete item' });
    }
  };

  const closeToast = () => {
    setToast({ isVisible: false, message: '' });
  };

  return (
    <div className={styles.menu}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>Menu & Inventory Management</h1>
          </div>
          <button 
            className={styles.addButton}
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={20} />
            Add Item
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className={styles.searchContainer}>
        <Search className={styles.searchIcon} size={20} />
        <input
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Category Pills */}
      <div className={styles.categoryContainer}>
        <div className={styles.categoryScroll}>
          {categories.map(category => (
            <button
              key={category}
              className={`${styles.categoryPill} ${selectedCategory === category ? styles.categoryActive : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Status Tabs */}
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tab} ${activeTab === STATUS_TABS.ALL ? styles.tabActive : ''}`}
          onClick={() => setActiveTab(STATUS_TABS.ALL)}
        >
          All Items
          <span className={styles.tabCount}>{menuItems.length}</span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === STATUS_TABS.IN_STOCK ? styles.tabActive : ''}`}
          onClick={() => setActiveTab(STATUS_TABS.IN_STOCK)}
        >
          In Stock
          <span className={`${styles.tabCount} ${styles.tabCountSuccess}`}>
            {inStockCount}
          </span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === STATUS_TABS.OUT_OF_STOCK ? styles.tabActive : ''}`}
          onClick={() => setActiveTab(STATUS_TABS.OUT_OF_STOCK)}
        >
          Out of Stock
          <span className={`${styles.tabCount} ${styles.tabCountDanger}`}>
            {outOfStockCount}
          </span>
        </button>
      </div>

      {/* Items List */}
      <div className={styles.itemsList}>
        {isLoading ? (
            <div className={styles.loadingState}>
              <Spinner />
              <p>Loading...</p>
            </div>
        ) : error ? (
            <div className={styles.errorState}>
              <p className={styles.errorText}>{error}</p>
            </div>
        ) : filteredItems.length > 0 ? (
          filteredItems.map(item => (
            <MenuItemCard
              key={item.id}
              item={item}
              onToggleStock={handleToggleStock}
              onDelete={handleDeleteItem}
            />
          ))
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>No items found</p>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddItem}
        categories={availableCategories} // Passing dynamic categories
      />

      {/* Success Toast Notification */}
      {toast.isVisible && (
        <SuccessToast
          message={toast.message}
          onClose={closeToast}
        />
      )}
    </div>
  );
}

export default Menu;