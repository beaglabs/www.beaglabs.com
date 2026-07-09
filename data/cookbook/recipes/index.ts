import type { Recipe } from '../types'

import { actionDiffusion } from './action-diffusion'
import { animationDistillation } from './animation-distillation'
import { behaviorCloning } from './behavior-cloning'
import { codecLanguageModels } from './codec-language-models'
import { computerUseModels } from './computer-use-models'
import { consistencyModels } from './consistency-models'
import { constitutionalAi } from './constitutional-ai'
import { constitutionalGeneration } from './constitutional-generation'
import { curriculumGeneration } from './curriculum-generation'
import { dapo } from './dapo'
import { dataFlywheels } from './data-flywheels'
import { diffusionPreferenceOptimization } from './diffusion-preference-optimization'
import { evolInstruct } from './evol-instruct'
import { flowMatching } from './flow-matching'
import { gaussianSplattingSupervision } from './gaussian-splatting-supervision'
import { grpo } from './grpo'
import { hierarchicalPlanning } from './hierarchical-planning'
import { imageRewardModels } from './image-reward-models'
import { interactionModels } from './interaction-models'
import { interactiveLearning } from './interactive-learning'
import { judgeModels } from './judge-models'
import { latentPlanning } from './latent-planning'
import { linearAttentionTraining } from './linear-attention-training'
import { memoryOptimization } from './memory-optimization'
import { meshDiffusion } from './mesh-diffusion'
import { multiAgentRL } from './multi-agent-rl'
import { multiSpeakerDistillation } from './multi-speaker-distillation'
import { multiViewDiffusion } from './multi-view-diffusion'
import { neuralFieldTraining } from './neural-field-training'
import { offlineRL } from './offline-rl'
import { onPolicyDistillation } from './on-policy-distillation'
import { preferenceOptimization } from './preference-optimization'
import { proceduralSupervision } from './procedural-supervision'
import { processSupervision } from './process-supervision'
import { rectifiedFlow } from './rectified-flow'
import { recursiveSelfImprovement } from './recursive-self-improvement'
import { rlvr } from './rlvr'
import { sceneGraphPlanning } from './scene-graph-planning'
import { selfInstruct } from './self-instruct'
import { selfTrainingVision } from './self-training-vision'
import { simToReal } from './sim-to-real'
import { skillDistillation } from './skill-distillation'
import { speechRL } from './speech-rl'
import { speechTokenModels } from './speech-token-models'
import { stateSpaceModelTraining } from './state-space-model-training'
import { syntheticCurriculum } from './synthetic-curriculum'
import { toolUseRL } from './tool-use-rl'
import { visionRL } from './vision-rl'
import { voiceCloning } from './voice-cloning'
import { webAgents } from './web-agents'
import { worldModelsDreamer } from './world-models-dreamer'
import { worldStatePrediction } from './world-state-prediction'

export const recipes: Recipe[] = [
  actionDiffusion,
  animationDistillation,
  behaviorCloning,
  codecLanguageModels,
  computerUseModels,
  consistencyModels,
  constitutionalAi,
  constitutionalGeneration,
  curriculumGeneration,
  dapo,
  dataFlywheels,
  diffusionPreferenceOptimization,
  evolInstruct,
  flowMatching,
  gaussianSplattingSupervision,
  grpo,
  hierarchicalPlanning,
  imageRewardModels,
  interactionModels,
  interactiveLearning,
  judgeModels,
  latentPlanning,
  linearAttentionTraining,
  memoryOptimization,
  meshDiffusion,
  multiAgentRL,
  multiSpeakerDistillation,
  multiViewDiffusion,
  neuralFieldTraining,
  offlineRL,
  onPolicyDistillation,
  preferenceOptimization,
  proceduralSupervision,
  processSupervision,
  rectifiedFlow,
  recursiveSelfImprovement,
  rlvr,
  sceneGraphPlanning,
  selfInstruct,
  selfTrainingVision,
  simToReal,
  skillDistillation,
  speechRL,
  speechTokenModels,
  stateSpaceModelTraining,
  syntheticCurriculum,
  toolUseRL,
  visionRL,
  voiceCloning,
  webAgents,
  worldModelsDreamer,
  worldStatePrediction,
].sort((a, b) => {
  if (a.part !== b.part) return 0
  return a.order - b.order
})

export function getRecipesByPart(part: string): Recipe[] {
  return recipes
    .filter((r) => r.part === part)
    .sort((a, b) => a.order - b.order)
}
