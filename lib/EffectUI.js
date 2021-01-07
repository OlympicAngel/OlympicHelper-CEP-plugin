class EffectUI {

    constructor(name, id, pppFuncName) {
        this.name = name;
        this.id = "FX_" + id;
        this.items = {};
        this.pointerX = 0;
        this.timelineLength = 10;
        this.timelinePixels;
        this.pppFuncName = pppFuncName;
        return this;
    }

    get CurrentTime() {
        return Math.floor(this.pointerX / this.timelinePixels * this.timelineLength * 100) / 100
    };

    AddUI(name, id, basevalue, type = "units", min, max, step, keyframeable = true) {
        //units, relative, checkbox, custom
        id = "attr_" + id;
        var timeline = new EffectAttrValue(id, name, basevalue, keyframeable);
        var uiObj = {
            id: this.id + "_" + id,
            timeline: timeline,
            type: type,
            min: min,
            max: max,
            step: step
        }
        this.items[id] = uiObj;
    }

    Render() {
        var mainDiv = document.createElement("div");
        mainDiv.id = this.id;
        mainDiv.className = "fxUI";
        mainDiv.setAttribute("closed", "true");
        mainDiv.setAttribute("name", this.name[Number(HE)]);
        mainDiv.onclick = this.OpenFX;

        if (!this.renderOverride) {
            var lastTimeline;
            for (const key in this.items) {
                var cUI = this.items[key];
                var fxAttrMain = document.createElement("table");
                fxAttrMain.setAttribute('tabindex', '0');
                fxAttrMain.id = cUI.id;
                var row = document.createElement("tr");
                var tdRight = document.createElement("td");
                tdRight.id = cUI.id + "_timeline";
                cUI.timeline.elemnt = tdRight;
                lastTimeline = tdRight;
                var tdLeft = document.createElement("td");

                var nameDisplay = document.createElement("span");
                nameDisplay.id = cUI.id + "Text";
                nameDisplay.innerHTML = cUI.timeline.name[Number(HE)];

                var input = document.createElement("input");
                var inputLabel = undefined;
                input.id = "input_" + cUI.id;
                input.setAttribute("base", cUI.timeline.value);
                input.setAttribute("objField", key);
                input.value = cUI.timeline.value;
                input.min = cUI.min;
                input.max = cUI.max;
                //input.oninput = this.onInputChange.bind(this, input);
                input.onblur = this.onInputChange.bind(this, input);
                input.onfocus = function () {
                    this.select()
                };
                input.onkeypress = this.AddKeyframe.bind(this);
                input.step = cUI.step;
                if (cUI.type == EffectUI.type.checkbox) {
                    input.type = "checkbox";
                    input.checked = Number(cUI.timeline.value) == 1;
                    input.onclick = this.AddKeyframe.bind(this, input);
                } else {
                    input.type = "number";
                    input.required = true;
                    var text = cUI.type;
                    if (cUI.type == EffectUI.type.units)
                        text = "";
                    if (cUI.type == EffectUI.type.relative)
                        text = "%";

                    inputLabel = document.createElement("label");
                    inputLabel.for = input.id;
                    inputLabel.innerHTML = text
                }

                var keyframeToggle = document.createElement("i");
                keyframeToggle.className = "stopwatch";
                keyframeToggle.onclick = this.ToggleKeyframes.bind(this, keyframeToggle, input);
                if (!cUI.timeline.keyframeable || cUI.type == EffectUI.type.checkbox) {
                    keyframeToggle.onclick = undefined;
                    keyframeToggle.className = undefined;
                }

                var reset = document.createElement("i");
                reset.className = "reset";
                reset.setAttribute("pointer", input.id);
                reset.onclick = this.resetValue.bind(this, input);

                tdLeft.appendChild(keyframeToggle);
                tdLeft.appendChild(nameDisplay);
                tdLeft.appendChild(input);
                if (inputLabel)
                    tdLeft.appendChild(inputLabel);
                tdLeft.appendChild(reset);
                row.appendChild(tdLeft);
                row.appendChild(tdRight);

                fxAttrMain.appendChild(row);
                mainDiv.appendChild(fxAttrMain);
            }

            var timePointer = document.createElement("pointer");
            mainDiv.appendChild(timePointer);
            var jq_timePointer = $(timePointer);
            jq_timePointer.draggable({
                axis: "x",
                cursor: "crosshair",
                drag: function (event, ui) {
                    ui.position.left = (Math.max(0, ui.position.left));
                    ui.position.left = (Math.min(this.timelinePixels, ui.position.left));


                    var onFirst = true;
                    for (const key in this.items) {
                        var cUI = this.items[key];
                        if (onFirst) {
                            this.timelinePixels = cUI.timeline.elemnt.offsetWidth;
                            onFirst = false;
                        }
                        if (cUI.timeline.keyframesToggle && (window.snapBlock == undefined || !window.snapBlock)) {
                            var snapDis = 5;
                            for (var x = 0; x < cUI.timeline.keyframes.length; x++) {
                                var keyF = cUI.timeline.keyframes[x];
                                var pointerOffset = this.pointerX;
                                var keyOffset = $(cUI.timeline.elemnt).find("keyframe[time='" + keyF.Time + "']");
                                if (keyOffset[0] == undefined)
                                    debugger
                                keyOffset = Number(getComputedStyle(keyOffset[0]).getPropertyValue("left").split("px")[0]);
                                if (window.snapper == undefined)
                                    window.snapper = 0;
                                if ((pointerOffset <= keyOffset && pointerOffset + snapDis / 2 >= keyOffset) || (pointerOffset >= keyOffset && pointerOffset - snapDis / 2 <= keyOffset)) {
                                    if (window.snapper < snapDis * 2) {
                                        window.snapper++;
                                        ui.position.left = (keyOffset + resizeFix * this.timelinePixels / this.timelineLength);

                                        break;
                                    } else {
                                        window.snapper = 0;
                                        window.snapBlock = true;
                                        setTimeout(function () {
                                            window.snapBlock = false;
                                        }, 100);
                                    }
                                }
                            }

                            var valueByTime = cUI.timeline.GetValueByTime(this.CurrentTime);
                            document.getElementById("input_" + cUI.id).value = Math.floor(valueByTime * 100) / 100;
                        }
                    }
                    this.pointerX = Math.floor(ui.position.left * 100) / 100;


                }.bind(this),
                start: function () {
                    window.onDrag = true;
                },
                stop: function () {
                    setTimeout(function () {
                        window.onDrag = false;
                    }, 1)
                },
            });

            var visualizer = document.createElement("table");
            var tr = document.createElement("tr");
            tr.appendChild(document.createElement("td"));
            tr.appendChild(document.createElement("td"));
            visualizer.appendChild(tr);
            mainDiv.appendChild(visualizer);


            var applyBtn = document.createElement("button");
            applyBtn.innerText = "Apply!";
            applyBtn.onclick = this.GenerateFX.bind(this);
            mainDiv.appendChild(applyBtn);

            var timeInput = document.createElement("input");
            timeInput.value = 10;
            timeInput.min = 1;
            timeInput.max = 120;
            timeInput.step = 0.1;
            timeInput.className = "timeer";
            timeInput.type = "number";
            timeInput.title = "אורך ציר הזמן שמופיע לעריכת הקיפריימס";
            timeInput.oninput = function () {
                if (timeInput.value > 60) {
                    $("<div style='text-align:right;font-size:1.2em; direction:rtl'>שים לב! ערך ממש גבוהה של ציר זמן יביא לקושי בדיוק בערכים של הקיפריימס!</div>").dialog({
                        title: "OlympicHelper INFO",
                        draggable: false,
                        modal: true,
                        buttons: [{
                            text: "הבנתי",
                            click: function () {
                                $(this).dialog("close");
                            }
                        }]
                    });
                }
                this.timelineLength = timeInput.value
            }.bind(this);
            var timeLabel = document.createElement("span");
            timeLabel.className = "timeer";
            timeLabel.innerHTML = "שניות.";
            timeLabel.title = "אורך ציר הזמן שמופיע לעריכת הקיפריימס";

            mainDiv.appendChild(timeInput);
            mainDiv.appendChild(timeLabel);
            this.timelinePixels = lastTimeline.offsetWidth;

        } else {
            this.renderOverride.bind(this, mainDiv)();
        }


        document.body.appendChild(mainDiv);
    }

    ToggleLang() {
        document.getElementById(this.id).setAttribute("name", this.name[Number(HE)]);
        for (const key in this.items) {
            var cUI = this.items[key];
            document.getElementById(cUI.id + "Text").innerHTML = cUI.timeline.name[Number(HE)];
        }
    }

    GenerateFX(e) {
        e.target.blur();
        evalScript('$._PPP_.GetClipFrameTime()', function (frameTime) {
            console.log("js:" + frameTime);
            frameTime = Number(frameTime);
            var args = "";
            for (const key in this.items) {
                var attrTimeLine = this.items[key].timeline.GenerateKeyframes(frameTime, true);
                args += attrTimeLine + ",";
            }
            args = args.slice(0, -1)
            console.log('$._PPP_.' + this.pppFuncName + '(' + args + ')');

            evalScript('$._PPP_.' + this.pppFuncName + '(' + args + ')', function (err) {
                console.log("jsx:" + err)
            });
        }.bind(this));
    }
    //#region minimize
    static get type() {
        return {
            units: "units",
            relative: "relative",
            checkbox: "checkbox"
        }
    }

    ToggleKeyframes(btn, input) {
        var fxAttr_timeline = this.items[input.getAttribute("objField")].timeline;
        var isOn = fxAttr_timeline.ToggleKeyFrames(this.CurrentTime);
        if (isOn) {
            btn.setAttribute("on", "1");

            this.RenderKeyFrame(fxAttr_timeline.keyframes[0], fxAttr_timeline);
        } else {
            btn.setAttribute("on", "0");
            fxAttr_timeline.elemnt.innerHTML = "";
        }

    }

    OpenFX(e) {
        if (window.onDrag != undefined && window.onDrag)
            return;
        var topOffset = this.getBoundingClientRect().top;
        var cssHeightExpression = getComputedStyle(this).getPropertyValue('--clickable');
        var cssHeightElemnt = document.createElement("div");
        cssHeightElemnt.style.height = cssHeightExpression;
        document.body.appendChild(cssHeightElemnt);
        var cssHeightVal = Math.round(1.1 * cssHeightElemnt.offsetHeight);
        cssHeightElemnt.remove();
        if (e.target.className == "fxUI") {
            if (e.clientY - topOffset > cssHeightVal) {
                return;
            }
            var closeSts = this.getAttribute("closed");
            $(".fxUI[closed=false]").attr("closed", "true");
            this.setAttribute("closed", (closeSts != "true").toString());
        }


    }

    resetValue(input) {
        input.value = input.getAttribute("base");
        if (input.type == EffectUI.type.checkbox) {
            input.checked = input.getAttribute("base");
        }
        this.AddKeyframe(input);
    }

    onInputChange(elemnt) {
        if (Number(elemnt.value) < Number(elemnt.min))
            elemnt.value = elemnt.min;
        if (Number(elemnt.value) > Number(elemnt.max))
            elemnt.value = elemnt.max;
        if (elemnt.value == undefined || elemnt.value == "" || elemnt.value == null || isNaN(elemnt.value) || elemnt.value % 1 == NaN) {
            elemnt.value = elemnt.getAttribute("base");
        }
        this.AddKeyframe(elemnt);
    }

    AddKeyframe(elemnt) {
        if (elemnt != undefined && elemnt.keyCode) {
            if (elemnt.keyCode != 13)
                return;
            elemnt = elemnt.target;
            elemnt.blur();
        }
        var fxAttr_timeline = this.items[elemnt.getAttribute("objField")].timeline;
        var newKey;
        if (elemnt.type == "checkbox") {
            newKey = fxAttr_timeline.AddKeyFrame(this.CurrentTime, Number(elemnt.checked));
        } else {
            newKey = fxAttr_timeline.AddKeyFrame(this.CurrentTime, Number(elemnt.value));
        }
        if (fxAttr_timeline.keyframesToggle == false)
            return;

        if (newKey != undefined) {
            this.RenderKeyFrame(newKey, fxAttr_timeline);
        } else {
            var keyframe = document.getElementById(fxAttr_timeline.elemnt.id + "_keyAt_" + this.CurrentTime);
            keyframe.setAttribute("title", elemnt.value);
        }
    }

    RenderKeyFrame(key, timeline) {
        var ease = ["", " EaseIn", " EaseOut", " In&Out"]
        var target = timeline.elemnt;
        var keyframe = document.createElement("keyframe");
        keyframe.id = target.id + "_keyAt_" + key.time;
        keyframe.setAttribute("time", key.Time);
        keyframe.setAttribute("type", key.Easing);
        keyframe.setAttribute("title", key.Val + ease[key.Easing]);
        keyframe.setAttribute("style", "left:" + this.pointerX + "px");

        keyframe.setAttribute('tabindex', '0');
        var jq_keyframe = $(keyframe);
        jq_keyframe.draggable({
            axis: "x",
            grid: [1, 0],
            drag: function (event, ui) {
                ui.position.left = (Math.max(0, ui.position.left));
                ui.position.left = (Math.min(this.timelinePixels, ui.position.left));
            }.bind(this),
            start: function () {
                window.onDrag = true;
                window.tempTime = key.Time;
            },
            stop: function (event, ui) {
                setTimeout(function (event, ui) {
                    window.onDrag = false;
                    var newTime = Math.floor(ui.position.left / this.timelinePixels * this.timelineLength * 100) / 100;
                    keyframe.setAttribute("time", newTime);
                    keyframe.id = target.id + "_keyAt_" + newTime;

                    key.time = newTime;
                    var temp = DeepSort(timeline.keyframes, "time");
                    timeline.keyframes = [];
                    for (var x = 0; x < temp.length; x++) {
                        timeline.keyframes[x] = temp[temp.length - 1 - x];
                    }

                    //if(timeline.RemoveKeyFrame(window.tempTime))
                    //debugger;
                    //timeline.AddKeyFrame(newTime,key.Val);

                    var valueByTime = timeline.GetValueByTime(this.CurrentTime);
                    var id = "input_" + timeline.elemnt.id.split("_timeline")[0];
                    document.getElementById(id).value = Math.floor(valueByTime * 100) / 100;
                }.bind(this, event, ui), 1)
            }.bind(this),
        });
        jq_keyframe.keyup(function (e) {
            if (e.keyCode == 46) {
                timeline.RemoveKeyFrame(key.time);
                this.UnRenderKeyFrame(key, target);
            }
        }.bind(this));

        var changeEase = function (e) {
            e.preventDefault();
            key.easing++;
            if (key.Easing > 3)
                key.easing = 0;
            timeline.AddKeyFrame(key.Time, undefined, key.Easing);
            keyframe.setAttribute("type", key.Easing);
            keyframe.setAttribute("title", key.Val + ease[key.Easing]);
            keyframe.blur();
            return false;

        }.bind(this);

        jq_keyframe.dblclick(changeEase);
        keyframe.oncontextmenu = changeEase

        target.appendChild(keyframe);
    }
    UnRenderKeyFrame(keyframe, target) {
        document.getElementById(target.id + "_keyAt_" + keyframe.time).remove();
    }
    //#endregion
}

