/* ═══════════════════════════════════════
   FOLIO — RADIX UI COMPONENT LIBRARY
   Reusable primitives built on Radix UI
   ═══════════════════════════════════════ */

import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import * as SelectPrimitive from '@radix-ui/react-select';
import * as SliderPrimitive from '@radix-ui/react-slider';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import * as HoverCardPrimitive from '@radix-ui/react-hover-card';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { Check, ChevronDown, ChevronUp, X } from 'lucide-react';

// ═══ LABEL ═══
export const Label = React.forwardRef(({ className, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={`rdx-label ${className || ''}`} {...props} />
));
Label.displayName = 'Label';

// ═══ INPUT ═══
export const Input = React.forwardRef(({ className, ...props }, ref) => (
  <input ref={ref} className={`rdx-input ${className || ''}`} {...props} />
));
Input.displayName = 'Input';

// ═══ TEXTAREA ═══
export const Textarea = React.forwardRef(({ className, ...props }, ref) => (
  <textarea ref={ref} className={`rdx-textarea ${className || ''}`} {...props} />
));
Textarea.displayName = 'Textarea';

// ═══ BUTTON ═══
export const Button = React.forwardRef(({ className, variant = 'primary', size = 'md', ...props }, ref) => (
  <button ref={ref} className={`rdx-btn rdx-btn-${variant} rdx-btn-${size} ${className || ''}`} {...props} />
));
Button.displayName = 'Button';

// ═══ ICON BUTTON ═══
export const IconButton = React.forwardRef(({ className, ...props }, ref) => (
  <button ref={ref} className={`rdx-icon-btn ${className || ''}`} {...props} />
));
IconButton.displayName = 'IconButton';

// ═══ CHECKBOX ═══
export const Checkbox = React.forwardRef(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root ref={ref} className={`rdx-checkbox ${className || ''}`} {...props}>
    <CheckboxPrimitive.Indicator className="rdx-checkbox-indicator">
      <Check size={12} strokeWidth={3} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = 'Checkbox';

// ═══ RADIO GROUP ═══
export const RadioGroup = React.forwardRef(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root ref={ref} className={`rdx-radio-group ${className || ''}`} {...props} />
));
RadioGroup.displayName = 'RadioGroup';

export const RadioGroupItem = React.forwardRef(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Item ref={ref} className={`rdx-radio-item ${className || ''}`} {...props}>
    <RadioGroupPrimitive.Indicator className="rdx-radio-indicator" />
  </RadioGroupPrimitive.Item>
));
RadioGroupItem.displayName = 'RadioGroupItem';

// ═══ SWITCH ═══
export const Switch = React.forwardRef(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root ref={ref} className={`rdx-switch ${className || ''}`} {...props}>
    <SwitchPrimitive.Thumb className="rdx-switch-thumb" />
  </SwitchPrimitive.Root>
));
Switch.displayName = 'Switch';

// ═══ SELECT ═══
export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger ref={ref} className={`rdx-select-trigger ${className || ''}`} {...props}>
    {children}
    <SelectPrimitive.Icon className="rdx-select-icon">
      <ChevronDown size={14} />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = 'SelectTrigger';

export const SelectContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content ref={ref} className={`rdx-select-content ${className || ''}`} position="popper" sideOffset={4} {...props}>
      <SelectPrimitive.ScrollUpButton className="rdx-select-scroll-btn">
        <ChevronUp size={14} />
      </SelectPrimitive.ScrollUpButton>
      <SelectPrimitive.Viewport className="rdx-select-viewport">
        {children}
      </SelectPrimitive.Viewport>
      <SelectPrimitive.ScrollDownButton className="rdx-select-scroll-btn">
        <ChevronDown size={14} />
      </SelectPrimitive.ScrollDownButton>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = 'SelectContent';

