import Image from 'next/image'
export const competitors:Record<string,{name:string;domain:string}>={numeric:{name:'Numeric',domain:'numeric.io'},odoo:{name:'Odoo',domain:'odoo.com'},'dynamics-365':{name:'Dynamics 365',domain:'microsoft.com'},netsuite:{name:'NetSuite',domain:'netsuite.com'},zapier:{name:'Zapier',domain:'zapier.com'},n8n:{name:'n8n',domain:'n8n.io'}}
export function ComparisonLogos({slug,large=false}:{slug:string;large?:boolean}){
  const rival=competitors[slug]
  if(!rival)return null
  const size=large?72:48
  return <div className="flex items-center gap-3" aria-label={`Papyrus and ${rival.name} logos`}>
    <span className="flex items-center justify-center border-2 border-black bg-[#fff0e9] p-2"><Image src="/papyrus-logo.svg" alt="Papyrus logo" width={size} height={size} className={large?'h-14 w-14 object-contain':'h-9 w-9 object-contain'}/></span>
    <span className="font-mono text-sm font-black">VS</span>
    <span className="flex items-center justify-center border-2 border-black bg-white p-2"><img src={`https://www.google.com/s2/favicons?domain=${rival.domain}&sz=128`} width={size} height={size} alt={`${rival.name} brand mark`} className={large?'h-14 w-14 object-contain':'h-9 w-9 object-contain'}/></span>
  </div>
}
