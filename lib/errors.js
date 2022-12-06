function jsx_error(err) {
    if (!err.startsWith("Error:"))
        return;
    let html;
    err = err.split("Error: ")[1];
    switch (err) {
        case "noClip":
            html = `<label class="EN">Please select a clip to apply the effect onto.</label><label class="HE">אנה בחר קליפ בשביל להחיל עליו את האפקט.</label>`;
            break;
        case "noAudio":
            html = `<label class="EN">Please select a audio to apply the effect onto.</label><label class="HE">אנה בחר אודיו בשביל להחיל עליו את האפקט.</label>`;
            break;
        case "noSequence":
            html = `<label class="EN">Please select a sequence on timeline to apply the effect onto.</label>
            <label class="HE">אנה בחר סיקוונס בציר הזמן בשביל להחיל עליו את האפקט.</label>`;
            break;
        case "noMarker":
            html = `<label class="EN">No marker found at that color, please add markers when you want sound effects to be added.</label>
            <label class="HE">לא נמצאו מרקרים בצבע הזה, יש להוסיף מרקרים איפה שרוצים להוסיף סאונד אפקטס.</label>`;
            break;
        case "moreTrack":
            html = `<label class="EN">New video track is needed! There is no room for inserting - canceling it midway. Add track & retry.</label>
            <label class="HE">פס ווידאו נוסף נדרש! אין מספיק מקום להכנסת קליפים - פעולה מבטולת באמצע. יש להוסיף פס ווידאו ולנסות מחדש.</label>`;
            break;
        default:
            console.log(err)

    }
    if (!html)
        return;

    MSG(`<div style="color:red; font-size:1.4em">${html}</div>`)
}