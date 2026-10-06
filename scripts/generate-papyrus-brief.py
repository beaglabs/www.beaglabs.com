from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'output/pdf/papyrus-solution-brief.pdf'
for n,f in [('WorkSans','WorkSans-400.ttf'),('Bold','WorkSans-700.ttf'),('Display','RobotoCondensed-900.ttf'),('Mono','JetBrainsMono-700.ttf')]: pdfmetrics.registerFont(TTFont(n,str(ROOT/'public/fonts'/f)))
pdfmetrics.registerFontFamily('WorkSans',normal='WorkSans',bold='Bold',italic='WorkSans',boldItalic='Bold')
W,H=612,792; OR='#ff5f1f'; BG='#fafaf9'; INK='#111111'; MUT='#555555'
c=canvas.Canvas(str(OUT),pagesize=(W,H)); c.setTitle('Papyrus | The Agentic Modernization Factory'); c.setAuthor('Beag Labs')
def box(x,y,w,h,color=BG,shadow=False):
 if shadow: c.setFillColor(HexColor(INK)); c.rect(x+4,H-y-h-4,w,h,fill=1,stroke=0)
 c.setFillColor(HexColor(color));c.setStrokeColor(HexColor(INK));c.setLineWidth(1.5);c.rect(x,H-y-h,w,h,fill=1,stroke=1)
def text(s,x,y,size=11,bold=False,color=INK):
 c.setFillColor(HexColor(color)); c.setFont('Display' if bold and size>=17 else ('Mono' if size<=9 and bold else ('Bold' if bold else 'WorkSans')),size);c.drawString(x,H-y-size,s)
def para(s,x,y,w,size=10,color=MUT,bold=False):
 p=Paragraph(s,ParagraphStyle('p',fontName='Bold' if bold else 'WorkSans',fontSize=size,leading=size*1.5,textColor=HexColor(color))); _,h=p.wrap(w,700);p.drawOn(c,x,H-y-h);return h
def rule(y): c.setStrokeColor(HexColor(INK));c.setLineWidth(1.5);c.line(28,H-y,W-28,H-y)
def frame(n,label):
 c.setFillColor(HexColor(BG));c.rect(0,0,W,H,fill=1,stroke=0)
 box(28,22,30,30,INK);text('B_',33,26,19,True,'#ffffff');text('BEAG LABS',70,30,10,True);text('SOLUTION BRIEF / PAPYRUS',310,31,8,True);text(f'{n:02} / 06',530,31,8,True);rule(65)
 box(28,86,250,24,OR);text(label.upper(),38,92,8,True)
 rule(751);text('BEAG LABS / CUSTOMER-HOSTED AGENTIC WORK',28,765,7,True);text('www.beaglabs.com',465,765,7)
def title(lines,sub):
 y=128
 for line in lines: text(line,28,y,31,True);y+=36
 para(sub,28,y+12,552,11);return y+70
def cards(items,y,h=112):
 gap=10;w=(552-gap*(len(items)-1))/len(items)
 for i,(name,body) in enumerate(items):
  x=28+i*(w+gap);box(x,y,w,h,'#ffffff',True);text(f'{i+1:02}',x+12,y+12,9,True,OR);para(name,x+12,y+31,w-24,11,INK,True);para(body,x+12,y+64,w-24,9)
def bullets(items,y):
 for name,body in items:
  box(28,y+4,6,6,OR);h=para('<b>'+name+'</b> '+body,44,y,525,10);y+=h+13
 return y
def cta(s):
 box(28,692,552,39,OR,True);text(s,40,705,11,True);c.linkURL('https://www.beaglabs.com/sales',(28,H-731,580,H-692),relative=0)
def nextpage(): c.showPage()
frame(1,'Customer-hosted modernization')
title(['THE AGENTIC','MODERNIZATION','FACTORY'], 'Papyrus turns requirements, constraints, and blockers into scoped tasks, coordinated workflows, and working apps - using your documents and systems inside your environment.')
box(28,321,552,128,'#111111',True);text('REQUIREMENTS > COORDINATED ACTION > DELIVERY',44,337,11,True,OR)
for i,(name,body) in enumerate([('DEFINE THE REQUIREMENTS','Requirements / constraints / blockers'),('TURN BLOCKERS INTO ACTION','Scoped tasks / approved tools / workflows'),('DELIVER AND REUSE','Working apps / outputs / reusable skills')]):
 x=44+i*178;text(name,x,376,10,True,'#ffffff');para(body,x,398,164,9,'#cccccc')
