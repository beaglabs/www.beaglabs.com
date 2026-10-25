import { dinero, toDecimal } from 'dinero.js'
import { USD } from 'dinero.js/currencies'

/** USD input must be expressed in exact hundredths; never round a float into a Stripe charge. */
export function parseUsdCents(value:string):number|null {
  const normalized=value.trim().replace(/^\$/, '')
  if(!/^(?:0|[1-9]\d{0,5})(?:\.\d{1,2})?$/.test(normalized))return null
  const [whole,fraction='']=normalized.split('.')
  const cents=Number(whole)*100+Number(fraction.padEnd(2,'0'))
  return Number.isSafeInteger(cents)?cents:null
}
export function formatUsdCents(cents:number):string {
  if(!Number.isSafeInteger(cents))throw new Error('Invalid USD amount')
  return toDecimal(dinero({amount:cents,currency:USD}))
}
export function displayUsdCents(cents:number):string {
  return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(formatUsdCents(cents)))
}
