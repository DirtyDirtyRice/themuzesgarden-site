export const TIMELINE_DAW_PRIVATE_MIX_CHANGE_EVENT="muzes:daw-private-mix-change";
export type TimelineDawPrivateMixChangeDetail={sourceKind:"lane"|"bus";sourceId:string;parameter:"gain"|"pan";value:number};
export function dispatchTimelineDawPrivateMixChange(detail:TimelineDawPrivateMixChangeDetail):void{window.dispatchEvent(new CustomEvent<TimelineDawPrivateMixChangeDetail>(TIMELINE_DAW_PRIVATE_MIX_CHANGE_EVENT,{detail}));}
