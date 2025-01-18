/*
MemCard2025
MIT License
Copyright (c) 2025 Raymond Lou Independent Developer
See LICENSE file for full license information.
*/

// js/display_view.js - handles display mode logic

import { PathUtils } from './pathReplacement.js';

document.addEventListener('DOMContentLoaded', initDisplayMode);


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

async function initDisplayMode() {
    const elements = {
        image: document.getElementById("display-image"),
        audio: document.getElementById("audio"),
        subtitle: document.getElementById("memSubtitle"),
        prevBtn: document.getElementById("prevBtn"),
        nextBtn: document.getElementById("nextBtn"),
        autoDisplayBtn: document.getElementById("autoDisplayBtn"),
        exitAutoBtn: document.getElementById("exitAutoBtn"),
        
        goHomeBtn: document.getElementById("goHomeBtn")
    };
    
    // Validate that all required elements exist
    const requiredElements = [
        'image', 'audio', 'subtitle', 'prevBtn', 'nextBtn', 
        'autoDisplayBtn', 'exitAutoBtn', 'goHomeBtn'
    ];
    
    const missingElements = requiredElements.filter(el => !elements[el]);
    if (missingElements.length > 0) {
        console.error('Missing required DOM elements:', missingElements);
        alert('Error: Some required page elements are missing. Please check the console for details.');
        return;
    }
    


    const state = {
        mediaQueue: await buildMediaQueue(),
        currentIndex: 0,
        autoDisplayInterval: null,
        secondWindow: null, 
        autoDisplayDuration: await getAutoDisplayInterval()
    };

    if (state.mediaQueue.length === 0) {
        alert("Media queue is empty. Please load a card sequence first.");
        goHome();
        return;
    }

    // Initialize display
    displayMedia(state, elements);
    setupEventListeners(state, elements);
}

async function getAutoDisplayInterval() {
    try {
        const configPath = Paths.MEMCARD_CONFIG;
        const response = await fetch(configPath);

        if (!response.ok) {
            throw new Error(`Failed to fetch configuration file: ${configPath}`);
        }

        const configText = await response.text();
        const configLines = configText.split('\n');
        for (const line of configLines) {
            // Remove extra whitespace and carriage return characters
            const trimmedLine = line.trim(); 
            console.info(`#### line: ${trimmedLine}`);
            const match = trimmedLine.match(/^DisplayMode_AutoCycle_interval=(\d+)$/);
            if (match) {
                console.info(`#### match: ${match}`);
                return parseInt(match[1], 10) * 1000; // Convert seconds to milliseconds
            }
        }

        console.warn("DisplayMode_AutoCycle_interval not found in configuration. Defaulting to 5000ms.");
        return 5000;
    } catch (error) {
        console.error('Error reading configuration file:', error.message);
        return 5000; // Default to 5000ms on error
    }
}

// Function to build the media queue
async function buildMediaQueue() {
    const categories = await loadCategories();
    const mediaQueue = [];

    categories.forEach(category => {
        const key = `currentSequence-category-${category}`;
        const content = JSON.parse(sessionStorage.getItem(key)) || [];
        mediaQueue.push(...content);
    });
    
    console.info(`Loaded mediaQueue: ${mediaQueue}`);

    return mediaQueue;
}

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

// Function to display media
function displayMedia(state, elements) {
    if (state.currentIndex < 0 || state.currentIndex >= state.mediaQueue.length) return;

    const mediaItem = state.mediaQueue[state.currentIndex];
    elements.image.src = PathUtils.join(Paths.Image_Directory, `${mediaItem}.JPG`);
    elements.audio.src = PathUtils.join(Paths.Audio_Directory, `${mediaItem}.mp3`);

    fetchSubtitle(mediaItem)
        .then(subtitle => {
            elements.subtitle.innerText = subtitle;
            // updateSecondDisplay(state, mediaItem, subtitle);
        });

    elements.audio.play().catch(console.warn);
    updateButtonStates(state, elements);
}

// Fetch subtitle for a media item
async function fetchSubtitle(mediaItem) {
    try {
        const subtitlePath = PathUtils.join(Paths.Subtitle_Directory, `${mediaItem}.txt`);
        const response = await fetch(subtitlePath);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch subtitle: ${subtitlePath}`);
        }
        
        return await response.text();
    } catch (error) {
        console.error('Error fetching subtitle:', error.message);
        return "";
    }
}

function updateButtonStates(state, elements) {
    // Check if all required elements exist
    if (!elements.prevBtn || !elements.nextBtn || !elements.autoDisplayBtn || !elements.exitAutoBtn) {
        console.error('Missing required button elements:', {
            prevBtn: !!elements.prevBtn,
            nextBtn: !!elements.nextBtn,
            autoDisplayBtn: !!elements.autoDisplayBtn,
            exitAutoBtn: !!elements.exitAutoBtn
        });
        return;
    }

    elements.prevBtn.disabled = (state.currentIndex === 0);
    elements.nextBtn.textContent = (state.currentIndex === state.mediaQueue.length - 1) ? "Finish" : "Next";
    elements.autoDisplayBtn.disabled = !!state.autoDisplayInterval;
    elements.exitAutoBtn.disabled = !state.autoDisplayInterval;
}


function startAutoDisplay(state, elements) {
    if (!state.autoDisplayInterval) {
        elements.autoDisplayBtn.disabled = true;
        elements.exitAutoBtn.disabled = false;
        state.autoDisplayInterval = setInterval(() => {
            if (state.currentIndex < state.mediaQueue.length - 1) {
                state.currentIndex++;
                displayMedia(state, elements);
            } else {
                state.currentIndex = 0; // Reset to the first item in the queue
            }
            displayMedia(state, elements);
        }, state.autoDisplayDuration);
    }
}

function stopAutoDisplay(state, elements) {
    if (state.autoDisplayInterval) {
        clearInterval(state.autoDisplayInterval);
        state.autoDisplayInterval = null;
        elements.autoDisplayBtn.disabled = false;
        elements.exitAutoBtn.disabled = true;
    }
}

function goHome() {
    window.location.href = './home_view.html';
}

function setupEventListeners(state, elements) {
    elements.prevBtn.addEventListener('click', () => {
        if (state.currentIndex > 0) {
            state.currentIndex--;
            displayMedia(state, elements);
        }
    });

    elements.nextBtn.addEventListener('click', () => {
        if (state.currentIndex < state.mediaQueue.length - 1) {
            state.currentIndex++;
            displayMedia(state, elements);
        } else {
            goHome();
        }
    });

    elements.autoDisplayBtn.addEventListener('click', () => startAutoDisplay(state, elements));
    elements.exitAutoBtn.addEventListener('click', () => stopAutoDisplay(state, elements));
    elements.goHomeBtn.addEventListener('click', goHome);
}


// Export functions for testing or additional usage
window.initDisplayMode = initDisplayMode;
window.buildMediaQueue = buildMediaQueue;
window.loadCategories = loadCategories;


