import * as React from "react";
import { cn } from "@/shared/utils/cn";

interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "single" | "multiple";
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ className, type = "single", value, onValueChange, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-2", className)}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            const itemValue = (child as React.ReactElement<AccordionItemProps>).props.value;
            const isOpen = type === "multiple"
              ? Array.isArray(value) && value.includes(itemValue)
              : value === itemValue;
            
            return React.cloneElement(child, {
              isOpen,
              onToggle: () => {
                if (type === "multiple") {
                  const currentValue = Array.isArray(value) ? value : [];
                  const newValue = isOpen
                    ? currentValue.filter((v) => v !== itemValue)
                    : [...currentValue, itemValue];
                  onValueChange?.(newValue);
                } else {
                  onValueChange?.(isOpen ? "" : itemValue);
                }
              },
            } as any);
          }
          return child;
        })}
      </div>
    );
  }
);
Accordion.displayName = "Accordion";

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ className, value, isOpen, onToggle, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("border rounded-lg", className)}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              isOpen,
              onToggle,
            } as any);
          }
          return child;
        })}
      </div>
    );
  }
);
AccordionItem.displayName = "AccordionItem";

interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isOpen?: boolean;
  onToggle?: () => void;
}

const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, isOpen, onToggle, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full items-center justify-between py-3 px-3 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
          className
        )}
        {...props}
      >
        {children}
        <svg
          className="h-4 w-4 shrink-0 transition-transform duration-200"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <path
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
    );
  }
);
AccordionTrigger.displayName = "AccordionTrigger";

const AccordionContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { isOpen?: boolean }
>(({ className, isOpen, children, ...props }, ref) => {
  if (!isOpen) return null;
  
  return (
    <div
      ref={ref}
      className={cn("overflow-hidden text-sm transition-all", className)}
      {...props}
    >
      {children}
    </div>
  );
});
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };

