var HE;
if( localStorage.langHE != null)
	HE = localStorage.langHE == "true";
else
{HE = false;}
var currentversion = 2.1;
  
var csInterface = new CSInterface();  

	
  

	 
$(function()
{
	$("body").append("V" + currentversion);
	DisplayLang();
	$.get( "https://www.olympicangelabz.com/prplugin/update.php?a="+Math.random(), function( data ) {
		var text = data;
		var csInterface = new CSInterface();
		if(data > currentversion)
		{ 
			$( "#dialog-confirm" ).html("<p>עדכון גרסה לפלאגין קיים וזמין להורדה מהאתר,</p><h3>הגרסה שלך - v." + currentversion+", הגרסה העדכנית - v."+data + "<h3>");
			$( "#dialog-confirm" ).dialog(
			{
				resizable: false,
				height: "auto",
				width: 400,
				modal: true,
				buttons: 
				{
					"הורד עכשיו!": function() {
					csInterface.openURLInDefaultBrowser("https://www.olympicangelabz.com/plugin_OlympicHelper.php");
					$( this ).dialog( "close" );
					},
					"התעלם..": function() {
					$( this ).dialog( "close" );
					}
				}
			});
		}
	});
	$("a").on("click",function()
	{
		var url = $(this).attr("href");
		csInterface.openURLInDefaultBrowser(url);
	});
});
	 
function tooglelang()
{
HE = !HE;
localStorage.langHE = HE;
DisplayLang();

}