export const SelectItem = React.forwardRef(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item ref={ref} className={`rdx-select-item ${className || ''}`} {...props}>
    <span className="rdx-select-item-indicator">
      <SelectPrimitive.ItemIndicator>
        <Check size={12} />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = 'SelectItem';

export const SelectSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator ref={ref} className={`rdx-select-separator ${className || ''}`} {...props} />
));
SelectSeparator.displayName = 'SelectSeparator';

// ═══ SLIDER ═══
export const Slider = React.forwardRef(({ className, ...props }, ref) => (
  <SliderPrimitive.Root ref={ref} className={`rdx-slider ${className || ''}`} {...props}>
    <SliderPrimitive.Track className="rdx-slider-track">
      <SliderPrimitive.Range className="rdx-slider-range" />
    </SliderPrimitive.Track>
    {(props.defaultValue || props.value || [0]).map((_, i) => (
      <SliderPrimitive.Thumb key={i} className="rdx-slider-thumb" />
    ))}
  </SliderPrimitive.Root>
));
Slider.displayName = 'Slider';

// ═══ TOOLTIP ═══
export const TooltipProvider = TooltipPrimitive.Provider;

export function Tooltip({ children, content, side = 'top', ...props }) {
  return (
    <TooltipPrimitive.Root {...props}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content className="rdx-tooltip" side={side} sideOffset={6}>
          {content}
          <TooltipPrimitive.Arrow className="rdx-tooltip-arrow" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

// ═══ DIALOG ═══
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({ children, className, title, description, width, ...props }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="rdx-dialog-overlay" />
      <DialogPrimitive.Content className={`rdx-dialog-content ${className || ''}`} style={width ? { width } : undefined} {...props}>
        {title && <DialogPrimitive.Title className="rdx-dialog-title">{title}</DialogPrimitive.Title>}
        {description && <DialogPrimitive.Description className="rdx-dialog-description">{description}</DialogPrimitive.Description>}
        {children}
        <DialogPrimitive.Close asChild>
          <button className="rdx-dialog-close"><X size={14} /></button>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

// ═══ ALERT DIALOG ═══
export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

export function AlertDialogContent({ children, className, title, description, ...props }) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className="rdx-dialog-overlay" />
      <AlertDialogPrimitive.Content className={`rdx-dialog-content rdx-alert-dialog ${className || ''}`} {...props}>
        {title && <AlertDialogPrimitive.Title className="rdx-dialog-title">{title}</AlertDialogPrimitive.Title>}
        {description && <AlertDialogPrimitive.Description className="rdx-dialog-description">{description}</AlertDialogPrimitive.Description>}
        {children}
      </AlertDialogPrimitive.Content>
    </AlertDialogPrimitive.Portal>
  );
}
export const AlertDialogAction = React.forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action ref={ref} className={`rdx-btn rdx-btn-primary rdx-btn-sm ${className || ''}`} {...props} />
));
AlertDialogAction.displayName = 'AlertDialogAction';
export const AlertDialogCancel = React.forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel ref={ref} className={`rdx-btn rdx-btn-ghost rdx-btn-sm ${className || ''}`} {...props} />
));
AlertDialogCancel.displayName = 'AlertDialogCancel';

// ═══ POPOVER ═══
export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverContent = React.forwardRef(({ className, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content ref={ref} className={`rdx-popover-content ${className || ''}`} sideOffset={4} {...props} />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = 'PopoverContent';

// ═══ TABS ═══
export const Tabs = TabsPrimitive.Root;
export const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List ref={ref} className={`rdx-tabs-list ${className || ''}`} {...props} />
));
TabsList.displayName = 'TabsList';
export const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger ref={ref} className={`rdx-tabs-trigger ${className || ''}`} {...props} />
));
TabsTrigger.displayName = 'TabsTrigger';
export const TabsContent = TabsPrimitive.Content;

