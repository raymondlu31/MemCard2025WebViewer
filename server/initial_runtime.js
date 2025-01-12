/*
MemCard2025
MIT License
Copyright (c) 2025 Raymond Lou Independent Developer
See LICENSE file for full license information.
*/


// server/initial_runtime.js

const fs = require('fs');
const path = require('path');

const Paths = {
    // BASE_DIRECTORY: path.resolve(__dirname, '../html/'),
    Resource_Root: path.join(path.resolve(__dirname, '../htmlmemcard/'), 'MemCard-resource/'),
    get Media_Root() { return path.join(this.Resource_Root, 'media/'); },
    get Image_Directory() { return path.join(this.Media_Root, 'images/'); },
    get Audio_Directory() { return path.join(this.Media_Root, 'audio/'); },
    get Subtitle_Directory() { return path.join(this.Media_Root, 'subtitles/'); },
    get CONFIG_FOLDER() { return path.join(this.Resource_Root, 'config'); },
    get RUNTIME_FOLDER() { return path.join(this.Resource_Root, 'runtime'); },
    get MEMCARD_CONFIG() { return path.join(this.CONFIG_FOLDER, 'memcard2025.cfg'); },
    get CARD_LIST_FILE() { return path.join(this.CONFIG_FOLDER, 'card-list.txt'); }
};

function clearRuntimeFolder() {
    if (fs.existsSync(Paths.RUNTIME_FOLDER)) {
        fs.readdirSync(Paths.RUNTIME_FOLDER).forEach(file => {
            const filePath = path.join(Paths.RUNTIME_FOLDER, file);
            if (fs.lstatSync(filePath).isFile()) {
                fs.unlinkSync(filePath);
            }
        });
    } else {
        fs.mkdirSync(Paths.RUNTIME_FOLDER, { recursive: true });
    }
    console.log('Runtime folder cleared.');
}

function loadCardList() {
    if (!fs.existsSync(Paths.CARD_LIST_FILE)) {
        throw new Error(`Card list file not found: ${Paths.CARD_LIST_FILE}`);
    }

    const cardLines = fs.readFileSync(Paths.CARD_LIST_FILE, 'utf8').split('\n').filter(line => line.trim() !== '');
    const cards = cardLines.map(line => {
        const [category, subNumber, alias] = line.split('-');
        return { category, subNumber, alias, uniqueName: alias ? `${category}-${subNumber}-${alias}` : `${category}-${subNumber}` };
    });
    console.log('Card list loaded.');
    return cards;
}

function writeRuntimeFiles(cards) {
    const cardsByCategory = cards.reduce((acc, card) => {
        if (!acc[card.category]) acc[card.category] = [];
        acc[card.category].push(card.uniqueName);
        return acc;
    }, {});
    
    // Write current-category-<Category>.tmp files
    Object.keys(cardsByCategory).forEach(category => {
        const filePath = path.join(Paths.RUNTIME_FOLDER, `current-category-${category}.tmp`);
        fs.writeFileSync(filePath, cardsByCategory[category].join('\n'), 'utf8');
    });

    // Write existing-category.tmp
    const existingCategories = Object.keys(cardsByCategory).sort();
    const existingCategoryFilePath = path.join(Paths.RUNTIME_FOLDER, 'existing-category.tmp');
    fs.writeFileSync(existingCategoryFilePath, existingCategories.join('\n'), 'utf8');

    console.log('Runtime files written.');
}

function initializeRuntime() {
    try {
        console.log('Initializing runtime...');
        clearRuntimeFolder();
        const cards = loadCardList();
        writeRuntimeFiles(cards);
        console.log('Runtime initialization complete.');
    } catch (error) {
        console.error(`Error during runtime initialization: ${error.message}`);
    }
}

module.exports = { initializeRuntime };
