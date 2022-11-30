let ongoin_SilenceCut = false;
async function SilenceCut() {

    if (!localStorage.ffmpeg)
        LocateFFmpeg(false)

    if (ongoin_SilenceCut)
        return;
    ongoin_SilenceCut = true;

    const filePath = "" + await new Promise(resolve => evalScript(`$._PPP_.getSelectedClipPath();`, resolve));
    if (filePath.startsWith("Error:")) {
        jsx_error(filePath);
        ongoin_SilenceCut = false;
        return;
    }


    const maxAudioTracks = await SilenceCut_getAudioTracks();
    let analyzeTrackNum = $("#s_c_track").val();
    if (analyzeTrackNum > maxAudioTracks) {
        $("#s_c_track").val("1")
        analyzeTrackNum = 1;
    }

    console.log("starting analyze track " + analyzeTrackNum)
    //starts analyze process
    var proc = window.cep.process.createProcess(localStorage.ffmpeg,
        "-i",
        filePath, //file path location
        "-map", "0:" + analyzeTrackNum, //audio track to map
        "-af",
        "silencedetect=noise=" + $("#s_c_db").val() + "dB:d=" + $("#s_c_duration").val() / 1000, // silence args
        "-f", "null", "-", "-nostats", "-hide_banner")

    console.log(["-i",
        filePath, //file path location
        "-map", "0:" + analyzeTrackNum, //audio track to map
        "-af",
        "silencedetect=noise=" + $("#s_c_db").val() + "dB:d=" + $("#s_c_duration").val() / 1000, // silence args
        "-f", "null", "-", "-nostats", "-hide_banner"].join(" "))

    if (!Check_FFmpeg(proc)) {
        ongoin_SilenceCut = false;
        return;
    }

    let detectStr = [];
    let gotFullResponse = false;
    let cut_count = 0;
    let checkInterval = 500;
    let countElement = $("#cutCount");
    countElement.text("0");
    $("div.cutLoader").show();
    $("div.cutLoader p").html(`<label class="EN">Detected </label><label class="HE">זוהו </label>
        <span id="cutCount">0</span>
        <label class="EN"> cuts</label><label class="HE"> קאטים</label>...<br>
            <small><label class="EN">Please wait and don't do ANY action!</label><label class="HE">נא המתן ואל
                תבצע אף
                פעולה!</label></small>`);

    //handle response of that eg raw ffmpeg
    const handleData = async (data = "") => {
        console.log("\n")
        if (data.err === 0) {
            console.warn(data)
            gotFullResponse = true;
            return;
        }
        if (data.startsWith("Input")) {
            console.log("Getting start of ffmpeg data:\n" + data)
            const firstIndex = data.indexOf("[silencedetect");
            data = data.slice(firstIndex, data.length)
        }
        console.log("Filtering raw data:")
        console.log(data)

        data = data.replaceAll(/(\[silencedetect.* silence_end: )|(silence_duration:)| |(\[silencede.*)/g, "")
        let newCuts = data.split('|').length - 1;
        cut_count += newCuts;

        (async () => {
            if (countElement)
                countElement = $("#cutCount");
            for (let index = 0; index <= 10; index++) {

                countElement.text(Math.floor((cut_count - newCuts * (1 - index / 10))).toLocaleString())
                await sleep(checkInterval / 10);
            }
        })();
        detectStr.push(data)

        await sleep(1000)

        gotFullResponse = !window.cep.process.isRunning(proc.data).data;
    }

    //loops std responses with {checkInterval} sleep between
    async function stdLoop(data) {
        if (data)
            handleData(data);
        if (gotFullResponse)
            return;
        await sleep(checkInterval);
        window.cep.process.stderr(proc.data, stdLoop);
    }
    stdLoop();
    //wait for std output to end
    while (!gotFullResponse)
        await sleep(200);
    await sleep(checkInterval)

    $("div.cutLoader").css("color", "red")

    const safeZone_margin = $("#s_c_margin").val() / 1000;
    const cut_arr = [];
    const frameTime = Number(await new Promise(resolve => evalScript(`$._PPP_.GetClipFrameTime()`, resolve)));


    function fixTimecode(time) {
        return time - time % frameTime;
    }

    //convert all data to array format
    detectStr = detectStr.join("").split("\n").filter((item) => { return item.length > 3 && item.indexOf("|") != -1 })
    detectStr.forEach((value, index) => {
        const split = value.split("|")
        const cut = {
            start_at: fixTimecode(Number(split[0]) - split[1] + safeZone_margin),
            end_at: fixTimecode(Number(split[0]) - safeZone_margin)
        };
        if (cut.start_at + frameTime * 4 >= cut.end_at) //checks after modify if the cut is still valid with minimal duration
            return;

        if (cut_arr.length > 0) {
            const last_cut = cut_arr[cut_arr.length - 1];
            if (cut.start_at - last_cut.end_at <= frameTime * 4) //if time since last cut is less then 4 frames
                return last_cut.end_at = cut.end_at;
        }

        cut_arr.push(cut);
    });


    for (let index = 0; index < cut_arr.length; index++) {
        const a_cut = cut_arr[index] //get current cut

        const call_start = new Date();
        const cutState = await new Promise(resolve => evalScript(`$._PPP_.CutAt(${JSON.stringify(a_cut)})`, resolve));
        const duration = Math.floor((new Date() - call_start) / 10) / 100;
        console.log(a_cut)
        console.log(cutState + "\n")
        await sleep(3)
        countElement.text(`${index}/${cut_arr.length}(${duration}s)`);
    }
    await new Promise(resolve => evalScript(`$._PPP_.AutoCut_end();`, resolve));

    $("div.cutLoader")[0].setAttribute("style", "")
    $("div.cutLoader").hide();
    ongoin_SilenceCut = false;
}

async function SilenceCut_getAudioTracks() {
    const data = "" + await new Promise(resolve => evalScript(`$._PPP_.getClipMetaData();`, resolve))
    if (data.startsWith("Error:")) {
        return console.log(data);
    }
    let jsonVid;
    try {
        jsonVid = JSON.parse(data);
    } catch (e) {
        console.warn(data)
        return;
    }
    const audioData = jsonVid.find((item) => { return item.ColumnID == "Column.Intrinsic.AudioInfo" });
    let audioTrackCount = audioData.ColumnValue.split(" - ").pop().split(" ")[0];
    audioTrackCount = Number(audioTrackCount);
    if (audioTrackCount == undefined || isNaN(audioTrackCount))
        audioTrackCount = 1;

    $("#s_c_track")[0].setAttribute("max", audioTrackCount)
    return audioTrackCount
}

function LocateFFmpeg(prompt = true) {
    let procc;

    if (localStorage.ffmpeg) { //test to see if old path is working
        procc = window.cep.process.createProcess(localStorage.ffmpeg);
        if (Check_FFmpeg(procc, false))
            return localStorage.ffmpeg = localStorage.ffmpeg;
    }

    //search in plugin path
    const extPath = csInterface.getSystemPath(SystemPath.EXTENSION);
    const normalPath = extPath + "/SilenceCut/bin/";
    procc = window.cep.process.createProcess(normalPath + "ffmpeg.exe");
    if (Check_FFmpeg(procc, false))
        return localStorage.ffmpeg = normalPath + "ffmpeg.exe";

    const stupidsCut = extPath + "/SilenceCut/ffmpeg-master-latest-win64-gpl-shared/bin/";
    procc = window.cep.process.createProcess(stupidsCut + "ffmpeg.exe");
    if (Check_FFmpeg(procc, false))
        return localStorage.ffmpeg = stupidsCut + "ffmpeg.exe";

    if (!prompt)
        return;

    const data = window.cep.fs.showOpenDialogEx(false, false, "Locate FFmpeg (Should be at ./bin/)", normalPath, ["exe"], "ffmpeg.exe", "Select");
    if (data.err != 0)
        return MSG(`<label class="EN">Unknown error.. what?</label><label class="HE">שגיאה לא ידוע.. מה?</label>`)
    if (data.data.length == 0)
        return Check_FFmpeg({ data: -1, err: 3 }) && false;
    if (!(data.data[0].endsWith("/ffmpeg.exe")))
        return MSG(`<label class="EN">Its looks like you selected an executable BUT <b>its NOT ffmpeg.exe</b>! please search again and choose correctly.</label>
            <label class="HE">נראה שכן נבחרה תוכנה אבל <b>זה לא ffmpeg.exe</b>! יש לחפש שוב ולבחור הפעם נכון.</label>`,
            "OK", LocateFFmpeg)
    return localStorage.ffmpeg = data.data[0];
}

function Check_FFmpeg(proc, alert = true) {
    if (proc.err == 0)
        return true;
    if (!alert)
        return;
    MSG(`<label class="EN">
		To make "SilenceCut" work - <b><a href="https://ffmpeg.org/download.html#build-windows" target="_blank">FFmpeg</a></b> must be installed!<br>
		Here how:<br>
		1. Use <a href="https://github.com/BtbN/FFmpeg-Builds/releases" target="_blank">THIS LINK</a> to download FFmpeg.<br>
		Recommended <b>"ffmpeg-master-latest-win64-gpl-shared.zip"</b> version.<br>
		2. Extract the ZIP inner folder onto:<br>
         "<b onClick="window.getSelection().selectAllChildren(this);" style="display:inline-block;color:red; background:rgba(0,0,0,0.1); border-radius:3px">${csInterface.getSystemPath(SystemPath.EXTENSION)}/SilenceCut/</b>"<br>
        3. Press "CHECK" in this prompt - thats it.<br><br>
        p.s. -  You may save ffmpeg.exe in other path if you wish..<br>
        If when closing this prompt the plugin will fail to locate ffmpeg.exe in the plugin's path - it will ask you to locate it,<br>
        The ffmpeg.exe file thats you need to select is within - "../bin/" folder.
		</label>

		<label class="HE">
		בשביל ש "חיתוך שקט" יעבוד - <b><a href="https://ffmpeg.org/download.html#build-windows" target="_blank">FFmpeg</a></b> צריך להיות מותקן!<br>
		איך להתקין:<br>
		1. יש לפתוח את <a href="https://github.com/BtbN/FFmpeg-Builds/releases" target="_blank">קישור הזה</a> כדי להוריד את FFmpeg.<br>
		מומלץ להוריד את הגרסה בשם - <b>"ffmpeg-master-latest-win64-gpl-shared.zip"</b><br>
		2. יש לחלץ את התקייה שב ZIP אל תוך התקייה :<br>
         "<b onClick="window.getSelection().selectAllChildren(this);" style="display:inline-block;color:red; background:rgba(0,0,0,0.1); border-radius:3px">${csInterface.getSystemPath(SystemPath.EXTENSION)}/SilenceCut/</b>"<br>
        3. לחצו "CHECK" בחלון הזה - זהו זה.<br><br>
        נ.ב. -  ניתן לשמור את ffmpeg.exe בתקייה אחרת במחשב אם תרצו..<br>
        אם כשהחלון הזה נסגר הפלאגין לא מצליח למצא את ffmpeg.exe בתקייה של הפלאגין - יפתח חלון שם צריך לבחור במיקום ששמרתם,<br>
        הקובץ ffmpeg.exe שצריך לבחור בו נמצא בתוך התקייה - "../bin/"
		</label>`, "CHECK", LocateFFmpeg)
    return false;
}