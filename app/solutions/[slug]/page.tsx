import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SEOResourcePage } from '@/components/seo-resource-page'
import { pageMetadata } from '@/lib/seo'

const solutions = {
 'document-automation': {
  title:'AI Document Automation for Enterprise Workflows',label:'Document Automation',
  description:'Automate PDF, Word and spreadsheet workflows with customer-hosted AI agents, source-aware extraction, structured outputs and human review.',
  intro:'Stop re-keying documents. Turn PDFs, Word files, spreadsheets and working records into structured data, requirements, reviews and repeatable processes—inside your environment.',
  heading:'From unstructured files to work that moves',context:'Document automation is more than OCR. Connect extraction, validation, transformation and approvals so teams can work from traceable records instead of copying fields between systems.',
  cards:[{title:'PDF and Office processing',description:'Process PDFs, documents and spreadsheets into structured records with source context.',href:'/products/papyrus#documents'},{title:'Structured extraction and validation',description:'Translate document content into typed fields, check rules and flag missing or uncertain inputs.',href:'/products/papyrus#documents'},{title:'Reviewable agent workflows',description:'Support human approval before consequential decisions or external actions.',href:'/trust/papyrus'}],
  steps:[{title:'Connect files',description:'Select the relevant formats, ingestion route and expected output schema.'},{title:'Extract and verify',description:'Normalize information and check results against source evidence and deterministic rules.'},{title:'Route the work',description:'Create reviewable requirements, reports or downstream workflow actions.'}],
  faqs:[{question:'Can document automation run in a private environment?',answer:'Papyrus is designed for customer-hosted deployment. Available integrations, inference endpoints and network boundaries depend on your configuration.'},{question:'Can humans review the results?',answer:'Yes. Design workflows so uncertain or consequential outputs require review and approval.'}]
 },
 'internal-app-factory':{
  title:'Agentic Internal App Factory',label:'Internal App Factory',
  description:'Create governed internal apps, forms and process interfaces with AI agents, reusable integrations and customer-hosted deployment.',
  intro:'Go from a messy internal process to an application people can actually use. Build forms, operational views and workflow interfaces around existing data, APIs and business rules.',
  heading:'Build the missing interface—not another spreadsheet',
  context:'Internal apps need more than generated screens. Teams need identity, data contracts, tested integrations, usable layouts and controlled operational actions.',
  cards:[{title:'Prompt-to-app workflows',description:'Translate business requirements into interfaces, application structure and iterative implementation tasks.',href:'/products/papyrus#factory'},{title:'Forms and staff dashboards',description:'Create useful front doors for requests, queues and internal operational work.',href:'/products/papyrus#factory'},{title:'Identity-aware integrations',description:'Connect business APIs and organization-approved authentication within the deployment boundary.',href:'/trust/papyrus'}],
  steps:[{title:'Describe the work',description:'Gather the process, users, roles and accepted outputs.'},{title:'Generate and connect',description:'Build interfaces, integrate APIs and validate application behavior.'},{title:'Review and deploy',description:'Test, approve and operate the application in the customer environment.'}],
  faqs:[{question:'Does an internal app factory replace engineers?',answer:'No. Engineers and process owners are still needed to review architecture, security, data access and behavior before deployment.'}]
 },
 'agentic-modernization':{
  title:'Agentic Modernization Factory for Legacy Systems',label:'Agentic Modernization',
  description:'Modernize COBOL, TN3270 and SOAP/XML systems with AI-assisted discovery, OpenAPI adapters and modern React interfaces while preserving core behavior.',
  intro:'Give old systems a modern front door. Discover legacy contracts, wrap existing services in modern APIs and build browser-based workflows without rushing into a full system replacement.',
  heading:'Modern access. Proven business logic.',
  context:'The goal is to preserve what already works while exposing useful operations through tested service boundaries. Choose adapters, modernization and replacement according to actual risk and technical debt.',
  cards:[{title:'Mainframe and terminal interfaces',description:'Map COBOL copybooks, TN3270 interactions and record boundaries into documented contracts.',href:'/capability/modernization'},{title:'SOAP/XML to OpenAPI',description:'Wrap existing XML services with REST interfaces and explicit validation and error mapping.',href:'/capability/modernization'},{title:'React front ends for legacy workflows',description:'Present existing capabilities through modern identity-aware forms and views.',href:'/products/papyrus#factory'}],
  steps:[{title:'Discover',description:'Inventory transactions, data formats and critical behavior.'},{title:'Wrap and test',description:'Expose typed API adapters and run regression comparisons against existing operations.'},{title:'Modernize access',description:'Introduce new interfaces with governed execution and phased adoption.'}],
  faqs:[{question:'Do I need to replace the mainframe?',answer:'Not necessarily. An adapter can preserve the system of record and improve access, provided the service contract is stable and appropriately tested.'}]
 }
} as const

type Props={params:Promise<{slug:string}>}
export function generateStaticParams(){return Object.keys(solutions).map(slug=>({slug}))}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {slug}=await params
 const entry=solutions[slug as keyof typeof solutions]
 if(!entry)return {}
 return pageMetadata({title:entry.title,description:entry.description,path:`/solutions/${slug}`,label:entry.label})
}
export default async function SolutionPage({params}:Props){
 const {slug}=await params
 const entry=solutions[slug as keyof typeof solutions]
 if(!entry)notFound()
 return <SEOResourcePage eyebrow={entry.label} title={entry.title} intro={entry.intro} path={`/solutions/${slug}`} heading={entry.heading} context={entry.context} cards={[...entry.cards]} steps={[...entry.steps]} faqs={[...entry.faqs]}/>
}
