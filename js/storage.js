// Pure quiz logic shared by the pages. Quizzes now live server-side and are
// fetched via js/api.js (deploy-plan/03); the old localStorage store and
// version-aware seed merge are gone. Scoring stays client-side — it's pure
// logic over the fetched quiz.
const Storage={
  scoreAnswers(quiz,opts){
    const mode=quiz.scoringMode||'highest-tier';
    if(mode==='tag-collection'){
      const collectedTags=[];const seenTags=new Set();
      for(const ans of opts){
        const ansArr=Array.isArray(ans)?ans:[ans];
        for(const a of ansArr){
          const tags=a.tags||(a.tag?[a.tag]:[]);
          for(const t of tags){if(!seenTags.has(t)){seenTags.add(t);collectedTags.push(t);}}
        }
      }
      return{mode,collectedTags,tier:null,result:null,scores:null,triggeredTags:[]};
    }
    if(mode==='point-accumulation'){
      const totals={};
      for(const r of quiz.results)totals[r.tier]=0;
      for(const o of opts){const pts=o.points||{};for(const[t,p]of Object.entries(pts)){if(totals[Number(t)]!==undefined)totals[Number(t)]+=Number(p)||0;}}
      let winnerTier=quiz.results[0]?.tier;let maxPts=-1;
      for(const[t,p]of Object.entries(totals)){if(p>maxPts){maxPts=p;winnerTier=Number(t);}}
      const collectedFlagsAccum=[];const seenAccumFlags=new Set();
      for(const o of opts){for(const f of(o.flags||[])){if(!seenAccumFlags.has(f)){seenAccumFlags.add(f);collectedFlagsAccum.push(f);}}}
      return{tier:winnerTier,result:quiz.results.find(r=>r.tier===winnerTier),scores:totals,mode,triggeredTags:[],collectedFlags:collectedFlagsAccum};
    }else{
      const minTier=quiz.results.reduce((m,r)=>Math.min(m,r.tier),Infinity);
      let max=isFinite(minTier)?minTier:1;
      for(const o of opts)if(o.tier>max)max=o.tier;
      const winResult=quiz.results.find(r=>r.tier===max);
      const triggeredTags=[];const seenTagIds=new Set();
      for(const o of opts){if(o.tier===max&&o.tag&&!seenTagIds.has(o.tag)){const tagDef=winResult&&winResult.tags&&winResult.tags.find(t=>t.id===o.tag);if(tagDef){triggeredTags.push(tagDef);seenTagIds.add(o.tag);}}}
      const collectedFlags=[];const seenFlagIds=new Set();
      for(const o of opts){for(const f of(o.flags||[])){if(!seenFlagIds.has(f)){seenFlagIds.add(f);collectedFlags.push(f);}}}
      return{tier:max,result:winResult,scores:null,mode,triggeredTags,collectedFlags};
    }
  },
  generateId(){return'id_'+Math.random().toString(36).slice(2,10)+'_'+Date.now().toString(36);}
};
