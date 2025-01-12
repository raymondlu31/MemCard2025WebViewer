/*
MemCard2025
MIT License
Copyright (c) 2025 Raymond Lou Independent Developer
See LICENSE file for full license information.
*/

// html/js/main.js

import { PathUtils } from './pathReplacement.js';
import { initializeSession } from './initial_session.js';
import { shuffleCards, loadDefaultCardSequence } from './shuffle_cards.js';

document.addEventListener('DOMContentLoaded', initializeApp);

document.addEventListener("DOMContentLoaded", () => {
    const menuButton = document.getElementById("menuToggle");
    const sidebar = document.querySelector(".sidebar");

    menuButton.addEventListener("click", () => {
        sidebar.classList.toggle("visible");
        menuButton.textContent = sidebar.classList.contains("visible") ? "Menu▲" : "Menu▼";
    });
});


const Paths = {
    DOC_Root: PathUtils.resolve('./'),
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

let bgmPlayer = null; // Audio player for BGM
let bgmTracks = []; // Array of BGM file paths
let bgmIndex = 0; // Current track index
let isPlaying = false;
let currentVolume = 0.1; // Track the current volume separately

function initializeApp() {
    // Convert to immediately invoked async function
    (async () => {
        try {
            await initializeBGMControls(); // Wait for BGM initialization
            initializeButtons();
            await initializeSession();
        } catch (error) {
            console.error('Error initializing app:', error);
        }
    })();
}

async function getBgmListPath() {
    const DEFAULT_BGM_LIST_PATH = PathUtils.join('MemCard-resource', 'config', 'BGM-list.txt');
    
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
            const match = trimmedLine.match(/^BGM_list=(.+)$/);
            if (match) {
                const bgmListPath = match[1].trim();
                console.info(`Found BGM_list path: ${bgmListPath}`);
                return PathUtils.resolve(bgmListPath);
            }
        }

        console.warn("BGM_list not found in configuration. Defaulting to 5000ms.");
        return DEFAULT_BGM_LIST_PATH;
    } catch (error) {
        console.error('Error reading configuration file:', error.message);
        return DEFAULT_BGM_LIST_PATH; // Default 
    }
}

async function initializeBGMControls() {
    const bgmToggle = document.getElementById('bgmToggle');
    const bgmVolume = document.getElementById('bgmVolume');
    
    // Set default volume in dropdown list
    bgmVolume.value = '10'; // Set to 10% initially
    
    bgmToggle.addEventListener('change', handleBGMToggle);
    bgmVolume.addEventListener('change', handleBGMVolumeChange);

    try {
        bgmTracks = await loadBGMTracks();
        console.log('Loaded BGM Tracks:', bgmTracks);
        
        // Create a single Audio instance that will be reused
        if (!bgmPlayer) {
            bgmPlayer = new Audio();
            bgmPlayer.volume = currentVolume; // Use tracked volume
            bgmVolume.value = currentVolume * 100; // Set initial slider value
            bgmPlayer.addEventListener('ended', playNextBGMTrack);
            // Add error handler
            bgmPlayer.addEventListener('error', (e) => {
                console.error('BGM player error:', e);
                resetBGMState();
            });
        }
    } catch (error) {
        console.error('Error initializing BGM controls:', error);
        bgmTracks = [];
        resetBGMState();
    }
}

function resetBGMState() {
    isPlaying = false;
    bgmIndex = 0;
    const bgmToggle = document.getElementById('bgmToggle');
    if (bgmToggle) bgmToggle.checked = false;
}

async function loadBGMTracks() {

    try {
        const bgmListPath = await getBgmListPath();
        const response = await fetch(bgmListPath);
        if (!response.ok) throw new Error(`Failed to load BGM list from ${bgmListPath}`);

        const bgmListText = await response.text();
        
        const bgmLines = bgmListText.split('\n')
            .map(line => line.trim())
            .filter(line => line);
        
        // After loading new tracks, reset the index
        bgmIndex = 0;

        // Return the resolved tracks
        return bgmLines.map(relativePath => PathUtils.join(Paths.DOC_Root, relativePath));
    } catch (error) {
        console.error('Error loading BGM tracks:', error);
        return []; // Return empty array on error
    }
}

function handleBGMToggle(event) {
    const isEnabled = event.target.checked;
    if (isEnabled && !isPlaying) {
        startBGM();
    } else {
        stopBGM();
    }
}

function handleBGMVolumeChange(event) {
    if (bgmPlayer) {
        // Convert slider value (0-100) directly to volume (0-1)
        currentVolume = parseInt(event.target.value) / 100;
        console.log('Setting volume to:', currentVolume);
        bgmPlayer.volume = currentVolume;
    }
}

async function startBGM() {
    if (!bgmTracks || bgmTracks.length === 0) {
        console.warn('No BGM tracks available to play.');
        resetBGMState();
        return;
    }

    if (!bgmPlayer) {
        console.error('BGM player not initialized.');
        resetBGMState();
        return;
    }

    try {
        bgmPlayer.src = bgmTracks[bgmIndex];
        bgmPlayer.volume = currentVolume; // Ensure correct volume on start
        await bgmPlayer.play();
        isPlaying = true;
    } catch (error) {
        console.error('Error playing BGM:', error);
        resetBGMState();
    }
}

function stopBGM() {
    if (bgmPlayer) {
        bgmPlayer.pause();
        bgmPlayer.currentTime = 0;
        isPlaying = false;
    }
}

async function playNextBGMTrack() {
    if (!bgmTracks || bgmTracks.length === 0) {
        console.warn('No BGM tracks available to play.');
        resetBGMState();
        return;
    }

    try {
        bgmIndex = (bgmIndex + 1) % bgmTracks.length;
        bgmPlayer.src = bgmTracks[bgmIndex];
        bgmPlayer.volume = currentVolume;
        await bgmPlayer.play();
        isPlaying = true;
    } catch (error) {
        console.error('Error playing next BGM track:', error);
        resetBGMState();
    }
}

function initializeButtons() {
    document.getElementById('displayModeBtn').addEventListener('click', () => {
        document.getElementById('contentFrame').src = 'subpages/display_view.html';
    });
    
    document.getElementById('challengeModeBtn').addEventListener('click', () => {
        document.getElementById('contentFrame').src = 'subpages/challenge_view.html';
    });
    
    document.getElementById('shuffleCardsBtn').addEventListener('click', handleShuffleCards);
    document.getElementById('loadDefaultBtn').addEventListener('click', handleLoadDefaultSequence);
    
    document.getElementById('exitBtn').addEventListener('click', () => {
        document.getElementById('contentFrame').src = 'subpages/home_view.html';
    });
}


function handleShuffleCards() {
    shuffleCards().catch(error => console.error('Error shuffling cards:', error));
}

function handleLoadDefaultSequence() {
    try {
        loadDefaultCardSequence();
        console.log('Default sequence loaded.');
    } catch (error) {
        console.error('Error loading default sequence:', error);
    }
}