function DisplayLang()
{
	
	if(HE)
	{
		$(".HE").show();
		$(".EN").hide();
		$("body").attr("style","--dir:rtl")

	}
	else
	{
		$(".HE").hide();
		$(".EN").show();
		$("body").attr("style","--dir:ltr")

	}

	for(var x = 0; x < all_fvx.length; x++)
{
    all_fvx[x].ToggleLang();
}
}


	$(".bs_table input, select, textarea").keypress(function (event) {
    if (event.which == 13) {
        event.preventDefault();
        bs_click();
    }
});
	
	function bs_click()
	{
	$("#bs_loader").slideDown();
	$(".bs_table").fadeOut();
	var mult = $("#bs_multi").val() / 1000,
	rate = Math.max(Math.round($("#bs_rate").val()),1),
	h = Math.abs($("#bs_Horizental").val()/200),
	v = Math.abs($("#bs_vertical").val()/200),
	isScale = $("#bs_scale").is(':checked'),
	shutter = Math.round($("#bs_motion").val());
	evalScript('$._PPP_.BaseShake('+mult+','+rate+','+h+','+v+','+isScale+','+shutter+','+HE+')',function(){
	$("#bs_loader").slideUp();
	$(".bs_table").fadeIn();
	});
	}

	function cm_click()
	{
	$("#cm_loader").slideDown();
	$(".cm_table").fadeOut();
	var mult = $("#cm_multi").val() / 100,
	rate = Math.max(Math.round($("#cm_rate").val()),1)/3,
	h = Math.abs($("#cm_Horizental").val()/200),
	v = Math.abs($("#cm_vertical").val()/200),
	isScale = $("#cm_scale").is(':checked'),
	shutter = Math.max(0,Math.min(360,Math.round($("#cm_motion").val())));

	var multiProp = new EffectAttrValue(undefined,"multi",20,true);
	multiProp.AddKeyFrame(0,0,2);
	multiProp.AddKeyFrame(2,3);

	evalScript('$._PPP_.GetClipFrameTime()',function(frameTime){
		frameTime = Number(frameTime);
		mult = multiProp.GenerateKeyframes(frameTime,true);
		evalScript('$._PPP_.CameraMovement('+mult+','+rate+','+h+','+v+','+isScale+','+shutter+')',function(err){
		$("#cm_loader").slideUp();
		$(".cm_table").fadeIn();
		});
	});
	}

	
	function bs_preCalc(mult,h)
	{
	return (mult * h * (Math.random()-0.5))*500;
	}
	
	function bs_preview()
	{
	var mult = $("#bs_multi").val() / 1000,
	rate = Math.round($("#bs_rate").val()),
	v = $("#bs_Horizental").val()/200,
	h = $("#bs_vertical").val()/200;
	var str = '@keyframes prev {\
  0% {transform: translate('+bs_preCalc(mult,h)+'px,'+bs_preCalc(mult,v)+'px) scale(0.7);}\
  25% {transform: translate('+bs_preCalc(mult,h)+'px,'+bs_preCalc(mult,v)+'px) scale(0.7);}\
  50% {transform: translate('+bs_preCalc(mult,h)+'px,'+bs_preCalc(mult,v)+'px) scale(0.7);}\
  75% {transform: translate('+bs_preCalc(mult,h)+'px,'+bs_preCalc(mult,v)+'px) scale(0.7);}\
  100% {transform: translate('+bs_preCalc(mult,h)+'px,'+bs_preCalc(mult,v)+'px) scale(0.7);}\
}\
#bs_pre {\
  animation-name: prev;\
  animation-iteration-count:99;\
  animation-direction: alternate;\
  animation-duration: '+rate*0.1+'s;\
}';
	
	$("#bs_styleedit").html(str);
	$("#bs_preB").fadeOut();
	setTimeout(function(){ $("#bs_styleedit").html("");$("#bs_preB").fadeIn(500); }, 3000);
	}
	
	function GetMarkerSts(markerid)
    {

        var colors = ["rgb(75, 132, 33)", "rgb(232, 55, 55)", "rgb(158, 80, 158)", "rgb(255, 120, 0)", "rgb(243, 223, 77)", "white", "rgb(66, 132, 255)", "cyan"];
       
		evalScript('$._PPP_.GetMarkerSts('+markerid+')',function(r)
		{
			$("#markerSts").html("<h2>"+r+" markers</h2>")
			$("#markerSts").css("color",colors[markerid]);
		});
	}
	
	function RenderMarkers()
	{
	var colors = ["rgb(75, 132, 33)","rgb(232, 55, 55)","rgb(158, 80, 158)","rgb(255, 120, 0)","rgb(243, 223, 77)","white","rgb(66, 132, 255)","cyan"];
	
	for(var i = 0; i<colors.length;i++)
	{
	  $("#markerHolder").append("<input type='radio' id='uuidmarker"+i+"'name=markers class='markers' group=markers marker='"+i+"'><label onclick='GetMarkerSts("+i+")' for='uuidmarker"+i+"' class='markerlablel' style='color:"+colors[i]+";background:"+colors[i]+";'></label>")
	}
	$("#uuidmarker0").prop('checked', true);
	}
	
	function GetProjAudioFX()
    {
	 var markerIndex =     $("input[name=markers]:checked").attr("marker");
     GetMarkerSts(markerIndex);
      
	 evalScript('$._PPP_.scanProjectAudio()',function(result){
		
     if(result==null || result == "" || result =="undefined")
		 return;
	 
	 $("#ProjmarkersAudios").html("");
	 var audioArr = result.split("///?");
	 for(var i = 0; i < audioArr.length; i++)
	 {
	  if(audioArr[i] != "")
	  {
	   var currentAudio = audioArr[i].split("|||?");
	   var name = currentAudio[1], uuid = currentAudio[0];
	    $("#ProjmarkersAudios").append("<input type='radio' id='fpa"+uuid+"' name='audio' class='audio' group=audio audio='proj'><label for='fpa"+uuid+"' title='"+name+"' class='audiolablel' >"+name+"</label>");
	  }
	 }
	 });
	}
	
	function GetAudioFX()
	{
		$.ajax({ url: './audio/', success: function(data) {
	var rawITems = data.split('<script>addRow("');
	for(var i = 2; i<rawITems.length;i++)
	{
	  rawITems[i] = rawITems[i].split('",')[0]
	  
	  $("#markersAudios").append("<input type='radio' id='uuidaudio"+i+"' name='audio' class='audio' group=audio audio='"+rawITems[i]+"'><label for='uuidaudio"+i+"' class='audiolablel' >"+rawITems[i]+"</label>");
	}
	$("#uuidaudio2").prop('checked', true);

	} });
	}
	
	function INImarkersCall()
	{
		$("input[name='audio']").on("click",function(){
			
			var markerIndex =     $("input[name=markers]:checked").attr("marker");
		GetMarkerSts(markerIndex);
		})
		
		$(".ms_table input, select, textarea").keypress(function (event) {
    if (event.which == 13) {
        event.preventDefault();
        ms_click();
    }
});
	}
	
	function ms_click()
	{
	
		
		var selectedDIFclip;
	   if($("input[name=audio]:checked").attr("audio") != "proj")
		   selectedDIFclip = $("input[name=audio]:checked").attr("audio");
	   else
	   {
		   selectedDIFclip = "?///"+$("input[name=audio]:checked").attr("id").split("fpa")[1];
	   }
	   
		var markerIndex =     $("input[name=markers]:checked").attr("marker");
		
		GetMarkerSts(markerIndex)
		var offsetVal = Math.min(Math.max(($("#ms_offset").val() / 100),0),1);
			
		
		
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
	    evalScript('$._PPP_.MarkerTransition("'+selectedDIFclip+'","'+markerIndex+'",'+offsetVal+',"'+path+'")',function(){});
	}
	
	
	function INIspinnerCall()
	{
		
	$(".sp_table input, select, textarea").keypress(function (event) {
    if (event.which == 13) {
        event.preventDefault();
        sp_click();
    }
});
	}
	
	
	function tx_click()
	{
	$("#tx_loader").slideDown();
	$(".tx_table ,#bs_applay").fadeOut();


	var easeType = $("#tx_ease").val();
	var isEaseOut = $("input[type=radio][name=tx_ease]:checked").attr("val")=="1";
	var transitionTime = $("#tx_AnimationTime").val();
	var tracking = $("#tx_tracking").val() / 100 / 2;
	var addiveTrack = $("#tx_addtive").val() / 100;
	var rotation = $("#tx_maxRotate").val();
	var rotateDirRTL = $("input[type=radio][name=tx_dir]:checked").attr("val")!="1";
	var minimun = $("#tx_minRotate").val();
	
	evalScript('$._PPP_.TextSpaceing('+easeType+','+isEaseOut+','+transitionTime+','+tracking+','+addiveTrack+','+rotation+','+rotateDirRTL+','+minimun+')',function(){
	$("#tx_loader").slideUp();
	$(".tx_table , #bs_applay").fadeIn();
	});
	}
		
	   
	
	
	
	
	function sp_click()
	{
	$("#sp_loader").slideDown();
	$(".sp_table").fadeOut();
	var mult = $("#sp_multi").val() / 100,
	xScale = Math.abs($("#sp_Horizental").val()/200),
	yScale = Math.abs($("#sp_vertical").val()/200),
	speed = Math.max(Math.abs($("#sp_speed").val()/10000),0.00001),
	speedOverTime = $("#sp_speedot").val()/100000,
	linear = $("#sp_scale").is(':checked'),
	neton = $("#sp_new").is(':checked');
	evalScript('$._PPP_.Spinner('+mult+','+xScale+','+yScale+','+speed+','+speedOverTime+','+linear+','+neton+','+$("#sp_motion").val()+')',function(){
	$("#sp_loader").slideUp();
	$(".sp_table").fadeIn();
	});
	}
	
	function sp_preCalc(mult,h)
	{
	return (mult * h * (Math.random()-0.5))*500;
	}
	
	function sb_click()
	{
		$("#sb_loader").slideDown();
		$(".sb_table").fadeOut();
		var SpinAmount = $("#sb_spin").val();
		var func=$("#sb_func").val();
		if(func == null || func == "")
		func = "1";
		try{
			var works = eval(func.replace("{x}",5));
		}catch(err)
		{alert("שגיאה בחישוב פונקציית ערכים, הערך ישתנה לברירת מחדל.");func=1;}
		var length=$("#sb_length").val();
		var auto = $("#sb_anchor").is(':checked');
	
	
		evalScript('$._PPP_.SpinBlur('+SpinAmount+','+length+',"'+auto+'","'+func+'")',function(){
			$("#sb_loader").slideUp();
			$(".sb_table").fadeIn();
		});
	
	 
	}

		
	function zb_click()
	{
		$("#zb_loader").slideDown();
		$(".zb_table").fadeOut();
		var SpinAmount = $("#zb_spin").val();
		var func=$("#zb_func").val();
		if(func == null || func == "")
		func = "1";
		try{
			var works = eval(func.replace("{x}",5));
		}catch(err)
		{alert("שגיאה בחישוב פונקציית ערכים, הערך ישתנה לברירת מחדל.");func=1;}
		var length=$("#zb_length").val();
		var auto = $("#zb_anchor").is(':checked');
	
	
		evalScript('$._PPP_.ZoomBlur('+SpinAmount+','+length+',"'+auto+'","'+func+'")',function(){
			$("#zb_loader").slideUp();
			$(".zb_table").fadeIn();
		});
	
	 
	}

	function gr_click()
{
	$("#gr_loader").slideDown();
	$(".gr_table").fadeOut();
	var SpinAmount = $("#gr_spin").val();
	var func=$("#gr_func").val();
	if(func == null || func == "")
	func = "1";
	try{
		var works = eval(func.replace("{x}",5));
	}catch(err)
	{alert("שגיאה בחישוב פונקציית ערכים, הערך ישתנה לברירת מחדל.");func=1;}
	var length=$("#gr_length").val();
	var brightness = $("#gr_light").val() - 100;


	evalScript('$._PPP_.GodRays('+SpinAmount+','+length+','+brightness+',"'+func+'")',function(){
		$("#gr_loader").slideUp();
		$(".gr_table").fadeIn();
	});

 
}