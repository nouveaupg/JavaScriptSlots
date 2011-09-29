var rawBadgeData = "";
var submitLock = false;
var sessionObject = null;
var flashInterval = null;

function disableSelection(target){
	if(target) {
	target.onmousedown=function(){return false};
	target.onselect = function(){return false};
	target.onstartselect = function(){return false};
	}
}

function recursiveDisableSelection(target) {
	disableSelection(target);
	if( target.childNodes ) {
		for( var x in target.childNodes ) {
			recursiveDisableSelection(target.childNodes[x]);
		}
	}
}

function slotMachine() {
	this._slotOrder = ["bell", "cherries", "grapes", "seven", "orange", "plumb", "logo"];
	this._slotPositions = ["bell", "cherries", "seven"];
	this._targets = ["logo", "logo", "grapes"];
	this._remainingRotations = [0, 0, 0];
	this._duration = [220, 200, 250];
	this._stopped = [true, true, true];
	this.stop = function(col_index) {
		this._remainingRotations[col_index - 1] = 0;
	}
	this.spin = function() {
		// make sure we're still not spinning
		if (this._remainingRotations[0] > 0 || this._remainingRotations[1] > 0 || this._remainingRotations[2] > 0) {
			if (this._slotPositions != this._targets) {
				return;
			}
		}
		this._stopped = [false, false, false];
		var chance = Math.random();
		if (chance < .18) {
			this._targets = ["logo", "logo", "logo"];
		} else if (chance < .58) {
			this._targets[0] = "logo";
			this._targets[1] = "logo";
			while (this._targets[2] == "logo") {
				this._targets[2] = this._slotOrder[Math.floor(Math.random() * this._slotOrder.length)];
			}
		} else {
			this._targets[0] = this._slotOrder[Math.floor(Math.random() * this._slotOrder.length)];
			while (this._targets[0] == "logo") {
				this._targets[0] = this._slotOrder[Math.floor(Math.random() * this._slotOrder.length)];
			}
			this._targets[1] = this._slotOrder[Math.floor(Math.random() * this._slotOrder.length)];
			while (this._targets[1] == "logo") {
				this._targets[1] = this._slotOrder[Math.floor(Math.random() * this._slotOrder.length)];
			}
			this._targets[2] = this._slotOrder[Math.floor(Math.random() * this._slotOrder.length)];
		}

		// now we send the data to Gitana
		personData = {
			"email": $("#emailaddress").val(),
			"q1": $("#q1").prop("checked"),
			"q2": $("#q2").prop("checked"),
			"q3": $("#q3").prop("checked"),
			"q4": $("#q4").prop("checked"),
			"slots": this._targets,
			"badgeData": rawUserInfo
		};
		
		$.each(barcodeUserData, function(key, value) {
			personData[key] = barcodeUserData[key];
		})

		var experience = null;
		try {
			experience = $.cookie("experience");
		} catch (e) {
			console.log(e);
			clientSettings = null;
		}

		if (experience) {
			var parts = experience.replace("\"", "").split(":");
			clientSettings = {
				"user": {
					"username": "admin",
					"password": "w1ntermute*1"
				}
			};
			for (var x in parts) {
				var key = parts[x].split("=")[0];
				var value = parts[x].split("=")[1];
				if (key == "surface") {
					clientSettings["surface"] = {
						"_doc": value
					};
				} else if (key == "repository") {
					clientSettings["repository"] = {
						"repository": value
					};
				} else if (key == "ticket") {
					clientSettings['ticket'] = value;
				}
			}
			leadingReachObj = LeadingReach.create(clientSettings);
			leadingReachObj.then(function() {
				surfaceId = this.surface().getId();
				console.log("Surface Id: " + surfaceId);
				applicationId = this.application().getId();
				console.log("Application Id: " + applicationId);
				scopeId = this.scope().getId();
				console.log("Scope Id: " + scopeId);
				this.startSession().then(function() {
					sessionId = this.session().getId();
					console.log("Gitana: Starting session " + sessionId);
					sessionObject = this.session();
					
					if (sessionObject) {
						console.log("Notice: leadingreach:session node updated with assets, scopeId, applicationId, surfaceId");
						sessionObject.set("rawBadgeData", rawUserInfo);
						sessionObject.set("assets",[]);
						sessionObject.set("scopeId", leadingReachObj.scope().getId());
						sessionObject.set("applicationId", leadingReachObj.application().getId());
						sessionObject.set("surfaceId", leadingReachObj.surface().getId());
						sessionObject.update();
					} else {
						console.log("Warning: session object not valid");
					}
					this.subchain(this._gitanaContext).addUnknownVisitor().listParticipants().keepOne().then(function() {
						console.log("Gitana: Added anonymous visitor " + this.getId());
						for (each in personData) {
							this.set(each, personData[each]);
							console.log(each + ": " + personData[each]);
						}
						this.update();
						console.log("Gitana: Updated n:person node");
						leadingReachObj.endSession().then(function() {
							console.log("Gitana: Session ended.");
						});
					});
				});
			});
		}
		this._remainingRotations = [4, 6, 8];
		this._spinSlot(1);
		this._spinSlot(2);
		this._spinSlot(3);
	};
	this._slotStopped = function(col_index) {
		this._stopped[col_index - 1] = true;
		console.log("Slot " + col_index + " stopped.");
		if (this._stopped[0] && this._stopped[1] && this._stopped[2]) {
			if (this._targets[0] == "logo" && this._targets[1] == "logo" && this._targets[2] == "logo") {
				$("#winner_main").html("You've won a $20 Best Buy Card!");
			} else if (this._targets[0] == "logo" && this._targets[1] == "logo") {
				$("#winner_main").html("You've won a $5 Starbucks Card!");
			} else {
				$("#winner_main").html("You've won a D&B Light!");
			}
			$("#winner_content").html("Please see associate to claim your prize.")
			if (this._targets[0] == "logo" && this._targets[1] == "logo") {
				document.getElementById("winner_sound").play();
			}
			setTimeout("document.getElementById(\"winner_sound\").pause();window.location.reload();", 180000);
			$("#winner").fadeIn();
			$("#rotating-message").html("WINNER!!!");
			this.pulseText();
			$("#logo").click(function() {
				document.getElementById("winner_sound").pause();
				window.location.reload();
			});
		}
	};
	this._spinSlot = function(col_index) {
		var duration = this._duration[col_index - 1];
		var remainingRotations = this._remainingRotations[col_index - 1];
		var nextSymbol = this._nextSymbol(col_index, duration);
		if (nextSymbol != this._targets[col_index - 1]) {
			setTimeout("slotCtx._spinSlot(" + col_index + ");", duration + 25);
		} else if (remainingRotations > 0) {
			this._remainingRotations[col_index - 1] = remainingRotations - 1;
			setTimeout("slotCtx._spinSlot(" + col_index + ");", duration + 25);
		} else {
			this._slotStopped(col_index);
		}
	}
	this._proceedTo = function(symbol, col_index) {
		var slotColumn = "";
		this._slotPositions[col_index - 1] = symbol;

		var slotIndex = this._slotOrder.indexOf(symbol) - 2;
		if (slotIndex < 0) {
			slotIndex = slotIndex + this._slotOrder.length;
		}

		slotColumn += "<img id=\"" + this._slotOrder[slotIndex] + "_col_" + col_index + "\" class=\"slot_icon\" src=\"./images/" + this._slotOrder[slotIndex] + ".svg\" />";

		slotIndex = this._slotOrder.indexOf(symbol);
		if (slotIndex == 0) {
			slotIndex = this._slotOrder.length - 1;
		} else {
			slotIndex--;
		}
		var slotColumnNode = $("#slot_col_" + col_index);
		slotColumnNode.empty();

		slotColumn += "<img id=\"" + this._slotOrder[slotIndex] + "_col_" + col_index + "\" class=\"slot_icon\" src=\"./images/" + this._slotOrder[slotIndex] + ".svg\" />";
		slotIndex = this._slotOrder.indexOf(symbol);
		slotColumn += "<img id=\"" + this._slotOrder[slotIndex] + "_col_" + col_index + "\" class=\"slot_icon\" src=\"./images/" + this._slotOrder[slotIndex] + ".svg\" />";

		if (slotIndex == (this._slotOrder.length - 1)) {
			slotIndex = 0;
		} else {
			slotIndex++;
		}
		slotColumn += "<img id=\"" + this._slotOrder[slotIndex] + "_col_" + col_index + "\" class=\"slot_icon\" src=\"./images/" + this._slotOrder[slotIndex] + ".svg\" />";
		slotColumnNode.append(slotColumn);
	};
	this._nextSymbol = function(columnIndex, duration) {
		var slotIndex = this._slotOrder.indexOf(this._slotPositions[columnIndex - 1]);
		slotIndex--;
		if (slotIndex < 0) {
			slotIndex = this._slotOrder.length + slotIndex;
		}
		var symbol = this._slotOrder[slotIndex];
		var slotColumnNode = $("#slot_col_" + columnIndex);
		var context = this;
		slotColumnNode.animate({
			top: '+=200px'
		}, duration, "linear", function() {
			context._proceedTo(symbol, columnIndex);
			slotColumnNode.css("top", "-350px");
		});
		return symbol;
	};
	this.init = function() {
		this._slotPositions[0] = this._slotOrder[this._slotPositions.length - 1];
		this._proceedTo(this._slotPositions.length - 1, 1);
		this._slotPositions[1] = this._slotOrder[this._slotPositions.length - 1];
		this._proceedTo(this._slotPositions.length - 1, 2);
		this._slotPositions[2] = this._slotOrder[this._slotPositions.length - 1];
		this._proceedTo(this._slotPositions.length - 1, 3);
		var panel = $("#winner");
		this.flashPanel(panel);
	};
	
	this.validateEmail = function() {
		var emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
		var email = $("#emailaddress").val();
		
		if (email == "") return false;
		else if (!emailPattern.test(email)) return false;
		else return true;
	};
	
	this.pulseText = function() {
		this.pulseIn();
	};
	
	this.pulseIn = function() {
		var self = this;
		$("#rotating-message").animate({
			fontSize: '+=25px',
			paddingTop: '-=20px',
			color: '#0075B4'
		}, 1500, "linear", function() {
			self.pulseOut();
		});
	};

	this.pulseOut = function() {
		var self = this;
		$("#rotating-message").animate({
			fontSize: '-=25px',
			paddingTop: '+=20px',
			color: '#003F72'
		}, 1500, "linear", function() {
			self.pulseIn();
		});
	};
	
	this.flashPanel = function(elt) {
		var self = this;
		flashInterval = setInterval(function() {self.toggleHidden(elt);}, 1500);
	};
	
	this.toggleHidden = function(element) {
		if (element.css("display") == "block") {
			element.css("display", "none");
			return;
		}
		else {
			element.css("display", "block");
			return;
		}
	};
}

