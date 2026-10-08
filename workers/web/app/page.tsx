import { InteractiveNav } from './interactive-nav'

const solutions = [
  { number: '01', title: 'Document automation', description: 'Turn PDFs and office files into structured, reviewable work.', href: 'https://www.beaglabs.com/solutions/document-automation' },
  { number: '02', title: 'Internal app factory', description: 'Build useful interfaces around the processes you already run.', href: 'https://www.beaglabs.com/solutions/internal-app-factory' },
  { number: '03', title: 'Agentic modernization', description: 'Put modern APIs and apps around legacy systems.', href: 'https://www.beaglabs.com/solutions/agentic-modernization' },
]

export default function Home() {
 return <main>
  <InteractiveNav />
  <section className="grid-bg hero">
   <div className="container hero-grid">
    <div>
     <span className="eyebrow">Practical, customer-hosted AI</span>
     <h1>Solving the boring problems.</h1>
     <p className="lede">Documents that take hours. Internal tools that never get built. Legacy systems nobody wants to touch. We make the work easier with governed AI on your infrastructure.</p>
     <div className="actions"><a className="button orange" href="https://www.beaglabs.com/contact?interest=one-month-trial">Start a one-month trial ↗</a><a className="button" href="#solutions">Explore solutions →</a></div>
    </div>
    <aside className="workflow" aria-label="Example workflow">
     <div className="panel-top"><b>Work, simplified</b><span>● ● ●</span></div>
     {solutions.map(item=><a className="workflow-row" href={item.href} key={item.number}><strong>{item.number}</strong><span><b>{item.title}</b><small>{item.description}</small></span><span aria-hidden="true">↗</span></a>)}
     <div className="workflow-bottom">YOUR ENVIRONMENT · YOUR CONTROLS</div>
    </aside>
   </div>
  </section>
  <section className="solutions" id="solutions"><div className="container">
   <p className="eyebrow">What we solve</p><h2>Less busywork. More useful software.</h2>
   <div className="solution-grid">{solutions.map(item=><a href={item.href} className="solution" key={item.number}><span>{item.number} / SOLUTION</span><h3>{item.title}</h3><p>{item.description}</p><b>Explore solution →</b></a>)}</div>
  </div></section>
  <section id="how-it-works" className="process"><div className="container"><p className="eyebrow">How it works</p><h2>From bottleneck to working software.</h2><div className="steps">{['Choose a workflow','Connect the context','Build and validate','Operate with control'].map((name,i)=><div className="step" key={name}><strong>0{i+1}</strong><h3>{name}</h3></div>)}</div></div></section>
  <section id="trial" className="grid-bg trial"><div className="container trial-grid"><div><p className="eyebrow">Try Papyrus</p><h2>Start a one-month trial.</h2><p className="lede">Pick a workflow worth simplifying. Explore document automation, internal apps and modernization in your own environment.</p><a href="https://www.beaglabs.com/contact?interest=one-month-trial" className="button orange">Request a trial ↗</a><small>Trial scope and terms confirmed before provisioning.</small></div><div className="trial-panel"><p>ONE WORKSPACE / FOUR BUILDING BLOCKS</p><div className="tiles">{['Documents','Internal apps','Legacy systems','Governance'].map((x,i)=><div key={x}><strong>0{i+1}</strong><b>{x}</b></div>)}</div><footer>CONNECTED THROUGH PAPYRUS →</footer></div></div></section>
  <footer className="footer"><div className="container"><h2>Documents to decisions. Legacy systems to modern apps.</h2><p>Your documents, apps and legacy systems—working together on your infrastructure.</p><a href="https://www.beaglabs.com/">www.beaglabs.com ↗</a></div></footer>
 </main>
}
