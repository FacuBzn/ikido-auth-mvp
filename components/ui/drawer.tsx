import * as React from "react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type DrawerRootProps = React.ComponentProps<typeof Sheet>;
type DrawerContentProps = React.ComponentProps<typeof SheetContent>;

const DEFAULT_SIDE: DrawerContentProps["side"] = "bottom";

function Drawer(props: DrawerRootProps) {
  return <Sheet data-slot="drawer" {...props} />;
}

function DrawerTrigger(props: React.ComponentProps<typeof SheetTrigger>) {
  return <SheetTrigger data-slot="drawer-trigger" {...props} />;
}

function DrawerClose(props: React.ComponentProps<typeof SheetClose>) {
  return <SheetClose data-slot="drawer-close" {...props} />;
}

function DrawerPortal(props: React.ComponentProps<typeof SheetPortal>) {
  return <SheetPortal data-slot="drawer-portal" {...props} />;
}

function DrawerOverlay(props: React.ComponentProps<typeof SheetOverlay>) {
  return <SheetOverlay data-slot="drawer-overlay" {...props} />;
}

function DrawerContent({ side = DEFAULT_SIDE, ...props }: DrawerContentProps) {
  return <SheetContent data-slot="drawer-content" side={side} {...props} />;
}

function DrawerHeader(props: React.ComponentProps<typeof SheetHeader>) {
  return <SheetHeader data-slot="drawer-header" {...props} />;
}

function DrawerFooter(props: React.ComponentProps<typeof SheetFooter>) {
  return <SheetFooter data-slot="drawer-footer" {...props} />;
}

function DrawerTitle(props: React.ComponentProps<typeof SheetTitle>) {
  return <SheetTitle data-slot="drawer-title" {...props} />;
}

function DrawerDescription(props: React.ComponentProps<typeof SheetDescription>) {
  return <SheetDescription data-slot="drawer-description" {...props} />;
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