cards([('Document automation','From source material to requirements and deliverables.'),('Internal app creation','From a workflow idea to a focused operational surface.'),('Legacy enablement','From terminal processes to a modern service experience.')],480,128)
para('Requirements define the work. Blockers reveal the next task. Papyrus coordinates approved tools, human review, and durable execution to turn both into useful deliverables.',28,636,552,10)
cta('BRING A REAL BOTTLENECK. TURN BLOCKERS INTO ACTION.');nextpage()
frame(2,'01 / Document automation')
title(['YOUR DOCUMENTS ARE','THE STARTING POINT.'], 'Turn reading and re-keying into requirements, decisions, and deliverables. Bring PDFs, Word documents, spreadsheets, and CSV data into shared working context.')
box(28,274,552,230,'#efeee8',True);text('EXISTING KNOWLEDGE > WORKING CONTEXT',42,289,8,True)
for i,(f,label) in enumerate([('pdf.png','PDF'),('docx.png','DOCX'),('xlsx.png','XLSX')]):
 x=44+i*58;box(x,332,48,89,'#ffffff');c.drawImage(str(ROOT/'public/products/papyrus'/f),x+8,H-385,width=32,height=40,preserveAspectRatio=True,mask='auto');text(label,x+6,397,8,True)
box(233,346,88,67,'#ffffff');c.drawImage(str(ROOT/'public/products/papyrus/agentfs.png'),250,H-390,width=50,height=40,preserveAspectRatio=True,mask='auto');text('AgentFS',253,418,10,True)
text('>',215,365,14,True,OR)
for i,name in enumerate(['Requirements','Find gaps','Source citations','Acceptance criteria']):
 box(365,319+i*42,194,33,'#ffffff');text(name,378,329+i*42,10,True);text('>',341,329+i*42,13,True,OR)
text('ASK PAPYRUS: Break these documents into requirements.',44,472,9,True)
para('Print adaptation of the product page demo. Sample sources and illustrative outputs.',28,520,552,8)
bullets([('Source-linked analysis.','Organize requirements, identify policy and delivery gaps, and define acceptance criteria with references.'),('Useful outputs.','Draft briefings, reports, registers, spreadsheets, CSV exports, and review-ready document packets.'),('Repeatable work.','Keep artifacts and working methods in the workspace for recurring reporting and operational workflows.')],552)
cta('SOURCE MATERIAL > REQUIREMENTS > ACTIONABLE TASKS');nextpage()
frame(3,'02 / Internal app creation')
title(['TURN REQUIREMENTS INTO','APPS THAT MOVE WORK.'], 'Turn the requirements and bottlenecks in your process into task-focused forms, views, and workflows your team can use.')
box(28,281,265,215,'#ffffff',True);text('FACTORY APP / REQUEST INTAKE',43,296,9,True);rule(0) if False else None
for y,label,value in [(328,'REQUEST TYPE','Resource access'),(378,'JUSTIFICATION','Access needed for analysis'),(428,'PRIORITY','Standard')]:
 text(label,43,y,8,True);box(43,y+16,233,26,BG);text(value,51,y+22,9)
