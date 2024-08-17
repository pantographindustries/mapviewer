import DSIIconCloudOffline from './icons/DSI-IconCloudOffline.vue'
import DSIIconError from './icons/DSI-IconError.vue'
import IconLoader from './icons/DSI-IconLoader.vue'
import IconQuestionMark from './icons/DSI-IconQuestionMark.vue'
import DSIIconRoadCone from './icons/DSI-IconRoadCone.vue'

export const icons = {
  Loader: IconLoader,
  QuestionMark: IconQuestionMark,
  RoadCone: DSIIconRoadCone,
  CloudOffline: DSIIconCloudOffline,
  Error: DSIIconError
}

export type IconsSelect = keyof typeof icons
