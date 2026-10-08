const url = process.argv[2] || process.env.WORKER_URL || 'https://beaglabs-web-preview.beag-labs.workers.dev/'
const response = await fetch(url,{redirect:'manual'})
const html = await response.text()
console.log('GET',url,'=>',response.status,'bytes:',html.length)
if (response.status!==200 || !html.includes('Solving the boring problems')) {
 console.error('FAIL: Homepage not served by the deployed Worker')
 process.exitCode=1
} else console.log('PASS: Homepage content verified')
