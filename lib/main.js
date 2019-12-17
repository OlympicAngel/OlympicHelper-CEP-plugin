var HE;
if( localStorage.langHE != null)
	HE = localStorage.langHE == "true";
else
{HE = false;}
var currentversion = 0.22;
  
  
var csInterface = new CSInterface();  

	
  

	 
  $( function() {

	$("body").append("V" + currentversion);
	
$('input[mode="function"]').closest('td').append(`
<button onclick="$(this).closest('tr').find('[mode=function]').val('1')"><label class="EN">Const</label><label class="HE">קבוע</label></button>
<button onclick="$(this).closest('tr').find('[mode=function]').val('{x}')"><label class="EN">Linear</label><label class="HE">לינארי</label></button>
<button onclick="$(this).closest('tr').find('[mode=function]').val('Math.sqrt({x})')"><label class="EN">EaseIn</label><label class="HE">כניסה חלקה</label></button>
<button onclick="$(this).closest('tr').find('[mode=function]').val('Math.sqrt(Math.sqrt({x}))')"><label class="EN">EaseIn^2</label><label class="HE">כניסה חלקה^2</label></button>
<button onclick="$(this).closest('tr').find('[mode=function]').val('1-Math.sqrt({x})')"><label class="EN">EaseOut</label><label class="HE">יציאה חלקה</label></button>
<button onclick="$(this).closest('tr').find('[mode=function]').val('1-Math.sqrt(Math.sqrt({x}))')"><label class="EN">EaseOut^2</label><label class="HE">יציאה חלקה^2</label></button>
<button onclick="$(this).closest('tr').find('[mode=function]').val('1+Math.sin({x})')"><label class="EN">Sin(x)</label><label class="HE">סינוס(x)</label></button>
<button onclick="$(this).closest('tr').find('[mode=function]').val('Math.sqrt(Math.max(0,5-{x}))')"><label class="EN">EaseIn for 5 sec</label><label class="HE">כניסה קלה ל 5 שניות</label></button>
`);
selectionINI();
DisplayLang();



$.get( "https://www.olympicangelabz.com/prplugin/update.php?a="+Math.random(), function( data ) {
  var text = data;
  var csInterface = new CSInterface();
  if(data > currentversion)
  { 
    $("#newvers").html("from v." + currentversion+" to v."+data);
	$( "#dialog-confirm" ).dialog({
      resizable: false,
      height: "auto",
      width: 400,
      modal: true,
      buttons: {
        "Download NOW!": function() {
		csInterface.openURLInDefaultBrowser("https://olympicangelabz.com/prplugin/PP_OlympicHelper.rar?a="+Math.random());
          $( this ).dialog( "close" );
        },
        Ignore: function() {
          $( this ).dialog( "close" );
        }
      }
    });
	}
	
});


$("select").selectmenu();

    $( "#accordion" ).accordion({collapsible: true,active: false});
	
	    $( "input[jqui=spiiners]" ).spinner(
		{
		min:1,numberFormat: "n",step: 0.1,page: 1,
		spin:   function( event, ui ) {FixWidth(this,ui)},
		stop:   function( event, ui ) {FixWidth(this,ui)},
		create: function( event, ui ) {FixWidth(this,ui)}
		});
		$( "input[jqui=spiiners]" ).on("input",function(){
		if(isNaN($(this).val()))
		 $(this).val(1);
		 
		$( this ).css("width",$(this).val().toString().length * 7 + "px");
		})
		
		$("[uistep='1']").spinner("option","step",1);
		
		  $( "input[jqui=spiiners][uistep]" ).each(function( index ) {
$(this).spinner("option","step",$(this).attr("uistep"))
});
		  		  $( "input[jqui=spiiners][uimax]" ).each(function( index ) {
$(this).spinner("option","max",$(this).attr("uimax"))
});

		  		  $( "input[jqui=spiiners][uimin]" ).each(function( index ) {
$(this).spinner("option","min",$(this).attr("uimin"))
});
 
 
    var thHeight = $(".resizer td:first").height();
  $(".resizer td").resizable({
      handles: "e",
      minHeight: thHeight,
      maxHeight: thHeight,
      minWidth: 300,
      resize: function (event, ui) {
        var sizerID = "#" + $(event.target).attr("id") + "-sizer";
        $(sizerID).width(ui.size.width);
      }
  });
 $(".progress").hide();

  $( ".progress" ).progressbar({
      value: false
	});
	

	

$("input[type!=checkbox][type!=radio], select").on("change spin stop onfocusout select close selectmenuchange selectmenuselect",function(){sessionStorage.setItem("AS" + $(this).attr("id"),$(this).val());})
$("[type=radio]").on("click",function(){sessionStorage.setItem("ASradio" + $(this)[0].name, $( "[name="+$(this)[0].name+"]:checked").attr("id"))});
$("[type=checkbox]").on("click",function(){sessionStorage.setItem("AS" + $(this).attr("id"),$(this).is(":checked"));});


$( "input, select").each(function() { 
	if(sessionStorage.getItem("AS" + $(this).attr("id")) != undefined && sessionStorage.getItem("AS" + $(this).attr("id")) != null )
{
	  $(this).val(sessionStorage.getItem("AS" + $(this).attr("id")));


	  if($(this)[0].tagName === "SELECT")
		  $("select").selectmenu( "refresh" );

	  if($(this)[0].type == "checkbox")
		{
			
			var stateToBe = sessionStorage.getItem("AS" + $(this).attr("id"));
			  $(this).attr("checked", stateToBe == "true");
		}
	}
	
	if($(this)[0].type === "radio")
	$("#" + sessionStorage.getItem("ASradio" + $(this)[0].name)).attr("checked","true");


});

ToggleVFXView();

$("a").on("click",function()
{
	var url = $(this).attr("href");
	csInterface.openURLInDefaultBrowser(url);

});






 } );


 var tfxTypes = ["camera"  ,"text","blur" ,"glow" ,"audio","visual"];
 var tfxTypesHE = ["מצלמה","טקסט","טשטוש","זוהר","אדיו" ,"וויזואלי"];
 function selectionINI()
 {

	$("div#accordion h3").each(function(){
		$(this).append("<au></au>");
	});
	

	 for(var x = 0; x < tfxTypes.length; x++)
	 {
		 $("."+tfxTypes[x] + " au").append("<tag type='"+tfxTypes[x]+"'><span class='HE'>"+tfxTypesHE[x]+"</span><span class='EN'>"+tfxTypes[x]+"</span></tag>");
		$("#selection").append("<label for='vfx"+tfxTypes[x]+"' type='"+tfxTypes[x]+"' onclick='ToggleVFXView()'><input type='checkbox' id='vfx"+tfxTypes[x]+"' /><span class='HE'>"+tfxTypesHE[x]+"</span><span class='EN'>"+tfxTypes[x]+"</span></label>");
	 }

	 $("tag , #selection label").hover(function(){
		var type = $(this).attr("type");
		$("tag[type="+type+"]").finish().animate({
			"background-color": "#ff0000"
		  }, 500);
	 },
	 function(){
		var type = $(this).attr("type");
		$("tag[type="+type+"]").finish().animate({
			"background-color": "#3d90de"
		  }, 300);
		}
	 );

	 
 }

 function ToggleVFXView()
 {
	var allowd = [];
	for(var x = 0; x < tfxTypes.length; x++)
	{
		if($("#vfx"+tfxTypes[x]).is(":checked"))
			allowd[x] = tfxTypes[x];
		else
			allowd[x] = null;
	}

	$("div#accordion h3").hide();
	for(var x = 0; x < allowd.length; x++)
	{
		if(tfxTypes.includes(allowd[x]))
			$("."+allowd[x]+"").show();
	}

 }


 	 function FixWidth(obj,ui)
	 {
	 try{
	 $( obj ).css("width",ui.value.toString().length * 7 + "px");
	 }
	 catch(err)
	 {}
	 
	 }
	 
	 
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
	$("div.title").removeClass("right");
$(".HE").show();
$(".EN").hide();
$("body").css("direction","rtl");
$("au").css("left","0px");
$("au").css("right","auto");
}
else
{
	$("div.title").addClass("right");
$(".HE").hide();
$(".EN").show();
$("body").css("direction","ltr");
$("au").css("left","auto");
$("au").css("right","0px");
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
	var mult = $("#cm_multi").val() / 1000,
	rate = Math.max(Math.round($("#cm_rate").val()),1)/3,
	h = Math.abs($("#cm_Horizental").val()/200),
	v = Math.abs($("#cm_vertical").val()/200),
	isScale = $("#cm_scale").is(':checked'),
	shutter = Math.max(0,Math.min(360,Math.round($("#cm_motion").val())));
	evalScript('$._PPP_.CameraMovement('+mult+','+rate+','+h+','+v+','+isScale+','+shutter+')',function(){
	$("#cm_loader").slideUp();
	$(".cm_table").fadeIn();
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