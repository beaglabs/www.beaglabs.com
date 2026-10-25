'use client'
import { useEffect, useState } from 'react'
import { MarketplaceSelect, type MarketplaceOption } from './marketplace-select'

type Props={country:string;state:string;city:string;onChange:(geo:{country:string;state:string;city:string})=>void}
function useGeoOptions(query:string,enabled:boolean){
  const [options,setOptions]=useState<MarketplaceOption[]>([])
  const [loading,setLoading]=useState(false)
  useEffect(()=>{
    if(!enabled){setOptions([]);setLoading(false);return}
    const controller=new AbortController()
    setLoading(true)
    fetch('/api/marketplace/geo'+query,{signal:controller.signal}).then(async response=>{
      if(!response.ok)throw Error('Geography unavailable')
      return response.json() as Promise<{items:MarketplaceOption[]}>
    }).then(result=>{if(!controller.signal.aborted)setOptions(result.items)})
      .catch(()=>{if(!controller.signal.aborted)setOptions([])})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false)})
    return()=>controller.abort()
  },[query,enabled])
  return {options,loading}
}
export function MarketplaceGeoSelect({country,state,city,onChange}:Props){
  const countries=useGeoOptions('',true)
  const states=useGeoOptions('?country='+encodeURIComponent(country),!!country)
  const cities=useGeoOptions('?country='+encodeURIComponent(country)+'&state='+encodeURIComponent(state),!!country&&!!state)
  return <div className="grid gap-3 sm:grid-cols-3">
    <label className="grid gap-1 text-xs font-black uppercase">Country
      <MarketplaceSelect label="Country" value={country} placeholder={countries.loading?'Loading…':'Choose country'} options={countries.options} onValueChange={value=>onChange({country:value,state:'',city:''})}/>
    </label>
    <label className="grid gap-1 text-xs font-black uppercase">State / Region
      <MarketplaceSelect label="State or region" value={state} placeholder={states.loading?'Loading…':'Choose region'} options={states.options} disabled={!country||states.options.length===0} onValueChange={value=>onChange({country,state:value,city:''})}/>
    </label>
    <label className="grid gap-1 text-xs font-black uppercase">City
      <MarketplaceSelect label="City" value={city} placeholder={cities.loading?'Loading…':'Choose city'} options={cities.options} disabled={!state||cities.options.length===0} onValueChange={value=>onChange({country,state,city:value})}/>
    </label>
  </div>
}
