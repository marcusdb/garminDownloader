var findAllFiles = function findAllFiles() {
    chrome.tabs.create({
        url: "https://connect.garmin.com/minactivities"
    });

}

var startDownload = function (activities) {
    activities.forEach(function (activity) {
        chrome.downloads.download({url: 'https://connect.garmin.com/modern/proxy/download-service/files/activity/' + activity},
            function (id) {
            });
    });

}

//initialize routine
function init() {
    var findAll;
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        //check if message is from content script

        //message is from the content script
        if (request.activities) {
            startDownload(request.activities);
        }

    });
    findAll = document.getElementById("findAll");
    findAll.addEventListener("click", findAllFiles);

}

window.onload = init;
