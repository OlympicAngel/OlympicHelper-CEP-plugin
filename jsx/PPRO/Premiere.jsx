//#include "PPro_API_Constants.jsx";
//#include "JSON.jsx";
//app.setSDKEventMessage(JSON.stringify(currentSeq.getPlayerPosition()));


var allowedAudio = ["mp3", "wav", "sgg", "aac", "3gp", "AIF", "M4A", "OMF"];

function isInFormatAudio(str) {

    for (var i = 0; i < allowedAudio.length; i++) {
        if (str.toLowerCase() == allowedAudio[i].toLowerCase()) {
            return true;
        }
    }
    return false;
}


$._PPP_ = {

    AddFXDataTrack : null,
	AddFXDataPosit : null,
	AddFXDataOldPos : null,

    /////////////////////////////////////////////////////////////////////////////////////////////////helper functions START



	AddEffect: function (effctName,track, position,times) {
	  try
	  {
		app.enableQE();
		var seq = qe.project.getActiveSequence();
		var videoTrack = seq.getVideoTrackAt(track);
		var CountClips = 0;
		var clipToAdd;
		
		if(this.AddFXDataOldPos == position && this.AddFXDataTrack == track)
		{clipToAdd = videoTrack.getItemAt(this.AddFXDataPosit);}
		else
		  {
			for(var i = 0; i < videoTrack.numItems; i++)
			{
				
				var TrackItem =  videoTrack.getItemAt(i);
				if(TrackItem.type == 'Clip')
				{
					if(CountClips == position)
					{clipToAdd = TrackItem;break;}
					else
						CountClips++;
				}
			}
			if(clipToAdd == null)
				return "could not find clip at position";
			
			this.AddFXDataTrack = track;
			this.AddFXDataPosit = i;
			this.AddFXDataOldPos = position;
		  }
		
		var fx = qe.project.getVideoEffectByName(effctName);
		if(times == null || times == undefined)
			times = 1;
		var couldPlace = true;
		for(var x = 0; x < times; x++)
		 clipToAdd.addVideoEffect(fx,false);

	  }catch(err){
		  return err ;
	  }
    },
    scanProjectAudio: function () {

        var audioFiles = "";
        if (app == null || app.project == null)
            return;
        var folderSearch = app.project.rootItem;
        if (folderSearch == null)
            return;
        var rootFiles = folderSearch.children;

        var audioFiles = [];
        for (var i = 0; i < rootFiles.numItems; i++) {
            var currentItem = rootFiles[i];
            if (currentItem.type == 1) {
                var currentName = currentItem.name;

                var splitarray = currentName.split(".");
                if (splitarray.length > 1) {
                    var currentExt = splitarray[splitarray.length - 1];



                    if (isInFormatAudio(currentExt)) {
                        //this.Alert(false,true,(currentItem.name))
                        audioFiles = audioFiles + "///?" + currentItem.nodeId + "|||?" + currentItem.name;

                    }
                }
            }
        }
        return audioFiles;
    },
    calcX: function (p) {
        var re = 0;
        re = Math.cos(p);
        return re;
    },
    calcY: function (p) {
        var re = 0;
        re = Math.sin(p);
        return re;
    },
    rndRange: function (x) { return 0.5 - x + Math.random() * (2 * x); },
    GetAllSelectedClipsV: function () {
        var seq = this.global.currentSeq;

        var clipArray = [];
        var trcksC = 0, clipC = 0;

        for (var s = 0; s < seq.videoTracks.numTracks; s++) {
            trcksC++;
            var firstVideoTrack = seq.videoTracks[s];

            for (var i = 0; i < firstVideoTrack.clips.numItems; i++) {
                clipC++;
                var firstClip = firstVideoTrack.clips[i]
                if (firstClip.isSelected()) {
					firstClip.trackNum = s;
					firstClip.clipNum = i;
                    clipArray.push(firstClip);
                }
            }
        }
        return clipArray;
    },
    LocateOrLoad: function (filePath, binObj, clipName) {
        var originclipName = clipName;
        var folderSearch = app.project.rootItem;
        var rootFiles = folderSearch.children;
        var folderObj = binObj, clipProj;

        for (var t = 0; t < folderObj.children.numItems; t++) {
            var curFile = folderObj.children[t];
            if (curFile.name == clipName)
                return curFile;
        }

        clipName = filePath + clipName;
        var didloaded = app.project.importFiles([clipName], false, folderObj);
        if (!didloaded) {
            this.Alert(true, true, "Error loading the file '" + clipName + "'!")
        }

        folderObj = this.VerifyBin();
        for (var t = 0; t < folderObj.children.numItems; t++) {
            var curFile = folderObj.children[t];
            if (curFile.name == originclipName) {
                clipProj = curFile;
                break;
            }
        }

        return clipProj;
    },
    LocateByID: function (id) {
        var folderSearch = app.project.rootItem;
        var rootFiles = folderSearch.children;

        for (var t = 0; t < rootFiles.numItems; t++) {
            var curFile = rootFiles[t];
            if (curFile.nodeId == id)
                return curFile;
        }
    },
    VerifyBin: function () {
        var folderSearch = app.project.rootItem;
        var rootFiles = folderSearch.children;

        var folderExt = false;
        var folderObj;
        for (var t = 0; t < rootFiles.numItems; t++) {
            var curFile = rootFiles[t];
            if (curFile.type == 2)
                if (curFile.name == "OlympicHelper Files") {
                    folderObj = curFile;
                    folderExt = true;
                    break;
                }
        }
        if (!folderExt) {
            app.project.rootItem.createBin("OlympicHelper Files");
            folderSearch = app.project.rootItem;
            rootFiles = folderSearch.children;
            for (var t = 0; t < rootFiles.numItems; t++) {
                var curFile = rootFiles[t];
                if (curFile.type == 2)
                    if (curFile.name == "OlympicHelper Files") {
                        folderObj = curFile;
                        folderExt = true;
                        break;
                    }
            }
        }
        return folderObj;
    },
    MovePlayer: function (frames) {
        var currentSeq = app.project.activeSequence;
        var oldPPos, newPPos;
        oldPPos = currentSeq.getPlayerPosition().ticks;
        var tickaddive = 0;
        tickaddive = frames * currentSeq.timebase;
        newPPos = parseInt(oldPPos) + parseInt(tickaddive);
        currentSeq.setPlayerPosition(newPPos);
    },
    Alert: function (realAlert, sideAlert, alertText) {
        if (sideAlert) app.setSDKEventMessage(alertText, "error");

        if (realAlert) alert(alertText, "OlympicHelper:");
    },

    wiggle:function( freq, amp, t ,type)
    {
        freq = freq / 10;
        amp = amp;

        if(this.global.wiggleX == undefined)
            this.global.wiggleX = new perlin();

        if(this.global.wiggleY == undefined)
            this.global.wiggleY = new perlin();

        if(type == "x" || type == "X")
             return this.global.wiggleX.get(t*freq,4) * amp;
        else
             return this.global.wiggleY.get(t*freq,4) * amp;

    },

    IsCustomFX: function(Effect,customFX){
        var fxName = Effect.displayName;
        switch(fxName)
        {
            case "Transform":
                var properties = Effect.properties;
                var skew = Math.floor(10000*properties[4].getValue())/10000;
                var axis = Math.floor(10000*properties[5].getValue())/10000;
                var opacity = Math.floor(10000*properties[6].getValue())/10000;
                if(customFX == "cameraMovement" && (skew==0.0007 || axis == 0.0007 || opacity == 99.9997))
                   return true;
                if(customFX == "baseShake" && (skew==0.0006 || axis == 0.0006 || opacity == 99.9996))
                   return true;
                if(customFX == "SpinBlur" && (skew==0.0005 || axis == 0.0005 || opacity == 99.9995))
                   return true;
                if(customFX == "ZoomBlur" && (skew==0.0004 || axis == 0.0004 || opacity == 99.9994))
                   return true;
                if(customFX == "GodRays" && (skew==0.0008 || axis == 0.0008 || opacity == 99.9998))
                   return true;

                   
                break;
            case "ProcAmp":
                var properties = Effect.properties;
                var Split = Math.floor(10000*properties[5].getValue())/10000;
                if(customFX == "GodRays" && Split == 50.0001)
                    return true;
                break;
            default:
                return false;
        }
    },

    SetCustomFX: function(Effect,customFX){
        switch(Effect.displayName)
        {
            case "Transform":
                switch(customFX)
                {
                    case "cameraMovement":
                         var properties = Effect.properties;
                         var skew = properties[4].setValue(0.00071 );
                         var axis = properties[5].setValue(0.00071);
                         var opacity = properties[6].setValue(99.99971);
                         break;
                    case "baseShake":
                         var properties = Effect.properties;
                         var skew = properties[4].setValue(0.00061 );
                         var axis = properties[5].setValue(0.00061);
                         var opacity = properties[6].setValue(99.99961);
                         break;
                    case "SpinBlur":
                            var properties = Effect.properties;
                            var skew = properties[4].setValue(0.00051 );
                            var axis = properties[5].setValue(0.00051);
                            var opacity = properties[6].setValue(99.99951);
                            break;
                    case "ZoomBlur":
                            var properties = Effect.properties;
                            var skew = properties[4].setValue(0.00041 );
                            var axis = properties[5].setValue(0.00041);
                            var opacity = properties[6].setValue(99.99941);
                            break;
                    case "GodRays":
                            var properties = Effect.properties;
                            var skew = properties[4].setValue(0.00081);
                            var axis = properties[5].setValue(0.00081);
                            var opacity = properties[6].setValue(99.99981);
                            break;

                    default:
                         break;
                }
                break;
            case "ProcAmp":
                switch(customFX)
                {
                    case "GodRays":
                            var properties = Effect.properties;
                            var Split = properties[5].setValue(50.00011 );
                    default:
                        break;
                }

                break;
            default:
                break;
        }
    },

    GetEffectFromClip: function(Clip,fxName,customFX)
    {
        if(Clip.trackNum == undefined || Clip.trackNum == null)
          return this.Alert(true,true,"ERROR: clip trackNum is null");
        if(Clip.clipNum == undefined || Clip.clipNum == null)
          return this.Alert(true,true,"ERROR: clip clipNum is null");
        var tFX;
        var fxCount = Clip.components.numItems;
        for (var s = 0; s < fxCount; s++)
        {
            tFX = Clip.components[s];
            if(tFX.displayName == fxName)
                if(this.IsCustomFX(tFX,customFX))
                    return tFX;
        }
        try{ this.AddEffect(fxName,Clip.trackNum,Clip.clipNum);}
        catch(err){this.Alert(true,true,"somesting went wrong locating/creating ["+fxName+"]FX at " + ToString(Clip))};
        var pos = 2;
        if(Clip.components[2].displayName == "Vector Motion")
          pos = 3;


        tFX = Clip.components[pos];
        this.SetCustomFX(tFX,customFX);

        return tFX;
    },

    ResetKeyframes: function(EffectAttr,allowKeyframes)
    {
        if (EffectAttr.areKeyframesSupported())
            {
                EffectAttr.setTimeVarying(false);
                EffectAttr.setTimeVarying(allowKeyframes);
            }
    },




    /////////////////////////////////////////////////////////////////////////////////////////////////helper functions END

    /////////////////////////////////////////////////////////////////////////////////////////////////End protdact Functions START
    GetMarkerSts: function (colorIndex) {
        var data = "";
        if (app == null || !app.project)
            return;
        var currentSeq = app.project.activeSequence;
        if (currentSeq == null)
            return;

        var TrackAllMarkers = currentSeq.markers;
        if (!TrackAllMarkers || TrackAllMarkers.numMarkers == 0) {
            return;
        }
        var numMarkers = TrackAllMarkers.numMarkers;
        var markers = TrackAllMarkers;
        var markAry = [];
        var currentMarker;


        for (a = 0; a < numMarkers; a++) {
            var tempAry = [];
            if (a == 0) {
                currentMarker = markers.getFirstMarker();
                tempAry.push(currentMarker.start);
                tempAry.push(currentMarker.end);
                tempAry.push(currentMarker.getColorByIndex(colorIndex));
                markAry.push(tempAry);
            }
            if (a > 0) {
                currentMarker = markers.getNextMarker(currentMarker);
                tempAry.push(currentMarker.start);
                tempAry.push(currentMarker.end);
                tempAry.push(currentMarker.getColorByIndex(colorIndex));
                markAry.push(tempAry);
            }
        }
        var markercount = 0;
        for (var i = 0; i < markAry.length; i++) {
            if (markAry[i][2] == colorIndex) { markercount++; }
        }

        data = markercount + "/" + markAry.length;
        return data;
    },
    Spinner: function (masterScale, xScale, yScale, speed, speedOverTime, linear, neton, shutter) {
        var multi = masterScale;
        var currentSeq = app.project.activeSequence;
        var timebase = currentSeq.timebase;
        var t = new Time();
        var slectedClips = this.GetAllSelectedClipsV();
        t.ticks = timebase;
        var keyframeRatio = t.seconds * 1;
        for (var i = 0; i < slectedClips.length; i++) {
			this.AddEffect("Transform",slectedClips[i].trackNum,slectedClips[i].clipNum);
            var clipComponents = slectedClips[i].components;
            var clipTimeStart = slectedClips[i].inPoint.seconds;
            var clipLength = slectedClips[i].outPoint.seconds - clipTimeStart;
            if (clipComponents) {
                var didfindFX = false;
                for (var s = 0; s < clipComponents.numItems; s++) {
                    clipComponent = clipComponents[s];

                    if (clipComponent.displayName == "Transform") {
                        var didfindFX = true;
                        var addtive = linear;
                        var cicleC = 0;
                        var bxScale = xScale;
                        var byScale = yScale;
                        var step = 0;
                        var maxv = 6.28;
                        var x = 0, y = 0;
                        var properties = clipComponent.properties;
                        var position = properties[1];
                        if (position.areKeyframesSupported())
                            position.setTimeVarying(true);
						
						var scaleRatio = properties[2];
						scaleRatio.setValue(true,true);		
						
                        var k;
                        for (k = clipTimeStart; k < clipLength + clipTimeStart; k = k + keyframeRatio) {
                            step += speed;
                            if (addtive) { speed += speedOverTime; }
                            else { speed = speed * (1 + speedOverTime) };
                            if (step > maxv) {
                                cicleC += speed;
                                step = 0;
                            }
                            x = this.calcX(step);
                            y = this.calcY(step);
                            if (neton) {
                                xScale = bxScale * Math.abs(Math.cos(cicleC));
                                yScale = byScale * Math.abs(Math.sin(cicleC));
                            }
                            x = (x) * multi * xScale + 0.5;
                            y = (y) * multi * yScale + 0.5;

                            t.seconds = k;
                            position.addKey(t);
                            position.setValueAtKey(t, [x, y], false);
                        }
                        var shutterSpeed = properties[10];
                        shutterSpeed.setValue(shutter, true);
						break;
                    }
                }
                if (!didfindFX) {
                    app.setSDKEventMessage("There is NO 'transform' effect for the selcted clip;\nClip name:" + slectedClips[i].name + ",\n plz add the effect and retry.", "error");
                    alert("There is NO 'transform' effect for the selcted clip;\nClip name:" + slectedClips[i].name + ",\n plz add the effect and retry.", "error");
                }
            }
        }
        if (slectedClips.length == 0) {
            app.setSDKEventMessage("there is not selected clip, please select one and retry.");
            alert("there is not selected clip, please select one and retry.")
        }
    },

    MarkerTransition: function (clipName, colorIndex, offset, path) {

        var currentSeq = app.project.activeSequence;
        if (!currentSeq) {
            this.Alert(true, true, "an active Sequence cannot be found! please open a sequence and then retry!");
            return;
        }
        var timebase = currentSeq.timebase;
        var clipProj;
        if (!(clipName.split("?///").length > 1)) {
            var folderObj = this.VerifyBin();

            clipProj = this.LocateOrLoad(path + "\\audio\\", folderObj, clipName);
        }
        else {

            var clipid = clipName.split("?///")[1];

            var clip = this.LocateByID(clipid);
            if (clip == null) {
                this.Alert(true, true, "From some reson the clip(" + clipid + ") could not be found.");
                return;
            }
            clipProj = clip;
        }
        clipProj.setColorLabel(Math.round(16 / 7 * colorIndex));

        var tempSeq = app.project.sequences[0].clone();
        tempSeq = app.project.activeSequence;
        var seqCount = app.project.sequences.numSequences;
        var tempAudioTrack = tempSeq.audioTracks[0];
        tempAudioTrack.overwriteClip(clipProj, new Time());
        var duretion = tempSeq.audioTracks[0].clips[0].duration.seconds;

        var offsetSec = offset * duretion;

        app.project.deleteSequence(tempSeq);
        // end of function




        var audioTracks = currentSeq.audioTracks;

        var TrackAllMarkers = currentSeq.markers;
        if (!TrackAllMarkers || TrackAllMarkers.numMarkers == 0) {
            this.Alert(true, true, "no Marker was found! (is it the right color?) in order to use this function you must add markers in your sequence!");
            return;
        }
        var numMarkers = TrackAllMarkers.numMarkers;
        var markers = TrackAllMarkers;
        var markAry = [];
        var currentMarker;


        for (a = 0; a < numMarkers; a++) {
            var tempAry = [];
            if (a == 0) {
                currentMarker = markers.getFirstMarker();
                tempAry.push(currentMarker.start);
                tempAry.push(currentMarker.end);
                tempAry.push(currentMarker.getColorByIndex(colorIndex));
                markAry.push(tempAry);
            }
            if (a > 0) {
                currentMarker = markers.getNextMarker(currentMarker);
                tempAry.push(currentMarker.start);
                tempAry.push(currentMarker.end);
                tempAry.push(currentMarker.getColorByIndex(colorIndex));
                markAry.push(tempAry);
            }
        }


        TrackAllMarkers = markAry;

        var allMarkers = [];
        for (var y = 0; y < currentSeq.markers.numMarkers; y++) {
            if (TrackAllMarkers[y][2] == colorIndex) {
                allMarkers.push(TrackAllMarkers[y]);
            }
        }

        var markerPostionT;
        for (var i = 0; i < allMarkers.length; i++)//עבור כל מארקר
        {
            var canPlace = false;
            markerPostionT = allMarkers[i][0];
            for (var x = 0; x < audioTracks.numTracks && !canPlace; x++)//עבור כל טראק
            {
                var currentTrackClips = audioTracks[x].clips;//קח את כל הקליפים בטראק
                canPlace = true;

                for (var z = 0; z < currentTrackClips.numTracks && canPlace; z++) //עובר כל קליפ
                {
                    var currentClip = currentTrackClips[z];
                    if (currentClip.start.seconds >= markerPostionT.seconds + duretion - offsetSec - 0.01 || currentClip.end.seconds <= markerPostionT.seconds - offsetSec + 0.01) // בדיקה אם הקליפ מפריע
                    {
                        canPlace = canPlace && true;
                        if (currentClip.start.seconds >= markerPostionT.seconds + duretion - offsetSec - 0.01)
                            break;
                    } // אם לא מפריע תשאיר שאפשר למקם
                    else {
                        canPlace = false; //אם מפריע לבטל שאפשר להשים וחזור ישר לטראק הבא
                        break
                    }
                }
                if (canPlace)
                    break; //אם אפשר אל תעבור לטראק הבא
            }
            if (canPlace) {
                var prefixTime = new Time();
                prefixTime.seconds = markerPostionT.seconds - offsetSec;
                audioTracks[x].overwriteClip(clipProj, prefixTime);
            }
            else {
                this.Alert(false, true, "all the tracks at [marker " + i + "] are full - unable to add the audio fx! please add new empty audio track!");
            }


        }



    },
    TextMaipulate: function (textFX,args,isKeyFrame,time) {
		var properties = textFX.properties;		
		var textItself = properties[0];
		var isNeedUpdate = false;
		
		if(args.LastKeyFrame == null)
			args.LastKeyFrame = false;

		var SourceText;//מקבל את המקור של הטקסט- בין אם זה מהמקור או לפי ההגדה של הארגס
		if(args.all)
		{
			SourceText = args.all;
			isNeedUpdate = true;
		}
		else
		 SourceText = textItself.getValue();
	 
		 if(args.text || args.tracking || args.getAll) //רק אם יש בכלל צורך בשינויים תמיר את האובייקט לJSON
		 {
			var mocaSourceText = SourceText.substring(4);
			var SourceElement = JSON.parse(mocaSourceText);
			if(args.getAll != null)
			{
				var mText = SourceElement.mTextParam.mStyleSheet.mText;
				var res=[];
				res[0] =  SourceText ;
				res[1]= mText;
				res[2] = SourceElement.mTextParam.mStyleSheet.mFontSize.mParamValues;//fontisize
				res[3] = SourceElement.mTextParam.mStyleSheet.mTracking.mParamValues; //va
				return res;
			}

			if(args.text != null)
			{
				var mText = SourceElement.mTextParam.mStyleSheet.mText;
				SourceText = SourceText.replace('"mText":"' + mText + '"', '"mText":"'+args.text+'"');
				isNeedUpdate = true;
			}
			if(args.tracking)
			{
				var mTracking = SourceElement.mTextParam.mStyleSheet.mTracking.mParamValues;
				SourceText = SourceText.replace('"mTracking":{"mParamValues":[[' + mTracking + ']]}', '"mTracking":{"mParamValues":[[0,'+args.tracking+']]}');
				isNeedUpdate = true;
			}
			//toDo baselineshift (if size 400 make it -150)
		 }
	    if(isNeedUpdate)
			textItself.setValue(SourceText,false);
		
		
		
						var position = properties[2];
						var scaleW = properties[3];
						var scaleH = properties[4];
						var scaleRation = properties[5];
						var rotation = properties[6];
						var opacity = properties[7];
						
						if(args.position != null)
							if(isKeyFrame)
							{
								position.setTimeVarying(true);
								position.addKey(time);
								position.setValueAtKey(time,args.position,args.LastKeyFrame);
							}
							else
							{position.setValue(args.position,args.LastKeyFrame)}
						
						if(args.scaleW != null)
							if(isKeyFrame)
							{
								scaleW.setTimeVarying(true);
								scaleW.addKey(time);
								scaleW.setValueAtKey(time,args.scaleW,args.LastKeyFrame);
							}
							else
							{scaleW.setValue(args.scaleW,args.LastKeyFrame)}
						
						if(args.scaleH != null)
							if(isKeyFrame)
							{
								scaleH.setTimeVarying(true);
								scaleH.addKey(time);
								scaleH.setValueAtKey(time,args.scaleH,args.LastKeyFrame);
							}
							else
							{scaleH.setValue(args.scaleH,args.LastKeyFrame)}
						
						if(args.scaleRation != null)
							if(isKeyFrame)
							{
								scaleRation.setTimeVarying(true);
								scaleRation.addKey(time);
								scaleRation.setValueAtKey(time,args.scaleRation,args.LastKeyFrame);
							}
							else
							{scaleRation.setValue(args.scaleRation,args.LastKeyFrame)}
						
						if(args.rotation != null)
							if(isKeyFrame)
							{
								rotation.setTimeVarying(true);
								rotation.addKey(time);
								rotation.setValueAtKey(time,args.rotation,args.LastKeyFrame);
							}
							else
							{rotation.setValue(args.rotation,args.LastKeyFrame)}
						
						if(args.opacity != null)
							if(isKeyFrame)
							{
								opacity.setTimeVarying(true);
								opacity.addKey(time);
								opacity.setValueAtKey(time,args.opacity,args.LastKeyFrame);
							}
							else
							{opacity.setValue(args.opacity,args.LastKeyFrame)}
    },
     TextSpaceing: function(easeType,isEaseOut,transitionTime,tracking,addiveTrack,rotation,rotateDirRTL,minimun)
	 {
		 
		rotation = rotation - minimun;
		 
	    var currentSeq = app.project.activeSequence;
        var timebase = currentSeq.timebase;
        var t = new Time();
        var slectedClips = this.GetAllSelectedClipsV();
        t.ticks = timebase;
		

	

        for (var i = 0; i < slectedClips.length; i++) {
			var currClip = slectedClips[i];
			var clipComponents = currClip.components;
			if(clipComponents.numItems > 3)
			{	
				var oneLetterFXCount = 0;
				var compareDesign = null;
				//עבור כל קליפ עם יותר מ3 אפקטים
		    	for(var z = 2; z < clipComponents.numItems ; z++)
				{
					 var currentFX = clipComponents[z];
					 if (currentFX.displayName == "Text") //זיהוי  / בדיקה של אפקט טקסט
					{
						var args = {};
						args.getAll = true;
						var baseDeisgn = this.TextMaipulate(currentFX,args,false,null); //לקיחת המשתנים של העיצוב / הטקסט עצמו
						var text = baseDeisgn[1];
						if(text[text.length-1] == " ")
							text = text.substr(0,text.length-1);
						
						if(text.length <= 1) //אם אורך הטקסט הוא 1 אז זה כנראה אפקט מפעם קודמת, במצב כזה אין צורך לבצע את כל האפקט
						{
							oneLetterFXCount++;
						}
						else //אם זה לא רק תו אחד נמשיך הלאה
						{
							
							//בדיקה של עברית ובמקרה וכן אז היפוך אותויות, בידקה עבור כל מילה
							var fixedText = "";
							var isHebrew = false;
							var isLastHebrew = false;
							var isLastHe = false;
							var words = (String)(text).split(" ");
							for(var b = 0; b < words.length; b++)
							{					
							var position = words[b].search(/[\u0590-\u05FF]/);
								if(position >= 0){
									isHebrew = true;
									var newText = "";
									for(var a = 1; a <= (String)(words[b]).length; a++)
										newText = (String)(newText) + (String)(words[b][words[b].length - a]) ;
									words[b] = newText;
								}
							
							if(isHebrew)
								{
									if(isLastHe)
									{
										isLastHe = false;
										fixedText = words[b] +  fixedText;
									}
									else
										fixedText = words[b] + " " +  fixedText;
									isLastHebrew = true;
								}
								else
								{
									if(isLastHebrew)
									{
										isLastHebrew = false;
										fixedText = fixedText + words[b];
									}
									else
										fixedText = fixedText + " " +  words[b];
									isLastHe = true;
								}
							
							}
							if(fixedText != null && fixedText != "")
							text = fixedText.substring(0, fixedText.length - 0); //במקרה שיש עברית בטקסט הגדר מחדש את המשתנה הרגיל
							if(text[text.length-1] == " ")
								text = text.substr(0,text.length-1);
							if(text[0] == " ")
								text = text.substr(1,text.length);
							
							
							var trackN = currClip.trackNum, clipN = currClip.clipNum; //לקיחת מיקום הקליפ ובאיזה שכבה הוא נמצא
							var clipTimeStart = currClip.inPoint.seconds,clipLength = currClip.duration.seconds;
							if(transitionTime > clipLength)
								transitionTime = clipLength;
							t.ticks = timebase;
							var keyframeRatio = t.seconds * 1;
							
							var letterrWidth = (String)(baseDeisgn[2][0]).split(",")[1] * 0.6 / currentSeq.frameSizeHorizontal; //לקיחת הגדרות לחישוב
							var lineHeight = (String)(baseDeisgn[2][0]).split(",")[1] / currentSeq.frameSizeVertical;
							var spacing = (String)(baseDeisgn[3][0]).split(",")[1] / 4 / currentSeq.frameSizeHorizontal + addiveTrack;
							var args = {};args.opacity = 0;
							this.TextMaipulate(currentFX,args,false,null); // שומר רפרנס לטקסט המקורי
							
							var NotRewriteMode = oneLetterFXCount < text.replace(" ","").length;
                            var ReWriteCounter = 0;
                            var ClearedText = text.replace(" ","");
							if(NotRewriteMode)
								this.AddEffect("Text",trackN,clipN);
							for(var cLetter = 0; cLetter < text.length; cLetter++)//עבור כל אות / אפקט שים עיצוב ותו מתאים
							{
								var charX = text[text.length-1-cLetter];
								if(charX != null && charX != "" && charX != " ") //אם האות הנוכחית מוגדרת
								{
                                    var newTextFX;
                                    if(!NotRewriteMode)
                                    {
                                        ReWriteCounter++;
                                        newTextFX = currClip.components[z - (ClearedText.length-ReWriteCounter) - 1]; // לוקח את האפקט הנוכחי לפי המיקום של האות
                                    }
                                    else
								    	newTextFX = currClip.components[z]; // לוקח את האפקט הנוכחי לפי המיקום של האות
									var args = {};
									args.all = baseDeisgn[0];
									args.text = charX;
									this.TextMaipulate(newTextFX,args,false);
									if(text.length > 1 && cLetter < text.length-1     &&   NotRewriteMode)
										this.AddEffect("Text",trackN,clipN);
								}
							}
							
							
							
							args = null;
							args = {}

							//עבור כל פריים בטווח האנימציה
							var dynamicTracking = tracking;
							var dynamicRotation = rotation;
							for (k = clipTimeStart; k <= transitionTime + clipTimeStart + keyframeRatio; k = k + keyframeRatio) 
							{
								var partTime;
								var prePartTime = Math.min((k-clipTimeStart)/(transitionTime),1);
								partTime = Math.abs(isEaseOut - prePartTime); 
								
								var presentPart;
								if(easeType == 0)
									presentPart = partTime;
								else
									presentPart = Math.abs(isEaseOut - Math.sqrt(1-Math.pow(partTime,easeType)));
								
								dynamicTracking = tracking * presentPart;
								dynamicRotation = rotation * presentPart / (text.length-1);
								
								t.seconds = k;
								var cLetter = 0;
								
								
								var letterPos = 0;
								for(var cLetter = 0; cLetter < text.length; cLetter++)
								{
									var charX = text[cLetter];
									if(charX != null && charX != "" && charX != " ")
									{
										
										
										var endPos;
										var multiAction = ((2*NotRewriteMode)-1);
										var newTextFX = currClip.components[z + letterPos * multiAction - !NotRewriteMode]; // לוקח את האפקט הנוכחי לפי המיקום של האות
										
										var wholeTextWidth = (text.length-2.2) * letterrWidth*1.0;
										var CurrentTWithoutSpacingPos = cLetter * letterrWidth*1.0;
										var centerPos = 0.5 - wholeTextWidth/2.0 + CurrentTWithoutSpacingPos;
										var additiveSpacing = dynamicTracking * ((cLetter+0.5)-text.length/2.0);
										var constSpacing = ((cLetter+0.5)-text.length/2.0)/3 * spacing;
										endPos = centerPos + additiveSpacing + constSpacing;

										args.position = [endPos,0.5 + lineHeight/3];
										
										
										var rotationMulty;
										if(rotateDirRTL)
											rotationMulty = cLetter + minimun / 180 - text.length;
										else
											rotationMulty = cLetter + minimun / 180;
										
										args.rotation = dynamicRotation * rotationMulty;
										
										if(k>transitionTime + clipTimeStart)
											args.LastKeyFrame = true;
										
									 
										this.TextMaipulate(newTextFX,args,true,t);//שומר את המיקום הגדרות לפריים הנוכחי
										letterPos++
									}
								}
								
								

							}
							
							break; //ברגע שסיים את הפעולה לאחר הזיהוי של האפקט טקסט הראשון תפסיק לבצע פעולות עבור כליפ זה
						}
					}
			   }
			}
		}	
    },

    //#region renew
    global: {frameTime:undefined,currentSeq:undefined,wiggleX:undefined, wiggleY:undefined},

    BaseApplyFX: function(callback)
    {
        this.GetClipFrameTime();
        var slectedClips = this.GetAllSelectedClipsV();
        if (slectedClips.length == 0)
            return this.Alert(true,true,"there is not selected clip, please select one and retry.");

         for (var i = 0; i < slectedClips.length; i++) 
        {
            callback.call(this,slectedClips[i]);
        }
    },

    GetClipFrameTime: function()
    {
        if(app.project == undefined)
        throw "1"
        if(app.project.activeSequence == undefined)
        throw "2"
        this.global.currentSeq = app.project.activeSequence;
        var timebase = this.global.currentSeq.timebase;
        var t = new Time();
        t.ticks = timebase;
        this.global.frameTime = t.seconds;

        return this.global.frameTime;
    },

    FxGetUserKeyframe: function(fxKeys, timefromClipStart)
    {
        var hashKey = Math.floor(timefromClipStart*120);
        var maxKey = fxKeys.max;
        if(hashKey > maxKey)
            hashKey = maxKey;
        return fxKeys[hashKey];
    },

    CameraMovement: function (multi, rate, horizental, vertical, isAuto, shutter) {
       this.BaseApplyFX(function(slectedClip){
            debugger;
            
            var tansformFX = this.GetEffectFromClip(slectedClip,"Transform","cameraMovement");
            var clipTimeStart = slectedClip.inPoint.seconds;
            var clipLength = slectedClip.duration.seconds;
            var properties = tansformFX.properties;
            var shutterSpeed = properties[10];
            shutterSpeed.setValue(shutter["0"], true);
            var scaleRatio = properties[2];
            scaleRatio.setValue(true,true);

            var scale = properties[3];
            this.ResetKeyframes(scale,true);
            var position = properties[1];
            this.ResetKeyframes(position,true);
            var t = new Time();
            for (var k = clipTimeStart; k < clipLength + clipTimeStart + this.global.frameTime; k = k + this.global.frameTime) 
            {
                 var timefromClipStart = k - clipTimeStart;
                 t.seconds = k;
                 position.addKey(t);
                scale.addKey(t);
            
                 var multiFrame =  this.FxGetUserKeyframe(multi,timefromClipStart)/100;
                 var verticalFrame =  this.FxGetUserKeyframe(vertical,timefromClipStart)/200;
                 var horizentalFrame =  this.FxGetUserKeyframe(horizental,timefromClipStart)/200;
                 var newPositionX =   0.5 + this.wiggle( rate["0"]/3, multiFrame * verticalFrame, t.seconds ,"x"); 
                 var newPositionY =   0.5 + this.wiggle( rate["0"]/3, multiFrame * horizentalFrame, t.seconds ,"y");
                 if(isNaN(newPositionX))
                 {
                     throw "sdfd";
                 }
                if(isAuto["0"] == 1)
                {
                    scale.setValueAtKey(t,(100 +  multiFrame * 1000 * (Math.max(Math.abs(0.5 - newPositionX), Math.abs(0.5 - newPositionY)))), k >= clipLength + clipTimeStart);
                }
                else
                {
                    scale.setValueAtKey(t,(100 + multiFrame * 100 * (Math.max(horizentalFrame, verticalFrame)*2)), k >= clipLength + clipTimeStart);
                }
                 position.setValueAtKey(t, [newPositionX, newPositionY], k >= clipLength + clipTimeStart);
            }
            this.global.wiggleX = undefined;
            this.global.wiggleY = undefined;
       });

    },

    BaseShake: function (multi, rate, horizental, vertical, isAuto, shutter) {
       this.BaseApplyFX(function(slectedClip){

            var tansformFX = this.GetEffectFromClip(slectedClip,"Transform","baseShake");
            var clipTimeStart = slectedClip.inPoint.seconds;
            var clipLength = slectedClip.duration.seconds;
            var properties = tansformFX.properties;
            var shutterSpeed = properties[10];
            shutterSpeed.setValue(shutter["0"], true);
            var scaleRatio = properties[2];
            scaleRatio.setValue(true,true);

            var scale = properties[3]; 
            this.ResetKeyframes(scale,true);
            var position = properties[1];
            this.ResetKeyframes(position,true);
            var t = new Time();
            for (var k = clipTimeStart; k < clipLength + clipTimeStart + this.global.frameTime * rate["0"]; k = k + this.global.frameTime * rate["0"]) 
            {
                 var timefromClipStart = k - clipTimeStart;
                 t.seconds = k;
                 position.addKey(t);
                 scale.addKey(t);

                 var multiFrame =  this.FxGetUserKeyframe(multi,timefromClipStart)/100;
                 var verticalFrame =  this.FxGetUserKeyframe(vertical,timefromClipStart)/200;
                 var horizentalFrame =  this.FxGetUserKeyframe(horizental,timefromClipStart)/200;
                 var x = this.rndRange(multiFrame * verticalFrame);
                 var y = this.rndRange(multiFrame * horizentalFrame);

                if(isAuto["0"] == 1)
                {
                    scale.setValueAtKey(t,(100 +  multiFrame * 1000 * (Math.max(Math.abs(0.5 - x), Math.abs(0.5 - y)))), k >= clipLength + clipTimeStart);
                }
                else
                {
                    scale.setValueAtKey(t,(100 + multiFrame * 100 * (Math.max(horizentalFrame, verticalFrame)*2)), k >= clipLength + clipTimeStart);
                }
                 position.setValueAtKey(t, [x,y],  k >= clipLength + clipTimeStart);
            }
            this.global.wiggleX = undefined;
            this.global.wiggleY = undefined;
       });
    },
    //#endregion


    SpinBlur: function(SpinAmount,blurLength,AutoCenter,func){
        if(func == null || func=="" || func == " ")
          func = "1";
        var currentSeq = app.project.activeSequence;
        var timebase = currentSeq.timebase;
        var t = new Time();
        var slectedClips = this.GetAllSelectedClipsV();
        t.ticks = timebase;
        var keyframeRatio = t.seconds;
        var subKeyframe = t.seconds / 2;
        for (var i = 0; i < slectedClips.length; i++) {
            var tansformFX = this.GetEffectFromClip(slectedClips[i],"Transform","SpinBlur");
            var clipTimeStart = slectedClips[i].inPoint.seconds;
            var clipLength = slectedClips[i].duration.seconds;
            

            var properties = tansformFX.properties;
            var shutterSpeed = properties[10];
            shutterSpeed.setValue(blurLength, true);

            var width = properties[4];
            width.setValue(100);

            var ancor = properties[0];
            var position = properties[1];
            if (AutoCenter == "true" && !ancor.isTimeVarying())
            {
                var ancorCal = ancor.getValue();
                var x = ancorCal[0];
                var y= ancorCal[1];
                position.setValue([x,y], true);
            }

            var rotation = properties[7];
            this.ResetKeyframes(rotation,true);
            for (var k = clipTimeStart; k < clipLength + clipTimeStart + keyframeRatio; k = k + keyframeRatio) 
            {
                t.seconds = k;
                rotation.addKey(t);
                rotation.setValueAtKey(t,0.0,k >= clipLength + clipTimeStart);

                if (AutoCenter == "true" && ancor.isTimeVarying() && false)//need a way to get value by time.
                {
                     var ancorCal = ancor.getValueAtKey(t)
                     var x = ancorCal[0];
                     var y= ancorCal[1];
                     position.setValueAtKey(t,[x,y],k >= clipLength + clipTimeStart);
                 }

                t.seconds = k + subKeyframe;
                rotation.addKey(t);
                
                var funcRatio = 1;
                var textEval = func.replace("{x}" , "("+ Number(k - clipTimeStart).toString() +")");
                funcRatio = eval(textEval);
                
                if(typeof funcRatio != 'number')
                    funcRatio = 1; //linear
                else
                    funcRatio = Math.max(0,Number(funcRatio));

                //this.Alert(false,true,funcRatio)

                rotation.setValueAtKey(t,SpinAmount * funcRatio,k >= clipLength + clipTimeStart);
            }
        }
        if (slectedClips.length == 0)
            this.Alert(true,true,"there is not selected clip, please select one and retry.");

        return true;

    },


    ZoomBlur: function(ZoomAmount,blurLength,AutoCenter,func){
        if(func == null || func=="" || func == " ")
          func = "1";
        var currentSeq = app.project.activeSequence;
        var timebase = currentSeq.timebase;
        var t = new Time();
        var slectedClips = this.GetAllSelectedClipsV();
        t.ticks = timebase;
        var keyframeRatio = t.seconds;
        var subKeyframe = t.seconds / 2;
        for (var i = 0; i < slectedClips.length; i++) {
            var tansformFX = this.GetEffectFromClip(slectedClips[i],"Transform","ZoomBlur");
            var clipTimeStart = slectedClips[i].inPoint.seconds;
            var clipLength = slectedClips[i].duration.seconds;
            

            var properties = tansformFX.properties;
            var shutterSpeed = properties[10];
            shutterSpeed.setValue(blurLength, true);

            var width = properties[4];
            width.setValue(100);

            var ancor = properties[0];
            var position = properties[1];
            if (AutoCenter == "true" && !ancor.isTimeVarying())
            {
                var ancorCal = ancor.getValue();
                var x = ancorCal[0];
                var y= ancorCal[1];
                position.setValue([x,y], true);
            }

            var scaleRatio = properties[2];
            scaleRatio.setValue(true,true);

            var scale = properties[3];
            this.ResetKeyframes(scale,true);
            for (var k = clipTimeStart; k < clipLength + clipTimeStart + keyframeRatio; k = k + keyframeRatio) 
            {
                t.seconds = k;
                scale.addKey(t);
                scale.setValueAtKey(t,100.0,k >= clipLength + clipTimeStart);

                if (AutoCenter == "true" && ancor.isTimeVarying() && false)//need a way to get value by time.
                {
                     var ancorCal = ancor.getValueAtKey(t)
                     var x = ancorCal[0];
                     var y= ancorCal[1];
                     position.setValueAtKey(t,[x,y],k >= clipLength + clipTimeStart);
                 }

                t.seconds = k + subKeyframe;
                scale.addKey(t);
                
                var funcRatio = 1;
                var textEval = func.replace("{x}" , "("+ Number(k - clipTimeStart).toString() +")");
                try{
                funcRatio = eval(textEval);
                }catch(e){this.Alert(true,true,"Faild to Calcultae ease function!:" + e);}
                
                if(typeof funcRatio != 'number')
                    funcRatio = 1; //linear
                else
                    funcRatio = Math.max(0,Number(funcRatio));

                //this.Alert(false,true,funcRatio)

                scale.setValueAtKey(t,ZoomAmount * funcRatio,k >= clipLength + clipTimeStart);
            }
        }
        if (slectedClips.length == 0)
            this.Alert(true,true,"there is not selected clip, please select one and retry.");

        return true;

    },


    GodRays: function(rayLength,BlurDetails,brightnessLevel,func){
        AutoCenter = true;
        if(func == null || func=="" || func == " ")
          func = "1";
        var currentSeq = app.project.activeSequence;
        var timebase = currentSeq.timebase;
        var t = new Time();
        var slectedClips = this.GetAllSelectedClipsV();
        t.ticks = timebase;
        var keyframeRatio = t.seconds;
        var subKeyframe = t.seconds / 2;
        for (var i = 0; i < slectedClips.length; i++) {
            var thisClip = slectedClips[i];
            var clipTrack = thisClip.trackNum;
            var timeStart = thisClip.start.seconds;
            if(currentSeq.videoTracks.numTracks < (clipTrack+2))
            {
                this.Alert(true,true,"Faild Creating FX for clip ["+thisClip.name+"], not enough tracks, please add new track above track " + (clipTrack+2));
                break;
            }
            var topTrack = currentSeq.videoTracks[clipTrack+1];
            var tracksClips = topTrack.clips;
            var canPlace = true, olderFX = null;
            for(var x=0;x<tracksClips.numItems;x++)
            {
                var cClip = tracksClips[x];
                if(cClip.start.seconds <= thisClip.end.seconds && cClip.end.seconds >= thisClip.start.seconds)
                {
                    if(cClip.name == thisClip.name && cClip.start.seconds == thisClip.start.seconds)
                    {
                         olderFX = cClip;
                         olderFX.trackNum = clipTrack+1;
                         olderFX.clipNum = x;
                         canPlace = true;
                         break;
                    }
                    canPlace = false;
                    break;
                }
            }
            if(!canPlace && olderFX==null)
            {
                this.Alert(true,true,"Faild Creating FX for clip ["+thisClip.name+"], the track above was not empty!, to make the FX you have to clear the above track At track " + (clipTrack+2));
                return;
            }
            var aboveClip;
            if(olderFX == null)
            {
                var preInsert = thisClip.projectItem;
                preInsert.setInPoint(thisClip.inPoint);
                preInsert.setOutPoint(thisClip.outPoint);
                preInsert.mediaType = "video";
                preInsert.setColorLabel(5);
                topTrack.overwriteClip(preInsert, thisClip.start);
                topTrack = currentSeq.videoTracks[clipTrack+1]; //reloads track items;
                tracksClips = topTrack.clips;
                
                x=0;
                for(var x=0;x<tracksClips.numItems;x++)
                {
                    var cClip = tracksClips[x];
                    if(cClip.start.seconds == timeStart)
                    {
                        aboveClip = cClip;
                        
                        aboveClip.trackNum = clipTrack+1;
                        aboveClip.clipNum = x;
                        break;
                    }
                }
            }
            else
              aboveClip = olderFX;

            var opacity = aboveClip.components[0];
            opacity.properties[1].setValue(22);

            var tansformFX = this.GetEffectFromClip(aboveClip,"Transform","GodRays");
            var clipTimeStart = thisClip.start.seconds;
            var clipLength = thisClip.duration.seconds;
            

            var properties = tansformFX.properties;
            var shutterSpeed = properties[10];
            shutterSpeed.setValue(BlurDetails, true);

            var width = properties[4];
            width.setValue(100);

            var ancor = properties[0];
            var position = properties[1];

                var ancorCal = ancor.getValue();
                var x = ancorCal[0];
                var y= ancorCal[1];
                position.setValue([x,y], true);

            var scaleRatio = properties[2];
            scaleRatio.setValue(true,true);

            var scale = properties[3];
            this.ResetKeyframes(scale,true);
            scale.setTimeVarying(true);
            for (var k = clipTimeStart; k < clipLength + clipTimeStart + keyframeRatio; k = k + keyframeRatio) 
            {
                

                t.seconds = k;
                scale.addKey(t);
                scale.setValueAtKey(t,100.0,k >= clipLength + clipTimeStart);

                if (AutoCenter == "true" && ancor.isTimeVarying() && false)//need a way to get value by time.
                {
                     var ancorCal = ancor.getValueAtKey(t)
                     var x = ancorCal[0];
                     var y= ancorCal[1];
                     position.setValueAtKey(t,[x,y],k >= clipLength + clipTimeStart);
                 }

                t.seconds = k + subKeyframe;
                scale.addKey(t);
                
                var funcRatio = 1;
                var textEval = func.replace("{x}" , "("+ Number(k - clipTimeStart).toString() +")");
                try{
                funcRatio = eval(textEval);
                }catch(e){this.Alert(true,true,"Faild to Calcultae ease function!:" + e);}
                
                if(typeof funcRatio != 'number')
                    funcRatio = 1; //linear
                else
                    funcRatio = Math.max(0,Number(funcRatio));

                scale.setValueAtKey(t,rayLength * funcRatio,k >= clipLength + clipTimeStart);
            }

            var procAmpFX = this.GetEffectFromClip(aboveClip,"ProcAmp","GodRays");
            procAmpFX.properties[0].setValue(brightnessLevel);
            procAmpFX.properties[1].setValue(100-brightnessLevel);

        }
        if (slectedClips.length == 0)
            this.Alert(true,true,"there is not selected clip, please select one and retry.");

        return true;

    },


    /////////////////////////////////////////////////////////////////////////////////////////////////End prodacut Functions END

    createDeepFolderStructure: function (foldersArray, maxDepth) {
        if (typeof foldersArray !== 'object' || foldersArray.length <= 0) {
            throw new Error('No valid folders array was provided!');
        }

        // if the first folder already exists, throw error
        for (var i = 0; i < app.project.rootItem.children.numItems; i++) {
            var curChild = app.project.rootItem.children[i];
            if (curChild.type === ProjectItemType.BIN && curChild.name === foldersArray[0]) {
                throw new Error('Folder with name "' + curChild.name + '" already exists!');
            }
        }

        // create the deep folder structure
        var currentBin = app.project.rootItem.createBin(foldersArray[0]);
        for (var m = 1; m < foldersArray.length && m < maxDepth; i++) {
            currentBin = currentBin.createBin(foldersArray[i]);
        }
    },

    getVersionInfo: function () {
        return 'PPro ' + app.version + 'x' + app.build;
    },

    getUserName: function () {
        var homeDir = new File('~/');
        var userName = homeDir.displayName;
        homeDir.close();
        return userName;
    },

    keepPanelLoaded: function () {
        app.setExtensionPersistent("com.adobe.PProPanel", 0); // 0, while testing (to enable rapid reload); 1 for "Never unload me, even when not visible."
    },

    getSep: function () {
        if (Folder.fs == 'Macintosh') {
            return '/';
        } else {
            return '\\';
        }
    },

    saveProject: function () {
        app.project.save();
    },

    exportCurrentFrameAsPNG: function () {
        app.enableQE();
        var activeSequence = qe.project.getActiveSequence(); 	// note: make sure a sequence is active in PPro UI
        if (activeSequence) {
            // Create a file name based on timecode of frame.
            var time = activeSequence.CTI.timecode; 	// CTI = Current Time Indicator.
            var removeThese = /:|;/ig;    // Why? Because Windows chokes on colons.
            var safeTimeStr = time.replace(removeThese, '_');
            var outputPath = new File("~/Desktop");
            var outputFileName = outputPath.fsName + $._PPP_.getSep() + safeTimeStr + '___' + activeSequence.name;
            activeSequence.exportFramePNG(time, outputFileName);
        } else {
        }
    },



    createSequence: function (name) {
        var someID = "xyz123";
        var seqName = prompt('Name of sequence?', '<<<default>>>', 'Sequence Naming Prompt');
        app.project.createNewSequence(seqName, someID);
    },

    createSequenceFromPreset: function (presetPath) {
        app.enableQE();
        var seqName = prompt('Name of sequence?', '<<<default>>>', 'Sequence Naming Prompt');
        if (seqName) {
            qe.project.newSequence(seqName, presetPath);
        }
    },

};


