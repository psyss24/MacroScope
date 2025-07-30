import React, { createContext, useState, useEffect } from 'react';

// Create the theme context
export const ThemeContext = createContext({
  darkMode: false,
  toggleDarkMode: () => {},
});

// Create the theme provider component
export const ThemeProvider = ({ children }) => {
  // Check if dark mode is stored in localStorage
  const storedDarkMode = localStorage.getItem('darkMode') === 'true';
  const [darkMode, setDarkMode] = useState(storedDarkMode);

  // Toggle dark mode function
  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

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