var resizeFix = 0;
window.onresize = function () {
    resizeFix = 0.01;
    var size;
    for (var x = 0; x < all_fvx.length; x++) {
        var vfx = all_fvx[x];
        vfx.timelinePixels = size;
        for (const key in vfx.items) {
            const attrRow = vfx.items[key];
            if (size == undefined) {
                size = attrRow.timeline.elemnt.offsetWidth;
                vfx.timelinePixels = size;
            }
            var jq_row = $(attrRow.timeline.elemnt);
            jq_row.find("keyframe").each(function (index) {
                var timeRatio = this.getAttribute("time") / vfx.timelineLength;

                this.style.left = timeRatio * size + "px";
            });


        }
    }
};

var all_fvx = [];


var camMove = new EffectUI(["Camera Movements", "תנועות מצלמה"], "camMove", "CameraMovement");
camMove.AddUI(["Movement Amount", "כמות תנועה"], "amount", 20, EffectUI.type.relative, 0, 1000, 1);
camMove.AddUI(["Speed", "מהירות"], "speed", 50, "x", 0, 1000, 0.5, false);
camMove.AddUI(["X Axis Ratio", "יחס תנועה בציר X"], "xAxis", 100, EffectUI.type.relative, 0, 100, 1);
camMove.AddUI(["Y Axis Ratio", "יחס תנועה בציר Y"], "yAxis", 100, EffectUI.type.relative, 0, 100, 1);
camMove.AddUI(["Dynamic Zoom In?", "זום בצורה משתנה?"], "zoom", false, EffectUI.type.checkbox);
camMove.AddUI(["Motion Blur", "טשטוש מתנועה"], "motionBlur", 180, "/360", 0, 360, 1, false);
all_fvx.push(camMove);


