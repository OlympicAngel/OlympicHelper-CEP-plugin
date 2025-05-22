/**
 * 
 * @param {string} videoFile 
 * @param {{ start_at: number, end_at: number }[]} silentSections
 * @param {{height: Number mediaPath: String numAudioTracks: Number sampleRate: Number timebase: Number totalDuration: Number width: Number inPoint: Number}} options
 * @returns 
 */
function generateNonSilentXML(videoFile, silentSections, options = {}) {
    // Convert seconds to frames
    const toFrames = (seconds) => Math.round(seconds * timebase);

    // function to escape XML special characters
    const escapeXml = str => str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const {
        timebase = 60,
        width = 1920,
        height = 1080,
        sampleRate = 48000,
        numAudioTracks = 4, // Now represents VISUAL TRACKS (each contains 2 underlying tracks)
        totalDuration = null,
    } = options;

    // Convert silent sections to frames and sort
    const frameSilentSections = silentSections.map(s => ({
        start_at: toFrames(s.start_at),
        end_at: toFrames(s.end_at)
    })).sort((a, b) => a.start_at - b.start_at);


    // Calculate non-silent sections in frames
    let timelinePosition = 0;
    const clips = [];
    let lastEnd = 0;

    frameSilentSections.forEach(section => {
        if (section.start_at > lastEnd) {
            const duration = section.start_at - lastEnd;
            clips.push({
                sourceIn: lastEnd,
                sourceOut: section.start_at,
                timelineStart: timelinePosition,
                timelineEnd: timelinePosition + duration
            });
            timelinePosition += duration;
        }
        lastEnd = Math.max(lastEnd, section.end_at);
    });

    if (totalDuration !== null) {
        const totalFrames = toFrames(totalDuration);
        if (lastEnd < totalFrames) {
            const duration = totalFrames - lastEnd;
            clips.push({
                sourceIn: lastEnd,
                sourceOut: totalFrames,
                timelineStart: timelinePosition,
                timelineEnd: timelinePosition + duration
            });
        }
    }

    // Generate XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<xmeml version="5">
    <sequence explodedTracks="true">
        <name>SilenceCut</name>
        <rate>
            <timebase>${timebase}</timebase>
            <ntsc>FALSE</ntsc>
        </rate>
        <media>
            <video>
                <format>
                    <samplecharacteristics>
                        <width>${width}</width>
                        <height>${height}</height>
                        <pixelaspectratio>square</pixelaspectratio>
                    </samplecharacteristics>
                </format>
                <track>`;

    // Video clips
    clips.forEach((clip, clipIndex) => {
        const videoClipId = clipIndex + 1;
        xml += `
                    <clipitem id="clipitem-${videoClipId}">
                        <name>${escapeXml(videoFile.name)}</name>
                        <enabled>TRUE</enabled>
                        <start>${clip.timelineStart}</start>
                        <end>${clip.timelineEnd}</end>
                        <in>${clip.sourceIn}</in>
                        <out>${clip.sourceOut}</out>
                        <file id="file-1">
                            <name>${escapeXml(videoFile.name)}</name>
                            <pathurl>${videoFile.path}</pathurl>
                            <timecode>
                                <string>00:00:00:00</string>
                                <displayformat>NDF</displayformat>
                                <rate>
                                    <timebase>${timebase}</timebase>
                                    <ntsc>FALSE</ntsc>
                                </rate>
                            </timecode>
                            <media>
                                <video>
                                    <samplecharacteristics>
                                        <width>${width}</width>
                                        <height>${height}</height>
                                        <pixelaspectratio>square</pixelaspectratio>
                                    </samplecharacteristics>
                                </video>
                                ${Array.from({ length: numAudioTracks * 2 }, (_, i) => `
                                <audio>
                                    <samplecharacteristics>
                                        <depth>16</depth>
                                        <samplerate>${sampleRate}</samplerate>
                                    </samplecharacteristics>
                                    <channelcount>2</channelcount>
                                </audio>`).join('')}
                            </media>
                        </file>
                        <compositemode>normal</compositemode>`;

        // Audio links - now 2 links per visual track
        for (let visualTrack = 1; visualTrack <= numAudioTracks; visualTrack++) {
            const track1Id = videoClipId + ((visualTrack * 2 - 1) * 8);
            const track2Id = videoClipId + ((visualTrack * 2) * 8);

            xml += `
                        <link>
                            <linkclipref>clipitem-${track1Id}</linkclipref>
                            <mediatype>audio</mediatype>
                            <trackindex>${visualTrack * 2 - 1}</trackindex>
                            <clipindex>${videoClipId}</clipindex>
                        </link>
                        <link>
                            <linkclipref>clipitem-${track2Id}</linkclipref>
                            <mediatype>audio</mediatype>
                            <trackindex>${visualTrack * 2}</trackindex>
                            <clipindex>${videoClipId}</clipindex>
                        </link>`;
        }

        xml += `
                        <link>
                            <linkclipref>clipitem-${videoClipId}</linkclipref>
                            <mediatype>video</mediatype>
                            <trackindex>1</trackindex>
                            <clipindex>${videoClipId}</clipindex>
                        </link>
                    </clipitem>`;
    });

    xml += `
                </track>
            </video>
            <audio>
                <numOutputChannels>2</numOutputChannels>
                <format>
                    <samplecharacteristics>
                        <depth>16</depth>
                        <samplerate>${sampleRate}</samplerate>
                    </samplecharacteristics>
                </format>`;

    // Generate 2 XML tracks per visual track
    for (let visualTrack = 1; visualTrack <= numAudioTracks; visualTrack++) {
        const trackPair = [
            { index: visualTrack * 2 - 1, channel: 1 },
            { index: visualTrack * 2, channel: 2 }
        ];

        trackPair.forEach((track, pairIndex) => {
            xml += `
                <track currentExplodedTrackIndex="${pairIndex}" 
                       totalExplodedTrackCount="2" 
                       premiereTrackType="Stereo">
                    <outputchannelindex>${track.channel}</outputchannelindex>`;

            clips.forEach((clip, clipIndex) => {
                const videoClipId = clipIndex + 1;
                const audioClipId = videoClipId + (track.index * 8);

                xml += `
                    <clipitem id="clipitem-${audioClipId}" premiereChannelType="stereo">
                        <name>${videoFile.name}</name>
                        <enabled>TRUE</enabled>
                        <start>${clip.timelineStart}</start>
                        <end>${clip.timelineEnd}</end>
                        <in>${clip.sourceIn}</in>
                        <out>${clip.sourceOut}</out>
                        <file id="file-1"/>
                        <link>
                            <linkclipref>clipitem-${videoClipId}</linkclipref>
                            <mediatype>video</mediatype>
                            <trackindex>1</trackindex>
                            <clipindex>${videoClipId}</clipindex>
                        </link>
                        <sourcetrack>
                            <mediatype>audio</mediatype>
                            <trackindex>${track.index}</trackindex>
                        </sourcetrack>
                        <labels>
                            <label2>Iris</label2>
                        </labels>
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