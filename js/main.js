var addNoteButton;
//Parse related keys
var PARSE_APP = "UwDU2ENsnfr30Hi3HSyl3bbXumswDmzyzxoSqtON";
var PARSE_JS = "vM0dMGC7gMEpedj3UhlsMNwn9u0dKihN5GvngSMT";
var parse_init = false;
var geoWatch;
var geoPoint;
var online;

document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady(e) {

    //document.addEventListener("offline", offlineFunc, false);
    //document.addEventListener("online", onlineFunc, false);
    $(document).on("online", onlineFunc);
    $(document).on("offline", offlineFunc);

    if(1 || !(navigator.connection.type === Connection.UNKNOWN &&
       navigator.connection.type === Connection.NONE)) {
    	$(document).trigger("online");

    } else {
    	$(document).trigger("offline");
    }

    addNoteButton = $("#addNoteBtn");

    /*
    We register this even though we may not be online. Since the button is disabled, this won't fire if you can't touch it.
    */
	$("#addNoteBtn").on("touchend", function(e) {
		e.preventDefault();

		//Grab the note details, no real validation for now
		var title = $("#noteTitle").val();
		var body = $("#noteBody").val();

		var note = new NoteObject();

		note.set("title", title);
		note.set("body", body);

		//if we have _some_ data
		if(geoPoint.longitude) {
			note.set("position", new Parse.GeoPoint({latitude:geoPoint.latitude, longitude:geoPoint.longitude}));
		}

		note.save(null, {
			success:function(object) {
				console.log("Saved the object!");
				$("#noteTitle").val("");
				$("#noteBody").val("");
				getNotes();
			}, 
			error:function(object,error) {
				console.dir(error);
				alert("Sorry, I couldn't save it.");
			}
		});
	});

	$(document).on("touchend", ".navLink", function(e) {
		e.preventDefault();

		//If we are offline, say we're sorry and move on..
		if(!online) {
		    navigator.notification.alert("Maps can only be viewed online.", null, "Offline!");
		}

		//Get the position from the data attribute
		var long = $(this).data("longitude");
		var lat = $(this).data("latitude");
		//Generate Google Static Map API link
		var link = "http://maps.googleapis.com/maps/api/staticmap?center="+lat+","+long+"&zoom=13&size=400x400&maptype=roadmap&markers=color:red%7Ccolor:red%7C"+lat+","+long+"&sensor=false";

		window.open(link, "blank");
	});

}

function initParse() {
	Parse.initialize(PARSE_APP, PARSE_JS);

	NoteObject = Parse.Object.extend("NoteObject");
	parse_init=true;
}

function offlineFunc(e) {
    console.log('offline');
    online=false;
    navigator.notification.alert("You are offline. Posting notes have been disabled.", null, "Offline!");
    addNoteButton.attr("disabled","disabled");
    if(geoWatch) navigator.geolocation.clearWatch(geoWatch);
}

function onlineFunc(e) {
    console.log('online');
    online=true;
    if(!parse_init) {
    	initParse();
    	getNotes();
    }
    geoWatch = navigator.geolocation.watchPosition(onGeo, onGeoError, { timeout: 30000 });
    addNoteButton.removeAttr("disabled");
}

/*
If there is a geolocation error, we don't care.
*/
function onGeoError() {
	//So yeah, do nothing and I'm ok with that.
}

function onGeo(g) {
	geoPoint = {latitude:g.coords.latitude, longitude:g.coords.longitude};
}

function getNotes() {
	var query = new Parse.Query(NoteObject);

	query.find({
		success:function(results) {
			console.dir(results);
			var s = "";
			for(var i=0, len=results.length; i<len; i++) {
				var note = results[i];
				s += "<p>";
				s += "<b>"+note.get("title")+"</b><br/>";
				s += "<b>Written "+note.createdAt + "<br/>";
				//Do we have a geo point?
				if(note.has("position")) {
					var pos = note.get("position");
					s += "<a href=\"\" class=\"navLink\" data-longitude=\"" + pos.longitude +"\" data-latitude=\""+ pos.latitude+"\">View on Map</a><br/>";
				}
				s += note.get("body");
				s += "</p>";
			}
			$("#notes").html(s);
		},
		error:function(error) {
			alert("Error when getting notes!");
		}
	});
}

