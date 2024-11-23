const scanStoppedMessage = document.getElementById("scanStoppedMessage");
let stateCheckInterval = null;

// Function to start polling for scan state
function startStatePolling() {
    if (stateCheckInterval) return; // Prevent multiple intervals

    stateCheckInterval = setInterval(statePoll, 1000);
}

// Function to stop polling
function stopStatePolling() {
    if (stateCheckInterval) {
        clearInterval(stateCheckInterval);
        stateCheckInterval = null;
    }
}

function statePoll() {
    chrome.storage.local.get(["scanStopped"], (result) => {
        const isScanStopped = result.scanStopped || false;

        if (isScanStopped) {
            scanStoppedMessage.style.visibility = "visible"; // Show the message
        } else {
            scanStoppedMessage.style.visibility = "hidden"; // Hide the message
        }
    });
}

// Function to send a message to the content script to start scanning
function startScan() {
    // Dynamically get the latest values from the popup inputs
    const maxGalaxy = parseInt(document.getElementById("maxGalaxy").value, 10);
    const maxSystem = parseInt(document.getElementById("maxSystem").value, 10);
    const startGalaxy = parseInt(document.getElementById("startGalaxy").value, 10);
    const startSystem = parseInt(document.getElementById("startSystem").value, 10);
    const waitMS = parseInt(document.getElementById("waitMS").value, 10);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(
            tabs[0].id,
            {
                action: "startScan",
                maxGalaxy,
                maxSystem,
                startGalaxy,
                startSystem,
                waitMS
            },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Error:", chrome.runtime.lastError.message);
                } else {
                    console.log("Scan started:", response);
                    startStatePolling();
                }
            }
        );
    });
}

// Function to send a message to the content script to stop scanning
function stopScan() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "stopScan" }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Error:", chrome.runtime.lastError.message);
            } else {
                console.log("Scan stopped:", response);
                statePoll();
            }
        });
    });
}

// Function to send a message to save scan data
function saveScan() {
    chrome.storage.local.get(["scanStopped"], (result) => {
        const isScanStopped = result.scanStopped || false;

        if (isScanStopped) {
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, {action: "saveScan"}, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error("Error:", chrome.runtime.lastError.message);
                    } else {
                        console.log("Scan saved:", response);
                        // update state to hide the 'scan finished' message
                        chrome.storage.local.set({scanStopped: false});
                        statePoll();
                        setTimeout(populateScanDifferences, 1000);
                    }
                });
            });
        }
    });
}

// Function to send a message to export scan data
function exportScan() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "exportScan" }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Error:", chrome.runtime.lastError.message);
            } else {
                console.log("Scan exported:", response);
            }
        });
    });
}

// Function to send a message to import scan data
function importScan() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "importScan" }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Error:", chrome.runtime.lastError.message);
            } else {
                console.log("Scan imported:", response);
                setTimeout(populateScanDifferences, 1000);
            }
        });
    });
}

function checkScanStateOnLoad() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "checkScanStateOnLoad" }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Error:", chrome.runtime.lastError.message);
            } else {
                console.log("Scan state checked:", response);
            }
        });
    });
}

function _debug_print_sync(){
    chrome.storage.local.get(null, (items) => {
        if (chrome.runtime.lastError) {
            console.error("Error retrieving storage:", chrome.runtime.lastError.message);
            return;
        }
        console.log("Contents of chrome.storage.local:", items);
    });
}

function populateScanDifferences() {
    const tableBody = document.querySelector("#scanDifferencesTable tbody");
    tableBody.innerHTML = ""; // Clear all rows

    const lastScanDateElement = document.getElementById("lastScanDate");
    const currentScanDateElement = document.getElementById("currentScanDate");

    chrome.storage.local.get(["currentScan", "previousScan"], (result) => {
        const currentScan = result.currentScan || { players: {}, planets: {} };
        const previousScan = result.previousScan || { players: {}, planets: {} };

        // Update the scan dates
        lastScanDateElement.textContent = previousScan.datetime || "N/A";
        currentScanDateElement.textContent = currentScan.datetime || "N/A";

        const allRows = [];

        // Helper function to find planet details
        const findPlanetDetails = (scan, coords) => {
            // Return null if scan has no planets
            if (!scan?.planets) {
                return null;
            }

            const playerName = scan.planets[coords];
            if (playerName) {
                const playerData = scan.players[playerName];
                if (playerData) {
                    const planet = playerData.planets.find((p) => p.coords === coords);
                    if (planet) {
                        return { name: planet.name, playerName, alliance: playerData.alliance, datetime: planet.datetime };
                    }
                }
            }
            return null;
        };

        // Combine all planet coordinates
        const allCoords = new Set([
            ...Object.keys(currentScan.planets),
            ...Object.keys(previousScan?.planets || {}),
        ]);

        allCoords.forEach((coords) => {
            const currentDetails = findPlanetDetails(currentScan, coords);
            const previousDetails = findPlanetDetails(previousScan, coords);

            let reason = "";
            let color = "";
            let previousDatetime = "-"; // Default value if previousDetails is not available

            if (!previousDetails && currentDetails) {
                reason = "!! NEW PLANET !!";
                color = "red";
            } else if (previousDetails && !currentDetails) {
                reason = "destroyed planet";
                color = "yellow";
                previousDatetime = previousDetails.datetime;
            } else if (currentDetails && previousDetails) {
                previousDatetime = previousDetails.datetime;
                if (currentDetails.alliance !== previousDetails.alliance) {
                    reason = "alliance change";
                    color = "red";
                } else if (currentDetails.playerName !== previousDetails.playerName) {
                    reason = "player name change";
                    color = "green";
                } else if (currentDetails.name !== previousDetails.name) {
                    reason = "planet name change";
                    color = "green";
                }
            }

            // Add a row for each planet, even if there's no difference
            allRows.push({
                coords,
                name: currentDetails ? currentDetails.name : previousDetails.name,
                playerName: currentDetails ? currentDetails.playerName : previousDetails.playerName,
                alliance: currentDetails ? currentDetails.alliance : previousDetails.alliance,
                reason,
                color,
                previousDatetime,
            });
        });

        // Sort rows by coords numerically
        allRows.sort((a, b) => {
            const parseCoords = (coords) => coords.split(".").map(Number);
            const [a1, a2, a3] = parseCoords(a.coords);
            const [b1, b2, b3] = parseCoords(b.coords);

            return a1 - b1 || a2 - b2 || a3 - b3;
        });

        // Populate the table
        allRows.forEach((row) => {
            const tableRow = document.createElement("tr");
            tableRow.dataset.reason = row.reason; // For filtering

            tableRow.innerHTML = `
                <td style="border: 1px solid #6f9fc8;">${row.coords}</td>
                <td style="border: 1px solid #6f9fc8;">${row.name || ""}</td>
                <td style="border: 1px solid #6f9fc8;">${row.playerName || ""}</td>
                <td style="border: 1px solid #6f9fc8;">${row.alliance || ""}</td>
                <td style="border: 1px solid #6f9fc8; color: ${row.color || "inherit"};">${row.reason || ""}</td>
                <td style="border: 1px solid #6f9fc8;">${row.previousDatetime || "-"}</td>
            `;

            tableBody.appendChild(tableRow);
        });
    });
}

