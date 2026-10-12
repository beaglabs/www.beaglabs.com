export interface Comparison {
  slug: string
  title: string
  metaDescription: string
  optionA: { name: string; description: string; pros: string[]; cons: string[] }
  optionB: { name: string; description: string; pros: string[]; cons: string[] }
  comparisonTable: { feature: string; optionA: string; optionB: string }[]
  verdict: string[]
}

export const comparisons: Comparison[] = [
  {
    "slug": "document-automation-vs-manual-processing",
    "title": "Document Automation vs Manual Processing",
    "metaDescription": "Compare governed document automation and manual processing for back office workflows, including validation, ownership, and operational change.",
    "optionA": {
      "name": "Governed document automation",
      "description": "Extract and route information with validation, source context, and human review.",
      "pros": [
        "Can build on existing workflow knowledge",
        "Supports incremental validation"
      ],
      "cons": [
        "Requires integration and exception handling",
        "Needs an accountable operational owner"
      ]
    },
    "optionB": {
      "name": "Manual processing",
      "description": "Staff read, enter, and route each document using existing procedures.",
      "pros": [
        "Can fit established organizational practices",
        "Makes ownership and acceptance criteria explicit"
      ],
      "cons": [
        "Requires staff time and ongoing maintenance",
        "Change effort depends on process and system complexity"
      ]
    },
    "comparisonTable": [
      {
        "feature": "Acceptance criteria",
        "optionA": "Validate against representative inputs and exceptions",
        "optionB": "Validate against the same business requirements"
      },
      {
        "feature": "Human responsibility",
        "optionA": "Keep approvals and operational ownership explicit",
        "optionB": "Keep approvals and operational ownership explicit"
      }
    ],
    "verdict": [
      "Choose based on the process, integration constraints, and acceptance criteria.",
      "Evaluate a representative workflow before committing to a broader rollout."
    ]
  },
  {
    "slug": "internal-app-factory-vs-custom-development",
    "title": "Internal App Factory vs Custom Development",
    "metaDescription": "Compare internal app factory and custom development for back office workflows, including validation, ownership, and operational change.",
    "optionA": {
      "name": "Internal app factory",
      "description": "Generate workflow-oriented interfaces, then validate behavior and access controls.",
      "pros": [
        "Can build on existing workflow knowledge",
        "Supports incremental validation"
      ],
      "cons": [
        "Requires integration and exception handling",
        "Needs an accountable operational owner"
      ]
    },
    "optionB": {
      "name": "Custom development",
      "description": "Engineer and maintain a purpose-built internal application.",
      "pros": [
        "Can fit established organizational practices",
        "Makes ownership and acceptance criteria explicit"
      ],
      "cons": [
        "Requires staff time and ongoing maintenance",
        "Change effort depends on process and system complexity"
      ]
    },
    "comparisonTable": [
      {
        "feature": "Acceptance criteria",
        "optionA": "Validate against representative inputs and exceptions",
        "optionB": "Validate against the same business requirements"
      },
      {
        "feature": "Human responsibility",
        "optionA": "Keep approvals and operational ownership explicit",
        "optionB": "Keep approvals and operational ownership explicit"
      }
    ],
    "verdict": [
      "Choose based on the process, integration constraints, and acceptance criteria.",
      "Evaluate a representative workflow before committing to a broader rollout."
    ]
  },
  {
    "slug": "legacy-api-wrapping-vs-replacement",
    "title": "Legacy API Wrapping vs System Replacement",
    "metaDescription": "Compare api wrapping and system replacement for back office workflows, including validation, ownership, and operational change.",
    "optionA": {
      "name": "API wrapping",
      "description": "Expose controlled interfaces while preserving the existing system of record.",
      "pros": [
        "Can build on existing workflow knowledge",
        "Supports incremental validation"
      ],
      "cons": [
        "Requires integration and exception handling",
        "Needs an accountable operational owner"
      ]
    },
    "optionB": {
      "name": "System replacement",
      "description": "Replace the underlying system and migrate its data and behavior.",
      "pros": [
        "Can fit established organizational practices",
        "Makes ownership and acceptance criteria explicit"
      ],
      "cons": [
        "Requires staff time and ongoing maintenance",
        "Change effort depends on process and system complexity"
      ]
    },
    "comparisonTable": [
      {
        "feature": "Acceptance criteria",
        "optionA": "Validate against representative inputs and exceptions",
        "optionB": "Validate against the same business requirements"
      },
      {
        "feature": "Human responsibility",
        "optionA": "Keep approvals and operational ownership explicit",
        "optionB": "Keep approvals and operational ownership explicit"
      }
    ],
    "verdict": [
      "Choose based on the process, integration constraints, and acceptance criteria.",
      "Evaluate a representative workflow before committing to a broader rollout."
    ]
  }
]
