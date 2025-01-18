/*
MemCard2025
MIT License
Copyright (c) 2025 Raymond Lou Independent Developer
See LICENSE file for full license information.
*/

// html/js/ChallengeCsvHelper.js

export const ChallengeCsvHelper = {
    parseChallengeLine(line) {
        if (!line || line.trim() === '') return null;

        let insideQuotes = false;
        let lastCommaIndex = -1;

        for (let i = 0; i < line.length; i++) {
            if (line[i] === '"') {
                insideQuotes = !insideQuotes;
            } else if (line[i] === ',' && !insideQuotes) {
                lastCommaIndex = i;
            }
        }

        if (lastCommaIndex === -1) return null;

        const cardName = line.substring(0, lastCommaIndex).trim().replace(/^"|"$/g, '');
        const value = line.substring(lastCommaIndex + 1).trim();

        return [cardName, value];
    },

    createChallengeLine(cardName, value) {
        return `"${cardName}",${value}`;
    },

    parseChallengeCSV(csvContent) {
        return csvContent
            .split('\n')
            .filter(line => line.trim() !== '')
            .map(line => this.parseChallengeLine(line))
            .filter(result => result !== null);
    }
};