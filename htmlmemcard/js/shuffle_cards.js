/*
MemCard2025
MIT License
Copyright (c) 2025 Raymond Lou Independent Developer
See LICENSE file for full license information.
*/

// html/js/shuffle_cards.js

import { PathUtils } from './pathReplacement.js';

const Paths = {
    Resource_Root: PathUtils.resolve('./MemCard-resource/'),
    get Media_Root() { return PathUtils.join(this.Resource_Root, 'media/'); },
    get Image_Directory() { return PathUtils.join(this.Media_Root, 'images/'); },
    get Audio_Directory() { return PathUtils.join(this.Media_Root, 'audio/'); },
    get Subtitle_Directory() { return PathUtils.join(this.Media_Root, 'subtitles/'); },
    get CONFIG_FOLDER() { return PathUtils.join(this.Resource_Root, 'config'); },
    get RUNTIME_FOLDER() { return PathUtils.join(this.Resource_Root, 'runtime'); },
    get MEMCARD_CONFIG() { return PathUtils.join(this.CONFIG_FOLDER, 'memcard2025.cfg'); },
    get CARD_LIST_FILE() { return PathUtils.join(this.CONFIG_FOLDER, 'card-list.txt'); }
};


// Function to load categories from 'existing-category.tmp'
async function loadCategories() {
    try {
        const categoryFile = PathUtils.join(Paths.RUNTIME_FOLDER, 'existing-category.tmp');
        const response = await fetch(categoryFile);
        
        if (!response.ok) {
            throw new Error(`Failed to load: ${categoryFile}`);
        }
        
        const fileContent = await response.text();
        return fileContent
            .split('\n')
            .map(line => line.trim())
            .filter(line => line !== '');
    } catch (error) {
        console.error('Error loading categories:', error.message);
        return [];
    }
}

// Load content from session storage for a given category
function loadContent(category) {
    const key = `currentSequence-category-${category}`;
    const content = sessionStorage.getItem(key);
    return content ? JSON.parse(content) : [];
}



// Shuffle an array using the Fisher-Yates algorithm
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}


// Write and replace the content in session storage for a given category
function saveContent(category, content) {
    const key = `currentSequence-category-${category}`;
    sessionStorage.setItem(key, JSON.stringify(content));
}

// Main function to shuffle cards for all categories
async function shuffleCards() {
    const categories = await loadCategories();
    categories.forEach(category => {
        const content = loadContent(category);
        if (content.length > 0) {
            const shuffledContent = shuffleArray(content);
            saveContent(category, shuffledContent);
            console.log(`Shuffled content for category ${category}.`);
            console.info(`---- shuffledContent: ${shuffledContent}`);
        } else {
            console.warn(`No content found for category ${category}.`);
        }
    });
}

// Load default card sequence
async function loadDefaultCardSequence() {
    const categories = await loadCategories();
    categories.forEach(category => {
        const key = `currentSequence-category-${category}`;
        const runtimeFile = PathUtils.join(Paths.RUNTIME_FOLDER, `current-category-${category}.tmp`);
        fetch(runtimeFile)
            .then(response => response.text())
            .then(data => {
                const cardList = data.split('\n').map(line => line.trim()).filter(line => line !== '');
                sessionStorage.setItem(key, JSON.stringify(cardList));
                console.log(`Default sequence loaded for category ${category}.`);
                console.info(`---- default cardList: ${cardList}`);
            })
            .catch(error => console.error(`Failed to load default sequence for ${category}:`, error));
    });
}

export { shuffleCards, loadDefaultCardSequence };

