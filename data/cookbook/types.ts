export interface Paper {
  title: string
  url: string
  authors?: string
  year?: number
}

export interface Recipe {
  id: string
  title: string
  part: string
  order: number
  purpose: string
  usedBy: string[]
  coreIdea: string
  pipeline: string[]
  architecture?: string
  advantages: string[]
  disadvantages: string[]
  worksBestFor: string[]
  keyPapers: Paper[]
  complexity: number
  compute: string
  openSource: string[]
  commonMistakes: string[]
  variants?: string[]
  futureDirections?: string
}

export interface Part {
  id: string
  title: string
  description: string
  order: number
}
