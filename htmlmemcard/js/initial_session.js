/*
MemCard2025
MIT License
Copyright (c) 2025 Raymond Lou Independent Developer
See LICENSE file for full license information.
*/


// js/initial_session.js

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

async function loadFile(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to load file: ${filePath}`);
        }
        return await response.text();
    } catch (error) {
        console.error(`Error fetching file '${filePath}':`, error.message);
        throw error;
    }
}

export async function loadCategoriesFromFile() {
    const categoryFile = PathUtils.join(Paths.RUNTIME_FOLDER, 'existing-category.tmp');
    try {
        const fileContent = await loadFile(categoryFile);
        const categories = fileContent
            .split('\n')
            .map(line => line.trim())
            .filter(line => line !== '');

        if (categories.length) {
            console.info(`Loaded categories: ${categories.join(', ')}`);
            return categories;
        } else {
            console.warn(`No categories found in ${categoryFile}`);
            return [];
        }
    } catch (error) {
        console.error(`Failed to load categories from ${categoryFile}:`, error.message);
        return [];
    }
}

export async function initializeSession() {
    try {
        const categories = await loadCategoriesFromFile();
        if (!categories.length) {
            console.error('No categories found to initialize session.');
            return;
        }

        for (const category of categories) {
            const cardsByCategory = PathUtils.join(Paths.RUNTIME_FOLDER, `current-category-${category}.tmp`);
            try {
                const fileContent = await loadFile(cardsByCategory);
                const cardList = fileContent
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line !== '');

                if (cardList.length) {
                    sessionStorage.setItem(`currentSequence-category-${category}`, JSON.stringify(cardList));
                    console.info(`Session data for '${category}' loaded from '${cardsByCategory}'`);
                } else {
                    console.warn(`No content found in ${cardsByCategory}`);
                }
            } catch (error) {
                console.error(`Failed to load content for category '${category}' from '${cardsByCategory}':`, error.message);
            }
        }
    } catch (error) {
        console.error('Failed to initialize session:', error.message);
    }
}