//$._PPP_.CameraMovement({"158":0,"160":0.46707895491869555,"162":0.7602209828323749,"164":1.0247973161561845,"166":1.2746011766838778,"168":1.51497616351387,"170":1.7486620165059181,"172":1.9772858123061219,"174":2.201907396531606,"176":2.4232627500788135,"178":2.6418876029377185,"180":2.8581862915544787,"182":3.072472873538248,"184":3.284997048226451,"186":3.49596122925143,"188":3.7055322021394685,"190":3.9138493287737988,"192":4.121030472130349,"194":4.327176370717768,"196":4.532373931406532,"198":4.7366987505576255,"200":4.940217073590911,"202":5.142987338683169,"204":5.345061407620502,"206":5.546485557962399,"208":5.747301290756138,"210":5.947545994050664,"212":6.147253492474605,"214":6.346454505911677,"216":6.545177034998526,"218":6.743446687225212,"220":6.941286954453121,"222":7.138719450412584,"224":7.335764115014479,"226":7.532439390972287,"228":7.728762377186707,"230":7.9247489625231005,"232":8.120413942960145,"234":8.315771124567991,"236":8.510833414355837,"238":8.705612900690797,"240":8.900120924714718,"242":9.09436814396061,"244":9.288364589185296,"246":9.482119715281936,"248":9.675642447009134,"250":9.868941220167322,"252":10.062024018764513,"254":10.254898408638788,"256":10.447571567941866,"258":10.64005031483471,"260":10.832341132700778,"262":11.024450193143473,"264":11.21638337700145,"266":11.408146293586768,"268":11.599744298326208,"270":11.791182508964978,"272":11.982465820473568,"274":12.1735989187825,"276":12.364586293455783,"278":12.555432249401797,"280":12.746140917709518,"282":12.936716265688815,"284":13.127162106185262,"286":13.317482106232589,"288":13.507679795099662,"290":13.697758571783046,"292":13.88772171199133,"294":14.077572374662799,"296":14.267313608054197,"298":14.456948355434731,"300":14.646479460416218,"302":14.835909671947608,"304":15.025241648999492,"306":15.214477964961882,"308":15.4036211117767,"310":15.59267350382422,"312":15.78163748158152,"314":15.970515315069003,"316":16.159309207100137,"318":16.348021296347998,"320":16.536653660241303,"322":16.725208317701483,"324":16.91368723173156,"326":17.102092311866564,"328":17.290425416494678,"330":17.478688355057514,"332":17.666882890137167,"334":17.855010739437425,"336":18.04307357766559,"338":18.231073038321274,"340":18.419010715397768,"342":18.606888165001372,"344":18.794706906893605,"346":18.982468425960995,"348":19.170174173616537,"350":19.357825569137095,"352":19.545424000940187,"354":19.732970827803918,"356":19.92046738003304,"358":20.107914960574426,"360":20.29531484608468,"362":20.482668287952468,"364":20.6699765132783,"366":20.857240725813888,"368":21.04446210686339,"370":21.23164181614854,"372":21.418780992639718,"374":21.60588075535461,"376":21.792942204126348,"378":21.979966420342627,"380":22.166954467657405,"382":22.353907392676557,"384":22.540826225618876,"386":22.72771198095372,"388":22.91456565801648,"390":23.10138824160302,"392":23.288180702544185,"394":23.474943998261406,"396":23.661679073304438,"398":23.848386859871937,"400":24.035068278316093,"402":24.221724237631765,"404":24.408355635931347,"406":24.594963360905677,"408":24.78154829027202,"410":24.9681112922097,"412":25.154653225784035,"414":25.34117494135918,"416":25.527677281000564,"418":25.714161078867363,"420":25.900627161595693,"422":26.08707634867293,"424":26.273509452803737,"426":26.45992728026825,"428":26.646330631272946,"430":26.832720300294522,"432":27.019097076417314,"434":27.205461743664756,"436":27.391815081325003,"438":27.57815786427147,"440":27.76449086327836,"442":27.95081484533179,"444":28.137130573936684,"446":28.32343880941993,"448":28.509740309230036,"450":28.696035828233732,"452":28.882326119009743,"454":29.068611932140108,"456":29.254894016499378,"458":29.441173119541943,"460":29.62744998758792,"462":29.81372536610773,"464":30.00000000000589,"466":30.186274633904016,"468":30.372550012423837,"470":30.55882688046981,"472":30.745105983512392,"474":30.931388067871648,"476":31.11767388100201,"478":31.303964171778027,"480":31.49025969078171,"482":31.676561190591826,"484":31.86286942607506,"486":32.04918515467995,"488":32.235509136733384,"490":32.421842135740285,"492":32.608184918686746,"494":32.79453825634699,"496":32.98090292359442,"498":33.167279699717234,"500":33.3536693687388,"502":33.5400727197435,"504":33.72649054720802,"506":33.912923651338836,"508":34.09937283841606,"510":34.285838921144396,"512":34.472322719011196,"514":34.65882505865258,"516":34.84534677422773,"518":35.03188870780206,"520":35.218451709739746,"522":35.40503663910609,"524":35.591644364080416,"526":35.778275762380005,"528":35.964931721695685,"530":36.15161314013983,"532":36.33832092670733,"534":36.525056001750364,"536":36.7118192974676,"538":36.89861175840875,"540":37.08543434199529,"542":37.27228801905806,"544":37.459173774392895,"546":37.64609260733523,"548":37.83304553235437,"550":38.02003357966917,"552":38.20705779588545,"554":38.39411924465718,"556":38.58121900737207,"558":38.768358183863256,"560":38.9555378931484,"562":39.14275927419791,"564":39.3300234867335,"566":39.517331712059345,"568":39.704685153927116,"570":39.89208503943738,"572":40.07953261997878,"574":40.267029172207906,"576":40.45457599907163,"578":40.642174430874725,"580":40.82982582639528,"582":41.01753157405083,"584":41.20529309311824,"586":41.39311183501048,"588":41.58098928461407,"590":41.76892696169056,"592":41.956926422346264,"594":42.14498926057443,"596":42.33311710987469,"598":42.52131164495435,"600":42.70957458351719,"602":42.89790768814532,"604":43.08631276828031,"606":43.27479168231041,"608":43.46334633977059,"610":43.6519787036639,"612":43.84069079291175,"614":44.0294846849429,"616":44.218362518430396,"618":44.407326496187686,"620":44.59637888823523,"622":44.78552203505004,"624":44.97475835101243,"626":45.16409032806432,"628":45.35352053959573,"630":45.54305164457721,"632":45.73268639195776,"634":45.922427625349165,"636":46.11227828802063,"638":46.30224142822892,"640":46.492320204912325,"642":46.68251789377941,"644":46.87283789382675,"646":47.06328373432319,"648":47.2538590823025,"650":47.44456775061022,"652":47.63541370655625,"654":47.82640108122954,"656":48.01753417953849,"658":48.208817491047085,"660":48.40025570168586,"662":48.59185370642532,"664":48.783616623010644,"666":48.975549806868635,"668":49.167658867311324,"670":49.35994968517742,"672":49.55242843207028,"674":49.74510159137336,"676":49.93797598124765,"678":50.13105877984485,"680":50.32435755300306,"682":50.517880284730275,"684":50.711635410826915,"686":50.90563185605162,"688":51.09987907529754,"690":51.29438709932148,"692":51.48916658565646,"694":51.68422887544431,"696":51.87958605705219,"698":52.07525103748925,"700":52.271237622825666,"702":52.46756060904013,"704":52.66423588499794,"706":52.861280549599876,"708":53.058713045559365,"710":53.2565533127873,"712":53.45482296501401,"714":53.653545494100904,"716":53.852746507538,"718":54.05245400596199,"720":54.25269870925655,"722":54.45351444205032,"724":54.65493859239227,"726":54.85701266132965,"728":55.05978292642196,"730":55.26330124945528,"732":55.467626068606435,"734":55.67282362929526,"736":55.87896952788275,"738":56.086150671239366,"740":56.29446779787377,"742":56.50403877076191,"744":56.71500295178698,"746":56.92752712647529,"748":57.14181370845917,"750":57.35811239707607,"752":57.576737249935135,"754":57.79809260348254,"756":58.02271418770825,"758":58.25133798350874,"760":58.485023836501156,"762":58.725398823331645,"764":58.97520268386008,"766":59.239779017185214,"768":59.53292104511328,"770":60,"772":60,"max":772},{"0":50,"max":0},{"0":100,"max":0},{"0":100,"max":0},{"0":0,"max":0},{"0":180,"max":0})