var camShake = new EffectUI(["Camera Shakes", "רעידות מצלמה"], "camShake", "BaseShake");
camShake.AddUI(["Multiplayer", "מכפלה כללית"], "multi", 10, EffectUI.type.relative, 0, 1000, 1);
camShake.AddUI(["Jump Delay", "דילאי של קפיצה"], "delay", 5, "x", 0, 1000, 0.5, false);
camShake.AddUI(["X Axis Ratio", "יחס רעידות בציר X"], "xAxis", 100, EffectUI.type.relative, 0, 100, 1);
camShake.AddUI(["Y Axis Ratio", "יחס רעידות בציר Y"], "yAxis", 100, EffectUI.type.relative, 0, 100, 1);
camShake.AddUI(["Dynamic Zoom In?", "זום בצורה משתנה?"], "zoom", false, EffectUI.type.checkbox);
camShake.AddUI(["Motion Blur", "טשטוש מתנועה"], "motionBlur", 180, "/360", 0, 360, 1, false);
all_fvx.push(camShake);


var glow = new EffectUI(["Glow", "זוהר"], "Glow", "glowFX");
glow.AddUI(["Glow Amount", "כמות זוהר"], "amount", 120, EffectUI.type.relative, 0, 200, 1);
glow.AddUI(["Glow Size", "גודל הזוהר"], "size", 70, "/400", 2, 400, 0.2);
glow.AddUI(["Highlight Boost", "חיזוק בהירות"], "highs", 60, EffectUI.type.relative, -90, 90, 1);
glow.AddUI(["Black Remove", "הסרת צבע שחור"], "blacks", 70, EffectUI.type.relative, 15, 100, 0.5);
glow.AddUI(["Lighten Blend", "שילוב צבע בהיר"], "blend", true, EffectUI.type.checkbox);
all_fvx.push(glow);


