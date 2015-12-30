var activeTabId;

var currentPage=1;
var activities=[];
var startDownload=function(activities){
	activities.forEach(function(activity){
		chrome.downloads.download({url: 'https://connect.garmin.com/modern/proxy/download-service/files/activity/'+activity},
			function(id) {
			});
	});

}

function init() {
	chrome.runtime.onMessage.addListener(function(request,sender,sendResponse) {
		//check if message is from content script
		if(sender.tab) {
			//message is from the content script
			if(request.showPageAction!=null) {
				//got a showPageAction message
				if(request.showPageAction) {
					//download links found or added to page
					chrome.pageAction.show(sender.tab.id);
				} else {
					//download links no found or removed from page
					chrome.pageAction.hide(sender.tab.id);
				}
				
				//update the most recent tab to sender tab
				activeTabId=sender.tab.id;
			}
			else if(request.downloadInitiate){
				// passing in the selected downloads
				if(request.selected && request.selected.length)
					downloadInitiate(request.selected, request.path);
			}
			else if(request.popupDownloadInitiate){
				if(request.popupData && request.popupData.length)
					popupDownloadInitiate(request.popupData, request.popupPath);
			}
			else if(request.executeScript){
				// passing in the script to be executed
				if(request.script)
					executeScript(request.script);
			}
			else if(request.addActivity){
				activities.push(request.addActivity);

			}
			else if(request.doneWithPage){
				currentPage=currentPage+1;
				sendResponse({nextPage:currentPage});
			}
			else if(request.startDownload){
				//chrome.runtime.sendMessage({"activities":activities});
				startDownload(activities);

			}


		}
	});
	
	//listen for active tab changes
	chrome.tabs.onActivated.addListener(function(activeInfo) {
		listenOnActiveTab();
	});
	
	//listen for active window changes
	chrome.windows.onFocusChanged.addListener(function(windowId) {
		listenOnActiveTab();
	});
}

function executeScript(script){
	chrome.tabs.executeScript({
	    code: script
	});
}


//when user switches to a new tab/window
//stop observing changes on the previous tab/window (if any)
//ask new tab/window to check its current download anchors and send that info immediately
//plus start observing changes in its page
function listenOnActiveTab() {
	chrome.tabs.query({active:true,currentWindow:true},function(tabs) {
		//get active tab id, null if none
		var tabId=(tabs[0]?tabs[0].id:null);
		
		//if new active tab is same as currently active tab, then nothing to do
		if(activeTabId==tabId) return;
		
		//send message to previously active tab (if any) to stop observing DOM changes
		if(activeTabId) {
			chrome.tabs.sendMessage(activeTabId,{observeDownloads:"stop"});
		}
			
		//update the new active tab
		activeTabId=tabId;

		//send message to new tab to query current download links and to start observing DOM changes
		if(activeTabId) {
			chrome.tabs.sendMessage(activeTabId,{observeDownloads:"start"});
		}
	});
}

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

function downloadInitiate(data, path){
	if(data){
		//add the slash to the end of the path if it exists
		path = (path == undefined ? "" : (path.endsWith('/') ? path : path + "/"));

		for(i=0;i<data.length;i++) {
			//save this file
			d=data[i];
			chrome.downloads.download({"url":d.href,"filename":path+d.download,"conflictAction":"uniquify"}, function(downloadId) {
		
			});
		}
	}
}

function popupDownloadInitiate(data, path){
	
	if(data){
		
		var dd;
		//add the slash to the end of the path if it exists
		path = (path == undefined ? "" : (path.endsWith('/') ? path : path + "/"));

		for(i=0;i<data.length;i++) {
			//save this file
			dd=data[i];
			chrome.downloads.download({"url":dd.href,"filename":path+dd.download,"conflictAction":"uniquify"}, function(downloadId) {
			});
		}
	}
}

init();
