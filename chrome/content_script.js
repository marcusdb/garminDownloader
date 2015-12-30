var anchors, observer, isWatching = false, extensionDetected = false;


function getNextPage(pageNumber){
    var input = $("<input>")
        .attr("type", "hidden")
        .attr("name", "ajaxSingle").val('activitiesForm:pageScroller');
    var input2 = $("<input>")
        .attr("type", "hidden")
        .attr("name", "activitiesForm:pageScroller").val(pageNumber);
    $('#activitiesForm').append($(input));
    $('#activitiesForm').append($(input2));

    $( "#activitiesForm" ).submit();
}

var startDownload=function(activities){
    activities.forEach(function(activity){
        chrome.downloads.download({url: 'https://connect.garmin.com/modern/proxy/download-service/files/activity/'+activity},
            function(id) {
            });
    });

}

function init() {
    var totalPages;
    chrome.runtime.sendMessage({"showPageAction": true});
    if(window.location.toString()==="https://connect.garmin.com/minactivities"){
        console.log("TOTAL:"+$(".counterContainer :eq(2)").text());
        totalPages=Math.ceil(+$(".counterContainer :eq(2)").text()/20);


        Array.prototype.slice.call(document.getElementsByClassName('activityNameLink')).forEach(function(element){
            console.log(+element.href.replace('https://connect.garmin.com/activity/',''));
            chrome.runtime.sendMessage({"addActivity":+element.href.replace('https://connect.garmin.com/activity/','')});
        });
        chrome.runtime.sendMessage({"doneWithPage":true},function(response){
            if (response.nextPage<=totalPages){
                getNextPage(response.nextPage);
            }else{
                chrome.runtime.sendMessage({"startDownload":true});
            }

        });

    }




    //page just loaded so check for download anchors, and notify background page
   // setTimeout(checkForAnchors, 500);
    //https://connect.garmin.com/modern/proxy/download-service/files/activity/995981872

    //listen for requests from the popup and the background
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        console.log("MESSAGE ARRIVED:"+JSON.stringify(request));
        if (request.getFiles) {
            //console.log("TOTAL:"+$("#iFrameWidget-0").contents().find(".counterContainer :eq(2)").value());
            //popup is requesting anchors so refresh list of anchors in page
            //send the file download data to the popup
            sendResponse({"data": updateData()});

        }
        else if (request.popupDownloadInitiate) {
            chrome.runtime.sendMessage({
                popupDownloadInitiate: true,
                popupData: request.popupDownloadData,
                popupPath: request.popupDownloadPath
            });
        }
        else if (request.observeDownloads) {

            switch (request.observeDownloads) {

                case "start":
                    //background page is saying that this is the active page
                    //so check the anchors immediately, and start observing changes for this page
                    checkForAnchors();

                    //observer.observe(document.body, {
                    //    "childList": true,
                    //    "attributes": true,
                    //    "characterData": false,
                    //    "subtree": true
                    //});
                    break;

                case "stop":
                    //background page is saying that another page is the active page
                    //so stop observing changes for this page
                    //observer.disconnect;
            }
        }
    });
}

function listenForDownloadInitiate() {
    var downloaderInitiateTag = document.querySelector("div[id='mfd-downloader-initiate-section']");

    // presence of download tag will indicate a call to downloader initiate
    if (downloaderInitiateTag) {
        var selected = [];

        var downloaderSelectTags = document.querySelectorAll("input[mfd-downloader-select-href][mfd-downloader-select-download]");

        // presence of watch tag will indicate a call to downloader watch
        if (downloaderSelectTags && downloaderSelectTags.length) {

            var i, selectTag;

            for (i = 0; i < downloaderSelectTags.length; i++) {
                selectTag = downloaderSelectTags[i];
                selected.push({
                    "href": absolutePath(selectTag.getAttribute("mfd-downloader-select-href")),
                    "download": fileName(selectTag.getAttribute("mfd-downloader-select-download"))
                });
            }

            var path = downloaderInitiateTag.getAttribute("mfd-downloader-path");
            chrome.runtime.sendMessage({
                downloadInitiate: true,
                selected: selected,
                path: path
            });
        }

        downloaderInitiateTag.remove();

        // return true to signal that we added a "download-initiate" tag
        return true;
    }

    // we didn't add a "download-initiate" tag
    return false;
}

// this function checks for a tag that, if inserted by the client page, will cause the extension to inform the client page of any anchor changes
// this function is fired everytime there are anchor changes
function listenForDownloadWatch() {
    var tagId = "mfd-downloader-watch-id";
    var tag = document.querySelector("input[id='" + tagId + "']");

    // presence of the tag will indicate an intent by the client page to communicate with this extension
    if (tag) {
        if (isWatching)
            respondToInputTag(tagId);
        else
            isWatching = true;
    }
}

// this function responds to  a tag that is inserted by the client page to detect if the extension is available
// this function is fired only when extensionDetected = false
function listenForDownloadExtensionDetect() {
    var tagId = "mfd-downloader-detect-extension-id";
    var tag = document.querySelector("input[id='" + tagId + "']");

    // presence of the tag will indicate an intent by the client page to communicate with this extension
    if (tag) {
        respondToInputTag(tagId);
        extensionDetected = true;
    }
}

// this function will detect for an input tag with the specified tag id and, if it finds the tag, respond to the client page by firing the input tag's onchange event
function respondToInputTag(tagId) {
    chrome.runtime.sendMessage({
        executeScript: true,
        script: 'if((e = document.querySelector("input[id=\'' + tagId + '\']"))){ ' +
        'if ("createEvent" in document) { ' +
        'var evt = document.createEvent("HTMLEvents"); ' +
        'evt.initEvent("change", false, true); ' +
        'e.dispatchEvent(evt); ' +
        '} ' +
        'else ' +
        'e.fireEvent("onchange"); }'
    });
}

function checkForAnchors() {
    //get all anchors that have an href and a download tag
    anchors = document.querySelectorAll("a[href][download]");

    //tell background page to show or hide the page action icon
    //in a dynamic page, downloads may have disappeared or appeared
    chrome.runtime.sendMessage({"showPageAction": anchors.length > 0});
}

function updateData() {
    checkForAnchors();

    //process the file download data
    var i, anchor;
    var data = [];

    for (i = 0; i < anchors.length; i++) {
        anchor = anchors[i];
        data.push({
            "href": absolutePath(anchor.getAttribute("href")),
            "download": fileName(anchor.getAttribute("download")),
            "text": anchor.textContent
        });
    }
    return data;
}

function absolutePath(href) {
    var a = document.createElement("a");
    a.href = href;
    return a.href;
}

function fileName(path) {
    var i = path.lastIndexOf("/");
    var j = path.lastIndexOf("\\");
    i = (i > j ? i : j);
    return (i > -1 ? path.substr(i + 1) : path);
}

init();
