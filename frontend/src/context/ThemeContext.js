import React, { createContext, useState, useEffect } from 'react';

// Create the theme context
export const ThemeContext = createContext({
  darkMode: true, // Changed default to true for dark mode
  toggleDarkMode: () => {},
});

// Create the theme provider component
export const ThemeProvider = ({ children }) => {
  // Check if dark mode is stored in localStorage, default to true (dark mode)
  const storedDarkMode = localStorage.getItem('darkMode') !== 'false'; // Default to true
  const [darkMode, setDarkMode] = useState(storedDarkMode);

  // Toggle dark mode function
  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  // Apply dark mode by default on mount
  useEffect(() => {
    // Set dark mode as default if no preference is stored
    if (localStorage.getItem('darkMode') === null) {
      setDarkMode(true);
      localStorage.setItem('darkMode', 'true');
    }
  }, []);

  // Update localStorage and apply class to body when darkMode changes
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    
    // Apply or remove dark-mode class from body
    if (darkMode) {
      document.body.classList.add('dark-mode');
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      document.body.setAttribute('data-theme', 'light');
    }
  }, [darkMode]);

  // Provide the theme context to children
  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};