function ObjToString(str, count) {
    return ToString(str, count);
}

function getMethods(obj)
{
    var res = [];
    for(var m in obj) {
        if(typeof obj[m] == "function") {
            res.push(m)
        }
    }
    return res;
}

function ToString(str, count) {
    if (str === undefined || str == null)
        str = "[??]";

    var output = "";
    var addtive = 6;
    if (count === undefined || count === null)
        var count = addtive - 1;
    var spacing = "";
    for (var z = 0; z < count; z++)
        spacing = spacing + " ";



    var forCount = 0;
    for (var property in str) {
        if (property == null || property.toString() == "" || property.toString() == " ")
            property = "[?]";

        forCount++;
        var valueStr = ToString(str[property], count + addtive);
        if (valueStr.split("\n").length <= 1)
            output += spacing + property + ": '" + valueStr + "';\n";
        else {
            var propertiesArray = "";
            if (property == "properties") {
                var currentI = 0;
                while (currentI < str[property].numItems) {
                    var comPar = str[property][currentI];
                    var comParName = comPar.displayName;
                    if (comParName == "Source Text") {

                        var realvalue = comPar.getValue().substring(4);

                        propertiesArray += "    -Arr[" + currentI + "] ~ [Source Text]" + ToString(JSON.parse(realvalue), count + addtive) + "\n\n"
                    }
                    else {
                        var comParValue = comPar.getValue().toString();
                        if (comParName === undefined || comParName == null || comParName == " " || comParName == "  ")
                            comParName = "[?]";
                        propertiesArray += spacing + "    -Arr[" + currentI + "]: " + comParName + "-'" + comParValue + "';\n";
                    }
                    currentI++;
                }
            }
            output += spacing + property + ":\n" + spacing + "{\n" + spacing + valueStr + propertiesArray + spacing + "}\n";

        }

    }
    if (forCount <= 1)
        output = str.toString();


    return output;

}