// ═══ AVATAR ═══
export function Avatar({ src, fallback, size = 32, className, ...props }) {
  return (
    <AvatarPrimitive.Root className={`rdx-avatar ${className || ''}`} style={{ width: size, height: size }} {...props}>
      <AvatarPrimitive.Image src={src} className="rdx-avatar-image" />
      <AvatarPrimitive.Fallback className="rdx-avatar-fallback" delayMs={200}>
        {fallback}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

// ═══ DROPDOWN MENU ═══
export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuContent = React.forwardRef(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content ref={ref} className={`rdx-dropdown-content ${className || ''}`} sideOffset={8} {...props} />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = 'DropdownMenuContent';
export const DropdownMenuItem = React.forwardRef(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Item ref={ref} className={`rdx-dropdown-item ${className || ''}`} {...props} />
));
DropdownMenuItem.displayName = 'DropdownMenuItem';
export const DropdownMenuSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator ref={ref} className={`rdx-dropdown-separator ${className || ''}`} {...props} />
));
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

// ═══ SEPARATOR ═══
export const Separator = React.forwardRef(({ className, ...props }, ref) => (
  <SeparatorPrimitive.Root ref={ref} className={`rdx-separator ${className || ''}`} {...props} />
));
Separator.displayName = 'Separator';

// ═══ SCROLL AREA ═══
export const ScrollArea = React.forwardRef(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root ref={ref} className={`rdx-scroll-area ${className || ''}`} {...props}>
    <ScrollAreaPrimitive.Viewport className="rdx-scroll-viewport">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollAreaPrimitive.Scrollbar className="rdx-scrollbar" orientation="vertical">
      <ScrollAreaPrimitive.Thumb className="rdx-scrollbar-thumb" />
    </ScrollAreaPrimitive.Scrollbar>
    <ScrollAreaPrimitive.Scrollbar className="rdx-scrollbar rdx-scrollbar-h" orientation="horizontal">
      <ScrollAreaPrimitive.Thumb className="rdx-scrollbar-thumb" />
    </ScrollAreaPrimitive.Scrollbar>
  </ScrollAreaPrimitive.Root>
));
ScrollArea.displayName = 'ScrollArea';

// ═══ PROGRESS ═══
export const Progress = React.forwardRef(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root ref={ref} className={`rdx-progress ${className || ''}`} {...props}>
    <ProgressPrimitive.Indicator className="rdx-progress-indicator" style={{ transform: `translateX(-${100 - (value || 0)}%)` }} />
  </ProgressPrimitive.Root>
));
Progress.displayName = 'Progress';

// ═══ HOVER CARD ═══
export const HoverCard = HoverCardPrimitive.Root;
export const HoverCardTrigger = HoverCardPrimitive.Trigger;
export const HoverCardContent = React.forwardRef(({ className, ...props }, ref) => (
  <HoverCardPrimitive.Portal>
    <HoverCardPrimitive.Content ref={ref} className={`rdx-hovercard ${className || ''}`} sideOffset={5} {...props} />
  </HoverCardPrimitive.Portal>
));
HoverCardContent.displayName = 'HoverCardContent';

// ═══ TOGGLE ═══
export const Toggle = React.forwardRef(({ className, ...props }, ref) => (
  <TogglePrimitive.Root ref={ref} className={`rdx-toggle ${className || ''}`} {...props} />
));
Toggle.displayName = 'Toggle';

// ═══ TOGGLE GROUP ═══
export const ToggleGroup = React.forwardRef(({ className, ...props }, ref) => (
  <ToggleGroupPrimitive.Root ref={ref} className={`rdx-toggle-group ${className || ''}`} {...props} />
));
ToggleGroup.displayName = 'ToggleGroup';
export const ToggleGroupItem = React.forwardRef(({ className, ...props }, ref) => (
  <ToggleGroupPrimitive.Item ref={ref} className={`rdx-toggle-group-item ${className || ''}`} {...props} />
));
ToggleGroupItem.displayName = 'ToggleGroupItem';

// ═══ BADGE ═══
export function Badge({ children, variant = 'default', className, ...props }) {
  return <span className={`rdx-badge rdx-badge-${variant} ${className || ''}`} {...props}>{children}</span>;
}

// ═══ CARD ═══
export const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={`rdx-card ${className || ''}`} {...props} />
));
Card.displayName = 'Card';
