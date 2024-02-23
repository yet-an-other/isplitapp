import { useState, useEffect } from 'react'

/**
 * Switches between dark and light mode, uses local storage to persist.
 * Uses the `element` parameter to add the dark or light class to the element.
 * @param initialValue set the initial value of the dark mode
 * @param darkModeClass the class to add when dark mode is enabled
 * @param lightModeClass the class to add when light mode is enabled
 * @param element the element to add the dark or light class to
 * @param storageKey the key to use for local storage 
 * @returns {isDarkMode, toggle} the current mode and a function to toggle the mode
 */
export const useDarkMode = function (
    {
        initialValue = false, 
        darkModeClass = 'dark', 
        lightModeClass = 'light', 
        element = 'body', 
        storageKey = 'is-dark-mode',
    } = {}): {isDarkMode: boolean, toggle: () => void} {

    const [isDarkMode, setIsDarkMode] = useState(initialValue)

    const toggle = function () {
        const newMode = !isDarkMode;
        const theme = newMode ? darkModeClass : lightModeClass;
        const _element = document.querySelector(element);
        if (_element) {
            _element.classList.add(theme);
            const prevTheme = newMode ? lightModeClass : darkModeClass;
            _element.classList.remove(prevTheme);
        }
        setIsDarkMode(newMode);
        localStorage.setItem(storageKey, newMode.toString());
    }

    useEffect(() => {
        const isDarkModeStored = Boolean(JSON.parse(localStorage.getItem(storageKey) ?? initialValue.toString()));
        if (isDarkModeStored !== initialValue)
            toggle();
        setIsDarkMode(isDarkModeStored);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return {isDarkMode, toggle};
}