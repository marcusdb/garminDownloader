var startDownload = function (activities) {
    activities.forEach(function (activity) {
        chrome.downloads.download({url: 'https://connect.garmin.com/modern/proxy/download-service/files/activity/' + activity},
            function (id) {
            });
    });

}

function init() {
    var activities = [];
    var currentPage = 1;
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        //check if message is from content script
        if (sender.tab) {
            //message is from the content script
            if (request.showPageAction != null) {
                //got a showPageAction message
                if (request.showPageAction) {
                    //download links found or added to page
                    chrome.pageAction.show(sender.tab.id);
                } else {
                    //download links no found or removed from page
                    chrome.pageAction.hide(sender.tab.id);
                }
            }

            else if (request.addActivity) {
                activities.push(request.addActivity);

            }
            else if (request.doneWithPage) {
                currentPage = currentPage + 1;
                sendResponse({nextPage: currentPage});
            }
            else if (request.startDownload) {
                startDownload(activities);
                activities = [];
                currentPage = 1;

            }

        }
    });

}

init();
