import Link from 'next/link'
const services=[
 {title:'Document automation',description:'Turn PDFs, forms, spreadsheets and working documents into structured, reviewable processes.',href:'/solutions/document-automation'},
 {title:'Internal app factory',description:'Build usable interfaces for business workflows and connect them to the systems you already run.',href:'/solutions/internal-app-factory'},
 {title:'Agentic modernization',description:'Wrap legacy terminal and SOAP/XML services with modern APIs and browser-based workflows.',href:'/solutions/agentic-modernization'},
]
export function CapabilitiesSection(){return <section id="capabilities" className="border-b-[3px] border-[#111] bg-[#ff5f1f] px-6 py-20 lg:px-9"><div className="mx-auto max-w-[1440px]">
 <span className="nb-label mb-6 inline-block bg-white">What we solve</span><h2 className="display-black mb-10 max-w-[900px] text-[48px] leading-none sm:text-[66px]">Less busywork. More useful software.</h2>
 <div className="grid gap-5 md:grid-cols-3">{services.map((service,i)=><Link key={service.href} href={service.href} className="group flex min-h-72 flex-col border-[3px] border-[#111] bg-white p-7 shadow-[6px_6px_0_#111] transition-transform hover:-translate-y-1 focus-visible:outline-4 focus-visible:outline-[#111] motion-reduce:transform-none"><span className="font-mono text-xs font-black">0{i+1} / SOLUTION</span><h3 className="mt-8 text-3xl font-black">{service.title}</h3><p className="mt-4 text-sm font-medium leading-7 text-[#444]">{service.description}</p><span className="mt-auto pt-7 text-xs font-black uppercase">Explore solution →</span></Link>)}</div>
 </div></section>}