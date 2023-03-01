/**
 * 
 * @param {EffectUI} fxUI 
 */
//{ id: 'silenceCut', items: {} }
function SavePreset(fxUI, suffix = "") {

    MSG(`<label class="HE">לשמור את הערכים של האפקט כברירת מחדל לפעם הבאה? (איקס לביטול)</label>
    <label class="EN">Do you want to save current effect values as default for next time? (press the X to cancel)</label>`, HE ? "קבע פריסט!" : "Set preset!", () => {
        let data = { items: {} };
        const id_key = fxUI.id + suffix;

        for (const key in fxUI.items) {
            const itemData = fxUI.items[key];
            data.items[key] = itemData.timeline.keyframes[0].value
        }

        if (fxUI.id == "silenceCut") {
            data = {
                vol: $("#s_c_db").val(),
                duration: $("#s_c_duration").val(),
                safe: $("#s_c_margin").val(),
                name: prompt(HE ? "איך לקרא לפריסט הזה?" : "how do you want to name this preset?", "preset" + suffix).slice(0, 15)
            }
            data.name = `P${suffix}: ` + data.name;
            $("[preset=" + suffix + "]").text(data.name);
        }
        localStorage[id_key] = JSON.stringify(data);

        if (fxUI.id != "silenceCut")
            MSG(`<label class="HE">הערכים של האפקט נקבעו כערך ברירת מחדל לעתיד, לאיפוס בכל שלב לחץ לחיצה ימנית על כפתור "קבע כברירת מחדל"..</label>
    <label class="EN">Effect values will now remain as default for future usage! to reset that - right click the button "Set as default"..</label>`)
        else
            MSG(`<label class="HE">פריסט נשמר! לטעינת הפריסט בעתיד לחץ מקש שמאלי על כפתור הפריסט.</label>
    <label class="EN">Preset saved! to use it in the future just left click the preset button.</label>`)
    })


}
/**
 * 
 * @param {EffectUI} fxUI 
 */
function LoadPreset(fxUI, suffix = "") {
    const id_key = fxUI.id + suffix;
    let storageData = localStorage[id_key];
    if (!storageData)
        return;

    const data = JSON.parse(storageData);
    for (const key in data.items) {
        fxUI.items[key].timeline.value = data.items[key]
    }
    console.log(fxUI)

}

/**
 * 
 * @param {EffectUI} fxUI 
 */
async function RemovePreset(fxUI, suffix = "") {
    const id_key = fxUI.id + suffix;

    MSG(`<label class="HE">האם לאפס את הפריסט לערך ההתחלתי של הפלאגין? (לחץ איקס לביטול)<br>העדכון יחול בפעם הבאה שתרעננו את הפלאגין.</label>
    <label class="EN">Do you want to reset to NATIVE default? (press the X to cancel)<br>The reset will we visible in the next plugin refresh.</label>`, HE ? "איפוס" : "RESET",
        (a) => {
            delete localStorage[id_key]
        })
}

function SilenceCutLoadPreset(suffix) {
    const id_key = "silenceCut" + suffix;
    let data = localStorage[id_key];
    if (!data) {
        return MSG(`<label class="HE">פריסט עדיין לא קיים, ליצירת פריסט עם ההגדרות שכרגע לחץ מקש שמאלי על הכפתור.</label>
    <label class="EN">Preset doesnt defined yet! to define a preset - right click the button.</label>`)
    }

    data = JSON.parse(data);
    $("#s_c_db").val(data.vol)
    $("#s_c_duration").val(data.duration)
    $("#s_c_margin").val(data.safe)
}