function applyFilters() {
    const searchValue = document.getElementById("searchInput").value.toLowerCase();
    const selectedReasons = Array.from(
        document.querySelectorAll("#filterCheckboxes input:checked")
    ).map((checkbox) => checkbox.value);

    const rows = document.querySelectorAll("#scanDifferencesTable tbody tr");

    rows.forEach((row) => {
        const textContent = row.textContent.toLowerCase();
        const reason = row.dataset.reason;

        const matchesSearch = searchValue === "" || textContent.includes(searchValue);
        const matchesReason =
            selectedReasons.length === 0 || selectedReasons.includes(reason);

        row.style.display = matchesSearch && matchesReason ? "" : "none";
    });
}

// Function to clear all data in chrome.storage.local
function clearAllData() {
    chrome.storage.local.clear(() => {
        if (chrome.runtime.lastError) {
            console.error("Error clearing data:", chrome.runtime.lastError.message);
        } else {
            console.log("All data cleared from chrome.storage.local.");
            // Clear the table as well since all data is reset
            populateScanDifferences();

            // reset filters
            document.getElementById("searchInput").value = "";
            // Restore checkbox states
            const checkboxes = document.querySelectorAll("#filterCheckboxes input");
            checkboxes.forEach((checkbox, index) => {
                checkbox.checked = false;
            });
            applyFilters();
        }
    });
}


// -------------------------

// Start polling when the popup opens
document.addEventListener("DOMContentLoaded", () => {
    checkScanStateOnLoad();
    startStatePolling();
    populateScanDifferences();

    restore_state_on_load();
    //setTimeout(restore_state_on_load, 1000);
});

// Stop polling when the popup closes
window.addEventListener("beforeunload", () => {
    stopStatePolling();
});

// Attach event listeners to popup buttons
document.getElementById("clearAllData").addEventListener("click", clearAllData);
document.getElementById("scanButton").addEventListener("click", startScan);
document.getElementById("stopButton").addEventListener("click", stopScan);
document.getElementById("saveButton").addEventListener("click", saveScan);
document.getElementById("exportButton").addEventListener("click", exportScan);
document.getElementById("importButton").addEventListener("click", importScan);

document.getElementById("searchInput").addEventListener("input", applyFilters);
document
    .querySelectorAll("#filterCheckboxes input")
    .forEach((checkbox) => checkbox.addEventListener("change", applyFilters));

// ------------------------

// Save popup state when it closes
window.addEventListener("blur", () => {
    const state = {
        searchFilter: document.getElementById("searchInput").value,
        checkboxes: Array.from(document.querySelectorAll("#filterCheckboxes input")).map(checkbox => checkbox.checked),
        mainScroll: window.scrollY,
        tableScroll: document.querySelector("#scanDifferencesTable tbody").scrollTop,
    };

    chrome.storage.local.set({ popupState: state }, () => {
        console.log("Popup state saved:", state);
    });
});

function restore_state_on_load() {
    chrome.storage.local.get("popupState", (result) => {
        const state = result.popupState;

        if (state) {
            // Restore search filter
            document.getElementById("searchInput").value = state.searchFilter || "";

            // Restore checkbox states
            const checkboxes = document.querySelectorAll("#filterCheckboxes input");
            checkboxes.forEach((checkbox, index) => {
                checkbox.checked = state.checkboxes[index] || false;
            });

            applyFilters();

            // Restore main scrollbar position
            window.scrollTo(0, state.mainScroll || 0);

            // Restore table scrollbar position
            document.querySelector("#scanDifferencesTable tbody").scrollTop = state.tableScroll || 0;

            console.log("Popup state restored:", state);
        }
    });
}