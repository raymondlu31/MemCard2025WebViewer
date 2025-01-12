/*
MemCard2025
MIT License
Copyright (c) 2025 Raymond Lou Independent Developer
See LICENSE file for full license information.
*/


// js/pathReplacement.js

export const PathUtils = {
    join: (...parts) => {
        return parts
            .map(part => part.replace(/\\/g, '/')) // Normalize slashes
            .join('/')
            .replace(/\/+/g, '/'); // Remove duplicate slashes
    },
    resolve: (...parts) => {
        let fullPath = PathUtils.join(...parts);
        const stack = [];
        fullPath.split('/').forEach(part => {
            if (part === '..') {
                stack.pop(); // Go up a directory
            } else if (part !== '.') {
                stack.push(part); // Add the part to the path
            }
        });
        return '/' + stack.join('/');
    }
};