export type TimelineDawPrivateWarpMarker={sourceFrame:number;destinationFrame:number;protected:boolean};
export type TimelineDawPrivateGrooveTemplate={id:string;name:string;gridFrames:number;offsets:number[]};

export function parseTimelineDawPrivateWarpMarkers(value:unknown,frameCount:number):TimelineDawPrivateWarpMarker[]{
 if(!Array.isArray(value))throw Error("Warp markers must be an array.");
 const markers=value.map((item)=>{if(!item||typeof item!=="object")throw Error("Warp marker is invalid.");const x=item as Record<string,unknown>,sourceFrame=Math.round(Number(x.sourceFrame)),destinationFrame=Math.round(Number(x.destinationFrame));if(!Number.isFinite(sourceFrame)||!Number.isFinite(destinationFrame)||sourceFrame<0||sourceFrame>=frameCount||destinationFrame<0)throw Error("Warp marker frame is outside the lane.");return{sourceFrame,destinationFrame,protected:Boolean(x.protected)}}).sort((a,b)=>a.sourceFrame-b.sourceFrame);
 for(let i=1;i<markers.length;i++)if(markers[i].sourceFrame<=markers[i-1].sourceFrame||markers[i].destinationFrame<=markers[i-1].destinationFrame)throw Error("Warp markers must preserve strict source and destination order.");
 return markers;
}

export function moveTimelineDawPrivateWarpMarker(markers:TimelineDawPrivateWarpMarker[],sourceFrame:number,destinationFrame:number){return parseTimelineDawPrivateWarpMarkers(markers.map(x=>x.sourceFrame===sourceFrame?{...x,destinationFrame}:x),Number.MAX_SAFE_INTEGER)}

export function quantizeTimelineDawPrivateWarpMarkers(markers:TimelineDawPrivateWarpMarker[],gridFrames:number,strength:number,selected:number[]){if(!Number.isFinite(gridFrames)||gridFrames<1||strength<0||strength>1)throw Error("Warp quantization settings are invalid.");return parseTimelineDawPrivateWarpMarkers(markers.map(x=>{if(x.protected||!selected.includes(x.sourceFrame))return x;const target=Math.round(x.destinationFrame/gridFrames)*gridFrames;return{...x,destinationFrame:Math.round(x.destinationFrame+(target-x.destinationFrame)*strength)}}),Number.MAX_SAFE_INTEGER)}

export function extractTimelineDawPrivateGroove(name:string,markers:TimelineDawPrivateWarpMarker[],gridFrames:number):Omit<TimelineDawPrivateGrooveTemplate,"id">{if(!name.trim()||gridFrames<1)throw Error("Groove name and grid are required.");return{name:name.trim(),gridFrames,offsets:markers.map(x=>x.destinationFrame-Math.round(x.destinationFrame/gridFrames)*gridFrames)}}

export function applyTimelineDawPrivateGroove(markers:TimelineDawPrivateWarpMarker[],groove:TimelineDawPrivateGrooveTemplate,strength:number){if(strength<0||strength>1)throw Error("Groove strength must be between 0 and 1.");return parseTimelineDawPrivateWarpMarkers(markers.map((x,i)=>x.protected?x:{...x,destinationFrame:Math.round(x.destinationFrame+(groove.offsets[i%groove.offsets.length]??0)*strength)}),Number.MAX_SAFE_INTEGER)}
