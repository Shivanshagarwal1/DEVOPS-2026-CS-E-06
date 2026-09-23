function startOfDay(d){ d=new Date(d); d.setHours(0,0,0,0); return d; }
function endOfDay(d){ d=new Date(d); d.setHours(23,59,59,999); return d; }
// Resolve a period keyword (or custom range) into {start,end}
function resolvePeriod(period, startDate, endDate){
  const now = new Date();
  let start, end = endOfDay(now);
  switch(period){
    case 'week': { const d=new Date(now); const day=(d.getDay()+6)%7; d.setDate(d.getDate()-day); start=startOfDay(d); break; }
    case 'last-month': { start=startOfDay(new Date(now.getFullYear(), now.getMonth()-1, 1)); end=endOfDay(new Date(now.getFullYear(), now.getMonth(), 0)); break; }
    case '3m': { start=startOfDay(new Date(now.getFullYear(), now.getMonth()-2, 1)); break; }
    case '6m': { start=startOfDay(new Date(now.getFullYear(), now.getMonth()-5, 1)); break; }
    case 'year': { start=startOfDay(new Date(now.getFullYear(), 0, 1)); break; }
    case 'custom': { start=startOfDay(startDate?new Date(startDate):now); end=endOfDay(endDate?new Date(endDate):now); break; }
    case 'month':
    default: { start=startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)); }
  }
  return { start, end };
}
module.exports = { resolvePeriod, startOfDay, endOfDay };
