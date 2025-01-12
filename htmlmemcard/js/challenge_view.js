/*
MemCard2025
MIT License
Copyright (c) 2025 Raymond Lou Independent Developer
See LICENSE file for full license information.
*/

// js/challenge_view.js

import { ChallengeCsvHelper } from './ChallengeCsvHelper.js';
import { PathUtils } from './pathReplacement.js';

document.addEventListener('DOMContentLoaded', initChallengeMode);


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


async function initChallengeMode() {
    const elements = {
        image: document.getElementById("display-image"),
        audio: document.getElementById("audio"),
        subtitle: document.getElementById("memSubtitle"),
        prevBtn: document.getElementById("prevBtn"),
        nextBtn: document.getElementById("nextBtn"),
        rememberBtn: document.getElementById("rememberBtn"),
        forgetBtn: document.getElementById("forgetBtn"),
        goHomeBtn: document.getElementById("goHomeBtn")
    };

    const requiredElements = [
        'image', 'audio', 'subtitle', 'prevBtn', 'nextBtn',
        'rememberBtn', 'forgetBtn', 'goHomeBtn'
    ];

    const missingElements = requiredElements.filter(el => !elements[el]);
    if (missingElements.length > 0) {
        console.error('Missing required DOM elements:', missingElements);
        alert('Error: Some required page elements are missing. Please check the console for details.');
        return;
    }
	
	// Clear "CurrentChallenge" content
    clearCurrentChallenge();

    const state = {
        mediaQueue: await buildMediaQueue(),
        currentIndex: 0,
        challengeData: {}, // To store answers
    };

    if (state.mediaQueue.length === 0) {
        alert("Media queue is empty. Please load a card sequence first.");
        goHome();
        return;
    }

    initializeChallengeFile(state);
    displayMedia(state, elements);
    setupEventListeners(state, elements);
}

// Function to clear "CurrentChallenge"
function clearCurrentChallenge() {
    sessionStorage.setItem("CurrentChallenge", "");
    console.info("CurrentChallenge has been cleared.");
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

// Initialize challenge file
function initializeChallengeFile(state) {
    state.mediaQueue.forEach((mediaItem) => {
        // state.challengeData[`"${mediaItem}"`] = true; // Default to true with quotes
    });

    writeChallengeFile(state.challengeData);
}


// Function to record "true" for the current card
function recordTrue(state, elements) {
    updateChallengeRecord(state, true);
	moveToNext(state, elements);
}

// Function to record "false" for the current card
function recordFalse(state, elements) {
    updateChallengeRecord(state, false);
	moveToNext(state, elements);
}


function updateChallengeRecord(state, answer) {
    const cardName = state.mediaQueue[state.currentIndex];
    state.challengeData[cardName] = answer;
    writeChallengeFile(state.challengeData);
}



// Simplified writeChallengeFile for sessionStorage
function writeChallengeFile(challengeData) {
    const csvData = Object.entries(challengeData)
        .map(([name, answer]) => ChallengeCsvHelper.createChallengeLine(name, answer))
        .join('\n');
    sessionStorage.setItem("CurrentChallenge", csvData);
}


// Function to retrieve CurrentChallenge data from session storage
function getCurrentChallengeData() {
    const csvData = sessionStorage.getItem("CurrentChallenge") || "";
    return csvData
        .split("\n")
        .filter(line => line.trim() !== "")
        .map(line => {
            const [Card_Unic_Name, answer] = line.split(",");
            return { 
                Card_Unic_Name: Card_Unic_Name.replace(/^"|"$/g, ''), // Remove quotes
                answer: answer === "true" 
            };
        });
}


// Function to save CurrentChallenge data back to session storage
function saveCurrentChallengeData(data) {
    const csvData = data
        .map(entry => `"${entry.Card_Unic_Name}",${entry.answer}`) // Add quotes
        .join("\n");
    sessionStorage.setItem("CurrentChallenge", csvData);
}



// Function to move to the next card or finish

function moveToNext(state, elements) {
    state.currentIndex++;
    if (state.currentIndex < state.mediaQueue.length) {
        displayMedia(state, elements);
		console.log("Current Index:", state.currentIndex);
		console.log("Current Media Item:", state.mediaQueue[state.currentIndex]);
    } else {
        finishChallenge();
    }
}

// Function to finish the challenge
function finishChallenge() {
    window.location.href = './challenge_result.html';
}


// Display media
function displayMedia(state, elements) {
    if (state.currentIndex < 0 || state.currentIndex >= state.mediaQueue.length) return;

    const mediaItem = state.mediaQueue[state.currentIndex];
    elements.image.src = PathUtils.join(Paths.Image_Directory, `${mediaItem}.JPG`);
    elements.audio.src = PathUtils.join(Paths.Audio_Directory, `${mediaItem}.mp3`);

    fetchSubtitle(mediaItem).then((subtitle) => {
        elements.subtitle.innerText = subtitle;
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
    // elements.prevBtn.disabled = state.currentIndex === 0;
	elements.prevBtn.disabled;
	elements.nextBtn.disabled;
    elements.nextBtn.textContent = (state.currentIndex === state.mediaQueue.length - 1) ? "Finish" : "Next";
}

// Navigation
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
            moveToNext(state, elements);
        } else {
            finishChallenge();
        }
    });

    elements.rememberBtn.addEventListener('click', () => recordTrue(state, elements));
    elements.forgetBtn.addEventListener('click', () => recordFalse(state, elements));
    elements.goHomeBtn.addEventListener('click', goHome);
}

// Export functions for testing or additional usage
window.initChallengeMode = initChallengeMode;
window.buildMediaQueue = buildMediaQueue;
window.loadCategories = loadCategories;

// Export updated functions
window.recordTrue = recordTrue;
window.recordFalse = recordFalse;
window.finishChallenge = finishChallenge;