var radialBlur = new EffectUI(["Radial Blur", "טשטוש סיבובי"], "raBlur", "SpinBlur");
radialBlur.AddUI(["Spin Amount", "כמות סיבוב"], "amount", 10, "°", -720, 720, 0.5);
radialBlur.AddUI(["Blur Length", "אורך טשטוש"], "length", 20, "/360", 2, 360, 1, false);
radialBlur.AddUI(["Set Spin-Origin as Anchor Point?", "שנה את מרכוז הסיבוב ל - Anchor Point?"], "anchorIt", true, EffectUI.type.checkbox);
all_fvx.push(radialBlur);

var zoomBlur = new EffectUI(["Zoom Blur", "טשטוש זום"], "zoBlur", "ZoomBlur");
zoomBlur.AddUI(["Zoom Amount", "כמות זום"], "amount", 90, "°", -90, 400, 0.5);
zoomBlur.AddUI(["Blur Length", "אורך טשטוש"], "length", 30, "/360", 2, 360, 1, false);
zoomBlur.AddUI(["Set Zoom-Origin as Anchor Point?", "שנה את מרכוז הזום ל - Anchor Point?"], "anchorIt", true, EffectUI.type.checkbox);
all_fvx.push(zoomBlur);


var MarkerSetup = new EffectUI(["Fast Sound Placement", "מיקום סאונד מהיר"], "SoundFX");
MarkerSetup.renderOverride = (function (div) {
    var container = document.getElementById("markerHTML");
    var clone = container.cloneNode(true);
    div.appendChild(clone);
    container.remove();

});
all_fvx.push(MarkerSetup);


for (var x = 0; x < all_fvx.length; x++) {
    all_fvx[x].Render();
}