/**
 * 
 * @param {EffectUI} fxUI 
 */

function SavePreset(fxUI, suffix = "") {
    const data = { items: {} };
    const id_key = fxUI.id + suffix;

    data.timelineLength = fxUI.timelineLength;
    for (const key in fxUI.items) {
        const itemData = fxUI.items[key];
        data.items[key] = itemData.timeline.keyframes[0].value
    }
    localStorage[id_key] = JSON.stringify(data);

    MSG(`<label class="HE">הערכים של האפקט נקבעו כערך ברירת מחדל לעתיד, לאיפוס בכל שלב לחץ לחיצה ימנית על כפתור "קבע כברירת מחדל"..</label>
    <label class="EN">Effect values will now remain as default for future usage! to reset that - right click the button "Set as default"..</label>`)
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