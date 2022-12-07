let ongoin_SilenceCut = false;
async function SilenceCut() {

    if (!localStorage.ffmpeg)
        LocateFFmpeg(false)

    if (ongoin_SilenceCut)
        return;
    ongoin_SilenceCut = true;


    var proc = await FFmpeg();
    console.log(proc)

    let detectStr = [];
    cut_count = 0;
    let checkInterval = 300;
    let countElement = $("#cutCount");
    countElement.text("0");
    $("div.cutLoader").show();
    $("div.cutLoader p").html(`<label class="EN">Detected </label><label class="HE">זוהו </label>
        <span id="cutCount">0</span>
        <label class="EN"> cuts</label><label class="HE"> קאטים</label>...<br>
            <small><label class="EN">Please wait and don't do ANY action!</label><label class="HE">נא המתן ואל
                תבצע אף
                פעולה!</label></small>`);



    let gotFullResponse = false;
    while (!gotFullResponse) {
        await sleep(checkInterval);
        const data = await new Promise(resolve => window.cep.process.stderr(proc.data, resolve)); //wait for data from std
        gotFullResponse = await HandleFFmpegData(data, detectStr, checkInterval); //checks if handler reported that he got full res
        gotFullResponse |= !window.cep.process.isRunning(proc.data).data; //older OR if the procc is not running = full res
    }

    await sleep(checkInterval); //allowing cut animation to finish

    $("div.cutLoader").css("color", "red")

    const safeZone_margin = $("#s_c_margin").val() / 1000;
    const cut_arr = [];
    const frameTime = Number(await new Promise(resolve => evalScript(`$._PPP_.GetClipFrameTime()`, resolve)));

    function fixTimecode(time) {
        return time - time % frameTime;
    }

    //convert all data to array format
    detectStr = detectStr.join("").split("\n").filter((item) => { return item.length > 3 && item.indexOf("|") != -1 })

    console.log("%c Raw data received", "border-left:solid 1vmin red")
    console.log([detectStr.join(",")])

    console.log("%c Converting data to cuts", "border-left:solid 1vmin red");

    $("div.cutLoader p").html(`<label class="EN">Removing </label><label class="HE">מסיר </label>
        <span id="cutCount">0</span>/${cut_count}
        <label class="EN"> cuts</label><label class="HE"> קאטים</label>...<br>
            <small><label class="EN">Please wait and don't do ANY action!</label><label class="HE">נא המתן ואל
                תבצע אף
                פעולה!</label></small>`);
    countElement = $("#cutCount");


    detectStr.forEach(async (value, index) => {
        await sleep(index * 40);
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
        countElement.text(1 + index - cut_arr.length)
    });
    await sleep(100 + detectStr.length * 40);
    console.log(`%c Converted ${cut_count} => ${cut_arr.length}`, "border-left:solid 1vmin red");

    console.log("%c Final cuts data:", "border-left:solid 1vmin lime")
    console.log(cut_arr)

    $("div.cutLoader p").html(`<label class="EN">Preforming </label><label class="HE">מבצע </label>
        <span id="cutCount">--</span>
        <label class="EN"> cuts</label><label class="HE"> קאטים</label>...<br>
            <small><label class="EN">Please wait and don't do ANY action!</label><label class="HE">נא המתן ואל
                תבצע אף
                פעולה!</label></small>`);
    countElement = $("#cutCount");

    for (let index = 0; index < cut_arr.length; index++) {
        const a_cut = cut_arr[index] //get current cut

        const call_start = new Date();
        const cutState = await new Promise(resolve => evalScript(`$._PPP_.CutAt(${JSON.stringify(a_cut)})`, resolve));
        const duration = Math.floor((new Date() - call_start) / 10) / 100;

        console.log(`%c cut #${index + 1}/${cut_arr.length} STATE: ${cutState}/${duration}s`, "border-left:solid 1vmin transparent")
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

    const selectedVal = $("#s_c_track option:selected").val();
    const opts = [];
    for (let i = 0; i <= audioTrackCount; i++) {
        let opt_val = i + 1,
            opt_text = opt_val + 0;

        if (i == audioTrackCount) {
            opt_val = "a";
            opt_text = "All Tracks";
        }

        opts.push(`<option value="${opt_val}">${opt_text}</option>`)


        if (opt_val == selectedVal) // set selected from memory
            opts.push(opts.pop().replace("value", "selected value"));
    }

    $("#s_c_track").html(opts.join(""));

    return audioTrackCount
}

async function FFmpeg() {
    const filePath = "" + await new Promise(resolve => evalScript(`$._PPP_.getSelectedClipPath();`, resolve));
    if (filePath.startsWith("Error:")) {
        jsx_error(filePath);
        ongoin_SilenceCut = false;
        return;
    }

    const clip_IO = JSON.parse(await new Promise(resolve => evalScript(`$._PPP_.getSelectedClipInOut();`, resolve)))

    const maxAudioTracks = await SilenceCut_getAudioTracks();
    let analyzeTrackNum = $("#s_c_track option:selected").val()
    if (analyzeTrackNum != "a" && Number(analyzeTrackNum) > maxAudioTracks) {
        analyzeTrackNum = 1;
    }

    const volume = $("#s_c_db").val(),
        min_time = $("#s_c_duration").val() / 1000;


    //TODO: check way partial cutting doesnt work

    const args = {
        ss: "-ss",
        ss_startAt: clip_IO.in + "s",
        to: "-to",
        t_duration: clip_IO.out + "s",

        override_output: "-y",
        input_arg: "-i",
        input_path: filePath,

        map_arg: "-map",
        map_value: "0:" + analyzeTrackNum,

        filter_arg: "-filter_complex",
        filter_value: `[0:${analyzeTrackNum}]afftdn=noise_reduction=15:track_noise=1; [0:${analyzeTrackNum}]silencedetect=noise=${volume}dB:duration=${min_time}:mono=false`.replace(/ /g, ""),

        output_arg: "-f",
        output_type: "mp4",
        output_path: "D:/הורדות/test.mp4",

        nostats: "-nostats",
        hide_banner: "-hide_banner"
    }

    if (true) // IS PRODUCTION? - DISABLE OUTPUT
    {
        args.output_type = "null";
        args.output_path = "-";
    }

    if (analyzeTrackNum == "a") {
        args.filter_value = `[0:a] amerge=inputs=4[0]; [0]silencedetect=noise=${volume}dB:duration=${min_time}:mono=false`
    }

    console.log("%c Running detection of silence with cmd:", "color:red");
    console.log("%c " + Object.values(args).join(" "), "color:gray");

    return window.cep.process.createProcess(localStorage.ffmpeg,
        args.ss, args.ss_startAt, args.to, args.t_duration,
        args.override_output, args.input_arg, args.input_path,
        args.map_arg, args.map_value,
        args.filter_arg, args.filter_value,
        args.output_arg, args.output_type, args.output_path,
        args.nostats, args.hide_banner
    )
}

let lastUpdate;
let cut_count;
async function HandleFFmpegData(data, detectStr, checkInterval) {
    console.log(data)
    if (data.err === 0) {
        //if error it is the end of action
        console.warn(data)
        return true;
    }
    //if its start of input - it will have ffmpeg data header - ignore it and search the first cut.
    if (data.startsWith("Input")) {
        console.log("%c Started Listening..", "border-left:solid 1vmin red")
        const firstIndex = data.indexOf("[silencedetect");
        if (firstIndex == -1)
            console.error(data)
        data = data.slice(firstIndex, data.length);

        lastUpdate = new Date(); //sets start of action
    }

    const parsedData = data.replace(/(\[silencedetect.* silence_end: )|(silence_duration:)| |(\[silencede.*)/g, "") //filtering to keep only time of cuts
    detectStr.push(parsedData)
    let newCuts = parsedData.split('|').length - 1;
    cut_count = cut_count + newCuts;

    console.log(`%c Getting chunk data after ${(new Date() - lastUpdate) / 1000}s  / size:${data.length}`, "border-left:solid 1vmin transparent");
    lastUpdate = new Date(); //updates last time got an update to be now

    //create new async without waiting for it - updating UI
    let countElement = $("#cutCount");
    (async () => {
        for (let index = 0; index <= 10; index++) {
            countElement.text(Math.floor((cut_count - newCuts * (1 - index / 10))).toLocaleString())
            await sleep(checkInterval / 10);
        }
    })();

    return false; //not end of procc
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