function perlin()
{
    this.rand_vect = function(){
        var theta = Math.random() * 2 * Math.PI;
        return {x: Math.cos(theta), y: Math.sin(theta)};
    };
    this.dot_prod_grid = function(x, y, vx, vy){
        var g_vect;
        var d_vect = {x: x - vx, y: y - vy};
        if (this.gradients[[vx,vy]]){
            g_vect = this.gradients[[vx,vy]];
        } else {
            g_vect = this.rand_vect();
            this.gradients[[vx, vy]] = g_vect;
        }
        return d_vect.x * g_vect.x + d_vect.y * g_vect.y;
    };
    this.smootherstep = function(x){
        return 6*Math.pow(x,5) - 15*Math.pow(x,4) + 10*Math.pow(x,3);
    };
    this.interp = function(x, a, b){
        return a + this.smootherstep(x) * (b-a);
    };
    this.seed = function(){
        this.gradients = {};
    };
    this.get = function(x, y) {
        var xf = Math.floor(x);
        var yf = Math.floor(y);
        //interpolate
        var tl = this.dot_prod_grid(x, y, xf,   yf);
        var tr = this.dot_prod_grid(x, y, xf+1, yf);
        var bl = this.dot_prod_grid(x, y, xf,   yf+1);
        var br = this.dot_prod_grid(x, y, xf+1, yf+1);
        var xt = this.interp(x-xf, tl, tr);
        var xb = this.interp(x-xf, bl, br);
        return this.interp(y-yf, xt, xb);
    };
    this.seed();
};