var slotCtx = new slotMachine();



$(document).ready(function() {
	// production things
	window.oncontextmenu = function(event) {
	        event.preventDefault();
	        event.stopPropagation();
	        return false;
	};
	/*
	disableSelection(document.getElementById("body"));
	disableSelection(document.getElementById("submit_button"));
	disableSelection(document.getElementById("logo"));
	disableSelection(document.getElementById("holder2"));
	disableSelection(document.getElementById("quiz1"));
	disableSelection(document.getElementById("quiz2"));
	disableSelection(document.getElementById("quiz3"));
	disableSelection(document.getElementById("quiz4"));
	disableSelection(document.getElementById("spin"));*/
	recursiveDisableSelection(document.getElementById("container"));
	generateKeyboard("#keyboard_container");
	
	$("#rotating-message").html("Touch Screen to Play");
	$("#q1").button();
	$("#q2").button();
	$("#q3").button();
	$("#q4").button();
	slotCtx.init();
	intervalRef1 = setInterval("slotCtx._nextSymbol(1,slotCtx._duration[0]);", slotCtx._duration[0] + 25);
	intervalRef2 = setInterval("slotCtx._nextSymbol(2,slotCtx._duration[1]);", slotCtx._duration[1] + 25);
	intervalRef3 = setInterval("slotCtx._nextSymbol(3,slotCtx._duration[2]);", slotCtx._duration[2] + 25);
	$(document).click(function() {
		clearInterval(intervalRef1);
		clearInterval(intervalRef2);
		clearInterval(intervalRef3);
		clearInterval(flashInterval);
		$(document).unbind();
		$("#winner").hide();
		$("#checkout_overlay").animate({
			top: "0px"
		}, 1000, function() {
			focus = setInterval("captureFocus();", 2000);
			jQuery(document).keydown(function (event) {
				if (ctrl == true) {
					ctrl = false;
					event.preventDefault();
				}
				console.log(event.which);

				if (event.which == 13) {
					parseBarcode();
				}
				else if (event.which == 17) {
					event.preventDefault();
					ctrl = true;
				}
				else if (event.which == 90 && prevKey.which == 17) {
					parseBarcode();
				}
				prevKey = event;
			});
		});
		
		$("#holder2").show();
		$("#rotating-message").html("Select Your Interests and Spin!");
		submitLock = true;
	});
	$("#cancel_button").click(function() {
		alert("cancel");
	});
	$(".quiz").click(function() {
		if (!submitLock) {
			$("#rotating-message").html("Press Spin to Play");
			$("#spin").show();
		}
	});
	
	$(".quiz").hover(function(event) {
		event.preventDefault();
		event.stopPropagation();
		$(this).removeClass("ui-state-hover");
	});
	
	$(".quiz").addClass("fg-button");
	
	$("#submit_button").button();
	
	$("#submit_button").click(function() {
		if (slotCtx.validateEmail()) {
			$("#checkout_overlay").fadeOut();
			clearInterval(intervalRef1);
			clearInterval(intervalRef2);
			clearInterval(intervalRef3);
			$("#spin").hide();
			$("#holder").show();
			submitLock = false;
			if ($("#q1").prop("checked") || $("#q2").prop("checked") || $("#q3").prop("checked") || $("#q4").prop("checked")) {
				$("#spin").show();
			}
		}
		else {
			$("#error_box_overlay").fadeIn(400);
			$("#error_box").fadeIn(400);
			$("#error_box_overlay").click(function() {
				$(this).fadeOut(250);
				$("#error_box").fadeOut(250);
				$(this).unbind();
			});
			
		}
	});
	$("#spin").click(function() {
		slotCtx.spin();
		$("#spin").hide();
		$("#holder2").hide();
	});
	
	focus = setInterval("captureFocus();", 2000);
	
	jQuery(document).keydown(function (event) {
		if (ctrl == true) {
			ctrl = false;
			event.preventDefault();
		}
		console.log(event.which);

		if (event.which == 13) {
			parseBarcode();
		}
		else if (event.which == 17) {
			event.preventDefault();
			ctrl = true;
		}
		else if (event.which == 90 && prevKey.which == 17) {
			parseBarcode();
		}
		prevKey = event;
	});
	
	focus = setInterval("captureFocus();", 2000);
});