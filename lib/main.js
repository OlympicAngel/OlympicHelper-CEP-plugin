var HE;
if (localStorage.langHE != null)
	HE = localStorage.langHE == "true";
else {
	HE = false;
}
var currentversion = 4.1;

var csInterface = new CSInterface();


$(function () {
	$("body").append("V" + currentversion);
	DisplayLang();
	if (localStorage.langHE == "true")
		$('body').addClass("hebrew")
	else
		$('body').removeClass("hebrew")
	$.get("https://www.olympicangelabz.com/prplugin/update.php?a=" + Math.random(), function (data) {
		var text = data;
		var csInterface = new CSInterface();
		if (data > currentversion) {
			$("#dialog-confirm").html("<p>עדכון גרסה לפלאגין קיים וזמין להורדה מהאתר,</p><h3>הגרסה שלך - v." + currentversion + ", הגרסה העדכנית - v." + data + "<h3>");
			$("#dialog-confirm").dialog({
				resizable: false,
				height: "auto",
				width: 400,
				modal: true,
				buttons: {
					"הורד עכשיו!": function () {
						csInterface.openURLInDefaultBrowser("https://www.olympicangelabz.com/plugin_OlympicHelper.php");
						$(this).dialog("close");
					},
					"התעלם..": function () {
						$(this).dialog("close");
					}
				}
			});
		}
	});
	$("a").on("click", function () {
		var url = $(this).attr("href");
		csInterface.openURLInDefaultBrowser(url);
	});

	$("button").on("click", async function (a) {
		await sleep(1000);
		const id = $(this).parent()[0].id;
		gtag('event', 'fx', {
			event_label: id,
			value: 1,

		});
	})
});


function toggleView() {
	$('body').toggleClass('hider')
}

function tooglelang() {
	HE = !HE;
	localStorage.langHE = HE;
	DisplayLang();

}

function DisplayLang() {
	$('body').toggleClass('hebrew')

	if (HE) {
		$(".HE").show();
		$(".EN").hide();
		$("body").attr("style", "--dir:rtl")

	} else {
		$(".HE").hide();
		$(".EN").show();
		$("body").attr("style", "--dir:ltr")

	}

	for (var x = 0; x < all_fvx.length; x++) {
		all_fvx[x].ToggleLang();
	}
}


function GetMarkerSts(markerid) {

	var colors = ["rgb(75, 132, 33)", "rgb(232, 55, 55)", "rgb(158, 80, 158)", "rgb(255, 120, 0)", "rgb(243, 223, 77)", "white", "rgb(66, 132, 255)", "cyan"];

	evalScript('$._PPP_.GetMarkerSts(' + markerid + ')', function (r) {
		$("#markerSts").html("<h2>" + r + " markers</h2>")
		$("#markerSts").css("color", colors[markerid]);
	});
}

function RenderMarkers() {
	var colors = ["rgb(75, 132, 33)", "rgb(232, 55, 55)", "rgb(158, 80, 158)", "rgb(255, 120, 0)", "rgb(243, 223, 77)", "white", "rgb(66, 132, 255)", "cyan"];

	for (var i = 0; i < colors.length; i++) {
		$("#markerHolder").append("<input type='radio' id='uuidmarker" + i + "'name=markers class='markers' group=markers marker='" + i + "'><label onclick='GetMarkerSts(" + i + ")' for='uuidmarker" + i + "' class='markerlablel' style='color:" + colors[i] + ";background:" + colors[i] + ";'></label>")
	}
	$("#uuidmarker0").prop('checked', true);
}

function GetProjAudioFX() {
	var markerIndex = $("input[name=markers]:checked").attr("marker");
	GetMarkerSts(markerIndex);

	evalScript('$._PPP_.scanProjectAudio()', function (result) {

		if (result == null || result == "" || result == "undefined")
			return;

		$("#ProjmarkersAudios").html("");
		var audioArr = result.split("///?");
		for (var i = 0; i < audioArr.length; i++) {
			if (audioArr[i] != "") {
				var currentAudio = audioArr[i].split("|||?");
				var name = currentAudio[1],
					uuid = currentAudio[0];
				$("#ProjmarkersAudios").append("<input type='radio' id='fpa" + uuid + "' name='audio' class='audio' group=audio audio='proj'><label for='fpa" + uuid + "' title='" + name + "' class='audiolablel' >" + name + "</label>");
			}
		}
	});
}

function GetAudioFX() {
	$.ajax({
		url: './audio/',
		success: function (data) {
			var rawITems = data.split('<script>addRow("');
			for (var i = 2; i < rawITems.length; i++) {
				rawITems[i] = rawITems[i].split('",')[0]

				$("#markersAudios").append("<input type='radio' id='uuidaudio" + i + "' name='audio' class='audio' group=audio audio='" + rawITems[i] + "'><label for='uuidaudio" + i + "' class='audiolablel' >" + rawITems[i] + "</label>");
			}
			$("#uuidaudio2").prop('checked', true);

		}
	});
}

function INImarkersCall() {
	$("input[name='audio']").on("click", function () {

		var markerIndex = $("input[name=markers]:checked").attr("marker");
		GetMarkerSts(markerIndex);
	})

	$(".ms_table input, select, textarea").keypress(function (event) {
		if (event.which == 13) {
			event.preventDefault();
			ms_click();
		}
	});
}

async function ms_click() {

	var selectedDIFclip;
	const selectedRadio = $("input[name=audio]:checked");
	if (selectedRadio.attr("audio") != "proj")
		selectedDIFclip = selectedRadio.attr("audio");
	else {
		selectedDIFclip = "?///" + selectedRadio.attr("id").split("fpa")[1];
	}

	var markerIndex = $("input[name=markers]:checked").attr("marker");

	GetMarkerSts(markerIndex)
	var offsetVal = Math.min(Math.max(($("#ms_offset").val() / 100), 0), 1);



	var csInterface = new CSInterface();
	var OSVersion = csInterface.getOSInformation();
	var path = csInterface.getSystemPath(SystemPath.EXTENSION);



	if (OSVersion) {
		// The path always comes back with '/' path separators. Windows needs '\\'.
		if (OSVersion.indexOf("Windows") >= 0) {

			var sep = '\\';
			path = path.replace("//", sep);

		}
	}
	const res = await new Promise(resolve => evalScript('$._PPP_.MarkerTransition("' + selectedDIFclip + '","' + markerIndex + '",' + offsetVal + ',"' + path + '")', resolve));
	jsx_error(res);
}


function MSG(innerHTML, btn = "ok", callback) {
	const buttons = {};
	buttons[btn] = function () {
		$(this).dialog("close");

		if (callback)
			callback();
	};

	$("#dialog-confirm").html(innerHTML);
	$("#dialog-confirm").dialog({
		resizable: false,
		height: "auto",
		width: "auto",
		modal: true,
		title: "OlympicHelper - INFO:",
		"buttons": buttons
	});

	$("#dialog-confirm a").on("click", function () {
		var url = $(this).attr("href");
		csInterface.openURLInDefaultBrowser(url);
	});
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Converts eval script to async while keeping the older callback option
 * @param {string} script 
 * @param {function} callback @optional
 * @returns 
 */
async function evalScript(script, callback) {

	return await new Promise((resolve) => {
		new CSInterface().evalScript(script, (output) => {
			if (callback)
				callback(output)
			resolve(output);
		})
	});
}

csInterface.addEventListener("debug", (e) => console.log("[DEBUGGER]", e.data));
