/**
 * 
 * @param {{ name: string, path: string }} videoFile 
 * @param {{ start_at: number, end_at: number }[]} silentSections
 * @param {{height?: number, mediaPath?: string, numAudioTracks?: number, sampleRate?: number, timebase?: number, totalDuration?: number, width?: number}} options
 * @returns {string}
 */
function generateNonSilentXML(videoFile, silentSections, options = {}) {
    const {
        timebase = 60,
        width = 1920,
        height = 1080,
        sampleRate = 48000,
        numAudioTracks = 4,
        totalDuration = null,
    } = options;

    const toFrames = seconds => Math.round(seconds * timebase);
    const escapeXml = str => str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const frameSilent = silentSections
        .map(s => ({ start_at: toFrames(s.start_at), end_at: toFrames(s.end_at) }))
        .sort((a, b) => a.start_at - b.start_at);

    let lastEnd = 0, timelinePos = 0;
    const clips = [];
    frameSilent.forEach(sec => {
        if (sec.start_at > lastEnd) {
            const d = sec.start_at - lastEnd;
            clips.push({ sourceIn: lastEnd, sourceOut: sec.start_at, timelineStart: timelinePos, timelineEnd: timelinePos + d });
            timelinePos += d;
        }
        lastEnd = Math.max(lastEnd, sec.end_at);
    });
    if (typeof totalDuration === 'number') {
        const totalFrames = toFrames(totalDuration);
        if (lastEnd < totalFrames) {
            const d = totalFrames - lastEnd;
            clips.push({ sourceIn: lastEnd, sourceOut: totalFrames, timelineStart: timelinePos, timelineEnd: timelinePos + d });
        }
    }

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<xmeml version="5">
  <sequence explodedTracks="true">
    <name>SilenceCut</name>
    <rate><timebase>${timebase}</timebase><ntsc>FALSE</ntsc></rate>
    <media>
      <video><format><samplecharacteristics>
        <width>${width}</width><height>${height}</height><pixelaspectratio>square</pixelaspectratio>
      </samplecharacteristics></format>
      <track>`;

    clips.forEach((clip, idx) => {
        const vidId = idx + 1;
        xml += `
        <clipitem id="clipitem-${vidId}">
          <name>${escapeXml(videoFile.name)}</name>
          <enabled>TRUE</enabled>
          <start>${clip.timelineStart}</start><end>${clip.timelineEnd}</end>
          <in>${clip.sourceIn}</in><out>${clip.sourceOut}</out>
          <file id="file-1">
            <name>${escapeXml(videoFile.name)}</name>
            <pathurl>${videoFile.path}</pathurl>
            <timecode><string>00:00:00:00</string><displayformat>NDF</displayformat>
            <rate><timebase>${timebase}</timebase><ntsc>FALSE</ntsc></rate></timecode>
            <media><video><samplecharacteristics>
              <width>${width}</width><height>${height}</height><pixelaspectratio>square</pixelaspectratio>
            </samplecharacteristics></video>
            ${Array.from({ length: numAudioTracks }).map(() => `
            <audio>
              <samplecharacteristics><depth>16</depth><samplerate>${sampleRate}</samplerate></samplecharacteristics>
              <channelcount>2</channelcount>
            </audio>`).join('')}
            </media>
          </file>
          <compositemode>normal</compositemode>`;

        for (let vt = 1; vt <= numAudioTracks; vt++) {
            const t1 = vidId + ((vt * 2 - 1) * 8);
            const t2 = vidId + ((vt * 2) * 8);
            xml += `
          <link><linkclipref>clipitem-${t1}</linkclipref><mediatype>audio</mediatype><trackindex>${vt * 2 - 1}</trackindex><clipindex>${vidId}</clipindex></link>`;
            xml += `
          <link><linkclipref>clipitem-${t2}</linkclipref><mediatype>audio</mediatype><trackindex>${vt * 2}</trackindex><clipindex>${vidId}</clipindex></link>`;
        }
        xml += `
          <link><linkclipref>clipitem-${vidId}</linkclipref><mediatype>video</mediatype><trackindex>1</trackindex><clipindex>${vidId}</clipindex></link>
        </clipitem>`;
    });

    xml += `
      </track></video>
      <audio>
        <numOutputChannels>2</numOutputChannels>
        <format><samplecharacteristics><depth>16</depth><samplerate>${sampleRate}</samplerate></samplecharacteristics></format>`;

    for (let vt = 1; vt <= numAudioTracks; vt++) {
        const pair = [{ index: vt * 2 - 1, channel: 1 }, { index: vt * 2, channel: 2 }];
        pair.forEach((trk, pi) => {
            xml += `
        <track currentExplodedTrackIndex="${pi}" totalExplodedTrackCount="2" premiereTrackType="Stereo">
          <outputchannelindex>${trk.channel}</outputchannelindex>`;
            clips.forEach((clip, idx) => {
                const vidId = idx + 1;
                const aId = vidId + (trk.index * 8);
                xml += `
          <clipitem id="clipitem-${aId}" premiereChannelType="stereo">
            <name>${escapeXml(videoFile.name)}</name>
            <enabled>TRUE</enabled>
            <start>${clip.timelineStart}</start><end>${clip.timelineEnd}</end>
            <in>${clip.sourceIn}</in><out>${clip.sourceOut}</out>
            <file id="file-1"/>
            <link><linkclipref>clipitem-${vidId}</linkclipref><mediatype>video</mediatype><trackindex>1</trackindex><clipindex>${vidId}</clipindex></link>
            <sourcetrack><mediatype>audio</mediatype><trackindex>${trk.index}</trackindex></sourcetrack>
          </clipitem>`;
            });
            xml += `
        </track>`;
        });
    }

    xml += `
      </audio>
    </media>
  </sequence>
</xmeml>`;

    return xml;
}
