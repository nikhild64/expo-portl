import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useCSSVariable } from 'uniwind';
import type { ReactNode } from 'react';

export interface SheetHandle {
  present: () => void;
  dismiss: () => void;
}

interface Props {
  children: ReactNode;
  snapPoints?: (string | number)[];
}

export const Sheet = forwardRef<SheetHandle, Props>(({ children, snapPoints = ['50%', '90%'] }, ref) => {
  const modalRef = useRef<BottomSheetModal>(null);
  const surface = useCSSVariable('--color-surface') as string;
  const textTertiary = useCSSVariable('--color-text-tertiary') as string;
  const overlay = useCSSVariable('--color-overlay') as string;

  useImperativeHandle(ref, () => ({
    present: () => modalRef.current?.present(),
    dismiss: () => modalRef.current?.dismiss(),
  }));

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        style={[props.style, { backgroundColor: overlay }]}
      />
    ),
    [overlay],
  );

  return (
    <BottomSheetModal
      ref={modalRef}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: textTertiary }}
      backgroundStyle={{ backgroundColor: surface }}
    >
      <BottomSheetView className="flex-1 p-base">{children}</BottomSheetView>
    </BottomSheetModal>
  );
});

Sheet.displayName = 'Sheet';

export function useSheet() {
  const ref = useRef<SheetHandle>(null);

  const present = useCallback(() => ref.current?.present(), []);
  const dismiss = useCallback(() => ref.current?.dismiss(), []);

  return { ref, present, dismiss };
}
