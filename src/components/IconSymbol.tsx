import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useCSSVariable } from 'uniwind';

import { colorVariable } from '@/lib/classNames';
import type { ThemeColor } from '@/theme';

export type IconName =
  | 'home'
  | 'notifications'
  | 'person'
  | 'settings'
  | 'check_circle'
  | 'cancel'
  | 'schedule'
  | 'info'
  | 'add'
  | 'close'
  | 'arrow_back'
  | 'arrow_forward'
  | 'search'
  | 'filter_list'
  | 'more_vert'
  | 'chevron_right'
  | 'phone'
  | 'message'
  | 'share'
  | 'edit'
  | 'delete'
  | 'qr_code'
  | 'qr_code_scanner'
  | 'photo_camera'
  | 'campaign'
  | 'poll'
  | 'construction'
  | 'water_drop'
  | 'lightbulb'
  | 'directions_car'
  | 'local_shipping'
  | 'shopping_bag'
  | 'restaurant'
  | 'apartment'
  | 'lock'
  | 'visibility'
  | 'visibility_off'
  | 'fingerprint'
  | 'star'
  | 'favorite'
  | 'thumb_up'
  | 'error_outline'
  | 'warning_amber'
  | 'inbox'
  | 'history'
  | 'menu'
  | 'verified_user'
  | 'groups'
  | 'credit_card'
  | 'calendar_today';

interface Props {
  name: IconName;
  size?: number;
  color?: ThemeColor;
}

type MaterialIconGlyph = keyof typeof MaterialIcons.glyphMap;

const materialIconName: Record<IconName, MaterialIconGlyph> = {
  home: 'home',
  notifications: 'notifications',
  person: 'person',
  settings: 'settings',
  check_circle: 'check-circle',
  cancel: 'cancel',
  schedule: 'schedule',
  info: 'info',
  add: 'add',
  close: 'close',
  arrow_back: 'arrow-back',
  arrow_forward: 'arrow-forward',
  search: 'search',
  filter_list: 'filter-list',
  more_vert: 'more-vert',
  chevron_right: 'chevron-right',
  phone: 'phone',
  message: 'message',
  share: 'share',
  edit: 'edit',
  delete: 'delete',
  qr_code: 'qr-code',
  qr_code_scanner: 'qr-code-scanner',
  photo_camera: 'photo-camera',
  campaign: 'campaign',
  poll: 'poll',
  construction: 'construction',
  water_drop: 'water-drop',
  lightbulb: 'lightbulb',
  directions_car: 'directions-car',
  local_shipping: 'local-shipping',
  shopping_bag: 'shopping-bag',
  restaurant: 'restaurant',
  apartment: 'apartment',
  lock: 'lock',
  visibility: 'visibility',
  visibility_off: 'visibility-off',
  fingerprint: 'fingerprint',
  star: 'star',
  favorite: 'favorite',
  thumb_up: 'thumb-up',
  error_outline: 'error-outline',
  warning_amber: 'warning-amber',
  inbox: 'inbox',
  history: 'history',
  menu: 'menu',
  verified_user: 'verified-user',
  groups: 'groups',
  credit_card: 'credit-card',
  calendar_today: 'calendar-today',
};

export function IconSymbol({ name, size = 24, color = 'textPrimary' }: Props) {
  const iconColor = useCSSVariable(colorVariable[color]) as string;

  return <MaterialIcons name={materialIconName[name]} size={size} color={iconColor} />;
}
