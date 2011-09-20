function slotMachine() {
	this._slotOrder = ["pear", "strawberry", "grapes", "seven", "clover", "star", "crown", "coin_stack", "logo"];
	this._slotPositions = ["grapes", "seven", "pear"];
	this._targets = ["logo", "logo", "strawberry"];
	this._remainingRotations = [0, 0, 0];
	this._duration = [200, 260, 240];
	this._stopped = [true,true,true];
	this.stop = function(col_index) {
		this._remainingRotations[col_index - 1] = 0;
	}
	this.spin = function() {
		// make sure we're still not spinning
		if (this._remainingRotations[0] > 0 || this._remainingRotations[1] > 0 || this._remainingRotations[2] > 0) {
			if( this._slotPositions != this._targets ) {
				return;
			}
		}
		this._stopped = [false,false,false];
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
		personData = {"email":$("#emailaddress").val(),
				"q1":$("#q1").prop(),
				"q2":$("#q2").prop(),
				"q3":$("#q3").prop(),
				"q4":$("#q4").prop(),
				"slots":this._targets};
		
		var experience = null;
		try {
			experience = $.cookie("experience");
		}
		catch(e) {
			console.log(e);
			clientSettings = null;
		}
		
		if( experience ) {
			var parts = experience.replace("\"","").split(":");
			clientSettings = {"user":{"username" : "admin","password" : "admin"}};
			for( var x in parts ) {
				var key = parts[x].split("=")[0];
				var value = parts[x].split("=")[1];
				if( key == "surface" ) {
				clientSettings["surface"] = { "_doc":value };
				}
				else if( key == "repository" ) {
					clientSettings["repository"] = {"repository":value};
				}
				else if( key == "ticket" ) {
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
					if( sessionObject ) {	
						console.log("Notice: leadingreach:session node updated with assets, scopeId, applicationId, surfaceId");
						sessionObject.set("assets",selectedAssets);
						sessionObject.set("scopeId",leadingReachObject.scope().getId());
						sessionObject.set("applicationId",leadingReachObject.application().getId());
						sessionObject.set("surfaceId",leadingReachObject.surface().getId());
						sessionObject.update();
					}else {
						console.log("Warning: session object not valid");
					}
					this.subchain(this._gitanaContext).addUnknownVisitor().listParticipants().keepOne().then(function() {
						console.log("Gitana: Added anonymous visitor " + this.getId());
						for( each in personData ) {
							this.set(each,personData[each]);
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
		
		
		
		this._remainingRotations = [2, 3, 4];
		this._spinSlot(1);
		this._spinSlot(2);
		this._spinSlot(3);
	};
	this._slotStopped = function(col_index) {
		this._stopped[col_index-1] = true;
		console.log("Slot " + col_index + " stopped.");
		if( this._stopped[0] && this._stopped[1] && this._stopped[2] ) {
			$("#winner").fadeIn();
			$("body").click(function() {
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
		}else {
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
		this._slotPositions[0] = this._slotOrder[Math.floor(Math.random() * this._slotOrder.length)];
		this._proceedTo(this._slotPositions[0], 1);
		this._slotPositions[1] = this._slotOrder[Math.floor(Math.random() * this._slotOrder.length)];
		this._proceedTo(this._slotPositions[1], 2);
		this._slotPositions[2] = this._slotOrder[Math.floor(Math.random() * this._slotOrder.length)];
		this._proceedTo(this._slotPositions[2], 3);
	};
}

var slotCtx = new slotMachine();
var intervalRef1 = null;
var intervalRef2 = null;
var intervalRef3 = null;

$(document).ready(function() {
    generateKeyboard("#keyboard_container");
	$("#q1").button();
	$("#q2").button();
	$("#q3").button();
	$("#q4").button();
	slotCtx.init();
    intervalRef1 = setInterval("slotCtx._nextSymbol(1,slotCtx._duration[0]);",slotCtx._duration[0]+25);
    intervalRef2 = setInterval("slotCtx._nextSymbol(2,slotCtx._duration[1]);",slotCtx._duration[1]+25);
    intervalRef3 = setInterval("slotCtx._nextSymbol(3,slotCtx._duration[2]);",slotCtx._duration[2]+25);
	$("#cancel_button").click(function() {
		alert("cancel");	
	});
	$(".quiz").click(function() {
		$("#spin").show();
	});
	$("#submit_button").button();
	$("#submit_button").click(function() {
		$("#checkout").fadeOut();
		clearInterval(intervalRef1);
		clearInterval(intervalRef2);
		clearInterval(intervalRef3);
		$("#spin").hide();
		$("#holder").show();
	});
	$("#spin").click(function() {
		slotCtx.spin();
		$("#spin").hide();
		$("#holder2").hide();
	});
	$("#stop1_link").click(function() {
		slotCtx.stop(1);
	});
	$("#stop2_link").click(function() {
		slotCtx.stop(2);
	});
	$("#stop3_link").click(function() {
		slotCtx.stop(3);
	});
});