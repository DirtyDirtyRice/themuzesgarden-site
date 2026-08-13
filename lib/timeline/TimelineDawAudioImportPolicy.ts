import { encodeTimelineDawPcmWav } from "./TimelineDawPcmCapture";

export type TimelineDawAudioImportEvidence={sourceName:string;sourceType:string;sourceByteLength:number;canonicalName:string;sampleRate:number;channelCount:number;frameCount:number;durationSeconds:number;converted:boolean};

export async function prepareTimelineDawAudioImport(file:File,contextFactory:()=>AudioContext=()=>new AudioContext()):Promise<{file:File;evidence:TimelineDawAudioImportEvidence}>{
  const lower=file.name.toLowerCase();
  if(lower.endsWith(".wav"))return{file,evidence:{sourceName:file.name,sourceType:file.type||"audio/wav",sourceByteLength:file.size,canonicalName:file.name,sampleRate:0,channelCount:0,frameCount:0,durationSeconds:0,converted:false}};
  if(!lower.endsWith(".mp3")&&file.type!=="audio/mpeg")throw Error("DAW imports currently accept WAV or MP3 files.");
  if(file.size<=0||file.size>268435456)throw Error("MP3 source size must be from 1 byte to 256 MB.");
  const context=contextFactory();
  try{
    const decoded=await context.decodeAudioData(await file.arrayBuffer());
    if(decoded.numberOfChannels<1||decoded.numberOfChannels>64||decoded.sampleRate<8000||decoded.sampleRate>384000||decoded.length<1)throw Error("Decoded MP3 audio geometry is outside supported bounds.");
    const channels=Array.from({length:decoded.numberOfChannels},(_,channel)=>Float32Array.from(decoded.getChannelData(channel)));
    const wav=encodeTimelineDawPcmWav(channels,decoded.sampleRate),canonicalName=file.name.replace(/.mp3$/i,"")+".wav",canonical=new File([wav.bytes.slice().buffer],canonicalName,{type:"audio/wav"});
    return{file:canonical,evidence:{sourceName:file.name,sourceType:file.type||"audio/mpeg",sourceByteLength:file.size,canonicalName,sampleRate:decoded.sampleRate,channelCount:decoded.numberOfChannels,frameCount:decoded.length,durationSeconds:decoded.duration,converted:true}};
  }catch(cause){throw Error("MP3 could not be decoded by this browser: "+(cause instanceof Error?cause.message:"unknown decoder failure"))}
  finally{if(context.state!=="closed")await context.close()}
}