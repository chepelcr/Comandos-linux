import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

/** Shared, keyboard accessible select with the same menu in both themes. */
export function Select({ id, value, onChange, label, options, className = '' }: {
 id: string; value: string; onChange: (value: string) => void; label: string;
 options: { value: string; label: string }[]; className?: string;
}) {
 return <SelectPrimitive.Root value={value} onValueChange={onChange}>
  <SelectPrimitive.Trigger id={id} aria-label={label} className={`select-trigger ${className}`}>
   <SelectPrimitive.Value/><SelectPrimitive.Icon className="select-chevron"><ChevronDown size={16} aria-hidden/></SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
  <SelectPrimitive.Portal><SelectPrimitive.Content className="select-menu" position="popper" sideOffset={8} collisionPadding={12}>
   <SelectPrimitive.ScrollUpButton className="select-scroll"><ChevronUp size={16}/></SelectPrimitive.ScrollUpButton>
   <SelectPrimitive.Viewport className="select-options">{options.map(option => <SelectPrimitive.Item key={option.value} value={option.value} className="select-option">
    <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText><SelectPrimitive.ItemIndicator><Check size={16} aria-hidden/></SelectPrimitive.ItemIndicator>
   </SelectPrimitive.Item>)}</SelectPrimitive.Viewport>
   <SelectPrimitive.ScrollDownButton className="select-scroll"><ChevronDown size={16}/></SelectPrimitive.ScrollDownButton>
  </SelectPrimitive.Content></SelectPrimitive.Portal>
 </SelectPrimitive.Root>;
}
