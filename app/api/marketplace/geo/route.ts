import { NextRequest, NextResponse } from 'next/server'
import { getCountries, getStatesOfCountry, getCitiesOfState } from '@countrystatecity/countries'

export const runtime='nodejs'
const code=/^[A-Z]{2}$/
export async function GET(request:NextRequest){
  const url=new URL(request.url)
  const country=url.searchParams.get('country')||''
  const state=url.searchParams.get('state')||''
  if((country&&!code.test(country))||(state&&!/^[A-Z0-9-]{1,12}$/.test(state)))return NextResponse.json({error:'invalid_location_code'},{status:400})
  if(state&&!country)return NextResponse.json({error:'country_required'},{status:400})
  try{
    const rows=state?await getCitiesOfState(country,state):country?await getStatesOfCountry(country):await getCountries()
    return NextResponse.json({items:rows.map(row=>({value:'isoCode' in row?String(row.isoCode):String(row.name),label:String(row.name)}))},{headers:{'Cache-Control':'public, max-age=86400, s-maxage=86400'}})
  }catch{return NextResponse.json({error:'geography_unavailable'},{status:503})}
}
