var externalObjectName = "PlugPlugExternalObject";
var mylib = new ExternalObject("lib:" + externalObjectName);

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
    AddFXDataTrack: null,
    AddFXDataPosit: null,
    AddFXDataOldPos: null,
    AutoCutBin: null,
    global: { frameTime: undefined, currentSeq: undefined, wiggleX: undefined, wiggleY: undefined },


    //#region helper functions
    autoCut_started: false,
    autoCut_currentClip: null,
    autoCut_currentClip_io: null,
    autoCut_progress: null,

    /**
     * 
     * @param {[{start_at: Number,end_at: Number}]} cutArr 
     */
    SilenceCut: function (cutArr) {
        try {
            this.autoCut_progress = true;
            var eventObj = new CSXSEvent();
            eventObj.type = "SilenceCut";
            function UpdatePanel(cutMade) {
                if (cutMade == undefined)
                    cutMade = ""
                eventObj.data = cutMade.toString();
                eventObj.dispatch();
            }

            //get the first clip selected from the right
            /** @type {{clip: TrackItem,track: Track,clipPos: Number, trackNum: Number}} */
            var clip_n_track = this.getSelectedClip_n_Track(true);



            var silenceCut_name = "unfocus = stop SilenceCut";

            //create new seq to hide real one prevent mass update of GUI, making it MUCH faster
            app.project.createNewSequenceFromClips(silenceCut_name, app.project.rootItem.children[0], app.project.rootItem);
            /**@type {Sequence} */
            var tempSeq = app.project.activeSequence;
            //tempSeq.audioTracks[0].clips[0].remove(false, false);

            var clip_links = tempSeq.videoTracks[0].clips[0].getLinkedItems();
            var index = 0;
            while (clip_links.numItems > 1) { //while there is MORE then 1 linked item (eg. video & audio)
                if (clip_links[index].mediaType != "Video") //Delete anything that is not the video as its disassemble the link
                    clip_links[index].remove(false, false);
                else
                    index++;
            }



            for (var i = 0; i < cutArr.length && this.autoCut_progress; i++) {
                var current_cut = cutArr[i];


                /** @type {{ state: String, nextClip_index: Number} || String} */
                var cut_res = this.CutAt(current_cut, clip_n_track)


                UpdatePanel(cut_res.state || cut_res); //output state or error if any

                //update next item
                clip_n_track.clipPos = cut_res.nextClip_index;
                clip_n_track.clip = clip_n_track.track.clips[clip_n_track.clipPos]

                //clear memory after each 10 cuts
                if (i % 10 == 0)
                    $.gc();

                if (i % 4) {
                    var activeSeq = app.project.activeSequence;
                    if (!activeSeq || activeSeq.name != silenceCut_name) {
                        this.autoCut_progress = false
                    }

                }
            }

            app.project.deleteSequence(tempSeq)
            this.autoCut_progress = false;

        } catch (e) {
            delete e.source
            return ToString(e, 2)
        }
    },

    /**
     * 
     * @param {{start_at: Number,end_at: Number}} at 
     * @param {{clip: TrackItem,track: Track,clip_index: Number}} clip_n_track
     */
    CutAt: function (at, clip_n_track) {
        try {
            if (at.start_at >= at.end_at)
                return new Error("wrong timing")

            //get args for easer r/w
            /** @type {TrackItem} */
            var clip = clip_n_track.clip;
            var track = clip_n_track.track;
            var clip_index = clip_n_track.clipPos



            if (!clip)
                return new Error("noClip");

            if (clip.inPoint.seconds > at.end_at || clip.outPoint.seconds < at.start_at) {//if cut range in outside of clip in/out
                const resObj = new Error("no cut needed");
                resObj.nextClip_index = clip_index + 1;
                return resObj;
            }

            //splits the clip upto 2 times if succeed for each cut returns true 

            var clipIO = { "in": clip.inPoint.seconds, out: clip.outPoint.seconds }

            var firstCut = this.split(clip, track, at.start_at, clipIO);
            var secondCut = this.split(clip, track, at.end_at, clipIO);

            // calc the new index clip of the removable cut.
            var removable_clip_index = clip_index + (firstCut || secondCut); //if it did make a cut the removable will be the next index in track
            if (secondCut && !firstCut) {// if did a cut at the end but not at start - e.g. when clip starts with a silence cut
                removable_clip_index = clip_index; //set the clip to remove the current(first clip)
            }

            var removable_clip = track.clips[removable_clip_index];
            //gets all linked audio / video for removable clip
            var removable_clip_audio = removable_clip.getLinkedItems();
            var index = 0;
            while (removable_clip_audio.numItems > 1) { //while there is MORE then 1 linked item (eg. video & audio)
                if (removable_clip_audio[index].mediaType != "Video") //Delete anything that is not the video as its disassemble the link
                    removable_clip_audio[index].remove(false, false);
                else
                    index++;
            }
            removable_clip.remove(true, false); // delete the video at last

            return { state: "GOOD", nextClip_index: removable_clip_index };
        } catch (e) {
            delete e.source
            return ToString(e, 2)
        }
    },

    /**
     * splits a clip at a point
     * @param {TrackItem} clip 
     * @param {Track} track 
     * @param {Number} at 
     * @return {Boolean} whatever it did split or not
    */
    split: function (clip, track, at, clipIO) {
        if (at <= clipIO.in || at >= clipIO.out) //if at position is outside of clip i/o there is no need in split
            return false;

        /**@type{ProjectItem} */
        var clip_origin = clip.projectItem;

        //sets the new in part for the new TrackItem that will be generated
        var new_in_time = new Time().seconds = at;
        clip_origin.setInPoint(new_in_time, 4);

        //create cut
        var insert_time = new Time().seconds = at - clipIO.in + clip.start.seconds;

        track.overwriteClip(clip_origin, insert_time)

        return true;
    },

    getSelectedClip_n_Track: function () {
        var currentSeq = app.project.activeSequence
        var numTracks = currentSeq.videoTracks.numTracks;
        for (var videoTrackIndex = 0; videoTrackIndex < numTracks; videoTrackIndex++) {
            var cVideoTrack = currentSeq.videoTracks[videoTrackIndex];

            var clipCount = cVideoTrack.clips.numItems;
            for (var i = 0; i < clipCount; i++) {
                var clipPos = clipCount - i - 1;
                var cClip = cVideoTrack.clips[clipPos]
                if (cClip.isSelected()) {
                    return {
                        clip: cClip,
                        track: currentSeq.videoTracks[videoTrackIndex],
                        trackNum: videoTrackIndex,
                        clipPos: clipPos
                    }
                }
            }
        }
        return {};
    },

    AutoCut_start: function () {
        var clip_n_track = this.getSelectedClip_n_Track();
        /** @type {TrackItem} */
        var clip = clip_n_track.clip;
        /** @type {Track}*/
        var track = clip_n_track.track;
        /** @type {Number}*/
        var clip_index = clip_n_track.clipPos

        //removing audio lines to prevent duplicates of audio tracks => prevents ripple delete
        var clip_links = clip.getLinkedItems();
        var index = 0;
        while (clip_links.numItems > 1) { //while there is MORE then 1 linked item (eg. video & audio)
            if (clip_links[index].mediaType != "Video") //Delete anything that is not the video as its disassemble the link
                clip_links[index].remove(false, false);
            else
                index++;
        }

        var clip_origin = clip.projectItem;
        clip_origin.setColorLabel(2)
        this.autoCut_currentClip = clip_origin;
        this.autoCut_currentClip_io = { inP: clip_origin.getInPoint(), outP: clip_origin.getOutPoint() }//get for later restoration

        clip_origin.setInPoint(clip.inPoint, 4);
        clip_origin.setOutPoint(clip.outPoint, 4);
        var start = clip.start;
        clip.remove(false, false)
        track.overwriteClip(clip_origin, start); //replaces the clip but now the audio will be at the correct audio track(s)
        track.clips[clip_index].setSelected(true, true);
    },

    AutoCut_end: function () {
        try {
            this.autoCut_started = false;
            this.autoCut_currentClip.clearOutPoint()
            this.autoCut_currentClip.clearInPoint()
            this.autoCut_currentClip = null;
            this.autoCut_currentClip_io = null;
        }
        catch (e) {
            delete e.source
            return ToString(e, 2)
        }
    },

    getSelectedClipPath: function () {
        var clip = this.getSelectedClip_n_Track().clip;
        if (!clip)
            return new Error("noClip")
        return clip.projectItem.getMediaPath();
    },
    getClipMetaData: function () {
        try {
            var clip = this.getSelectedClip_n_Track().clip;
            if (!clip)
                return new Error("noClip")
            return clip.projectItem.getProjectColumnsMetadata();
        } catch (e) {
            delete e.source
            return ToString(e, 2)
        }
    },

    getSelectedClipInOut: function () {
        try {
            var track_n_clip = this.getSelectedClip_n_Track();
            /** @type {TrackItem} */
            var clip = track_n_clip.clip;
            if (!clip)
                return new Error("noClip")
            return '{"in":xx,"out":yy}'.replace("xx", clip.inPoint.seconds).replace("yy", clip.outPoint.seconds)
        } catch (e) {
            delete e.source
            return ToString(e, 2)
        }
    },

    AddEffect: function (effctName, track, position, times, fromSeq) {
        try {
            var openedSeqID = app.project.activeSequence.sequenceID;
            if (fromSeq)
                app.project.openSequence(fromSeq.sequenceID);

            app.enableQE();
            var seq = qe.project.getActiveSequence();

            if (fromSeq)
                app.project.openSequence(openedSeqID);

            var videoTrack
            if (effctName == "Pitch Shifter")
                videoTrack = seq.getAudioTrackAt(track);
            else
                videoTrack = seq.getVideoTrackAt(track);


            var CountClips = 0;
            var clipToAdd;

            for (var i = 0; i < videoTrack.numItems; i++) {

                var TrackItem = videoTrack.getItemAt(i);
                if (TrackItem.type == 'Clip') {
                    if (CountClips == position) { clipToAdd = TrackItem; break; }
                    else
                        CountClips++;
                }
            }
            if (clipToAdd == undefined)
                return "could not find clip at position";


            var getFx, addFx;
            if (effctName == "Pitch Shifter") {
                getFx = qe.project.getAudioEffectByName;
                addFx = clipToAdd.addAudioEffect;
            }
            else {
                getFx = qe.project.getVideoEffectByName;
                addFx = clipToAdd.addVideoEffect;
            }


            var fx;
            if (effctName == "Pitch Shifter")
                fx = qe.project.getAudioEffectByName(effctName);
            else
                fx = qe.project.getVideoEffectByName(effctName);

            if (effctName == "Pitch Shifter") {
                getFx = qe.project.getAudioEffectByName;
                addFx = clipToAdd.addAudioEffect;
            }
            else {
                getFx = qe.project.getVideoEffectByName;
                addFx = clipToAdd.addVideoEffect;
            }

            if (times == null || times == undefined)
                times = 1;
            for (var x = 0; x < times; x++) {
                if (effctName == "Pitch Shifter")
                    clipToAdd.addAudioEffect(fx, false);
                else
                    clipToAdd.addVideoEffect(fx, false);
            }


        } catch (err) {
            delete err.source
            throw ToString(err, 2)
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
    GetAllSelectedClipsV: function (useAudio) {
        var seq = this.global.currentSeq;

        var clipArray = [];

        var tracks;
        if (useAudio == true)
            tracks = seq.audioTracks;
        else
            tracks = seq.videoTracks;

        for (var s = 0; s < tracks.numTracks; s++) {
            var firstVideoTrack = tracks[s];

            for (var i = 0; i < firstVideoTrack.clips.numItems; i++) {
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

        folderObj = this.VerifyBin("OlympicHelper Files");
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
    VerifyBin: function (name) {
        var folderSearch = app.project.rootItem;
        var rootFiles = folderSearch.children;

        var folderExt = false;
        var folderObj;
        for (var t = 0; t < rootFiles.numItems; t++) {
            var curFile = rootFiles[t];
            if (curFile.type == 2)
                if (curFile.name == name) {
                    folderObj = curFile;
                    folderExt = true;
                    break;
                }
        }
        if (!folderExt) {
            app.project.rootItem.createBin(name);
            folderSearch = app.project.rootItem;
            rootFiles = folderSearch.children;
            for (var t = 0; t < rootFiles.numItems; t++) {
                var curFile = rootFiles[t];
                if (curFile.type == 2)
                    if (curFile.name == name) {
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
    wiggle: function (freq, amp, t, type) {
        freq = freq / 10;
        amp = amp;

        if (this.global.wiggleX == undefined)
            this.global.wiggleX = new perlin();

        if (this.global.wiggleY == undefined)
            this.global.wiggleY = new perlin();

        if (this.global.wiggleR == undefined)
            this.global.wiggleR = new perlin();

        if (type == "x" || type == "X")
            return this.global.wiggleX.get(t * freq, 4) * amp;
        else if (type == "y" || type == "Y")
            return this.global.wiggleY.get(t * freq, 4) * amp;
        else if (type == "r" || type == "R")
            return this.global.wiggleR.get(t * freq, 4) * amp;

    },
    IsCustomFX: function (Effect, customFX) {
        var fxName = Effect.displayName;
        var properties = Effect.properties;
        switch (fxName) {
            case "Opacity":
                return true;
            case "Motion":
                return true;

            case "Luma Key":
                var cutoff = Math.floor(10000 * properties[1].getValue()) / 10000;
                if (customFX == "glow" && cutoff == 10.0001)
                    return true;
                break;
            case "Gaussian Blur":
                return properties[2].isTimeVarying();
                break;
            case "Brightness & Contrast":
                var Brightness = Math.floor(100 * properties[0].getValue()) / 100;
                if (customFX == "glow" && Brightness == -0.01)
                    return true;
                if (customFX == "glow2" && Brightness == -0.02)
                    return true;
                break;
            case "Transform":
                var skew = Math.floor(10000 * properties[4].getValue()) / 10000;
                var axis = Math.floor(10000 * properties[5].getValue()) / 10000;
                var opacity = Math.floor(10000 * properties[6].getValue()) / 10000;
                if (customFX == "cameraMovement" && (skew == 0.0007 || axis == 0.0007 || opacity == 99.9997))
                    return true;
                if (customFX == "baseShake" && (skew == 0.0006 || axis == 0.0006 || opacity == 99.9996))
                    return true;
                if (customFX == "SpinBlur" && (skew == 0.0005 || axis == 0.0005 || opacity == 99.9995))
                    return true;
                if (customFX == "ZoomBlur" && (skew == 0.0004 || axis == 0.0004 || opacity == 99.9994))
                    return true;
                if (customFX == "GodRays" && (skew == 0.0008 || axis == 0.0008 || opacity == 99.9998))
                    return true;
                break;
            case "ProcAmp":
                var Split = Math.floor(10000 * properties[5].getValue()) / 10000;
                if (customFX == "glow" && Split == 50.0001)
                    return true;
                break;

            case "Pitch Shifter":
                return true;
            default:
                return false;
        }
        return false;
    },
    SetCustomFX: function (Effect, customFX) {
        switch (Effect.displayName) {
            case "Luma Key":
                switch (customFX) {
                    case "glow":
                        var properties = Effect.properties;
                        properties[0].setValue(15);
                        properties[1].setValue(10.0001);
                        break;
                    default:
                        break;
                }
                break;
            case "Gaussian Blur":
                switch (customFX) {
                    case "glow":
                        var properties = Effect.properties;
                        properties[2].setTimeVarying(true);
                        break;
                    default:
                        break;
                }
                break;
            case "Brightness & Contrast":
                switch (customFX) {
                    case "glow":
                        var properties = Effect.properties;
                        properties[0].setValue(-0.01);
                        break;
                    case "glow2":
                        var properties = Effect.properties;
                        properties[0].setValue(-0.02);
                        break;
                    default:
                        break;
                }
            case "Transform":
                switch (customFX) {
                    case "cameraMovement":
                        var properties = Effect.properties;
                        var skew = properties[4].setValue(0.00071);
                        var axis = properties[5].setValue(0.00071);
                        var opacity = properties[6].setValue(99.99971);
                        break;
                    case "baseShake":
                        var properties = Effect.properties;
                        var skew = properties[4].setValue(0.00061);
                        var axis = properties[5].setValue(0.00061);
                        var opacity = properties[6].setValue(99.99961);
                        break;
                    case "SpinBlur":
                        var properties = Effect.properties;
                        var skew = properties[4].setValue(0.00051);
                        var axis = properties[5].setValue(0.00051);
                        var opacity = properties[6].setValue(99.99951);
                        break;
                    case "ZoomBlur":
                        var properties = Effect.properties;
                        var skew = properties[4].setValue(0.00041);
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
                switch (customFX) {
                    case "glow":
                        var properties = Effect.properties;
                        properties[5].setValue(50.00011);
                        break;
                    default:
                        break;
                }

                break;
            default:
                break;
        }
    },
    GetEffectFromClip: function (Clip, fxName, customFX, seq) {
        if (Clip.trackNum == undefined || Clip.trackNum == null)
            return this.Alert(true, true, "ERROR: clip trackNum is null");
        if (Clip.clipNum == undefined || Clip.clipNum == null)
            return this.Alert(true, true, "ERROR: clip clipNum is null");
        var tFX;
        var fxCount = Clip.components.numItems;
        for (var s = 0; s < fxCount; s++) {
            tFX = Clip.components[s];
            if (tFX.displayName == fxName)
                if (this.IsCustomFX(tFX, customFX)) {

                    return tFX;
                }
        }

        try {
            this.AddEffect(fxName, Clip.trackNum, Clip.clipNum, undefined, seq);
        }
        catch (err) {
            this.Alert(true, true, "somesting went wrong locating/creating [" + fxName + "]FX at " + ToString(err))
        };

        fxCount = Clip.components.numItems;
        for (var s = 0; s < fxCount; s++) {
            tFX = Clip.components[s];
            if (tFX.displayName == fxName) {
                this.SetCustomFX(tFX, customFX);
                return tFX;
            }
        }

        throw "fail to locate added effect.."
    },
    ResetKeyframes: function (EffectAttr, allowKeyframes) {
        if (EffectAttr.areKeyframesSupported()) {
            EffectAttr.setTimeVarying(false);
            EffectAttr.setTimeVarying(allowKeyframes);
        }
    },
    FxEndOfUserKeyframs: function (fxKeys, framesFromClipStart) {
        var hashKey = Math.round(framesFromClipStart);
        var maxKey = fxKeys.max;
        return hashKey <= maxKey;
    },
    FxGetUserKeyframe: function (fxKeys, framesFromClipStart) {
        var hashKey = Math.round(framesFromClipStart);
        var maxKey = fxKeys.max;
        if (hashKey > maxKey)
            hashKey = maxKey;
        return fxKeys[hashKey];
    },
    GetClipFrameTime: function () {
        if (app.project == undefined)
            throw "1"
        if (app.project.activeSequence == undefined)
            throw "2"
        this.global.currentSeq = app.project.activeSequence;
        var timebase = this.global.currentSeq.timebase;
        var t = new Time();
        t.ticks = timebase;
        this.global.frameTime = t.seconds;

        return this.global.frameTime;
    },

    GetSeq: function (seq) {
        if (seq.sequenceID != undefined)
            return seq;
        var proItemID = seq.nodeId;
        for (var x = 0; x < app.project.sequences.numSequences; x++) {
            if (app.project.sequences[x].projectItem.nodeId == proItemID) {
                return app.project.sequences[x];
            }
        }
        throw "no match is projectitem?"
    },

    AsNest: function (slectedClip, identifyStr, onCreation) {
        var openedSeqID = app.project.activeSequence.sequenceID;
        var projectItemRef = slectedClip.projectItem;
        var clipName = projectItemRef.name;
        var seqNamePrefix = identifyStr;
        if (projectItemRef.isSequence() && clipName.indexOf("_") && clipName.split("_")[1] == seqNamePrefix)
            return this.GetSeq(projectItemRef);
        else {
            var clipSeq;
            clipSeq = app.project.createNewSequenceFromClips(slectedClip.nodeId + "_" + seqNamePrefix + "_CLOSE-ME!", projectItemRef, this.VerifyBin("OlympicHelper Files"));
            app.project.openSequence(openedSeqID);
            clipSeq.audioTracks[1].setMute(1);

            try {
                var preInsert = clipSeq.projectItem;
                preInsert.setInPoint(slectedClip.inPoint, 4);
                preInsert.setOutPoint(slectedClip.outPoint, 4);
                preInsert.setColorLabel(6);
                app.project.activeSequence.videoTracks[slectedClip.trackNum].overwriteClip(preInsert, slectedClip.start);
                app.project.activeSequence.videoTracks[slectedClip.trackNum].clips[slectedClip.clipNum].projectItem.select();
                app.project.activeSequence.videoTracks[slectedClip.trackNum].clips[slectedClip.clipNum].name = "Glow_" + slectedClip.name;
            }
            catch (e) {
                this.Alert(true, false, "e:" + e);
            }
            onCreation(clipSeq);
            return clipSeq;
        }
    },

    //#endregion

    //#region marker sound fx
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

    MarkerTransition: function (clipName, colorIndex, offset, path) {

        var currentSeq = app.project.activeSequence;
        if (!currentSeq) {
            return new Error("noSequence")
        }
        var timebase = currentSeq.timebase;
        var clipProj;
        if (!(clipName.split("?///").length > 1)) {
            var folderObj = this.VerifyBin("OlympicHelper Files");

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
            return new Error("noMarker");
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

        if (allMarkers.length == 0)
            return new Error("noMarker");


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
                return new Error("moreTrack")
            }


        }



    },
    //#endregion


    glowFX: function (glowAmount, glowSize, falloff, ignoreBlacks, blend) {
        this.BaseApplyFX(function (slectedClip) {

            var innerSeq = this.AsNest(slectedClip, "Seq-Glow", function (innerSeq) {
                innerSeq.videoTracks[1].overwriteClip(slectedClip.projectItem, new Time());
            });
            var fxClip = innerSeq.videoTracks[1].clips[0];

            fxClip.trackNum = 1;
            fxClip.clipNum = 0;
            fxClip.name = "Glow Layer";

            var openedSeqID = app.project.activeSequence.sequenceID;
            app.project.openSequence(innerSeq.sequenceID);
            var lumakeyFX = this.GetEffectFromClip(fxClip, "Luma Key", "glow");
            var brightness_ontrast1FX = this.GetEffectFromClip(fxClip, "Brightness & Contrast", "glow");
            var blurFX = this.GetEffectFromClip(fxClip, "Gaussian Blur", "glow");
            var brightness_ontrast2FX = this.GetEffectFromClip(fxClip, "Brightness & Contrast", "glow2");
            var ampFX = this.GetEffectFromClip(fxClip, "ProcAmp", "glow");
            app.project.openSequence(openedSeqID);

            var opacityFx = this.GetEffectFromClip(fxClip, "Opacity", "glow");
            if (blend["0"])
                opacityFx.properties[1].setValue(11);//lighten
            else
                opacityFx.properties[1].setValue(22);//screen

            var clipTimeStart = slectedClip.inPoint.seconds;
            var clipLength = slectedClip.duration.seconds;

            var lumaThree = lumakeyFX.properties[0];
            var bnc1 = brightness_ontrast1FX.properties[1];
            var bnc2 = brightness_ontrast2FX.properties[1];
            var blur = blurFX.properties[0];
            var brightness = ampFX.properties[0];
            ampFX.properties[3].setValue(200);
            ampFX.properties[1].setValue(110);



            this.ResetKeyframes(lumaThree, true);
            this.ResetKeyframes(bnc1, true);
            this.ResetKeyframes(bnc2, true);
            this.ResetKeyframes(blur, true);
            this.ResetKeyframes(brightness, true);

            var t = new Time();
            for (var k = clipTimeStart; k < clipLength + clipTimeStart + this.global.frameTime; k = k + this.global.frameTime * 2) {
                var timefromClipStart = (k - clipTimeStart) / this.global.frameTime;
                t.seconds = k;

                var lumaThree_frame = this.FxGetUserKeyframe(ignoreBlacks, timefromClipStart);
                if (this.FxEndOfUserKeyframs(ignoreBlacks, timefromClipStart)) {
                    lumaThree.addKey(t);
                    lumaThree.setValueAtKey(t, lumaThree_frame, k >= clipLength + clipTimeStart);
                }

                var bnc_frame = this.FxGetUserKeyframe(falloff, timefromClipStart);
                if (this.FxEndOfUserKeyframs(falloff, timefromClipStart)) {
                    bnc1.addKey(t);
                    bnc1.setValueAtKey(t, bnc_frame, k >= clipLength + clipTimeStart);
                    bnc2.addKey(t);
                    bnc2.setValueAtKey(t, (-1) * bnc_frame, k >= clipLength + clipTimeStart);
                }

                var blur_frame = this.FxGetUserKeyframe(glowSize, timefromClipStart);
                if (this.FxEndOfUserKeyframs(glowSize, timefromClipStart)) {
                    blur.addKey(t);
                    blur.setValueAtKey(t, blur_frame, k >= clipLength + clipTimeStart);
                }

                var brightness_frame = this.FxGetUserKeyframe(glowAmount, timefromClipStart) - 100;
                if (this.FxEndOfUserKeyframs(glowAmount, timefromClipStart)) {
                    brightness.addKey(t);
                    brightness.setValueAtKey(t, brightness_frame, k >= clipLength + clipTimeStart);
                }
            }
        });
    },

    //#region effects

    BaseApplyFX: function (callback, useAudio) {
        var event_clip_done = new CSXSEvent();
        event_clip_done.type = "fx_clip_done";

        var event_fx_progress = new CSXSEvent();
        event_fx_progress.type = "fx_progress";
        var ignore_update_counter;
        function UpdateProgress(current_time, total_time, clipTimeStart) {
            ignore_update_counter++
            //if not each 6 cycles(usally frames) ignore
            if (ignore_update_counter % 6 != 0)
                return
            event_fx_progress.data = Math.floor((current_time - clipTimeStart) / (total_time - clipTimeStart) * 100);
            event_fx_progress.dispatch();
        }

        this.GetClipFrameTime();
        var slectedClips = this.GetAllSelectedClipsV(useAudio);
        if (slectedClips.length == 0)
            return new Error((useAudio == true && "useAudio") || "noClip");

        for (var i = 0; i < slectedClips.length; i++) {
            event_clip_done.data = (i + 1) + "/" + slectedClips.length;
            event_clip_done.dispatch();

            ignore_update_counter = 0;
            callback.call(this, slectedClips[i], UpdateProgress);
        }
    },

    CameraMovement: function (multi, rate, horizental, vertical, rotationVal, isAuto, shutter) {
        return this.BaseApplyFX(function (slectedClip, UpdateProgress) {
            /** @type {ComponentCollection } */
            var tansformFX = this.GetEffectFromClip(slectedClip, "Transform", "cameraMovement");
            var clipTimeStart = slectedClip.inPoint.seconds;
            var clipLength = slectedClip.duration.seconds;
            var properties = tansformFX.properties;
            var shutterSpeed = properties[10];
            shutterSpeed.setValue(shutter["0"], true);
            var scaleRatio = properties[2];
            scaleRatio.setValue(true, true);

            var scale = properties[3];
            this.ResetKeyframes(scale, true);
            var position = properties[1];
            this.ResetKeyframes(position, true);
            var rotation = properties[7];
            this.ResetKeyframes(rotation, true);

            var t = new Time();
            var endWhenK = clipLength + clipTimeStart + this.global.frameTime * 2;


            for (var k = clipTimeStart; k < endWhenK; k = k + this.global.frameTime * 2) {
                UpdateProgress(k, endWhenK, clipTimeStart)

                var framesFromClipStart = (k - clipTimeStart) / this.global.frameTime;
                t.seconds = k;
                position.addKey(t);
                rotation.addKey(t);

                var multiFrame = this.FxGetUserKeyframe(multi, framesFromClipStart) / 100;
                var verticalFrame = this.FxGetUserKeyframe(vertical, framesFromClipStart) / 200;
                var horizentalFrame = this.FxGetUserKeyframe(horizental, framesFromClipStart) / 200;

                var rotationFrame = this.FxGetUserKeyframe(rotationVal, framesFromClipStart);
                var rotationValue = this.wiggle(rate["0"] / 5, rotationFrame, t.seconds, "r");

                var newPositionX = 0.5 + this.wiggle(rate["0"] / 3, multiFrame * verticalFrame, t.seconds, "x");
                var newPositionY = 0.5 + this.wiggle(rate["0"] / 3, multiFrame * horizentalFrame, t.seconds, "y");
                if (isAuto["0"] == 1) {
                    scale.addKey(t);
                    scale.setValueAtKey(t,
                        Math.max(100 + multiFrame * 1001 * (Math.max(Math.abs(0.5 - newPositionX), Math.abs(0.5 - newPositionY))),
                            100 + Math.pow(Math.abs(rotationValue) * 2, 1.25)),
                        k >= clipLength + clipTimeStart);
                }
                else if (this.FxEndOfUserKeyframs(multi, framesFromClipStart) ||
                    this.FxEndOfUserKeyframs(vertical, framesFromClipStart) ||
                    this.FxEndOfUserKeyframs(horizental, framesFromClipStart) ||
                    this.FxEndOfUserKeyframs(rotationVal, framesFromClipStart)) {
                    scale.addKey(t);
                    scale.setValueAtKey(t,
                        Math.max(100 + multiFrame * 100 * (Math.max(horizentalFrame, verticalFrame) * 2),
                            100 + Math.pow(rotationFrame, 1.25)),
                        k >= clipLength + clipTimeStart);
                }
                position.setValueAtKey(t, [newPositionX, newPositionY], k >= clipLength + clipTimeStart);
                rotation.setValueAtKey(t, rotationValue, k >= clipLength + clipTimeStart);
            }
            this.global.wiggleX = undefined;
            this.global.wiggleY = undefined;
        });
    },

    BaseShake: function (multi, rate, horizental, vertical, isAuto, shutter) {
        return this.BaseApplyFX(function (slectedClip, UpdateProgress) {

            var tansformFX = this.GetEffectFromClip(slectedClip, "Transform", "baseShake");
            var clipTimeStart = slectedClip.inPoint.seconds;
            var clipLength = slectedClip.duration.seconds;
            var properties = tansformFX.properties;
            var shutterSpeed = properties[10];
            shutterSpeed.setValue(shutter["0"], true);
            var scaleRatio = properties[2];
            scaleRatio.setValue(true, true);

            var scale = properties[3];
            this.ResetKeyframes(scale, true);
            var position = properties[1];
            this.ResetKeyframes(position, true);
            var t = new Time();
            var endWhenK = clipLength + clipTimeStart + this.global.frameTime * rate["0"];
            for (var k = clipTimeStart; k < endWhenK; k = k + this.global.frameTime * rate["0"]) {
                UpdateProgress(k, endWhenK, clipTimeStart)


                var timefromClipStart = (k - clipTimeStart) / this.global.frameTime;
                t.seconds = k;
                position.addKey(t);

                var multiFrame = this.FxGetUserKeyframe(multi, timefromClipStart) / 100;
                var verticalFrame = this.FxGetUserKeyframe(vertical, timefromClipStart) / 200;
                var horizentalFrame = this.FxGetUserKeyframe(horizental, timefromClipStart) / 200;
                var x = this.rndRange(multiFrame * verticalFrame);
                var y = this.rndRange(multiFrame * horizentalFrame);

                if (isAuto["0"] == 1) {
                    scale.addKey(t);
                    scale.setValueAtKey(t, (100 + multiFrame * 1000 * (Math.max(Math.abs(0.5 - x), Math.abs(0.5 - y)))), k >= clipLength + clipTimeStart);
                }
                else if (this.FxEndOfUserKeyframs(multi, timefromClipStart) ||
                    this.FxEndOfUserKeyframs(vertical, timefromClipStart) ||
                    this.FxEndOfUserKeyframs(horizental, timefromClipStart)) {
                    scale.addKey(t);
                    scale.setValueAtKey(t, (100 + multiFrame * 100 * (Math.max(horizentalFrame, verticalFrame) * 2)), k >= clipLength + clipTimeStart);
                }
                position.setValueAtKey(t, [x, y], k >= clipLength + clipTimeStart);
            }
            this.global.wiggleX = undefined;
            this.global.wiggleY = undefined;
        });
    },

    ZoomBlur: function (ScaleAmount, blurLength, AutoCenter) {
        return this.BaseApplyFX(function (slectedClip, UpdateProgress) {

            var tansformFX = this.GetEffectFromClip(slectedClip, "Transform", "ZoomBlur");
            var clipTimeStart = slectedClip.inPoint.seconds;
            var clipLength = slectedClip.duration.seconds;
            var properties = tansformFX.properties;

            var scaleRatio = properties[2];
            scaleRatio.setValue(true, true);

            var shutterSpeed = properties[10];
            shutterSpeed.setValue(blurLength["0"], true);
            this.ResetKeyframes(shutterSpeed, true);

            var ancor = properties[0];
            if ((AutoCenter[0] == 1) && !ancor.isTimeVarying()) {
                var ancor = properties[0];
                var position = properties[1];
                var ancorCal = ancor.getValue();
                position.setValue(ancorCal, true);
            }

            var scale = properties[3];
            this.ResetKeyframes(scale, true);

            var t = new Time();
            var x = 0;
            var endWhenK = clipLength + clipTimeStart + this.global.frameTime
            for (var k = clipTimeStart; k <= endWhenK; k = k + this.global.frameTime) {
                UpdateProgress(k, endWhenK, clipTimeStart)


                x++;
                var timefromClipStart = Math.round((k - clipTimeStart) / this.global.frameTime);
                t.seconds = k;
                scale.addKey(t);
                scale.setValueAtKey(t, 100, k >= clipLength + clipTimeStart);

                var subFrame = new Time();
                subFrame.seconds = t.seconds + this.global.frameTime * 0.5;
                var amountFrame = 100 + this.FxGetUserKeyframe(ScaleAmount, timefromClipStart);
                scale.addKey(subFrame);
                scale.setValueAtKey(subFrame, amountFrame, k >= clipLength + clipTimeStart);
            }
            return x;
        });
    },

    SpinBlur: function (SpinAmount, blurLength, AutoCenter) {
        return this.BaseApplyFX(function (slectedClip, UpdateProgress) {

            var tansformFX = this.GetEffectFromClip(slectedClip, "Transform", "SpinBlur");
            var clipTimeStart = slectedClip.inPoint.seconds;
            var clipLength = slectedClip.duration.seconds;
            var properties = tansformFX.properties;

            var scaleRatio = properties[2];
            scaleRatio.setValue(true, true);

            var shutterSpeed = properties[10];
            shutterSpeed.setValue(blurLength["0"], true);
            this.ResetKeyframes(shutterSpeed, true);

            var ancor = properties[0];
            if ((AutoCenter[0] == 1) && !ancor.isTimeVarying()) {
                var ancor = properties[0];
                var position = properties[1];
                var ancorCal = ancor.getValue();
                position.setValue(ancorCal, true);
            }

            var rotation = properties[7];
            this.ResetKeyframes(rotation, true);

            var t = new Time();
            var x = 0;
            var endWhenK = clipLength + clipTimeStart + this.global.frameTime
            for (var k = clipTimeStart; k <= endWhenK; k = k + this.global.frameTime) {
                UpdateProgress(k, endWhenK, clipTimeStart)


                x++;
                var timefromClipStart = Math.round((k - clipTimeStart) / this.global.frameTime);
                t.seconds = k;
                rotation.addKey(t);
                rotation.setValueAtKey(t, 0.0, k >= clipLength + clipTimeStart);

                var subFrame = new Time();
                subFrame.seconds = t.seconds + this.global.frameTime * 0.5;
                var amountFrame = this.FxGetUserKeyframe(SpinAmount, timefromClipStart);
                rotation.addKey(subFrame);
                rotation.setValueAtKey(subFrame, amountFrame, k >= clipLength + clipTimeStart);
            }
            return x;
        });
    },


    RandomPitcher: function (base, rndRange) {
        try {
            this.BaseApplyFX(function (slectedClip) {
                /**
                 * @type {Effect}
                */
                try {
                    var pitchFx = this.GetEffectFromClip(slectedClip, "Pitch Shifter", "rndPitch");
                    /**@type {Component} */
                    var pitch_prop = pitchFx.properties[1];
                    var newPitch = 1 / 3 + base[0] / 100 * 2 / 3 + (rndRange[0] / 100) * (2 / 3 - Math.random());

                    pitch_prop.setValue(newPitch, true);
                }
                catch (e) {
                    delete e.source
                    throw ToString(e, 2)
                }
            }, true);
        }
        catch (e) {
            delete e.source
            return ToString(e, 2)
        }
    },

    //#endregion


    GodRays: function (rayLength, BlurDetails, brightnessLevel, func) {
        AutoCenter = true;
        if (func == null || func == "" || func == " ")
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
            if (currentSeq.videoTracks.numTracks < (clipTrack + 2)) {
                this.Alert(true, true, "Faild Creating FX for clip [" + thisClip.name + "], not enough tracks, please add new track above track " + (clipTrack + 2));
                break;
            }
            var topTrack = currentSeq.videoTracks[clipTrack + 1];
            var tracksClips = topTrack.clips;
            var canPlace = true, olderFX = null;
            for (var x = 0; x < tracksClips.numItems; x++) {
                var cClip = tracksClips[x];
                if (cClip.start.seconds <= thisClip.end.seconds && cClip.end.seconds >= thisClip.start.seconds) {
                    if (cClip.name == thisClip.name && cClip.start.seconds == thisClip.start.seconds) {
                        olderFX = cClip;
                        olderFX.trackNum = clipTrack + 1;
                        olderFX.clipNum = x;
                        canPlace = true;
                        break;
                    }
                    canPlace = false;
                    break;
                }
            }
            if (!canPlace && olderFX == null) {
                this.Alert(true, true, "Faild Creating FX for clip [" + thisClip.name + "], the track above was not empty!, to make the FX you have to clear the above track At track " + (clipTrack + 2));
                return;
            }
            var aboveClip;
            if (olderFX == null) {
                var preInsert = thisClip.projectItem;
                preInsert.setInPoint(thisClip.inPoint);
                preInsert.setOutPoint(thisClip.outPoint);
                preInsert.mediaType = "video";
                preInsert.setColorLabel(5);
                topTrack.overwriteClip(preInsert, thisClip.start);
                topTrack = currentSeq.videoTracks[clipTrack + 1]; //reloads track items;
                tracksClips = topTrack.clips;

                x = 0;
                for (var x = 0; x < tracksClips.numItems; x++) {
                    var cClip = tracksClips[x];
                    if (cClip.start.seconds == timeStart) {
                        aboveClip = cClip;

                        aboveClip.trackNum = clipTrack + 1;
                        aboveClip.clipNum = x;
                        break;
                    }
                }
            }
            else
                aboveClip = olderFX;

            var opacity = aboveClip.components[0];
            opacity.properties[1].setValue(22);

            var tansformFX = this.GetEffectFromClip(aboveClip, "Transform", "GodRays");
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
            var y = ancorCal[1];
            position.setValue([x, y], true);

            var scaleRatio = properties[2];
            scaleRatio.setValue(true, true);

            var scale = properties[3];
            this.ResetKeyframes(scale, true);
            scale.setTimeVarying(true);
            for (var k = clipTimeStart; k < clipLength + clipTimeStart + keyframeRatio; k = k + keyframeRatio) {


                t.seconds = k;
                scale.addKey(t);
                scale.setValueAtKey(t, 100.0, k >= clipLength + clipTimeStart);

                if (AutoCenter == "true" && ancor.isTimeVarying() && false)//need a way to get value by time.
                {
                    var ancorCal = ancor.getValueAtKey(t)
                    var x = ancorCal[0];
                    var y = ancorCal[1];
                    position.setValueAtKey(t, [x, y], k >= clipLength + clipTimeStart);
                }

                t.seconds = k + subKeyframe;
                scale.addKey(t);

                var funcRatio = 1;
                var textEval = func.replace("{x}", "(" + Number(k - clipTimeStart).toString() + ")");
                try {
                    funcRatio = eval(textEval);
                } catch (e) { this.Alert(true, true, "Faild to Calcultae ease function!:" + e); }

                if (typeof funcRatio != 'number')
                    funcRatio = 1; //linear
                else
                    funcRatio = Math.max(0, Number(funcRatio));

                scale.setValueAtKey(t, rayLength * funcRatio, k >= clipLength + clipTimeStart);
            }

            var procAmpFX = this.GetEffectFromClip(aboveClip, "ProcAmp", "GodRays");
            procAmpFX.properties[0].setValue(brightnessLevel);
            procAmpFX.properties[1].setValue(100 - brightnessLevel);

        }
        if (slectedClips.length == 0)
            this.Alert(true, true, "there is not selected clip, please select one and retry.");

        return true;
    },


    /////////////////////////////////////////////////////////////////////////////////////////////////End prodacut Functions END
    //#region example functions
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
    //#endregion
};

function ObjToString(str, count) {
    return ToString(str, count);
}

function getMethods(obj) {
    var res = [];
    for (var m in obj) {
        if (typeof obj[m] == "function") {
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
        count = addtive - 1;
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



function perlin() {
    this.rand_vect = function () {
        var theta = Math.random() * 2 * Math.PI;
        return { x: Math.cos(theta), y: Math.sin(theta) };
    };
    this.dot_prod_grid = function (x, y, vx, vy) {
        var g_vect;
        var d_vect = { x: x - vx, y: y - vy };
        if (this.gradients[[vx, vy]]) {
            g_vect = this.gradients[[vx, vy]];
        } else {
            g_vect = this.rand_vect();
            this.gradients[[vx, vy]] = g_vect;
        }
        return d_vect.x * g_vect.x + d_vect.y * g_vect.y;
    };
    this.smootherstep = function (x) {
        return 6 * Math.pow(x, 5) - 15 * Math.pow(x, 4) + 10 * Math.pow(x, 3);
    };
    this.interp = function (x, a, b) {
        return a + this.smootherstep(x) * (b - a);
    };
    this.seed = function () {
        this.gradients = {};
    };
    this.gradients = {};
    this.get = function (x, y) {
        var xf = Math.floor(x);
        var yf = Math.floor(y);
        //interpolate
        var tl = this.dot_prod_grid(x, y, xf, yf);
        var tr = this.dot_prod_grid(x, y, xf + 1, yf);
        var bl = this.dot_prod_grid(x, y, xf, yf + 1);
        var br = this.dot_prod_grid(x, y, xf + 1, yf + 1);
        var xt = this.interp(x - xf, tl, tr);
        var xb = this.interp(x - xf, bl, br);
        return this.interp(y - yf, xt, xb);
    };
    this.seed();
};