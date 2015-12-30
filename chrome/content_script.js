function getNextPage(pageNumber) {
    var input = $("<input>")
        .attr("type", "hidden")
        .attr("name", "ajaxSingle").val('activitiesForm:pageScroller');
    var input2 = $("<input>")
        .attr("type", "hidden")
        .attr("name", "activitiesForm:pageScroller").val(pageNumber);
    $('#activitiesForm').append($(input));
    $('#activitiesForm').append($(input2));

    $("#activitiesForm").submit();
}

function init() {
    var totalPages;
    chrome.runtime.sendMessage({"showPageAction": true});
    if (window.location.toString().indexOf('https://connect.garmin.com/minactivities')>=0) {
        console.log("TOTAL:" + $(".counterContainer :eq(2)").text());
        totalPages = Math.ceil(+$(".counterContainer :eq(2)").text() / 20);

        Array.prototype.slice.call(document.getElementsByClassName('activityNameLink')).forEach(function (element) {
            console.log(+element.href.replace('https://connect.garmin.com/activity/', ''));
            chrome.runtime.sendMessage({"addActivity": +element.href.replace('https://connect.garmin.com/activity/', '')});
        });
        chrome.runtime.sendMessage({"doneWithPage": true}, function (response) {
            if (response.nextPage <= totalPages) {
                getNextPage(response.nextPage);
            } else {
                chrome.runtime.sendMessage({"startDownload": true});
            }

        });

    }

}

init();
