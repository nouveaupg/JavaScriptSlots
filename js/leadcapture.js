var inputTimeout = null;
var textTimer = null;
var rawUserInfo = null;

function captureFocus(textfield) {
	var field = textfield;
	var check = $("#checkout").css("left");
	//var newcheck = check.replace( /px/ , "");
	var newcheck = -1001;
	
	if(newcheck < -1000 || field == 1) {
		
		if (document.activeElement != document.getElementById("raw_string")){
			$("#raw_string").focus();
		}
	}

}

var barcodeUserData = {
		"firstName": "",
		"lastName": "",
		"title": "",
		"badgeId": "",
		"phoneNumber": "",
		"companyName": "",
		"email": ""
}

function parseBarcode() {
	var info = $("#raw_string").val();
	if (info == " ") return;
	rawUserInfo = $("#raw_string").val();
	// split data with carriage return as delimiter
	var dataArray = info.split("^");
//	$("#firstname").val(dataArray[0]);
//	$("#lastname").val(dataArray[1]);
//	$("#phonenumber").val(dataArray[4]);
	$("#emailaddress").val(dataArray[6]);
//	$("#company").val(dataArray[5]);
//	$("#title").val(dataArray[3]);
//	$("#user_info").html("Welcome, " + $("#firstname").val() + "!");
	
	var step = 0;
	if (dataArray[1]){
		$.each(barcodeUserData, function(key, value) {
			barcodeUserData[key] = dataArray[step];
			step++;
		})
		if(sessionObject){
			var badgeScans = sessionObject.object["rawBadgeData"];
			if (badgeScans) {
				badgeScans.push(rawUserInfo);
			}
			else {
				badgeScans = [rawUserInfo];
			}
			sessionObject.set("rawBadgeData", badgeScans);
			sessionObject.update();
		}
	}
	$("#raw_string").val("");
	if ($("#rotating-message").html() == "Touch Screen to Play") {
		clearInterval(intervalRef1);
		clearInterval(intervalRef2);
		clearInterval(intervalRef3);
		$(document).unbind();
		$("#winner").hide();
		$("#checkout").animate({
			top: "400px"
		}, 1000);
		$("#holder2").show();
		$("#rotating-message").html("Select Your Pain Points");
		submitLock = true;
	}
	/*if (controller._currentView == "ScreensaverView" && $("#firstname").val() != "") {
		logoutButtonLock = false;
		controller.display_view("CategoryView");
		setTimeout(function() {
			var sessionObject = controller._gitanaContext.session();
			if(sessionObject){
				var badgeScans = sessionObject.object["rawBadgeData"];
				
				if (badgeScans) {
					badgeScans.push(rawUserInfo);
				}
				else {
					badgeScans = [rawUserInfo];
				}
				sessionObject.set("rawBadgeData", badgeScans);
				sessionObject.update();
			}
		}, 5000);
	}*/
	console.log("Badge Scanned, updated badge data on session object:");
	if (sessionObject){
		console.log(sessionObject.object["rawBadgeData"]);
	}
}


var caretCount = 0;
var ctrl = false;
$(document).ready(function() {
	
});