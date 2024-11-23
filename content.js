let maxGalaxy = 5;
let maxSystem = 499;

let waitMS = 1000;

let playersData = {};
let explorationInterval = null;
let scanStartTime = null;
let currentGalaxy = 1;
let currentSystem = 1;

// Start scanning
function startScan(message) {
    // Update the global variables based on the message from the popup
    maxGalaxy = message.maxGalaxy || maxGalaxy;
    maxSystem = message.maxSystem || maxSystem;
    waitMS = message.waitMS || waitMS;
    currentGalaxy = message.startGalaxy || currentGalaxy;
    currentSystem = message.startSystem || currentSystem;

    // set inital system and galaxy
    document.getElementById("galaxy_input").value = currentGalaxy;
    document.getElementById("system_input").value = currentSystem;
    document.getElementById("galaxyHeader").querySelector(".btn_blue").click();

    scanStartTime = new Date().toISOString().slice(0, 16).replace('T', ' ');
    playersData = {}; // Reset the data
    explorationInterval = setInterval(scanSystemsAndGalaxies, waitMS);
    console.log(`Scan started at ${scanStartTime}`);
}

// Stop scanning
function stopScan() {
    if (explorationInterval) {
        clearInterval(explorationInterval);
        explorationInterval = null;
        notifyPopupScanStopped();
    }
}

function notifyPopupScanStopped() {
    // Store the stopped state in storage
    chrome.storage.local.set({ scanStopped: true }, () => {
        console.log("Scan stopped state stored.");
    });
}

// Save scan data to chrome.storage
function saveScan() {
    chrome.storage.local.get(["currentScan"], (result) => {
        const previousScan = result.currentScan || null;

        // Step 1: Backup currentScan to previousScan if it exists
        if (previousScan) {
            chrome.storage.local.set({ previousScan }, () => {
                console.log("Previous scan backed up.");
            });
        }

        // Step 2: Update playersData with the oldest datetimes
        const planetMap = {};

        for (const player in playersData) {
            const playerData = playersData[player];

            for (const planet of playerData.planets) {
                const { coords, name, datetime } = planet;

                // Check if the planet exists in the previous scan
                let oldestDatetime = datetime;
                if (previousScan && previousScan.planets && previousScan.planets[coords]) {
                    const previousPlayer = previousScan.planets[coords];
                    const previousPlanet = previousScan.players[previousPlayer].planets.find(
                        (p) => p.coords === coords
                    );

                    if (previousPlanet) {
                        oldestDatetime = previousPlanet.datetime < datetime ? previousPlanet.datetime : datetime;
                    }
                }

                // Update the planet with the oldest datetime
                planet.datetime = oldestDatetime;

                // Update the planet map
                planetMap[coords] = player;
            }
        }

        // Step 3: Save the updated scan to currentScan
        const currentScan = {
            players: playersData,
            planets: planetMap,
            datetime: scanStartTime
        };

        chrome.storage.local.set({ currentScan }, () => {
            console.log("Current scan saved:", currentScan);
            clearPlayersData();
        });
    });
}

// Export scan data as JSON from chrome.storage.local
function exportScan() {
    console.log("called export scan");
    // Retrieve currentScan and previousScan from storage
    chrome.storage.local.get(["currentScan", "previousScan"], (result) => {
        if (chrome.runtime.lastError) {
            console.error("Error retrieving scans:", chrome.runtime.lastError.message);
            return;
        }

        // Create a dictionary containing both scans
        const exportData = {
            currentScan: result.currentScan || {}, // Default to an empty object if no data exists
            previousScan: result.previousScan || {}, // Default to an empty object if no data exists
        };

        // Create a JSON blob from the dictionary
        const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(jsonBlob);

        // Create a temporary link element to trigger the download
        const a = document.createElement("a");
        a.href = url;
        a.download = "ogame_scan.json";
        a.click();

        console.log("Scan data exported:", exportData);
    });
}