'use strict';
perlin2 = {
    rand_vect: function(){
        var theta = Math.random() * 2 * Math.PI;
        return {x: Math.cos(theta), y: Math.sin(theta)};
    },
    dot_prod_grid: function(x, y, vx, vy){
        var g_vect;
        var d_vect = {x: x - vx, y: y - vy};
        if (this.gradients[[vx,vy]]){
            g_vect = this.gradients[[vx,vy]];
        } else {
            g_vect = this.rand_vect();
            this.gradients[[vx, vy]] = g_vect;
        }
        return d_vect.x * g_vect.x + d_vect.y * g_vect.y;
    },
    smootherstep: function(x){
        return 6*Math.pow(x,5) - 15*Math.pow(x,4) + 10*Math.pow(x,3);
    },
    interp: function(x, a, b){
        return a + this.smootherstep(x) * (b-a);
    },
    seed: function(){
        this.gradients = {};
    },
    get: function(x, y) {
        var xf = Math.floor(x);
        var yf = Math.floor(y);
        //interpolate
        var tl = this.dot_prod_grid(x, y, xf,   yf);
        var tr = this.dot_prod_grid(x, y, xf+1, yf);
        var bl = this.dot_prod_grid(x, y, xf,   yf+1);
        var br = this.dot_prod_grid(x, y, xf+1, yf+1);
        var xt = this.interp(x-xf, tl, tr);
        var xb = this.interp(x-xf, bl, br);
        return this.interp(y-yf, xt, xb);
    }
};
perlin2.seed();