box(314,281,266,100,INK,True);text('OPERATIONS / STATUS',329,298,9,True,'#ffffff');text('Submitted > In review > Complete',329,338,10,True,OR)
box(314,397,266,99,'#ffffff',True);text('WORKFLOW / RESOLVE THE BLOCKER',329,413,9,True);para('Identify what is stuck. Define the task. Review and execute the action.',329,439,232,10)
para('Illustrative factory app surfaces; configurations depend on the customer workflow.',28,515,552,8)
bullets([('Forms and views.','Capture structured information and surface status, results, and operational data.'),('Agent-assisted delivery.','Use models, approved tools, and reusable skills to prepare content and support workflow execution.'),('Identity-aware access.','Papyrus uses Microsoft Entra for workspace identity; generated apps can use a separate authentication front door.'),('Human review.','Keep consequential actions visible and route them through the configured approval process.')],547)
cta('FROM REQUIREMENTS TO WORKING APPS AND WORKFLOWS');nextpage()
frame(4,'03 / Legacy system enablement')
title(['A NEW FRONT DOOR.','FOR THE SYSTEMS','YOU ALREADY HAVE.'], 'Keep the system of record. Give people a better way to use it through connected, identity-aware service apps.')
box(28,322,254,228,'#101b15',True);text('TN3270 / CASEINTK',42,339,9,True,'#8df6b1')
for i,s in enumerate(['PUBLIC SERVICES / SCREEN 01','NEW SERVICE REQUEST','APPLICANT: __________','SERVICE TYPE: _______','REFERENCE: PENDING','READY. AWAITING INPUT.']):text(s,42,378+i*25,9,False,'#8df6b1')
text('>',291,423,18,True,OR)
box(320,322,260,228,'#ffffff',True);text('FACTORY APP / SERVICE INTAKE',334,340,8,True);text('A modern front door.',334,380,17,True);para('Sign in before creating a service request.',334,414,230,10);box(334,458,232,35,'#19304f');text('Login.gov sign-in >',346,470,10,True,'#ffffff');c.saveState(); clip=c.beginPath();clip.rect(334,H-541,130,40);c.clipPath(clip,stroke=0,fill=0);c.drawImage(str(ROOT/'public/products/papyrus/login-gov-brief.png'),334,H-580,width=120,height=120,mask='auto');c.restoreState();text('+',461,513,10,True);c.drawImage(str(ROOT/'public/products/papyrus/oidc-brief.png'),480,H-538,width=30,height=30,mask='auto');text('OIDC',517,515,8,True)
para('Illustrative product page demo: simulated Login.gov / OIDC and a mock TN3270 host. No real sign-in or host connection is shown.',28,570,552,8)
bullets([('Connect the existing process.','Bind the app to a customer-approved integration and verify its connection before using workflow actions.'),('Capture structured work.','Identity opens the app; the form captures a request; an approved action updates the legacy record.')],606)
cta('MODERNIZE THE EXPERIENCE. KEEP THE RECORD.');nextpage()
frame(5,'Runtime / Integrations / Governance')
title(['DURABLE WORK.','GOVERNED EXECUTION.'], 'A shared workspace for context, agent execution, and useful outputs - with the runtime and controls close to your systems.')
bullets([('Mastra runtime.','Sessions, memory, schedules, workflows, and signal delivery support durable agent work.'),('Reusable skills and artifacts.','Retain useful outputs and working methods so the next task starts with context.'),('Model and gateway flexibility.','Connect customer-approved inference endpoints and select the models available in your environment.'),('Tools and MCP.','Connect the capabilities, tools, and data sources the workflow needs.'),('Plugin architecture.','Teams, Exchange email, ACP, A2A, and customer system integrations are adapters; the runtime remains independent.'),('Governed connector lifecycle.','Draft, test, submit for approval, activate, then monitor health or disable.'),('Approvals and observability.','Review consequential actions and retain durable records and traces for inspection.'),('Microsoft Entra roles.','Separate integration access, integration management, security management, action approval, audit access, and system ownership.')],281)
box(28,594,552,69,'#efeee8');text('CONNECTOR LIFECYCLE',42,607,8,True);text('Draft > Tested > Approval > Active > Health monitoring',42,633,10,True);
cta('REQUIREMENTS TO TASKS. BLOCKERS TO RESOLVED WORK.');nextpage()
frame(6,'Deployment / Commercial model / Next step')
title(['YOUR ENVIRONMENT.','YOUR OPERATING MODEL.'], 'Customer-hosted execution keeps Papyrus close to your people, documents, and systems. Start with a blocked workflow, define success, and make the work repeatable.')
bullets([('Customer-hosted deployment.','Deploy on Azure or discuss your controlled environment and operating requirements.'),('Secrets stay referenced.','Connector configuration uses customer-vault, certificate, or managed-identity references; inline tokens and keys are rejected.'),('Sandboxed execution.','The documented Linux execution profile uses Bubblewrap with network denied and off-host execution disabled.'),('Offline licensing.','Signed offline licenses use customer-pinned authorities and require no Beag cloud callback. Enterprise deployment rights are defined in the agreement.')],278)
text('ENTERPRISE PRICING / DIRECT ENGAGEMENT',28,478,9,True)
for i,(plan,price,term,body) in enumerate([
 ('PILOT ENGAGEMENT','$250,000','90 DAYS','A scoped modernization pilot with implementation, integrations, and dedicated live support. Deliverables, acceptance criteria, coverage, and response targets are agreed before kickoff.'),
 ('ENTERPRISE LICENSE','$2,000,000','2 YEARS','Unlimited customer-hosted VMs within the licensed organization, including offline deployment. Implementation, maintenance, and support scope are defined in the agreement.')]):
 x=28+i*282;box(x,505,270,139,'#ffffff',True);text(plan,x+12,517,8,True);text(price,x+12,537,25,True);text(term,x+12,569,8,True,OR);para(body,x+12,588,246,8)
text('DISCOVER > CONFIGURE > PILOT > EXPAND',28,660,11,True)
cta('DISCUSS YOUR DEPLOYMENT / WWW.BEAGLABS.COM/SALES')
c.save();print(OUT)
