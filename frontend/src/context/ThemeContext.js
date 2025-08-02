import React, { createContext, useState, useEffect } from 'react';

// Create the theme context - dark mode only
export const ThemeContext = createContext({
  darkMode: true, // Always dark mode
  toggleDarkMode: () => {}, // Disabled
});

// Create the theme provider component
export const ThemeProvider = ({ children }) => {
  // Always use dark mode
  const [darkMode, setDarkMode] = useState(true);

  // Disable theme toggle - always dark
  const toggleDarkMode = () => {
    // No-op - theme switching disabled
  };

  // Apply dark mode on mount
  useEffect(() => {
    // Always set dark mode
    setDarkMode(true);
    localStorage.setItem('darkMode', 'true');
  }, []);

  // Update localStorage and apply class to body when darkMode changes
  useEffect(() => {
    localStorage.setItem('darkMode', 'true');
    
    // Always apply dark mode
    document.body.classList.add('dark-mode');
    document.body.setAttribute('data-theme', 'dark');
  }, [darkMode]);

  // Provide the theme context to children
  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};