function NoiseSeed()
{
    'use strict';
var tSeed = {
    rand_vect: function(){
        var theta = Math.random() * 2 * Math.PI;
        return {x: Math.cos(theta), y: Math.sin(theta)};
    },
    dot_prod_grid: function(x, y, vx, vy){
        var g_vect;
        var d_vect = {x: x - vx, y: y - vy};
        if (this.gradients[[vx,vy]]){
            g_vect = this.gradients[[vx,vy]];
        } else {
            g_vect = this.rand_vect();
            this.gradients[[vx, vy]] = g_vect;
        }
        return d_vect.x * g_vect.x + d_vect.y * g_vect.y;
    },
    smootherstep: function(x){
        return 6*Math.pow(x,5) - 15*Math.pow(x,4) + 10*Math.pow(x,3);
    },
    interp: function(x, a, b){
        return a + this.smootherstep(x) * (b-a);
    },
    seed: function(){
        this.gradients = {};
    },
    get: function(x, y) {
        var xf = Math.floor(x);
        var yf = Math.floor(y);
        //interpolate
        var tl = this.dot_prod_grid(x, y, xf,   yf);
        var tr = this.dot_prod_grid(x, y, xf+1, yf);
        var bl = this.dot_prod_grid(x, y, xf,   yf+1);
        var br = this.dot_prod_grid(x, y, xf+1, yf+1);
        var xt = this.interp(x-xf, tl, tr);
        var xb = this.interp(x-xf, bl, br);
        return this.interp(y-yf, xt, xb);
    }
};
tSeed.seed();
return tSeed;
}
