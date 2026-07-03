// m1l4 Mission & Vision are entered as two fields but stored as ONE brain entry
// ("Mission: …\n\nVision: …") so the review/Snapshot/Delegate pipeline stays single.
// These helpers convert between the combined text and the two parts, and are shared
// by the exercise UI (LMS) and every read-only render (DocumentsPanel).

export function splitMissionVision(text: string): { mission: string; vision: string } {
  const vIdx = text.search(/(^|\n)\s*Vision:/i);
  const missionPart = vIdx >= 0 ? text.slice(0, vIdx) : text;
  const visionPart = vIdx >= 0 ? text.slice(vIdx) : '';
  return {
    mission: missionPart.replace(/^\s*Mission:\s*/i, '').trim(),
    vision: visionPart.replace(/^\s*Vision:\s*/i, '').trim(),
  };
}

export function composeMissionVision(mission: string, vision: string): string {
  return `Mission: ${mission.trim()}\n\nVision: ${vision.trim()}`;
}
