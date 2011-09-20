var inputTimeout = null;
var textTimer = null;

/*$(window).keypress(function(event){
    if( inputTimeout ) {
	clearTimeout(inputTimeout);
    }
    inputTimeout = setTimeout("parseRFID();",100);
});*/

function decode_user( input_string ) {
    var main_parts = input_string.split(",");
    
    console.log(JSON.stringify(main_parts));
    
	return {"first_name":main_parts[3],
	    "last_name":main_parts[2],
	    "phone_number":main_parts[14],
	    "email":main_parts[16],
	    "company":main_parts[5]};
    
}

/*function setTimer() {
	textTimer = setInterval(getText(), 1000);
	console.log("timer set");
}
setTimer();

function getText() {

}*/

function parseCard() {
    clearTimeout(inputTimeout);

	// get input from card swipe
	A = $("#raw_string").val();
	$("#raw_string").val("");
	// replace unnecessary characters
	B = A.replace(/\^/gi,",");
	C = B.replace(/\*/gi,"@");
	D = C.replace(/\n/gi,"");
	E = D.replace(/  /gi,"");
	
	// establish the types of errors
	error1 = /%e\?/gi;
	error2 = /;e\?/gi;
	error3 = /\+e\?/gi;
	
	// find these errors throughout the parsed string
	F1 = error1.test(E);
	F2 = error2.test(E);
	F3 = error3.test(E);
	
	// if any of these errors exist in the code then it is invalid
	if (F1 || F2 || F3 ){
		 error_sound();
	     console.log("Invalid swipe");
	}
	else {
		// otherwise, show the newly cleaned and parsed string
	    var user_info = decode_user(E);
	    console.log(JSON.stringify(user_info));
	    
	    $("#firstname").val(user_info.first_name);
	    $("#lastname").val(user_info.last_name);
	    $("#phonenumber").val(user_info.phone_number);
	    $("#emailaddress").val(user_info.email);
	    $("#company").val(user_info.company);
	    
	    $("#user_info").val("Welcome, " + user_info.first_name + "!");
	    success_sound();
	}
	

}

function parseRFID() {
	console.log("parsing");
	var info = $("#raw_string").val();
	
	// split data with carriage return as delimiter
	var dataArray = info.split("\n");

	$("#firstname").val(dataArray[2]);
    $("#lastname").val(dataArray[3]);
    $("#phonenumber").val(dataArray[17]);
    $("#emailaddress").val(dataArray[20]);
    $("#company").val(dataArray[7]);
    $("#title").val(dataArray[6]);
    $("#user_info").html("Welcome, " + dataArray[2] + "!");

    $("#raw_string").val("");
    if (controller._currentView == "ScreensaverView" && $("#firstname").val() != "") {
    	logoutButtonLock = false;
    	controller.display_view("CategoryView");
    	console.log('unlocked logout button');
    }
}