// Import scan data from a JSON file
function importScan() {
    console.log("called import scan");
    // Create a file input element
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";

    // Listen for file selection
    input.addEventListener("change", (event) => {
        const file = event.target.files[0];

        if (file) {
            const reader = new FileReader();

            // Read the file as text
            reader.onload = (e) => {
                try {
                    // Parse the JSON file content
                    const importedData = JSON.parse(e.target.result);

                    // Validate the structure of the imported data
                    if (typeof importedData === "object" &&
                        importedData.hasOwnProperty("currentScan") &&
                        importedData.hasOwnProperty("previousScan")) {

                        // Save the imported data to chrome.storage.local
                        chrome.storage.local.set(importedData, () => {
                            if (chrome.runtime.lastError) {
                                console.error("Error saving imported data:", chrome.runtime.lastError.message);
                            } else {
                                console.log("Imported data saved successfully:", importedData);
                            }
                        });
                    } else {
                        console.error("Invalid file structure.");
                    }
                } catch (err) {
                    console.error("Error parsing JSON:", err);
                }
            };

            reader.readAsText(file);
        }
    });

    // Trigger the file input dialog
    input.click();
}

// Core scan logic
function scanSystemsAndGalaxies() {
    let nextSystem = document.querySelector('.galaxy_icons.next.ipiHintable'); // Next system button
    let nextGalaxy = document.querySelector('.galaxy_icons.next'); // Next galaxy button

    if (!nextSystem || !nextGalaxy) {
        console.error("Next system or galaxy button not found.");
        return;
    }

    // If finished all galaxies, stop the scan
    if (currentGalaxy > maxGalaxy) {
        console.log("Finished scanning.");
        stopScan();
        return;
    }

    // If exceeded maxSystem, move to the next galaxy
    if (currentSystem > maxSystem) {
        currentGalaxy++;
        nextGalaxy.click();
        currentSystem = 1;
        return;
    }

    // Extract player and planet info
    extractPlayerPlanetInfo();
    nextSystem.click();
    currentSystem++;
}

currentGalaxy = 1;
currentSystem = 1;
scanStartTime = new Date().toISOString().slice(0, 16).replace('T', ' ');
playersData = {};
// Extract player and planet info
function extractPlayerPlanetInfo() {
    const filteredGalaxyRows = document.querySelectorAll('.galaxyRow.ctContentRow:not(.empty_filter)');
    filteredGalaxyRows.forEach(row => {
        if (row.querySelector('.galaxyCell.cellPlayerName').hasChildNodes()) {
            const planet_slot = row.querySelector('.galaxyCell.cellPosition').textContent.trim();
            const planet_coords = `${currentGalaxy}.${currentSystem}.${planet_slot}`;
            const planet_name = row.querySelector('.galaxyCell.cellPlanetName').firstElementChild.textContent.trim();

            let player_name = 'UNKNOWN';
            const playerNameElement = row.querySelector('.galaxyCell.cellPlayerName').querySelector('.playerName');
            if (playerNameElement) {
                player_name = Array.from(playerNameElement.childNodes)
                    .find(node => node.nodeType === Node.TEXT_NODE).textContent.trim();
            }
            else {
                player_name = row.querySelector('.galaxyCell.cellPlayerName').querySelector('.ownPlayerRow').textContent;
            }

            const allianceNameElement = row.querySelector('.galaxyCell.cellAlliance').firstElementChild;
            const alliance_name = allianceNameElement
                ? Array.from(allianceNameElement.childNodes)
                    .find(node => node.nodeType === Node.TEXT_NODE).textContent.trim()
                : '';

            if (!playersData[player_name]) {
                playersData[player_name] = {
                    alliance: alliance_name,
                    planets: []
                };
            }

            playersData[player_name].planets.push({
                name: planet_name,
                coords: planet_coords,
                datetime: scanStartTime
            });

            console.log(playersData);
        }
    });
}
extractPlayerPlanetInfo();

function checkScanStateOnLoad() {
    if (!Object.keys(playersData).length) {
        chrome.storage.local.set({scanStopped: false});
    }
}

function clearPlayersData() {
    playersData = {};
}


// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    if (message.action === "startScan") {
        startScan(message);
        sendResponse({ status: "Scanning started." });

    } else if (message.action === "stopScan") {
        stopScan();
        sendResponse({ status: "Scanning stopped." });

    } else if (message.action === "saveScan") {
        saveScan();
        sendResponse({ status: "Scan saved." });

    } else if (message.action === "exportScan") {
        exportScan();
        sendResponse({ status: "Scan exported." });

    } else if (message.action === "importScan") {
        importScan();
        sendResponse({ status: "Scan imported." });

    }  else if (message.action === "checkScanStateOnLoad") {

        checkScanStateOnLoad();
        sendResponse({ status: "Scan state polled." });

    }
});