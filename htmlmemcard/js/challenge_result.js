/*
MemCard2025
MIT License
Copyright (c) 2025 Raymond Lou Independent Developer
See LICENSE file for full license information.
*/

// js/challenge_result.js

import { ChallengeCsvHelper } from './ChallengeCsvHelper.js';

document.addEventListener('DOMContentLoaded', function() {
    displayResults();
    setupHomeButton();
});

function displayResults() {
    const resultsCSV = sessionStorage.getItem("CurrentChallenge") || "";
    console.log("resultsCSV:", resultsCSV);
    const results = ChallengeCsvHelper.parseChallengeCSV(resultsCSV);
    const totalCards = results.length;
    let correctCount = 0;
    
    // Update the result details table
    const resultDetails = document.getElementById("result-details");
    resultDetails.innerHTML = ''; // Clear existing content
    
    results.forEach(([cardName, answer]) => {
        const isCorrect = answer.toLowerCase() === "true";
        if (isCorrect) correctCount++;
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${escapeHtml(cardName)}</td>
            <td>${isCorrect ? "True" : "False"}</td>
        `;
        resultDetails.appendChild(tr);
    });

    // Update summary statistics
    const accuracy = totalCards > 0 ? ((correctCount / totalCards) * 100).toFixed(2) : 0;
    document.getElementById("correct-count").textContent = correctCount;
    document.getElementById("total-cards").textContent = totalCards;
    document.getElementById("accuracy").textContent = accuracy;
}

// Helper function to prevent XSS when displaying card names
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/""/g, "&quot;&quot;"); // Handle escaped quotes
}

// Update the initialization of challengeData in initChallengeMode
function initializeChallengeFile(state) {
    state.challengeData = Object.fromEntries(
        state.mediaQueue.map(mediaItem => [mediaItem, true])
    );
    writeChallengeFile(state.challengeData);
}



function setupHomeButton() {
    const homeButton = document.getElementById("goHomeBtn");
    if (homeButton) {
        homeButton.addEventListener("click", () => {
            window.location.href = './home_view.html';
        });
    }
}