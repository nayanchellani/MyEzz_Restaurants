import { createContext, useContext, useState, useEffect } from 'react';
import { getRestaurantDetails } from '../services/menuService';

const RestaurantContext = createContext();

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};

export const RestaurantProvider = ({ children, restaurantId }) => {
  const [restaurantName, setRestaurantName] = useState('Loading...');
  const [restaurantData, setRestaurantData] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (restaurantId) {
      fetchRestaurantData();
    }
  }, [restaurantId]);

  const fetchRestaurantData = async () => {
    try {
      setIsLoading(true);
      const data = await getRestaurantDetails(restaurantId);
      setRestaurantData(data);
      setRestaurantName(data?.name || 'Unknown Restaurant');
    } catch (error) {
      console.error('Failed to fetch restaurant:', error);
      setRestaurantName('Error Loading');
    } finally {
      setIsLoading(false);
    }
  };

  const setOnlineStatus = (status) => {
    setIsOnline(status);
  };

  const toggleProfile = (isOpen) => {
    setIsProfileOpen(isOpen);
  };

  const value = {
    restaurantId,
    restaurantName,
    restaurantData,
    isOnline,
    setOnlineStatus,
    isProfileOpen,
    toggleProfile,
    isLoading,
    refetchRestaurant: fetchRestaurantData
  };

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
};
