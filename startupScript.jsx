#target bridge
#targetengine "MainEngine"
#include "json2.js"

// Load Plugplug Lib for CSXSEvent
if (xLib === undefined) {
    var xLib = new ExternalObject("lib:\PlugPlugExternalObject");
}

var dispatchCepEvent = function(in_eventType, in_message) {
    if (xLib) {
        try {
            var eventObj = new CSXSEvent();
            eventObj.type = in_eventType;
            eventObj.data = JSON.stringify(in_message);
            eventObj.dispatch();
        } catch (error) {
            alert("Unexpected Error: " + error);
        }
    }
}

var onSelectedThumb = function(event) {
    if (event.object instanceof Document && event.type == "selectionsChanged") {
        var doc = event.object;
        var thumbs = doc.selections;
        var selectedFilename = [];
        for (var i = 0; i < thumbs.length; i++) {
            if (thumbs[i] !== undefined && thumbs[i].hasMetadata) {
                selectedFilename.push(thumbs[i].path);
            }
        }
        dispatchCepEvent("com.adobe.genaipanel.select", selectedFilename);
    }
}

alert(JSON.stringify(app))
if (app.name == "bridge") {
	app.eventHandlers = [];
    app.synchronousMode = true;
    app.eventHandlers.push({
        handler: onSelectedThumb
    });
}
